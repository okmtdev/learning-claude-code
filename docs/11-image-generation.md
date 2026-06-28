# 11. 画像生成を Gemini に委譲する 🎨

[10](10-gemini-as-tool.md) の発展。**Claude は画像を生成できない**ので、
画像が必要なときは Gemini の画像生成モデルに委譲します。これは「別モデルを下請けにする」
典型的で分かりやすいユースケースです。

## 前提と仕組み

- Claude（Anthropic モデル）は画像の**入力**はできても**出力（生成）**はできません。
- Gemini は `gemini-2.5-flash-image`（通称 Nano Banana）で画像生成・編集ができます。
  `generateContent` に `responseModalities: ["TEXT","IMAGE"]` を付けて呼び、
  応答の `parts[].inlineData.data`（base64）に画像が返ります。
- このリポジトリの gemini MCP サーバーに `generate_image` ツールを追加済みです。
  base64 をデコードして**ファイルに保存し、そのパスを返す**実装になっています。

```
Claude ──(generate_image)──> gemini MCP ──> gemini-2.5-flash-image
                                  │
                                  └─ base64画像をデコードして generated/ に保存 → パスを返す
```

> 注意:
> - **api バックエンド限定**（要 APIキー・要ネット）。`ollama`(Gemma) は画像生成不可、`mock` はダミーPNG。
> - 料金の目安は **1枚 ≈ $0.039**。
> - 旧 Imagen は非推奨。本ツールは Nano Banana を使用。

## 1. 準備（api バックエンドにする）

[10 章](10-gemini-as-tool.md)の手順で gemini MCP を **api バックエンド**で接続済みにします。
`.env` は以下を含みます:

```bash
GEMINI_BACKEND=api
GEMINI_API_KEY=（あなたのキー）
GEMINI_IMAGE_MODEL=gemini-2.5-flash-image
```

接続確認（`claude` 起動中）:

```
/mcp
```

`gemini` の中に `generate_image` ツールが見えれば準備OKです。

## 2. mock で配線確認（キー不要）

いきなり課金せず、まず配線だけ確かめられます。`.env` を `GEMINI_BACKEND=mock` にして登録し:

```
generate_image ツールで「テスト」という画像を作って。保存先パスを教えて。
```

`generated/gemini-xxxx.png`（1x1のダミー）が保存されれば、Claude→ツール→ファイル保存の
経路は完成です。確認できたら api バックエンドに切り替えます。

## 3. 画像を作る: `/make-image`

**ターミナル A** でモニター:

```bash
./scripts/watch-agents.sh
```

**ターミナル B** の `claude` で:

```
/make-image 夕暮れの居心地のいいカフェの内装、シネマティック、暖色
```

Claude がプロンプトを整えて `generate_image` を呼び、保存先を返します。
**ターミナル A** には次のように流れます:

```
[14:39:06] 🎨 MCP     mcp__gemini__generate_image  prompt="夕暮れの居心地のいいカフェの内装…"
```

🎨（黄・太字）= 画像生成の委譲。生成された PNG は `generated/` に保存されます（gitignore 済）。

自然言語で直接頼んでもOKです:

```
このREADMEのヘッダー用に、ターミナルとロボットを組み合わせたミニマルなロゴ画像を generate_image で作って。
```

## 4. 保存先を指定する

`out_path` で保存先を指定できます（相対パスはプロジェクト基準）:

```
generate_image で「青い鳥のアイコン」を作って、assets/bird.png に保存して。
```

## 5. このユースケースの“おいしさ”

- **役割分担が明確**: Claude は「要望を良いプロンプトに翻訳し、結果を扱う」司令塔。
  画像という不得手な領域だけ Gemini に外注する。
- **可視化で腑に落ちる**: 🎨 がモニターに流れ、「Claude が自分でできないことを別モデルに頼んだ」
  瞬間が見える。
- 同じ発想で、動画/音声/OCR など Claude が持たない能力も MCP ツールとして足していけます。

## トラブルシューティング

| 症状 | 対処 |
|---|---|
| 「画像が返りませんでした」 | プロンプトが拒否された可能性。表現を変える。stderr ログに応答が出る。 |
| 403/400 | `GEMINI_API_KEY` と `GEMINI_IMAGE_MODEL` を確認。地域・権限により画像生成が使えない場合あり。 |
| ollama で失敗 | 仕様。画像生成は `GEMINI_BACKEND=api` のみ。 |
| 🎨 が流れない | [06](06-hooks-and-monitoring.md) の `mcp__.*` フックと権限を確認。 |
| ファイルが見つからない | 既定の保存先はプロジェクト直下 `generated/`。返却パスを確認。 |

---

次へ → [12. Headless モードと自動化](12-headless-automation.md)
