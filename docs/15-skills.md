# 15. Skills（エージェントスキル）を使いこなす

スキルは、カスタムスラッシュコマンド（[04](04-slash-commands.md)）の **進化版** です。
単一ファイルのコマンドに対し、スキルは **フォルダに補助ファイル（スクリプト・参照資料・テンプレート）を束ね**、
**Claude が自動で呼ぶか/手動だけか**、**実行モデルやツール**まで細かく制御できます。

この章は厚めに、(1)概念 → (2)解剖 → (3)実例3種 → (4)作法 → (5)使い分け の順で解説します。

---

## 1. スキルとは / コマンドとの違い

| | カスタムコマンド | スキル |
|---|---|---|
| 置き場所 | `.claude/commands/foo.md` | `.claude/skills/foo/SKILL.md` |
| 呼び出し | `/foo` | `/foo`（同じ） |
| 補助ファイル | 不可（1ファイル） | **可**（scripts/・参照md・テンプレ等を同梱） |
| 自動起動 | しにくい | **description で Claude が自動起動できる** |
| 実行制御 | 限定的 | model / effort / context:fork / tools などを指定可 |

> 重要: **コマンド名はディレクトリ名**から決まります。
> `.claude/skills/release-notes/SKILL.md` → `/release-notes`。
> （`name:` フロントマターは一覧の表示名で、入力するコマンド名は変えません）

スコープと優先順位（上が優先）:
1. 個人 `~/.claude/skills/<名前>/SKILL.md`（全プロジェクトで使える）
2. プロジェクト `.claude/skills/<名前>/SKILL.md`（このリポジトリ専用）
3. プラグイン同梱（`/plugin:skill` の形）
4. レガシー `.claude/commands/*.md`（同名ならスキルが優先）

`SKILL.md` の編集はセッション中に**即反映**されます（再起動不要）。

---

## 2. SKILL.md の解剖（フロントマター）

すべて任意ですが `description` は実質必須です。

| フィールド | 役割 |
|---|---|
| `name` | 一覧での表示名（既定はディレクトリ名）。コマンド名は変えない。 |
| `description` | **最重要**。Claude が「いつ自動起動するか」を判断する材料。要点を先頭に。 |
| `when_to_use` | 追加のトリガー語（description と合わせて 1,536 文字まで）。 |
| `disable-model-invocation` | `true` で **手動 `/foo` 専用**（Claude は自動起動しない）。デプロイ等の副作用系に。 |
| `user-invocable` | `false` で **Claude 専用**（人は叩けない）。背景知識の注入に。 |
| `argument-hint` | 補完に出る引数ヒント（例 `[issue-number]`）。 |
| `arguments` | 名前付き引数（`[issue, branch]` → 本文で `$issue` `$branch`）。 |
| `allowed-tools` | スキル有効中に事前許可するツール（権限プロンプト省略）。 |
| `disallowed-tools` | スキル有効中に外すツール。 |
| `model` / `effort` | スキル有効中のモデル / 思考量を上書き。 |
| `context: fork` | **独立したサブエージェント**として実行（メイン文脈を汚さない）。 |
| `agent` | `context: fork` 時に使うエージェント（`Explore`/`Plan`/カスタム等）。 |
| `paths` | グロブ。該当ファイル編集時にだけ自動ロード。 |

本文での引数展開はコマンドと同じ: `$ARGUMENTS` / `$0` `$1` / `$name`。
特殊変数 `${CLAUDE_SKILL_DIR}`（スキルのフォルダ）、`${CLAUDE_SESSION_ID}` なども使えます。

### 動的コンテキスト注入（強力）

本文に `` !`コマンド` `` を書くと、**スキル読み込み時にそのコマンドが実行され、出力に置換**されます。
Claude は「結果」を見て作業します。

```markdown
## いまの状態
!`git status`
```

---

## 3. このリポジトリの実例スキル（3種）

`.claude/skills/` に3つ用意しました。それぞれ別の特徴を示します。

### (A) `repo-conventions` — 背景知識 ＋ 段階的開示

