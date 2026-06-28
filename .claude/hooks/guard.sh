#!/usr/bin/env bash
#
# guard.sh — PreToolUse(Bash) フックの安全ガード。
# 明らかに危険な Bash コマンドだけをブロックする学習用デモ。
#
# 使い方（settings.json）:
#   matcher: "Bash" の PreToolUse フックとして登録。
#   stdin に PreToolUse の JSON が渡る。
#
# ブロックの仕組み:
#   PreToolUse フックが JSON を stdout に出し、
#   hookSpecificOutput.permissionDecision = "deny" を返すとツール実行が拒否される。
#
# 注意: ここはあくまで「危険な一部パターン」を弾くだけのデモ。
#       本物の防御は permissions(allow/deny) 設定と人間の確認が基本（docs/13）。

set -uo pipefail

PROJECT_DIR="${CLAUDE_PROJECT_DIR:-$(pwd)}"
LOG_FILE="$PROJECT_DIR/.claude/logs/agent-activity.log"
INPUT="$(cat 2>/dev/null || true)"

command_str="$(printf '%s' "$INPUT" | jq -r '.tool_input.command // empty' 2>/dev/null || true)"

# 危険パターン（必要に応じて調整）。
# - rm -rf /  などの破壊的削除
# - パイプで取得スクリプトを直接シェル実行（curl|sh, wget|bash）
# - ディスク直書き(dd of=/dev/...)、:(){...} fork bomb
deny_reason=""
case "$command_str" in
  *"rm -rf /"*|*"rm -rf /*"*|*"rm -rf ~"*|*"rm -fr /"*)
    deny_reason="破壊的な削除コマンドを検出しました" ;;
  *"curl"*"| sh"*|*"curl"*"| bash"*|*"wget"*"| sh"*|*"wget"*"| bash"*|*"curl"*"|sh"*|*"curl"*"|bash"*)
    deny_reason="ネットから取得したスクリプトの直接実行(curl|sh 等)を検出しました" ;;
  *"dd "*"of=/dev/"*)
    deny_reason="デバイスへの直接書き込み(dd of=/dev/...)を検出しました" ;;
  *":(){"*":|:&"*|*":(){ :|:& };:"*)
    deny_reason="fork bomb を検出しました" ;;
esac

if [ -n "$deny_reason" ]; then
  TS="$(date '+%Y-%m-%d %H:%M:%S')"
  mkdir -p "$(dirname "$LOG_FILE")"
  printf '[%s] 🛑 BLOCK   %s :: %s\n' "$TS" "$deny_reason" "$(printf '%s' "$command_str" | cut -c1-60)" >> "$LOG_FILE"
  # permissionDecision=deny で実行を拒否する。
  cat <<JSON
{"hookSpecificOutput":{"hookEventName":"PreToolUse","permissionDecision":"deny","permissionDecisionReason":"[guard.sh] ${deny_reason}。学習用ガードによりブロックしました。"}}
JSON
  exit 0
fi

# 問題なければ何も出力せず通す。
exit 0
