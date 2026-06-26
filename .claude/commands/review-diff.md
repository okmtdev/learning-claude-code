---
description: 現在の git 差分（ステージ済み・未ステージ）をレビューし、バグ・改善点を指摘する。
argument-hint: [観点(任意) 例: security]
allowed-tools: Bash(git diff:*), Bash(git status:*), Read
---

現在の作業ツリーの差分をレビューしてください。

まず以下を実行して差分を把握します:
- `git status`
- `git diff`
- `git diff --staged`

観点の指定: $ARGUMENTS （未指定なら「正確性・可読性・バグ」を中心に）

レビュー結果は次の形式で:
- **要約**: 差分が何をしているか1〜2文。
- **指摘事項**: 重要度（高/中/低）付きの箇条書き。各指摘に `file:line` を添える。
- **良い点**: あれば簡潔に。
