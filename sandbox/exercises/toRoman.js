// 【自己修正ループ用の練習問題】
// 整数(1〜3999)をローマ数字に変換する関数。
//
// この実装には「わざと」バグがあります:
//   加算表記しか対応しておらず、減算表記(IV, IX, XL, ...)を作れません。
//   そのため toRoman(4) は "IIII" を返してしまい、テストが失敗します。
//
// 目的: `npm run test:exercise` を実行 → 失敗を見る → 修正 → 再実行、を
//       テストが全部通るまで繰り返す「ループ」を体験すること。
//       （docs/09-loops.md 参照）

export function toRoman(num) {
  if (!Number.isInteger(num) || num < 1 || num > 3999) {
    throw new RangeError("1〜3999 の整数を渡してください");
  }

  // バグ: 減算表記(900=CM, 400=CD, 90=XC, 40=XL, 9=IX, 4=IV)が抜けている。
  const table = [
    [1000, "M"],
    [500, "D"],
    [100, "C"],
    [50, "L"],
    [10, "X"],
    [5, "V"],
    [1, "I"],
  ];

  let result = "";
  let n = num;
  for (const [value, symbol] of table) {
    while (n >= value) {
      result += symbol;
      n -= value;
    }
  }
  return result;
}
