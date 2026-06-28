# repo-conventions リファレンス（詳細）

SKILL.md から「必要になったら」参照される補助ファイル。
これが **段階的開示（progressive disclosure）** の実例です。
SKILL.md 本体は短く保ち、詳細はここに逃がすことでコンテキストを節約します。

## 命名

- 関数・変数: camelCase（例 `wordCount`）。
- ファイル: 機能名そのまま（例 `textUtils.js` / `mathUtils.js`）。
- スキル/コマンド/エージェント: lowercase-hyphen（例 `repo-conventions`, `code-explorer`）。

## コードスタイル

- 教材なので「賢いコード」より「読めるコード」。1関数1責務。
- 既存コメントの言語（日本語）に合わせる。
- 早期 return でネストを浅く。境界値（空配列・0・範囲外）を意識。

## テスト

- `sandbox/test/*.test.js` は `node:test` + `node:assert/strict`。
- 新しい関数を足したら必ずテストも足す（TDD でもよい）。
- `npm test` は常に緑。バグ練習は `sandbox/exercises/` に隔離。

## レビュー観点（reviewer エージェントと同じ）

1. 正確性・バグ（境界値、例外、Null/空、型）
2. 可読性（命名、責務分離、コメント）
3. 設計・再利用性（重複、過剰な複雑さ）

## コミット / PR

- コミットメッセージは Conventional Commits 風（`feat:`, `fix:`, `docs:` …）。
- 生成物・秘密情報を含めない。`git diff` で確認してからコミット。
- PR はユーザーが明示的に求めたときだけ作る。
