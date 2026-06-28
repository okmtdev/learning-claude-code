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

import { writeFileSync, mkdirSync } from "node:fs";
import { join, isAbsolute, dirname } from "node:path";

const BACKEND = process.env.GEMINI_BACKEND || "mock";
const log = (...a) => process.stderr.write(`[gemini-mcp] ${a.join(" ")}\n`);

// 画像の保存先ルート（既定はプロジェクト直下の generated/）。
function projectRoot() {
  return process.env.CLAUDE_PROJECT_DIR || process.cwd();
}
function saveImage(buf, mimeType, outPath) {
  const mt = mimeType || "image/png";
  const ext = mt.includes("jpeg") || mt.includes("jpg") ? "jpg" : (mt.split("/")[1] || "png");
  let target;
  if (outPath) {
    target = isAbsolute(outPath) ? outPath : join(projectRoot(), outPath);
  } else {
    target = join(projectRoot(), "generated", `gemini-${Date.now()}.${ext}`);
  }
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, buf);
  return target;
}

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

// ---- 画像生成 ------------------------------------------------------------

// 1x1 透明 PNG（mock 用のダミー画像）。
const ONE_PX_PNG =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

function generateImageMock(prompt, outPath) {
  const buf = Buffer.from(ONE_PX_PNG, "base64");
  const saved = saveImage(buf, "image/png", outPath);
  return { saved, text: `(モック) ダミーPNGを保存。GEMINI_BACKEND=api で実画像になります。prompt="${prompt.slice(0, 40)}"` };
}

async function generateImageApi(prompt, outPath) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("GEMINI_API_KEY が未設定です（画像生成には api バックエンドが必要）");
  const model = process.env.GEMINI_IMAGE_MODEL || "gemini-2.5-flash-image";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": key },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { responseModalities: ["TEXT", "IMAGE"] },
    }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Gemini API エラー ${res.status}: ${body.slice(0, 300)}`);
  }
  const data = await res.json();
  const parts = data?.candidates?.[0]?.content?.parts ?? [];
  const imgPart = parts.find((p) => p.inlineData?.data || p.inline_data?.data);
  if (!imgPart) throw new Error(`画像が返りませんでした: ${JSON.stringify(data).slice(0, 300)}`);
  const inline = imgPart.inlineData || imgPart.inline_data;
  const buf = Buffer.from(inline.data, "base64");
  const saved = saveImage(buf, inline.mimeType || inline.mime_type, outPath);
  const text = parts.filter((p) => p.text).map((p) => p.text).join(" ").trim();
  return { saved, text };
}

async function generateImage(prompt, outPath) {
  if (BACKEND === "ollama") {
    throw new Error("Ollama(Gemma) では画像生成できません。GEMINI_BACKEND=api を使ってください。");
  }
  return BACKEND === "api" ? generateImageApi(prompt, outPath) : generateImageMock(prompt, outPath);
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
  {
    name: "generate_image",
    description:
      "Gemini の画像生成モデル(gemini-2.5-flash-image)で画像を生成し、ファイルに保存してパスを返す。" +
      "Claude は画像を生成できないため、画像が必要なときにこのツールへ委譲する。api バックエンド限定。",
    inputSchema: {
      type: "object",
      properties: {
        prompt: { type: "string", description: "生成したい画像の説明（英語推奨だが日本語も可）" },
        out_path: {
          type: "string",
          description: "保存先パス（任意）。相対パスはプロジェクト基準。未指定なら generated/ に自動命名で保存。",
        },
      },
      required: ["prompt"],
    },
  },
];

// ---- MCP リソース定義（読み取り専用データ） ------------------------------
// リソースは「Claude が参照できるデータ」。@gemini-mcp:... の形で添付できる。

const ABOUT_TEXT = `# gemini-mcp について

外部モデル(Gemini / ローカル Ollama)を Claude のツールにする学習用 MCP サーバー。

