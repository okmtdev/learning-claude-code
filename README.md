# learning-claude-code

Claude Code（CLI）を **手を動かしながら** 学ぶための学習用リポジトリです。

- 🧑‍💻 CLI ベースの利用手順を、上から順にコピー&ペーストで試せます
- 🧩 主要機能（編集・検索・スラッシュコマンド・サブエージェント・フック・MCP）を一通りカバー
- 👀 **サブエージェントが実際に動いている様子を、別ターミナルで視覚的に確認** できます
- 📦 すべて **ローカルで完結**（外部サービス不要、依存パッケージほぼ不要）

> 想定読者: Claude Code をこれから触る／触り始めたばかりの人。
> 前提: ターミナルが使える環境。Node.js 18+（`node --test` を使うため）。

---

## 目次

| ステップ | 内容 | ドキュメント |
|---|---|---|
| 0 | このリポジトリの構成 | （下記） |
| 1 | インストールと初期設定 | [docs/01-setup.md](docs/01-setup.md) |
| 2 | CLI の基本操作 | [docs/02-cli-basics.md](docs/02-cli-basics.md) |
| 3 | 主要機能（編集・検索・Git・計画モード） | [docs/03-core-features.md](docs/03-core-features.md) |
| 4 | スラッシュコマンド（組み込み & カスタム） | [docs/04-slash-commands.md](docs/04-slash-commands.md) |
| 5 | **サブエージェントと可視化** ⭐ | [docs/05-subagents.md](docs/05-subagents.md) |
| 6 | フックと仕組みの解説 | [docs/06-hooks-and-monitoring.md](docs/06-hooks-and-monitoring.md) |
| 7 | MCP サーバー（概念） | [docs/07-mcp.md](docs/07-mcp.md) |
| 8 | **Postgres を Docker + MCP で繋ぐ** 🐘 | [docs/08-mcp-postgres.md](docs/08-mcp-postgres.md) |
| 9 | **ループエンジニアリング（自己修正ループ）** 🔁 | [docs/09-loops.md](docs/09-loops.md) |

困ったら [docs/99-troubleshooting.md](docs/99-troubleshooting.md) を参照。

---

## リポジトリ構成

```
learning-claude-code/
├── README.md                     ← いまここ
├── docs/                         ← ステップ別の解説
├── .claude/
│   ├── settings.json             ← フック設定（エージェント可視化の心臓部）
│   ├── agents/                   ← カスタムサブエージェント定義
│   │   ├── code-explorer.md      ← 読み取り専用の調査エージェント
│   │   └── test-runner.md        ← テスト実行エージェント
│   ├── commands/                 ← カスタムスラッシュコマンド
│   │   ├── demo-agents.md        ← /demo-agents : 可視化デモ
│   │   ├── review-diff.md        ← /review-diff : 差分レビュー
│   │   ├── db-report.md          ← /db-report   : Postgres 分析レポート（要MCP）
│   │   └── fix-until-green.md    ← /fix-until-green : テストが通るまで自走（loop）
│   ├── hooks/
│   │   └── agent-logger.sh       ← フックから呼ばれるロガー
│   └── logs/                     ← アクティビティログ出力先（gitignore 済）
├── scripts/
│   └── watch-agents.sh           ← ログをリアルタイム色付き表示する監視ツール
├── sandbox/                      ← 練習用 Node.js プロジェクト（依存なし）
│   ├── src/                      ← 操作対象のサンプルコード
│   ├── test/                     ← node --test 用テスト（npm test で緑）
│   └── exercises/                ← わざとバグ入り。自己修正ループの題材（docs/09）
├── docker-compose.yml            ← 学習用 PostgreSQL（docs/08 で使用）
└── db/init/                      ← Postgres 初期スキーマ＆サンプルデータ
```

---

## クイックスタート（5分）

### 1. リポジトリを開く

```bash
git clone <このリポジトリのURL> learning-claude-code
cd learning-claude-code
```

### 2. Claude Code を起動する

```bash
claude
```

初回はブラウザで認証が走ります。完了するとプロンプトが出ます。
（インストールがまだの場合は [docs/01-setup.md](docs/01-setup.md) を参照）

### 3. まずは挨拶して動作確認

Claude Code のプロンプトに、そのまま日本語で打ち込みます:

```
このリポジトリは何のためのもの? README を読んで3行で説明して。
```

これで「自然言語で頼む → Claude がファイルを読んで答える」基本の流れが体感できます。

### 4. サンドボックスのテストを動かす

```
sandbox のテストを実行して結果を教えて。
```

Claude が `cd sandbox && npm test` を実行してよいか確認してきます。許可すると 6 件のテストが通るはずです。

---

## ⭐ 目玉: サブエージェントが動く様子を「見る」

このリポジトリの最大のポイントです。**ターミナルを2つ** 用意してください。

### ターミナル A — モニターを起動

```bash
./scripts/watch-agents.sh
```

次のような監視画面が出て待機状態になります:

```
╔══════════════════════════════════════════════════════╗
║   Claude Code  Agent Activity Monitor  (Ctrl-C で終了) ║
╚══════════════════════════════════════════════════════╝
監視ファイル: .../.claude/logs/agent-activity.log
Claude Code 側でサブエージェントを使うと、ここに流れます…
------------------------------------------------------------
```

### ターミナル B — Claude Code を起動してデモ実行

```bash
claude
```

プロンプトで:

```
/demo-agents
```

すると **ターミナル A** に、3つのサブエージェントが起動・完了する様子がリアルタイムで色付き表示されます:

```
[11:48:38] 🚀 SPAWN   agent=code-explorer  task="sandbox/src の関数一覧"   (黄)
[11:48:38] 🚀 SPAWN   agent=test-runner    task="テスト実行"               (黄)
[11:48:39] 🚀 SPAWN   agent=code-explorer  task="スラッシュコマンド一覧"    (黄)
[11:48:41] ✅ DONE    agent=test-runner                                    (緑)
[11:48:42] ✅ DONE    agent=code-explorer                                  (緑)
[11:48:43] ✅ DONE    agent=code-explorer                                  (緑)
```

🚀（黄）= サブエージェント起動、✅（緑）= 完了。
「エージェントが本当に並列で動いている」ことが目で確認できます。

> 仕組み: `.claude/settings.json` のフックが、サブエージェント起動時（`PreToolUse` の `Task`）と
> 完了時（`SubagentStop`）に `agent-logger.sh` を呼び、ログに追記します。
> `watch-agents.sh` はそのログを `tail -f` で色付き表示しているだけです。
> 詳細は [docs/05-subagents.md](docs/05-subagents.md) と [docs/06-hooks-and-monitoring.md](docs/06-hooks-and-monitoring.md)。

---

## 次のステップ

[docs/01-setup.md](docs/01-setup.md) から順に進めてください。各ドキュメントは「説明 → コピペして試すコマンド/プロンプト → 確認ポイント」の構成になっています。

## ライセンス

MIT
