# sandbox

Claude Code を試すための練習用プロジェクトです。**外部依存はありません**
（Node.js 標準の `node --test` を使用）。

## テスト実行

```bash
cd sandbox
npm test
```

`# pass 6` と表示されれば成功です。

## 中身

- `src/textUtils.js` … `slugify`, `truncate`, `wordCount`
- `src/mathUtils.js` … `sum`, `average`, `fizzbuzz`
- `test/*.test.js` … 上記の関数のテスト（`npm test` で実行・常に緑）
- `exercises/` … **わざとバグを入れた** 練習問題。`npm run test:exercise` で実行。
  自己修正ループ（[docs/09](../docs/09-loops.md)）の題材で、デフォルトの `npm test` には含めない。

## 練習アイデア（Claude Code に頼んでみる）

- 「`textUtils.js` に `capitalize` を追加して、テストも書いて」
- 「`chunk(array, size)` 関数を新規追加して（テスト駆動で）」
- 「`average` にわざとバグを入れて → テストで失敗を確認 → 修正して」

詳しくはリポジトリ直下の [docs/03-core-features.md](../docs/03-core-features.md) を参照。
