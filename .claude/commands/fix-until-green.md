---
description: sandbox/exercises のテストが全て通るまで「実行→失敗を読む→修正→再実行」を自律的に繰り返す（自己修正ループのデモ）。
argument-hint: (引数なし)
allowed-tools: Bash(npm:*), Bash(node:*), Read, Edit
---

これは自己修正ループ（loop engineering）のデモです。
別ターミナルで `./scripts/watch-agents.sh` を起動しておくと、ループ中のツール実行が 🔧 TOOL として流れます。

目標: `sandbox/exercises` のテストを **すべて green** にすること。

次の手順を、全テストが通るまで繰り返してください:
1. `cd sandbox && npm run test:exercise` を実行する。
2. 失敗したテストの**期待値と実際値**を読み、原因を特定する。
3. `sandbox/exercises/` 配下の**実装側**（テストファイルではなく）を最小限の変更で修正する。
   - テストを書き換えて通すのは禁止。あくまで実装を直すこと。
4. 再度テストを実行し、結果を確認する。まだ失敗があれば 2 に戻る。

全て通ったら、(a) 何が原因だったか、(b) どう直したか、(c) 何回ループしたか を簡潔に報告してください。
