import { test } from "node:test";
import assert from "node:assert/strict";
import { toRoman } from "./toRoman.js";

test("加算表記の基本ケース（最初から通る）", () => {
  assert.equal(toRoman(1), "I");
  assert.equal(toRoman(3), "III");
  assert.equal(toRoman(10), "X");
  assert.equal(toRoman(2000), "MM");
});

test("減算表記（バグで最初は失敗する）", () => {
  assert.equal(toRoman(4), "IV");
  assert.equal(toRoman(9), "IX");
  assert.equal(toRoman(40), "XL");
  assert.equal(toRoman(90), "XC");
  assert.equal(toRoman(400), "CD");
  assert.equal(toRoman(900), "CM");
});

test("複合ケース（減算表記が直れば通る）", () => {
  assert.equal(toRoman(14), "XIV");
  assert.equal(toRoman(49), "XLIX");
  assert.equal(toRoman(1994), "MCMXCIV");
  assert.equal(toRoman(3999), "MMMCMXCIX");
});

test("範囲外は例外", () => {
  assert.throws(() => toRoman(0), RangeError);
  assert.throws(() => toRoman(4000), RangeError);
  assert.throws(() => toRoman(1.5), RangeError);
});
