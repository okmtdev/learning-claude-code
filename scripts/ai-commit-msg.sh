#!/usr/bin/env bash
#
# ai-commit-msg.sh — headless モード(claude -p)の実用デモ。
# ステージ済みの git 差分から、コミットメッセージ案を生成して表示する。
#
# 使い方:
#   git add -p           # 何かをステージしてから
#   ./scripts/ai-commit-msg.sh
#
# 仕組み: `git diff --staged` を claude -p にパイプで渡し、テキストだけ受け取る。
#         対話なし・ツール実行なしのワンショット呼び出し。

set -uo pipefail

if ! command -v claude >/dev/null 2>&1; then
  echo "claude CLI が見つかりません。docs/01 を参照。" >&2
  exit 1
fi

diff="$(git diff --staged)"
if [ -z "$diff" ]; then
  echo "ステージされた変更がありません。先に 'git add' してください。" >&2
  exit 1
fi

prompt='次の git diff に対するコミットメッセージを提案してください。
出力は Conventional Commits 形式の1行のみ（例: "feat: add X"）。説明や前置き・コードブロックは不要。'

# --permission-mode plan で読み取り専用に固定し、余計なツール実行をさせない。
printf '%s\n\n--- diff ---\n%s\n' "$prompt" "$diff" \
  | claude -p --permission-mode plan
