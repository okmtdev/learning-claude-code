# 01. インストールと初期設定

Claude Code（CLI）をローカルにセットアップします。

## 1. インストール

### npm（推奨・どの OS でも）

```bash
npm install -g @anthropic-ai/claude-code
```

### ネイティブインストーラ

```bash
# macOS / Linux
curl -fsSL https://claude.ai/install.sh | bash

# Windows (PowerShell)
irm https://claude.ai/install.ps1 | iex
```

インストール確認:

```bash
claude --version
```

## 2. 起動と認証

リポジトリのディレクトリに移動して起動します。

```bash
cd learning-claude-code
claude
```

初回起動時:
- ブラウザが開き、Claude アカウント（Pro/Max プラン）または Anthropic Console（API キー課金）でログインします。
- ターミナルのテーマ選択などの初期設定が走ります。

## 3. 動作確認

プロンプトが出たら、そのまま日本語で打ち込めます:

```
いま居るディレクトリにあるファイルを一覧して。
```

ファイル一覧が返ってくれば成功です。`/exit` または `Ctrl-D` で終了できます。

## 4. このリポジトリ用の準備

可視化スクリプトに実行権限を付けておきます（クローン直後に1回だけ）:

```bash
chmod +x scripts/watch-agents.sh .claude/hooks/agent-logger.sh
```

サンドボックスのテストが通ることを確認:

```bash
cd sandbox && npm test && cd ..
```

> `# pass 6` と表示されれば OK。Node.js 18 以上が必要です（`node --version` で確認）。

## 5. 設定ファイルの場所（概念）

| スコープ | パス | 用途 |
|---|---|---|
| ユーザー全体 | `~/.claude/settings.json` | 全プロジェクト共通の設定 |
| プロジェクト | `.claude/settings.json` | チームで共有する設定（**このリポジトリで使用**） |
| ローカル | `.claude/settings.local.json` | 個人用・Git 管理外 |

このリポジトリの `.claude/settings.json` には、エージェント可視化用のフックが入っています（[docs/06](06-hooks-and-monitoring.md) で解説）。

---

次へ → [02. CLI の基本操作](02-cli-basics.md)
