# 06. フックと仕組みの解説

前章で見た「エージェント可視化」がどう実現されているかを掘り下げます。
フック（hooks）は Claude Code の挙動の特定タイミングで、自分のスクリプトを実行する仕組みです。

## フックのイベント

主なイベント:

| イベント | 発火タイミング |
|---|---|
| `SessionStart` | セッション開始時 |
| `UserPromptSubmit` | ユーザーが入力を送った時 |
| `PreToolUse` | ツール実行の **直前**（拒否・改変も可能） |
| `PostToolUse` | ツール実行の **直後** |
| `SubagentStop` | サブエージェントが完了した時 |
| `Stop` | メインエージェントが応答を終えた時 |

## 設定の読み方

このリポジトリの `.claude/settings.json`:

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Task",
        "hooks": [
          {
            "type": "command",
            "command": "bash \"$CLAUDE_PROJECT_DIR/.claude/hooks/agent-logger.sh\" TASK_START"
          }
        ]
      }
    ],
    "SubagentStop": [
      {
        "hooks": [
          { "type": "command", "command": "bash \"$CLAUDE_PROJECT_DIR/.claude/hooks/agent-logger.sh\" SUBAGENT_DONE" }
        ]
      }
    ]
  }
}
```

要素の意味:

- **`matcher`**: どのツールに反応するか。`"Task"` はサブエージェント起動ツール。
  `"Edit|Write"` のように `|` で複数指定もできる。`SubagentStop` のように matcher 不要の
  イベントもある（その場合は全件で発火）。
- **`hooks[].type`**: `"command"`（外部コマンド実行）。
- **`command`**: 実行内容。`sh -c` 経由で実行される。
- **`$CLAUDE_PROJECT_DIR`**: プロジェクトルートに展開される環境変数。
  どこから起動しても正しいパスでスクリプトを呼べる。

## フックに渡ってくるデータ

フックコマンドの **標準入力(stdin)** に JSON が渡されます。

`PreToolUse`（Task の場合）の例:

```json
{
  "hook_event_name": "PreToolUse",
  "tool_name": "Task",
  "tool_input": {
    "subagent_type": "code-explorer",
    "description": "sandbox/src の関数一覧",
    "prompt": "..."
  },
  "session_id": "...",
  "cwd": "..."
}
```

`SubagentStop` の例:

```json
{
  "hook_event_name": "SubagentStop",
  "agent_type": "code-explorer",
  "agent_id": "..."
}
```

## ロガーの中身

`.claude/hooks/agent-logger.sh` は、この JSON を `jq` で読んで1行に整形し、
`.claude/logs/agent-activity.log` に追記しているだけです（抜粋）:

```bash
INPUT="$(cat)"                                   # stdin の JSON を読む
subagent=$(printf '%s' "$INPUT" | jq -r '.tool_input.subagent_type // empty')
description=$(printf '%s' "$INPUT" | jq -r '.tool_input.description // empty')

case "$EVENT" in
  TASK_START)    line="[$TS] 🚀 SPAWN   agent=${subagent} task=\"${description}\"" ;;
  SUBAGENT_DONE) line="[$TS] ✅ DONE    agent=${agent_type}" ;;
esac
echo "$line" >> "$LOG_FILE"
```

ポイント:
- **必ず `exit 0`**。`PreToolUse` フックが終了コード 2 を返すとツール実行がブロックされます。
  ここはログ目的なので絶対にブロックしないようにしています。
- jq が無くても落ちないようフォールバックを入れています。

## ツール実行も記録している（PostToolUse）

このリポジトリでは `PostToolUse` フックも有効化済みで、
`Bash` / `Edit` / `Write` / `MultiEdit` の実行後に `🔧 TOOL` をログに残します:

```json
"PostToolUse": [
  {
    "matcher": "Bash|Edit|Write|MultiEdit",
    "hooks": [
      { "type": "command", "command": "bash \"$CLAUDE_PROJECT_DIR/.claude/hooks/agent-logger.sh\" TOOL" }
    ]
  }
]
```

これにより、[09. 自己修正ループ](09-loops.md) で「テスト実行→修正→再実行」を繰り返す際、
`🔧 TOOL Bash` / `🔧 TOOL Edit` が連続して流れ、**ループが回っている様子が見える**ようになります。
（`Read`/`Grep` などは除外してノイズを抑えています。matcher を変えれば対象を調整できます）

> 注意: フックは「自分のマシンで自分の権限で」実行されます。
> 信頼できるコマンドだけを設定してください。

## ログを手動で確認する

モニターを使わずに中身を直接見ることもできます:

```bash
cat .claude/logs/agent-activity.log
tail -f .claude/logs/agent-activity.log   # 生ログを追う
```

---

次へ → [07. MCP サーバー](07-mcp.md)
