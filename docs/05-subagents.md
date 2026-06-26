# 05. サブエージェントと可視化 ⭐

このリポジトリの目玉です。**サブエージェント（subagent）** とは何かを理解し、
実際に動いている様子を **別ターミナルで目視確認** します。

## サブエージェントとは

サブエージェントは「特定の役割に特化した、独立した文脈を持つ子エージェント」です。
メインの Claude が、必要に応じて子エージェントに仕事を**委譲（delegate）**します。

メリット:
- **文脈の分離**: 子エージェントは自分の作業に集中でき、メインの会話を汚さない。
- **専門化**: 役割ごとにツールやプロンプトを絞れる（例: 調査専用＝読み取りのみ）。
- **並列化**: 複数の子エージェントを同時に走らせて時間短縮できる。

メインからは内部的に `Task` ツールとして呼ばれます。
このリポジトリでは、その `Task` 呼び出しをフックで捕捉して可視化します。

## このリポジトリのサブエージェント

`.claude/agents/*.md` に定義されています。

### `code-explorer`（読み取り専用の調査役）

```markdown
---
name: code-explorer
description: コードベースの構造・実装箇所を調べて要約する読み取り専用エージェント...
tools: Read, Grep, Glob      # ← 編集ツールを与えない = 安全
model: inherit
color: cyan
---
（システムプロンプト本文）
```

### `test-runner`（テスト実行役）

```markdown
---
name: test-runner
description: sandbox のテストを実行し、失敗内容を要約する...
tools: Bash, Read, Grep
model: inherit
color: green
---
```

### フロントマターの要点

| フィールド | 説明 |
|---|---|
| `name` | 識別子（小文字とハイフン）。必須。 |
| `description` | **いつこのエージェントに委譲すべきか**。メインがこれを見て自動委譲する。必須。 |
| `tools` | 使えるツールを限定（カンマ/空白区切り）。**省略すると全ツールを継承**。 |
| `model` | `sonnet` / `opus` / `haiku` / `inherit` など。既定は `inherit`。 |
| `color` | 表示色（任意）。 |

> 確認: `claude` 起動中に `/agents` と打つと、認識されているサブエージェント一覧が見えます。

## 🎬 デモ: エージェントが動く様子を見る

**ターミナルを2つ** 開いてください。

### ① ターミナル A でモニター起動

```bash
./scripts/watch-agents.sh
```

待機画面になります。これは `.claude/logs/agent-activity.log` を `tail -f` で
色付き表示しているだけのシンプルなツールです。

### ② ターミナル B で Claude Code を起動

```bash
claude
```

### ③ 可視化デモコマンドを実行

```
/demo-agents
```

このコマンドは、3つのサブエージェントを **1メッセージ内で並列起動** するよう
メインに指示します。ターミナル A に次のように流れます:

```
[11:48:38] 🚀 SPAWN   agent=code-explorer  task="..."     ← 黄色
[11:48:38] 🚀 SPAWN   agent=test-runner    task="..."     ← 黄色
[11:48:39] 🚀 SPAWN   agent=code-explorer  task="..."     ← 黄色
[11:48:41] ✅ DONE    agent=test-runner                   ← 緑色
[11:48:42] ✅ DONE    agent=code-explorer                 ← 緑色
[11:48:43] ✅ DONE    agent=code-explorer                 ← 緑色
```

- 🚀 SPAWN（黄）= サブエージェントが起動した瞬間
- ✅ DONE（緑）= サブエージェントが完了した瞬間

SPAWN が立て続けに3つ出てから DONE が返ってくるので、
「3体が並列で動いて、それぞれ終わった」ことが視覚的に分かります。

### 手動でも試せる

`/demo-agents` を使わず、自然言語で委譲を指示してもログは流れます:

```
code-explorer サブエージェントを使って、sandbox/src 配下の全関数を一覧にして。
```

```
test-runner と code-explorer を同時に使って、テスト実行と関数一覧を並行でやって。
```

## 仕組み（なぜログが出るのか）

```
            メインエージェント
                  │  Task ツールで子を起動
        ┌─────────┼─────────┐
        ▼         ▼         ▼
   PreToolUse フック(matcher: "Task")   ← 起動を捕捉 → ログに 🚀 SPAWN
        │
   サブエージェント実行
        │
   SubagentStop フック                  ← 完了を捕捉 → ログに ✅ DONE
```

- 設定: `.claude/settings.json`
- ロガー: `.claude/hooks/agent-logger.sh`（stdin のフック JSON から `subagent_type` 等を抽出）
- 表示: `scripts/watch-agents.sh`

フックの詳しい仕組みは次章で解説します。

## トラブル: ログが流れない場合

- `claude` を **このリポジトリのディレクトリ** で起動しているか（`.claude/settings.json` が読まれる必要がある）。
- フックの実行権限: `chmod +x .claude/hooks/agent-logger.sh`。
- `jq` が入っているか（`jq --version`）。無い場合はエージェント名が `?` になりますが SPAWN/DONE 自体は出ます。
- 設定変更直後は `claude` を再起動するか `/status` で設定が読まれているか確認。

---

次へ → [06. フックと仕組みの解説](06-hooks-and-monitoring.md)
