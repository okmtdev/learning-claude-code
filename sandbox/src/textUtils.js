// テキスト操作のユーティリティ関数群。
// Claude Code で「関数を追加して」「テストを書いて」などを試す練習対象。

/**
 * 文字列を URL スラッグに変換する。
 * 例: "Hello, World!" -> "hello-world"
 */
export function slugify(text) {
  return String(text)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

/**
 * 文字列を指定長で切り詰め、末尾に省略記号を付ける。
 * 例: truncate("abcdef", 4) -> "abc…"
 */
export function truncate(text, maxLength) {
  const s = String(text);
  if (s.length <= maxLength) return s;
  return s.slice(0, maxLength - 1) + "…";
}

/**
 * 単語数を数える（空白区切り）。
 */
export function wordCount(text) {
  const trimmed = String(text).trim();
  if (trimmed === "") return 0;
  return trimmed.split(/\s+/).length;
}
