# 12. Headless モードと自動化

ここまでは「対話的に使う」Claude Code でした。本章では **対話なしで“部品として”使う**
headless（print）モードを学びます。スクリプトや Git フック、CI に組み込めます。

## 基本: `-p`（print）モード

`claude -p "プロンプト"` で、結果だけ返して終了します（通常シェルで実行）:

```bash
claude -p "2 + 2 は? 数値のみ答えて"
```

標準入力(stdin)をパイプで渡せます:

```bash
cat sandbox/src/textUtils.js | claude -p "この中で最も複雑な関数を1つ挙げ、理由を1行で"
```

```bash
git diff --staged | claude -p "この差分のリスクを3点、箇条書きで"
```

## 出力フォーマット

`--output-format` で出力形式を選べます: `text`（既定）/ `json` / `stream-json`。

機械処理には `json` が便利です。`result`・`session_id`・`total_cost_usd` などが返ります:

```bash
claude -p "Claude Code とは何か1文で" --output-format json | jq -r '.result'
```

コストを確認:

```bash
claude -p "hello" --output-format json | jq '.total_cost_usd'
```

`stream-json` は1行1イベントのストリーム。逐次処理やログ向きです。

## ツールと権限を絞る

非対話では「勝手に何かを実行されない」よう、ツールや権限を制御します:

| フラグ | 用途 |
|---|---|
| `--allowedTools "Read,Grep"` | 使えるツールを限定（カンマ区切り） |
| `--disallowedTools "Bash"` | 特定ツールを禁止 |
| `--permission-mode plan` | 読み取り専用（変更させない）。要約・分析向き |
| `--model <名前>` | モデル指定 |
| `--append-system-prompt "..."` | システムプロンプトに追記 |

例: 読み取り専用で要約だけさせる（安全）:

```bash
cat README.md | claude -p --permission-mode plan "このREADMEを3行で要約して"
```

> フラグの一覧は `claude --help` で確認できます（バージョンで増減します）。

## 実用デモ: AI コミットメッセージ

`scripts/ai-commit-msg.sh` を用意しました。ステージ済み差分からメッセージ案を作ります。

```bash
# 何か編集してステージ
echo "// 例" >> sandbox/src/mathUtils.js
git add sandbox/src/mathUtils.js

# メッセージ案を生成
./scripts/ai-commit-msg.sh
```

中身はこれだけです（headless の典型）:

```bash
git diff --staged | claude -p --permission-mode plan "コミットメッセージを1行で…"
```

（試したら `git restore --staged sandbox/src/mathUtils.js && git checkout sandbox/src/mathUtils.js` で戻す）

## 発展: Git pre-commit フックに組み込む（任意）

コミット前に AI で簡易チェックさせる例。`.git/hooks/pre-commit` に置いて実行権限を付けます:

```bash
#!/usr/bin/env bash
# 重大な問題があれば commit を止める簡易レビュー（任意・コスト注意）
diff="$(git diff --staged)"
[ -z "$diff" ] && exit 0
verdict="$(printf '%s' "$diff" | claude -p --permission-mode plan \
  'この差分に明らかなバグや秘密情報の混入があれば "BLOCK:理由" を、なければ "OK" だけ返して')"
echo "$verdict"
case "$verdict" in
  BLOCK:*) echo "コミットを中止しました。" >&2; exit 1 ;;
esac
exit 0
```

> 注意: フックで毎回 API を呼ぶとコスト・待ち時間が発生します。常用は慎重に。
> あくまで「headless をどう組み込むか」の例です。

## CI での利用メモ

- CI では認証に `ANTHROPIC_API_KEY` 環境変数を使います。
- `--output-format json` で結果を機械処理し、`jq` で判定 → ジョブの成否に反映、という流れが定番です。
- 将来 `-p` は「自動探索なし(bare)」が既定になる方向です。CI ではフックや MCP を読み込ませたくない場合が多いので相性が良い設計です。

---

次へ → [13. 権限とセキュリティ](13-permissions-security.md)
