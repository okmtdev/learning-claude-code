// 数値計算のユーティリティ関数群。

/**
 * 配列の合計を返す。
 */
export function sum(numbers) {
  return numbers.reduce((acc, n) => acc + n, 0);
}

/**
 * 配列の平均を返す。空配列は 0 を返す。
 */
export function average(numbers) {
  if (numbers.length === 0) return 0;
  return sum(numbers) / numbers.length;
}

/**
 * FizzBuzz の1要素を返す。
 * 3 の倍数 -> "Fizz", 5 の倍数 -> "Buzz", 15 の倍数 -> "FizzBuzz"
 */
export function fizzbuzz(n) {
  if (n % 15 === 0) return "FizzBuzz";
  if (n % 3 === 0) return "Fizz";
  if (n % 5 === 0) return "Buzz";
  return String(n);
}
