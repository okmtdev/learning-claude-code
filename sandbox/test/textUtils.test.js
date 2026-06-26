import { test } from "node:test";
import assert from "node:assert/strict";
import { slugify, truncate, wordCount } from "../src/textUtils.js";

test("slugify: 記号を除去しハイフン区切りにする", () => {
  assert.equal(slugify("Hello, World!"), "hello-world");
  assert.equal(slugify("  Claude   Code  "), "claude-code");
});

test("truncate: 長い文字列を省略記号付きで切り詰める", () => {
  assert.equal(truncate("abcdef", 4), "abc…");
  assert.equal(truncate("abc", 10), "abc");
});

test("wordCount: 単語数を数える", () => {
  assert.equal(wordCount("hello world"), 2);
  assert.equal(wordCount("   "), 0);
  assert.equal(wordCount("one"), 1);
});
