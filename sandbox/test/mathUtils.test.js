import { test } from "node:test";
import assert from "node:assert/strict";
import { sum, average, fizzbuzz } from "../src/mathUtils.js";

test("sum: 配列の合計", () => {
  assert.equal(sum([1, 2, 3]), 6);
  assert.equal(sum([]), 0);
});

test("average: 配列の平均（空配列は 0）", () => {
  assert.equal(average([2, 4, 6]), 4);
  assert.equal(average([]), 0);
});

test("fizzbuzz: 基本ケース", () => {
  assert.equal(fizzbuzz(3), "Fizz");
  assert.equal(fizzbuzz(5), "Buzz");
  assert.equal(fizzbuzz(15), "FizzBuzz");
  assert.equal(fizzbuzz(7), "7");
});
