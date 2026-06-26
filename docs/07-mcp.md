# 07. MCP サーバー（発展）

MCP（Model Context Protocol）は、Claude Code に **外部ツールやデータソース** を
接続するための仕組みです。GitHub、データベース、社内 API などを「ツール」として
Claude に使わせられます。

> この章は概念紹介です。**手を動かす実践は [08. Postgres を Docker + MCP で繋ぐ](08-mcp-postgres.md)** にあります。
> ローカルの Docker で PostgreSQL を立て、自然言語で DB に問い合わせる体験ができます。

## 仕組みのイメージ

```
Claude Code  ──(MCP)──>  MCP サーバー  ──>  外部リソース
                          (別プロセス)       (DB / API / ファイル等)
```

MCP サーバーは独立したプロセスで、Claude Code はそれが公開する「ツール」を
呼び出します。

## サーバーの追加方法

```bash
# stdio 型（ローカルでコマンドとして起動するサーバー）
claude mcp add <名前> -- <起動コマンド> [引数...]

# 登録済み一覧
claude mcp list

# 削除
claude mcp remove <名前>
```

スコープ:
- `--scope local`（既定）: 自分だけ・このプロジェクト。
- `--scope project`: `.mcp.json` に保存しチームで共有。
- `--scope user`: 全プロジェクトで自分用。

## ローカルで試せる例: filesystem サーバー

公式の filesystem MCP サーバーを、このリポジトリの `sandbox` だけに限定して接続する例:

```bash
claude mcp add fs -- npx -y @modelcontextprotocol/server-filesystem "$(pwd)/sandbox"
```

接続後、`claude` 起動中に確認:

```
/mcp
```

`fs` サーバーのツールが見えれば成功です。その後、こんな依頼が MCP 経由で処理されます:

```
fs サーバーを使って sandbox 内のファイルを一覧して。
```

不要になったら削除:

```bash
claude mcp remove fs
```

> npx での取得にはネットワークが必要です。完全オフライン環境では、
> このリポジトリの主目的である「サブエージェント可視化（docs/05）」だけでも
> ローカル完結で学べます。

## MCP ツールとフックの組み合わせ

MCP ツールも `PreToolUse` / `PostToolUse` フックで捕捉できます。
matcher にはツール名（`mcp__<server>__<tool>` 形式）を指定します。例:

```json
"PreToolUse": [
  { "matcher": "mcp__fs__.*", "hooks": [ /* ... */ ] }
]
```

これで MCP ツールの利用も `watch-agents.sh` 的に可視化できます（応用課題）。

## 参考

- 公式ドキュメント: Claude Code の MCP ガイド（`claude mcp --help` でも概要が見られます）

---

次へ → [08. Postgres を Docker + MCP で繋ぐ（ハンズオン）](08-mcp-postgres.md)
