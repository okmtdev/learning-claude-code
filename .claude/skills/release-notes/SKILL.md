---
name: release-notes
description: git のコミット履歴からリリースノート/変更サマリを生成する。「リリースノート作って」「変更点まとめて」のときに使う。
argument-hint: [起点(タグ/コミット, 任意。未指定なら直近タグ〜HEAD)]
disable-model-invocation: true
allowed-tools: Bash(git log:*), Bash(git describe:*), Bash(bash:*), Read
---

git のコミット履歴からリリースノートを作成します。
（これは副作用ではなく生成タスクですが、明示実行させたいので手動専用にしています）

## いまの状態（スキル読み込み時に自動実行）

- 直近のタグ: !`git describe --tags --abbrev=0 2>/dev/null || echo "(タグなし。全履歴を対象)"`
- 収集したコミット:
!`bash ${CLAUDE_SKILL_DIR}/scripts/collect.sh $ARGUMENTS`

## 手順

1. 上の「収集したコミット」を読み、**Added / Changed / Fixed / その他** に分類する。
   - Conventional Commits の接頭辞（feat/fix/docs/refactor…）を手がかりにする。
2. [template.md](template.md) の形式に沿って Markdown で出力する。
3. **コミットに無い機能を捏造しない**。曖昧なものは「その他」に置く。

引数 `$ARGUMENTS` で起点（タグやコミット）を指定できます。未指定なら直近タグ〜HEAD。
