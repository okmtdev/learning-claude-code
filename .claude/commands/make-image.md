---
description: Claude は画像を作れないので、Gemini の generate_image ツールに委譲して画像を生成・保存する。要 gemini MCP（api バックエンド）。
argument-hint: [作りたい画像の説明]
allowed-tools: mcp__gemini__generate_image
---

Claude 自身は画像を生成できません。`generate_image` ツール（Gemini）に委譲してください。
別ターミナルで `./scripts/watch-agents.sh` を起動しておくと、生成呼び出しが 🎨 MCP として流れます。

作りたい画像: $ARGUMENTS

手順:
1. ユーザーの要望を、画像生成に適した具体的なプロンプトに整える（被写体・画風・構図・色・雰囲気など）。
   必要なら元の意図を確認する。
2. `generate_image` ツールを呼ぶ（`prompt` に整えた説明、必要なら `out_path` を指定）。
3. 返ってきた保存先パスをユーザーに伝える。どんな指示で生成したかも一言添える。

注意:
- 画像生成は api バックエンド限定（mock ではダミーPNG、ollama は不可）。
- 出力先の既定はプロジェクト直下の `generated/`（gitignore 済）。
