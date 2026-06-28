#!/usr/bin/env bash
# gemini MCP サーバーの起動ラッパ。
# 同ディレクトリの .env を読み込んでから server.mjs を起動する。
# これにより API キーを .mcp.json やシェル履歴に残さずに済む。
#
# Claude Code への登録例:
#   claude mcp add gemini -- bash /絶対パス/mcp-servers/gemini/run.sh
set -euo pipefail

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# .env があれば読み込む（KEY=VALUE 形式）。
if [ -f "$DIR/.env" ]; then
  set -a
  # shellcheck disable=SC1091
  . "$DIR/.env"
  set +a
fi

exec node "$DIR/server.mjs"
