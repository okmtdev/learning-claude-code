#!/usr/bin/env bash
#
# watch-agents.sh — サブエージェントの動きを「別ターミナルで」リアルタイム監視する。
#
# 使い方:
#   ./scripts/watch-agents.sh
#
# 別のターミナルでこれを起動した状態で、Claude Code 側でサブエージェントを
# 使うタスク（例: /demo-agents）を実行すると、ここに 🚀 SPAWN / ✅ DONE が
# 流れて「エージェントが実際に動いている」ことが視覚的に確認できる。

set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
LOG_FILE="$PROJECT_DIR/.claude/logs/agent-activity.log"

# 色定義（端末が対応していれば色付け）。
if [ -t 1 ]; then
  RED=$'\033[31m'; GREEN=$'\033[32m'; YELLOW=$'\033[33m'
  BLUE=$'\033[34m'; CYAN=$'\033[36m'; BOLD=$'\033[1m'; RESET=$'\033[0m'
else
  RED=""; GREEN=""; YELLOW=""; BLUE=""; CYAN=""; BOLD=""; RESET=""
fi

mkdir -p "$(dirname "$LOG_FILE")"
touch "$LOG_FILE"

clear 2>/dev/null || true
echo "${BOLD}${CYAN}╔══════════════════════════════════════════════════════╗${RESET}"
echo "${BOLD}${CYAN}║   Claude Code  Agent Activity Monitor  (Ctrl-C で終了) ║${RESET}"
echo "${BOLD}${CYAN}╚══════════════════════════════════════════════════════╝${RESET}"
echo "監視ファイル: $LOG_FILE"
echo "Claude Code 側でサブエージェントを使うと、ここに流れます…"
echo "------------------------------------------------------------"

# 既存の行も含めて表示しつつ、追記をリアルタイムで追う。
# キーワードごとに色付けする。
tail -n 20 -f "$LOG_FILE" | while IFS= read -r line; do
  case "$line" in
    *"🚀 SPAWN"*)         echo "${YELLOW}${line}${RESET}" ;;
    *"✅ DONE"*)          echo "${GREEN}${line}${RESET}" ;;
    *"🟢 SESSION"*)       echo "${GREEN}${BOLD}${line}${RESET}" ;;
    *"🔵 MAIN AGENT"*)    echo "${BLUE}${line}${RESET}" ;;
    *"🔧 TOOL"*)          echo "${CYAN}${line}${RESET}" ;;
    *"🗄️"*)               echo "${RED}${line}${RESET}" ;;
    *"🤖 MCP"*)           echo "${BOLD}${BLUE}${line}${RESET}" ;;
    *)                    echo "${line}" ;;
  esac
done
