# 04. スラッシュコマンド（組み込み & カスタム）

スラッシュコマンド（`/foo`）は、よく使う指示を呼び出しやすくする仕組みです。

## 組み込みコマンド（抜粋）

`claude` 起動中に試せます:

| コマンド | 説明 |
|---|---|
| `/help` | コマンド一覧 |
| `/status` | モデル・設定・接続状況 |
| `/clear` | 会話履歴（コンテキスト）をリセット |
| `/agents` | サブエージェントの一覧・管理 |
| `/init` | CLAUDE.md を自動生成 |
| `/config` | 設定の確認・変更 |
| `/model` | 使用モデルの切替 |
| `/review` | コードレビュー |

## カスタムスラッシュコマンドを作る

`.claude/commands/` に Markdown ファイルを置くだけで、`/ファイル名` のコマンドになります。

### このリポジトリに入っている例

#### `/review-diff` — 差分レビュー

`.claude/commands/review-diff.md`:

```markdown
---
description: 現在の git 差分をレビューし、バグ・改善点を指摘する。
argument-hint: [観点(任意) 例: security]
allowed-tools: Bash(git diff:*), Bash(git status:*), Read
---

現在の作業ツリーの差分をレビューしてください。
...
観点の指定: $ARGUMENTS （未指定なら「正確性・可読性・バグ」を中心に）
```

ポイント:
- **フロントマター**（`---` で囲む部分）にメタ情報を書く。
  - `description`: 一覧やオートコンプリートに出る説明。
  - `argument-hint`: 引数のヒント。
  - `allowed-tools`: このコマンドで事前許可するツール。`Bash(git diff:*)` のように絞れる。
- 本文が Claude に渡るプロンプト本体。
- `$ARGUMENTS` は呼び出し時の引数（全体）に展開される。`$1`, `$2` で個別取得も可能。

### 試す

何か変更を加えてから:

```bash
# 通常シェルで何か編集（例）
echo "// test" >> sandbox/src/mathUtils.js
```

`claude` のプロンプトで:

```
/review-diff
```

観点を指定:

```
/review-diff 可読性
```

（試したら `git checkout sandbox/src/mathUtils.js` で戻しておきましょう）

#### `/demo-agents` — サブエージェント可視化デモ

サブエージェントの章（[docs/05](05-subagents.md)）で詳しく扱います。

## 自分で1つ作ってみる

`.claude/commands/explain.md` を作る例:

```markdown
---
description: 指定したファイルを初心者向けに解説する。
argument-hint: [ファイルパス]
allowed-tools: Read
---

次のファイルをプログラミング初心者向けに、専門用語を避けて解説してください: $ARGUMENTS
各関数について「何を入れると何が出るか」を例付きで示すこと。
```

保存後、`claude` で:

```
/explain sandbox/src/textUtils.js
```

> ヒント: コマンドはサブディレクトリでグループ化できます。
> `.claude/commands/git/commit.md` → `/git:commit` のように名前空間が付きます。

---

次へ → [05. サブエージェントと可視化](05-subagents.md)
