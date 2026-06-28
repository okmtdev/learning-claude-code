---
name: repo-conventions
description: このリポジトリのコーディング規約・テスト方法・ディレクトリ構成・禁止事項を答える。コードを書く/直す前や「このプロジェクトのルールは?」と聞かれたときに使う。
when_to_use: 規約 コーディングスタイル テストの実行方法 ディレクトリ構成 どこに置く 命名 naming convention
user-invocable: true
---

このリポジトリで作業するときの規約です。要点は以下。詳細は必要時に参照ファイルを読むこと。

## 要点
- テストは `cd sandbox && npm test`（常に緑を保つ）。`sandbox/exercises/` は別物（`npm run test:exercise`、docs/09）。
- コメント・ドキュメントは**日本語**。教材なので**可読性優先**で過度に凝らない。
- 生成物（`.claude/logs/*.log`, `generated/`）はコミットしない。
- 秘密情報（`.env`）はコミットしない・読ませない（docs/13）。
- 外部依存は増やさない方針（Node 標準の `node --test` を使う）。

## さらに詳しく
- 命名・スタイル・レビュー観点・PR の出し方の詳細は [reference.md](reference.md) を参照（必要になったら読む）。
