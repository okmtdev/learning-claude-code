---
description: Postgres MCP サーバー経由で shop データベースを調べ、スキーマ概要と簡単な売上分析を日本語でレポートする。事前に docker compose up と MCP 接続が必要。
argument-hint: (引数なし)
---

Postgres MCP サーバー（`postgres`）を使って、`shop` データベースを調査しレポートしてください。
別ターミナルで `./scripts/watch-agents.sh` を起動しておくと、MCP 呼び出しが 🗄️ MCP として流れます。

手順:
1. テーブル一覧とスキーマを取得する（list_schemas / スキーマ参照系ツール）。
2. 次の分析クエリを SQL で実行する:
   - 顧客ごとの「支払済み(paid)」注文の合計金額ランキング（上位5件）。
   - カテゴリ別の売上合計。
   - 返金(refunded)された注文の件数と内容。
3. 結果を日本語の表とコメントでまとめる。

注意:
- 参照のみ（SELECT）で完結させ、データを変更しないこと。
- 金額は price_cents（セント）なので、表示時は通貨単位に直すこと。
