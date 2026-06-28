# 17. MCPサーバーを自作する（tools / resources / prompts）

[07](07-mcp.md)〜[11](11-image-generation.md) で MCP を「使う」側を学びました。
本章は「**作る**」側です。MCP サーバーが提供できる3種類——**tools / resources / prompts**——を、
このリポジトリの自作サーバー `mcp-servers/gemini/server.mjs` で実装して理解します。

## 1. MCP サーバーが提供する3種類

| 種類 | 何か | Claude からの使われ方 |
|---|---|---|
| **tools** | Claude が呼べる「動詞」（副作用あり） | ツール呼び出し（例 `ask_gemini`） |
| **resources** | Claude が参照できる「データ」（読み取り） | `@server:uri` で文脈に添付 |
| **prompts** | 再利用可能なプロンプトテンプレート | `/mcp__server__prompt` で呼ぶ |

今までの gemini サーバーは tools だけでしたが、本章で **resources と prompts も追加**しました。

## 2. stdio MCP の仕組み（おさらい）

- クライアント(Claude Code)がサーバーを**子プロセス**として起動。
- **改行区切りの JSON-RPC 2.0** を stdin/stdout でやり取り。
- **stdout は MCP メッセージ専用**。ログは stderr へ。

最小サーバーが応答すべき主なメソッド:

| メソッド | 役割 |
|---|---|
| `initialize` | 能力(capabilities)を宣言 |
| `tools/list` / `tools/call` | ツール一覧 / 実行 |
| `resources/list` / `resources/read` | リソース一覧 / 読み取り |
| `prompts/list` / `prompts/get` | プロンプト一覧 / 取得 |

`initialize` で「自分は何を提供するか」を宣言します:

```js
capabilities: { tools: {}, resources: {}, prompts: {} }
```

## 3. resources を実装する

「データ」を URI で公開します。一覧と読み取りの2メソッド。

```js
// resources/list の返り値
{ resources: [ { uri: "gemini://about", name: "...", description: "...", mimeType: "text/markdown" } ] }

// resources/read（params.uri を受けて）
{ contents: [ { uri, mimeType: "text/markdown", text: "..." } ] }
```

このリポジトリでは `gemini://about`（サーバーの概要・現在のバックエンド）を公開しています。

**動作確認（stdio に直接 JSON を流す）**:

```bash
printf '%s\n' \
  '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05"}}' \
  '{"jsonrpc":"2.0","id":2,"method":"resources/read","params":{"uri":"gemini://about"}}' \
| GEMINI_BACKEND=mock node mcp-servers/gemini/server.mjs 2>/dev/null | tail -1 | jq .
```

接続済みなら `claude` 内で `@gemini:gemini://about` のように添付して使えます（`/mcp` で確認）。

## 4. prompts を実装する

「よく使うプロンプト」を引数つきテンプレートとして公開します。

```js
// prompts/list
{ prompts: [ { name: "second_opinion", description: "...",
               arguments: [ { name: "topic", required: true } ] } ] }

// prompts/get（params.name, params.arguments）
{ description: "...", messages: [ { role: "user", content: { type: "text", text: "..." } } ] }
```

`second_opinion` プロンプトを追加しました。Claude Code 上では
`/mcp__gemini__second_opinion` のようなコマンドとして現れます。

**動作確認**:

```bash
printf '%s\n' \
  '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05"}}' \
  '{"jsonrpc":"2.0","id":2,"method":"prompts/get","params":{"name":"second_opinion","arguments":{"topic":"この設計"}}}' \
| GEMINI_BACKEND=mock node mcp-servers/gemini/server.mjs 2>/dev/null | tail -1 | jq .
```

## 5. 自作サーバーの設計メモ

- **依存ゼロ**: Node 標準の `fetch`・`fs` だけ。配布・学習が楽（`mcp-servers/gemini/`）。
- **stdout を汚さない**: `console.log` でうっかりデバッグ出力すると壊れる。必ず stderr へ。
- **通知に応答しない**: `id` の無いメッセージ（`notifications/initialized` 等）は返信不要。
- **エラーは握りつぶさない**: ツール実行失敗は `isError: true` の content か JSON-RPC error で返す。
- **能力宣言と実装を一致させる**: `capabilities` に書いたら対応する `*/list` を実装する。

## 6. tools / resources / prompts の使い分け

- **動作させたい**（DB照会・画像生成・送信）→ **tool**。
- **参照させたい**（規約・スキーマ・状態）→ **resource**（または CLAUDE.md/スキル）。
- **定型プロンプトを配りたい** → **prompt**。

> 既存の `ask_gemini` / `generate_image`（tools）に、本章で `gemini://about`（resource）と
> `second_opinion`（prompt）が加わり、3種すべてを備えたサーバーになりました。

---

次へ → [18. モデル選択とコスト戦略](18-models-and-cost.md)