```
repo-conventions/
├── SKILL.md       # 短い要点だけ。auto-invocable
└── reference.md   # 詳細。必要になったら読まれる
```

- `description` を頼りに、規約を聞かれると **Claude が自動で起動**します。
- 本体は短く、詳細は `reference.md` に逃がす＝**progressive disclosure**。

**試す**（`claude` で）:

```
このプロジェクトのコーディング規約とテストの実行方法を教えて。
```

→ `repo-conventions` が自動的に参照され、必要なら `reference.md` まで読んで答えます。

### (B) `release-notes` — スクリプト同梱 ＋ 動的注入 ＋ 手動専用

```
release-notes/
├── SKILL.md            # disable-model-invocation: true（手動専用）
├── scripts/collect.sh  # コミット収集（${CLAUDE_SKILL_DIR} で参照）
└── template.md         # 出力フォーマット
```

- 読み込み時に `` !`bash ${CLAUDE_SKILL_DIR}/scripts/collect.sh ...` `` が走り、コミット一覧を注入。
- それを Claude が分類し、`template.md` の形式で出力。

**試す**:

```
/release-notes
```

（起点指定も可: `/release-notes v1.0.0`）

### (C) `explain-arch` — 独立サブエージェント実行（context: fork）

```
explain-arch/
└── SKILL.md   # context: fork, agent: Explore
```

- `context: fork` で **独立した Explore サブエージェント** として調査が走ります。
- メインの会話を汚さず、調査結果だけが返ります（Monitor に 🚀/✅）。

**試す**（別ターミナルで `./scripts/watch-agents.sh` を起動してから）:

```
/explain-arch 可視化の仕組み
```

---

## 4. スキルを書くときの作法

- **`description` に命を注ぐ**: 「何を/いつ」を具体的に。弱いと自動起動されない。
  - 良い例: 「git のコミット履歴からリリースノートを生成する。『変更点まとめて』のときに使う」
  - 悪い例: 「便利なツール」
- **SKILL.md は短く（〜500行目安）**: 「何をするか」を書き、詳細・例は別ファイルへ。
- **補助ファイルは本文から明示的に参照**: `[reference.md](reference.md)` のようにリンクし、
  「いつ読むか」を書く。暗黙ロードはされない。
- **スクリプトは Bash 経由**: Claude が直接実行するのではなく、本文の手順に従って
  `bash ${CLAUDE_SKILL_DIR}/scripts/xxx.sh` を Bash で呼ぶ。パスは `${CLAUDE_SKILL_DIR}` で解決。
- **自動 or 手動を選ぶ**:
  - 参照・知識系 → 自動起動（既定）。
  - 副作用・明示実行したいもの → `disable-model-invocation: true`。
- **段階的開示でトークン節約**: 説明文は常時ロード、本体は起動時、補助ファイルは参照時。

---

## 5. 一覧・点検

`claude` 起動中:

```
/help      # 利用可能なスキル/コマンド一覧
/skills    # スキルの有効/無効をトグルする対話 UI
/doctor    # スキルのメタ情報・説明文の文字数超過などを点検
```

`description` + `when_to_use` は合計 1,536 文字で切られます。長すぎると自動起動が不安定に。
`/doctor` で切り詰めが起きていないか確認しましょう。

---

## 6. いつ何を使う?（コマンド / スキル / サブエージェント / MCP）

| 目的 | 使うもの |
|---|---|
| 1行の定型指示 | カスタムコマンド or 簡単なスキル |
| 補助ファイル/スクリプトを束ねた再利用パッケージ | **スキル** |
| 文脈を分けた専門の実行役（並列・レビュー等） | サブエージェント（[14](14-multi-agent.md)） |
| 外部のツール/データ/モデルに接続 | MCP（[07](07-mcp.md), [17](17-mcp-authoring.md)） |

スキルは「**プロンプト＋資材＋起動条件**をひとまとめにして配布できる」のが本質です。

---

次へ → [16. コンテキスト管理（コンテキストエンジニアリング）](16-context-management.md)
