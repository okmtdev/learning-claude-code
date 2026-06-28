#!/usr/bin/env bash
#
# collect.sh — リリースノート用にコミットを収集する補助スクリプト。
# release-notes スキルから ${CLAUDE_SKILL_DIR}/scripts/collect.sh 経由で呼ばれる。
#
# 使い方:
#   collect.sh [起点]
#     起点を省略すると、直近タグ〜HEAD（タグが無ければ全履歴の直近50件）。

set -uo pipefail

start="${1:-}"

if [ -z "$start" ]; then
  start="$(git describe --tags --abbrev=0 2>/dev/null || true)"
fi

if [ -n "$start" ]; then
  range="${start}..HEAD"
  echo "# 範囲: ${range}"
  git log --no-merges --pretty=format:'- %s (%h)' "${range}" 2>/dev/null || \
    git log --no-merges --pretty=format:'- %s (%h)' -n 50
else
  echo "# 範囲: 全履歴の直近50件"
  git log --no-merges --pretty=format:'- %s (%h)' -n 50
fi
echo
