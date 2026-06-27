#!/usr/bin/env bash
#
# agent-logger.sh — Claude Code のフックから呼ばれ、サブエージェント等の
# アクティビティを構造化ログとして書き出す。
#
# 使い方（settings.json のフックから）:
#   bash "$CLAUDE_PROJECT_DIR/.claude/hooks/agent-logger.sh" <EVENT_LABEL>
#
# 標準入力(stdin)にフックの JSON が渡される。第1引数にイベント種別を渡す。
# ログは .claude/logs/agent-activity.log に追記される。
#
# 注意: ログ目的のみなので、必ず exit 0 で終了し Claude の動作をブロックしない。

set -uo pipefail

EVENT="${1:-UNKNOWN}"
PROJECT_DIR="${CLAUDE_PROJECT_DIR:-$(pwd)}"
LOG_DIR="$PROJECT_DIR/.claude/logs"
LOG_FILE="$LOG_DIR/agent-activity.log"

mkdir -p "$LOG_DIR"

# stdin のフック JSON を読み取る（無くても動くように）。
INPUT="$(cat 2>/dev/null || true)"
TS="$(date '+%Y-%m-%d %H:%M:%S')"

# jq でフィールドを安全に取り出すヘルパ。
field() {
  printf '%s' "$INPUT" | jq -r "$1 // empty" 2>/dev/null || true
}

tool_name="$(field '.tool_name')"
subagent="$(field '.tool_input.subagent_type')"
description="$(field '.tool_input.description')"
agent_type="$(field '.agent_type')"
# MCP の execute_sql 系で渡される SQL（先頭60文字だけ表示）。
sql="$(field '.tool_input.sql')"
sql_short="$(printf '%s' "$sql" | tr '\n' ' ' | cut -c1-60)"

line=""
case "$EVENT" in
  TASK_START)
    # PreToolUse(Task): サブエージェントが起動する直前
    line="[$TS] 🚀 SPAWN   agent=${subagent:-?}  task=\"${description:-}\""
    ;;
  SUBAGENT_DONE)
    # SubagentStop: サブエージェントが完了した
    line="[$TS] ✅ DONE    agent=${agent_type:-${subagent:-?}}"
    ;;
  TOOL)
    # PostToolUse: 任意のツール実行後（参考用）
    line="[$TS] 🔧 TOOL    ${tool_name:-?}"
    ;;
  MCP)
    # PreToolUse(mcp__*): MCP サーバーのツール呼び出し（Postgres / Gemini など）
    case "$tool_name" in
      *generate_image*)
        prompt_short="$(field '.tool_input.prompt' | tr '\n' ' ' | cut -c1-50)"
        line="[$TS] 🎨 MCP     ${tool_name}  prompt=\"${prompt_short}\""
        ;;
      *gemini*)
        prompt_short="$(field '.tool_input.prompt' | tr '\n' ' ' | cut -c1-50)"
        line="[$TS] 🤖 MCP     ${tool_name}  prompt=\"${prompt_short}\""
        ;;
      *)
        if [ -n "$sql_short" ]; then
          line="[$TS] 🗄️  MCP     ${tool_name:-?}  sql=\"${sql_short}\""
        else
          line="[$TS] 🗄️  MCP     ${tool_name:-?}"
        fi
        ;;
    esac
    ;;
  SESSION_START)
    line="[$TS] 🟢 SESSION START"
    ;;
  STOP)
    line="[$TS] 🔵 MAIN AGENT STOP"
    ;;
  *)
    line="[$TS] ❔ ${EVENT}  ${tool_name:-}"
    ;;
esac

printf '%s\n' "$line" >> "$LOG_FILE"

exit 0
