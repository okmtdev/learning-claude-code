#!/usr/bin/env node
//
// gemini MCP サーバー（依存パッケージなし・Node 18+ の標準 fetch を使用）
//
// Claude Code に「ask_gemini」ツールを提供する最小の MCP サーバー。
// stdio 経由で JSON-RPC 2.0（改行区切り）を話す。
//
// バックエンドは環境変数 GEMINI_BACKEND で切替:
//   - mock   : 課金も通信もなし。配線確認用（既定）。
//   - api    : Google Gemini API を呼ぶ。要 GEMINI_API_KEY。
//   - ollama : ローカルの Ollama を呼ぶ（完全ローカル）。
//
// 環境変数:
//   GEMINI_BACKEND  mock | api | ollama        (既定: mock)
//   GEMINI_API_KEY  api バックエンドで必須
//   GEMINI_MODEL    api のモデル                (既定: gemini-2.5-flash)
//   OLLAMA_HOST     ollama のホスト             (既定: http://localhost:11434)
//   OLLAMA_MODEL    ollama のモデル             (既定: gemma3)
//
// 重要: stdout には MCP メッセージ以外を絶対に書かない。ログは stderr へ。

const BACKEND = process.env.GEMINI_BACKEND || "mock";
const log = (...a) => process.stderr.write(`[gemini-mcp] ${a.join(" ")}\n`);

// ---- バックエンド実装 ----------------------------------------------------

async function callMock(prompt) {
  return `「${prompt}」への回答(モック)。GEMINI_BACKEND を api か ollama にすると実際のモデルが応答します。`;
}

async function callGeminiApi(prompt) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("GEMINI_API_KEY が未設定です（GEMINI_BACKEND=api には必須）");
  const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": key },
    body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Gemini API エラー ${res.status}: ${body.slice(0, 300)}`);
  }
  const data = await res.json();
  const parts = data?.candidates?.[0]?.content?.parts ?? [];
  const text = parts.map((p) => p.text || "").join("").trim();
  return text || `（空応答）${JSON.stringify(data).slice(0, 300)}`;
}

async function callOllama(prompt) {
  const host = process.env.OLLAMA_HOST || "http://localhost:11434";
  const model = process.env.OLLAMA_MODEL || "gemma3";
  const res = await fetch(`${host}/api/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model, prompt, stream: false }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Ollama エラー ${res.status}: ${body.slice(0, 300)}`);
  }
  const data = await res.json();
  return (data?.response || "").trim() || `（空応答）${JSON.stringify(data).slice(0, 300)}`;
}

async function askBackend(prompt) {
  switch (BACKEND) {
    case "api": return callGeminiApi(prompt);
    case "ollama": return callOllama(prompt);
    case "mock": return callMock(prompt);
    default: throw new Error(`未知の GEMINI_BACKEND: ${BACKEND}`);
  }
}

// ---- MCP ツール定義 ------------------------------------------------------

const TOOLS = [
  {
    name: "ask_gemini",
    description:
      "外部モデル(Gemini もしくはローカル Ollama)に質問を投げて回答テキストを得る。" +
      "セカンドオピニオン、巨大入力の要約、別視点のレビューなどに使う。",
    inputSchema: {
      type: "object",
      properties: {
        prompt: { type: "string", description: "外部モデルへ渡すプロンプト全文" },
      },
      required: ["prompt"],
    },
  },
];

// ---- JSON-RPC / stdio ----------------------------------------------------

function send(msg) {
  process.stdout.write(JSON.stringify(msg) + "\n");
}

function reply(id, result) {
  send({ jsonrpc: "2.0", id, result });
}

function replyError(id, code, message) {
  send({ jsonrpc: "2.0", id, error: { code, message } });
}

async function handle(msg) {
  const { id, method, params } = msg;
  // 通知（id 無し）は応答しない。
  switch (method) {
    case "initialize":
      reply(id, {
        protocolVersion: params?.protocolVersion || "2024-11-05",
        capabilities: { tools: {} },
        serverInfo: { name: "gemini-mcp", version: "1.0.0" },
      });
      return;
    case "notifications/initialized":
      return; // 通知。応答不要。
    case "ping":
      reply(id, {});
      return;
    case "tools/list":
      reply(id, { tools: TOOLS });
      return;
    case "tools/call": {
      const name = params?.name;
      const args = params?.arguments || {};
      if (name !== "ask_gemini") {
        replyError(id, -32602, `未知のツール: ${name}`);
        return;
      }
      const prompt = String(args.prompt ?? "").trim();
      if (!prompt) {
        reply(id, { content: [{ type: "text", text: "prompt が空です" }], isError: true });
        return;
      }
      try {
        log(`ask_gemini backend=${BACKEND} promptLen=${prompt.length}`);
        const text = await askBackend(prompt);
        reply(id, { content: [{ type: "text", text }] });
      } catch (e) {
        reply(id, { content: [{ type: "text", text: `エラー: ${e.message}` }], isError: true });
      }
      return;
    }
    default:
      if (id !== undefined) replyError(id, -32601, `未対応のメソッド: ${method}`);
      return;
  }
}

let buffer = "";
process.stdin.setEncoding("utf8");
process.stdin.on("data", (chunk) => {
  buffer += chunk;
  let nl;
  while ((nl = buffer.indexOf("\n")) >= 0) {
    const line = buffer.slice(0, nl).trim();
    buffer = buffer.slice(nl + 1);
    if (!line) continue;
    let msg;
    try {
      msg = JSON.parse(line);
    } catch {
      log("JSON parse 失敗:", line.slice(0, 120));
      continue;
    }
    handle(msg).catch((e) => log("handle 例外:", e.message));
  }
});

log(`started (backend=${BACKEND})`);