## ツール
- ask_gemini(prompt): 別モデルに質問してテキスト回答を得る（セカンドオピニオン・要約など）
- generate_image(prompt, out_path?): 画像を生成して保存（api バックエンド限定）

## バックエンド（環境変数 GEMINI_BACKEND）
- mock   : 通信なし。配線確認用（既定）
- api    : Google Gemini API（要 GEMINI_API_KEY）
- ollama : ローカル Ollama（完全ローカル。画像生成は不可）

現在のバックエンド: ${BACKEND}
`;

const RESOURCES = [
  {
    uri: "gemini://about",
    name: "gemini-mcp について",
    description: "この MCP サーバーの概要・ツール・バックエンド設定",
    mimeType: "text/markdown",
  },
];

function readResource(uri) {
  switch (uri) {
    case "gemini://about":
      return { uri, mimeType: "text/markdown", text: ABOUT_TEXT };
    default:
      return null;
  }
}

// ---- MCP プロンプト定義（再利用可能なプロンプトテンプレート） --------------
// プロンプトは Claude Code で /mcp__gemini__<name> のように呼べる。

const PROMPTS = [
  {
    name: "second_opinion",
    description: "指定トピックについて、別モデルにセカンドオピニオンを求めるプロンプトを生成する",
    arguments: [
      { name: "topic", description: "レビュー/検証したい対象や論点", required: true },
    ],
  },
];

function getPrompt(name, args) {
  if (name !== "second_opinion") return null;
  const topic = args?.topic || "(未指定)";
  return {
    description: "セカンドオピニオン用プロンプト",
    messages: [
      {
        role: "user",
        content: {
          type: "text",
          text:
            `次について批判的にレビューしてください: ${topic}\n` +
            `- 見落とし・誤り・リスクを挙げる\n- 代替案があれば提示する\n- 最後に「結論」を1〜2文で`,
        },
      },
    ],
  };
}

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
        // tools だけでなく resources / prompts も提供することを宣言（docs/17）。
        capabilities: { tools: {}, resources: {}, prompts: {} },
        serverInfo: { name: "gemini-mcp", version: "1.1.0" },
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
    case "resources/list":
      reply(id, { resources: RESOURCES });
      return;
    case "resources/read": {
      const uri = params?.uri;
      const content = readResource(uri);
      if (!content) {
        replyError(id, -32602, `未知のリソース: ${uri}`);
        return;
      }
      reply(id, { contents: [content] });
      return;
    }
    case "prompts/list":
      reply(id, { prompts: PROMPTS });
      return;
    case "prompts/get": {
      const result = getPrompt(params?.name, params?.arguments);
      if (!result) {
        replyError(id, -32602, `未知のプロンプト: ${params?.name}`);
        return;
      }
      reply(id, result);
      return;
    }
    case "tools/call": {
      const name = params?.name;
      const args = params?.arguments || {};
      const prompt = String(args.prompt ?? "").trim();
      if (!prompt) {
        reply(id, { content: [{ type: "text", text: "prompt が空です" }], isError: true });
        return;
      }
      if (name === "ask_gemini") {
        try {
          log(`ask_gemini backend=${BACKEND} promptLen=${prompt.length}`);
          const text = await askBackend(prompt);
          reply(id, { content: [{ type: "text", text }] });
        } catch (e) {
          reply(id, { content: [{ type: "text", text: `エラー: ${e.message}` }], isError: true });
        }
        return;
      }
      if (name === "generate_image") {
        try {
          log(`generate_image backend=${BACKEND} promptLen=${prompt.length}`);
          const { saved, text } = await generateImage(prompt, args.out_path);
          reply(id, { content: [{ type: "text", text: `画像を保存しました: ${saved}${text ? "\n" + text : ""}` }] });
        } catch (e) {
          reply(id, { content: [{ type: "text", text: `エラー: ${e.message}` }], isError: true });
        }
        return;
      }
      replyError(id, -32602, `未知のツール: ${name}`);
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
