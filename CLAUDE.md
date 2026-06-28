# CLAUDE.md

このファイルは Claude Code に常時読み込まれる「プロジェクトの取扱説明書」です。
（このリポジトリ自体が CLAUDE.md の実例を兼ねています）

## このリポジトリの目的

Claude Code（CLI）を手を動かして学ぶための教材。詳しくは `README.md` と `docs/`。

## ディレクトリ

- `docs/` … ステップ別チュートリアル（01〜11, 99）
- `.claude/agents/` … カスタムサブエージェント（`code-explorer`, `test-runner`）
- `.claude/commands/` … カスタムスラッシュコマンド（`/demo-agents`, `/review-diff`, `/db-report`, `/fix-until-green`, `/second-opinion`, `/make-image`）
- `.claude/hooks/agent-logger.sh` … フックから呼ばれるロガー（サブエージェント＋MCP呼び出しを記録）
- `scripts/watch-agents.sh` … エージェント活動のリアルタイム監視ツール
- `sandbox/` … 練習用 Node.js プロジェクト（依存なし）
- `docker-compose.yml` / `db/init/` … 学習用 PostgreSQL と初期データ（docs/08, MCP 連携用）
- `mcp-servers/gemini/` … 外部モデル(Gemini/Ollama)を ask_gemini / generate_image ツールにする自作 MCP サーバー（docs/10-11）
- `generated/` … generate_image の出力先（生成物。gitignore 済）

## テスト

- テストは `sandbox/` で実行する: `cd sandbox && npm test`（常に green を保つ）
- `sandbox/exercises/` は**わざとバグ入り**（自己修正ループの題材, docs/09）。
  実行は `npm run test:exercise`。デフォルトの `npm test` には含めない。
- テストランナーは Node 標準（`node --test`）。外部依存は追加しない方針。

## コーディング方針

- `sandbox` のコードは初学者向けの教材なので、過度に凝らず読みやすさ優先。
- 既存のコメントは日本語。スタイルを合わせる。

## 注意

- `.claude/logs/*.log` は生成物。Git では追跡しない（`.gitignore` 済）。
- フックスクリプトはログ目的。`exit 0` を守り、Claude の動作をブロックしない。
