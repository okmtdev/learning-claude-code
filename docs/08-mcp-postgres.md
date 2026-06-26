# 08. ローカル Docker の Postgres を MCP でつなぐ（ハンズオン）

[07](07-mcp.md) で概念を見た MCP を、**ローカル Docker の PostgreSQL** で実践します。
自然言語で「先月一番売れたカテゴリは?」のように聞くと、Claude が SQL を組み立てて
DB に問い合わせて答える、という体験をローカル完結で作ります。

さらに、その MCP 呼び出しも [05](05-subagents.md) の Agent Activity Monitor に
🗄️ として流れるようにしてあります。

## 全体像

```
Claude Code ──(MCP/stdio)──> postgres-mcp コンテナ ──> Postgres コンテナ(:5432)
     │                                                      ▲
     └─ PreToolUse(mcp__*) フック → 🗄️ MCP をログに記録 ──┘（可視化）
```

- DB: `docker-compose.yml`（`postgres:16-alpine`、初期データ付き）
- MCP サーバー: [`crystaldba/postgres-mcp`](https://github.com/crystaldba/postgres-mcp)（Docker イメージ）
- 可視化: 既存のフック＋`watch-agents.sh`

## 前提

- Docker / Docker Compose が動くこと（`docker --version`, `docker compose version`）。
- イメージ取得時のみネットワークが必要（取得後はローカルで動きます）。

## 1. Postgres を起動する

リポジトリ直下で:

```bash
docker compose up -d
```

初回は `db/init/01_schema.sql`・`02_seed.sql` が自動実行され、
`shop` データベースに EC のサンプル（customers / products / orders / order_items）が入ります。

起動確認:

```bash
docker compose ps
# psql が手元にあれば疎通確認（任意）
psql "postgresql://learner:learner@localhost:5432/shop" -c "select count(*) from orders;"
```

> 接続情報: ユーザ `learner` / パスワード `learner` / DB `shop` / ポート `5432`。

## 2. Postgres MCP サーバーを Claude Code に登録する

`crystaldba/postgres-mcp` を Docker で起動する形で登録します。
**このイメージは `localhost` を自動的にホスト側へ remap** します
（Mac/Windows は `host.docker.internal`、Linux はホストアドレス）。
なので接続文字列は素直に `localhost:5432` を書けます。

```bash
claude mcp add postgres -- \
  docker run -i --rm \
  -e DATABASE_URI=postgresql://learner:learner@localhost:5432/shop \
  crystaldba/postgres-mcp --access-mode=restricted
```

ポイント:
- `-i`（インタラクティブ）と `--rm`（終了時に破棄）は stdio MCP の定番。
- `DATABASE_URI` が接続文字列。
- `--access-mode=restricted`: **読み取り中心の安全モード**（学習はこれを推奨）。
  書き込みも試したい場合は `--access-mode=unrestricted` にする。

登録の確認:

```bash
claude mcp list
```

`claude` を起動して接続状態を確認:

```
/mcp
```

`postgres` が connected と出て、`execute_sql` などのツールが見えれば成功です。

> 補足: もっと手軽に試したいだけなら、Docker を使わない参照実装
> `claude mcp add pg -- npx -y @modelcontextprotocol/server-postgres "postgresql://learner:learner@localhost:5432/shop"`
> でも読み取りはできます（ただし機能は最小限。本章は高機能な crystaldba 版を推奨）。

## 3. 自然言語で DB に聞いてみる

**ターミナル A** でモニターを起動:

```bash
./scripts/watch-agents.sh
```

**ターミナル B** の `claude` で、普通に日本語で頼みます:

```
postgres の shop データベースにあるテーブルを一覧して、それぞれの役割を説明して。
```

```
支払済み(status = 'paid')の注文について、顧客ごとの合計金額の多い順トップ3を出して。金額は円表示で。
```

```
カテゴリ別の売上合計を求めて、棒グラフ風のテキストで表示して。
```

実行すると **ターミナル A** に MCP 呼び出しが流れます:

```
[12:30:01] 🗄️  MCP     mcp__postgres__list_schemas
[12:30:03] 🗄️  MCP     mcp__postgres__execute_sql  sql="SELECT c.name, SUM(...) ..."   (赤)
```

「Claude が裏で実際に SQL を発行して DB に触っている」ことが目で確認できます。

## 4. ワンコマンドでレポート: `/db-report`

まとめて分析させるカスタムコマンドを用意してあります:

```
/db-report
```

スキーマ概要＋売上ランキング＋カテゴリ別集計＋返金の確認を、日本語のレポートで返します
（中身は `.claude/commands/db-report.md`）。

## 5. 発展: 性能分析とインデックス提案

crystaldba 版は EXPLAIN 解析やインデックス提案の機能を持っています:

```
orders と order_items を結合して顧客別売上を出すクエリの実行計画(EXPLAIN)を見て、
追加すべきインデックスがあれば提案して。理由も添えて。
```

`db/init/01_schema.sql` ではあえて `orders(customer_id)` にしかインデックスを張っていません。
`order_items(order_id)` などを提案してくるはずです。

## 6. 書き込みも試す（任意）

書き込みを試す場合は MCP を unrestricted で登録し直します:

```bash
claude mcp remove postgres
claude mcp add postgres -- \
  docker run -i --rm \
  -e DATABASE_URI=postgresql://learner:learner@localhost:5432/shop \
  crystaldba/postgres-mcp --access-mode=unrestricted
```

```
新しい商品 "Webcam"（category=electronics, price_cents=6000）を products に追加して。
追加後、electronics カテゴリの商品一覧を表示して。
```

> 学習が終わったら restricted に戻しておくと安全です。

## 7. 後片付け

```bash
# MCP 登録を外す
claude mcp remove postgres

# Postgres を停止（データは残る）
docker compose down

# データも含めて完全初期化（次回 up で seed が再実行される）
docker compose down -v
```

## トラブルシューティング

| 症状 | 対処 |
|---|---|
| `/mcp` で postgres が出ない | `claude` を再起動。`claude mcp list` で登録を確認。 |
| 接続エラー | `docker compose ps` で DB が healthy か確認。`psql ...select 1` で疎通切り分け。 |
| Linux で接続できない | `localhost` remap が効かない場合は `DATABASE_URI` のホストを `172.17.0.1`（docker0 のIP）にする。 |
| イメージ取得が遅い/失敗 | 初回のみ `docker pull crystaldba/postgres-mcp` を先に実行。 |
| 🗄️ ログが出ない | [06](06-hooks-and-monitoring.md) のフック設定（matcher `mcp__.*`）と権限を確認。 |

---

次へ → [09. ループエンジニアリング（自己修正ループ）](09-loops.md)
