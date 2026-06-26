# 10. 外部モデル(Gemini)を Claude の“下請け”にする

「Gemini を Claude のサブエージェントにできる?」への答えと、その実現方法のハンズオンです。

## まず大事な前提

**Claude Code のサブエージェント（`.claude/agents/*.md`）の頭脳は必ず Claude です。**
`model:` に指定できるのは Claude 系（`sonnet`/`opus`/`haiku`/`fable`/`inherit`）だけで、
Gemini に置き換えることはできません。

なので実際にやるのは:

> **Claude（司令塔）が、Gemini を“ツール”として呼び出す**

という形です。本章では Gemini を **MCP ツール `ask_gemini`** として公開し、
Claude から呼べるようにします。

## なぜ Gemini を併用するのか（メリット）

- **セカンドオピニオン / 相互検証**: 別モデルにレビューさせ、単一モデルの盲点を減らす。
- **巨大コンテキスト**: 長大なログ/ファイルの要約を Gemini に逃がし、Claude の文脈を節約。
- **コスト / 速度**: 単純・大量の下請けを安価・高速なモデルに任せる。
- **多様性**: ブレストで異なる視点を得る。

> 注意: 呼び出しごとにレイテンシ・コスト・APIキー管理が増えます。
> 「Claude が司令塔、Gemini が下請け」という役割分担を明確にして使うのがコツです。

## このリポジトリに用意したもの

```
mcp-servers/gemini/
├── server.mjs       ← 依存ゼロの最小 MCP サーバー（ask_gemini ツールを提供）
├── run.sh           ← .env を読み込んで server を起動するラッパ
└── .env.example     ← 設定例（コピーして .env を作る）
```

`server.mjs` は環境変数 `GEMINI_BACKEND` で3つのバックエンドを切替えます:

| backend | 説明 | 通信先 |
|---|---|---|
| `mock` | 課金も通信もなし。**配線確認用（既定）** | なし |
| `api` | 本物の **Gemini API** | Google（要ネット・APIキー） |
| `ollama` | ローカルの **Ollama**（Gemma 等） | localhost（完全ローカル） |

## 0. まずは mock で“配線”だけ確認する

API キーなしで、MCP の接続が成立するかを先に確かめます。

```bash
# 設定ファイルを作る（mock のまま）
cp mcp-servers/gemini/.env.example mcp-servers/gemini/.env
# .env を開き、GEMINI_BACKEND=mock に書き換える（最初はこれでOK）
```

Claude Code に登録（**絶対パス**で）:

```bash
claude mcp add gemini -- bash "$(pwd)/mcp-servers/gemini/run.sh"
```

`claude` を起動して確認:

```
/mcp
```

`gemini` が connected で、`ask_gemini` ツールが見えれば配線OKです。試しに:

```
ask_gemini ツールで「テスト」と聞いて、返事をそのまま見せて。
```

モック応答が返れば、Claude → MCP の経路は完成です（まだ本物のモデルは呼んでいません）。

## 1-A. Gemini API バックエンドにする

APIキーを [Google AI Studio](https://aistudio.google.com/apikey) で取得し、`.env` を編集:

```bash
# mcp-servers/gemini/.env
GEMINI_BACKEND=api
GEMINI_API_KEY=（取得したキー）
GEMINI_MODEL=gemini-2.5-flash
```

設定を反映するため再登録（または `claude` 再起動）:

```bash
claude mcp remove gemini
claude mcp add gemini -- bash "$(pwd)/mcp-servers/gemini/run.sh"
```

> キーは `.env`（gitignore 済）に置くので、`.mcp.json` やシェル履歴に残りません。
> `run.sh` が起動時に読み込みます。

## 1-B. 完全ローカル（Ollama + Gemma）にする

ネットに出したくない場合はローカルモデルを使います。

```bash
# Ollama を導入（https://ollama.com）後、モデルを取得して起動
ollama pull gemma3
ollama serve   # 既に動いていれば不要（既定で :11434）
```

`.env` を編集:

```bash
GEMINI_BACKEND=ollama
OLLAMA_HOST=http://localhost:11434
OLLAMA_MODEL=gemma3
```

再登録して完了。これで **完全ローカル**で「外部モデルを下請けにする」構図を学べます
（Gemini 本体ではありませんが、仕組みは同一です）。

## 2. 使ってみる: セカンドオピニオン `/second-opinion`

**ターミナル A** でモニター:

```bash
./scripts/watch-agents.sh
```

**ターミナル B** の `claude` で:

```
/second-opinion sandbox/src/textUtils.js の truncate の設計
```

Claude が自分の見解をまとめた上で `ask_gemini` を呼び、両者を突き合わせて
「一致点 / 相違点 / 最終推奨」を報告します。

このとき **ターミナル A** に Gemini 呼び出しが流れます:

```
[16:21:47] 🤖 MCP     mcp__gemini__ask_gemini  prompt="この設計をレビューして。見落とし…"
```

🤖（青・太字）= 外部モデル呼び出し。Claude が裏で別モデルに相談しているのが見えます。

自然言語で直接呼ぶこともできます:

```
この長いログ(貼り付け)を ask_gemini に渡して3行に要約させて。
```

## 3. （応用）Claude サブエージェントから Gemini を使う

「サブエージェントっぽく」したいなら、**Claude 製サブエージェント**に
`ask_gemini` だけを許可する形にできます。例 `.claude/agents/external-reviewer.md`:

```markdown
---
name: external-reviewer
description: 外部モデル(Gemini)の意見を取り寄せて要約する役。クロスチェックに使う。
tools: mcp__gemini__ask_gemini, Read
model: inherit
---
渡された対象について ask_gemini で別モデルの意見を取得し、要点と妥当性を要約する。
```

こうすると「Claude が、Gemini に相談する子エージェントに委譲する」形になり、
[05](05-subagents.md) の 🚀/✅ と 🤖 が両方モニターに流れます。

## 4. 後片付け

```bash
claude mcp remove gemini
# .env は秘密情報を含むので不要なら削除
rm -f mcp-servers/gemini/.env
```

## トラブルシューティング

| 症状 | 対処 |
|---|---|
| `/mcp` に gemini が出ない | 絶対パスで登録したか確認。`claude mcp list`。`claude` 再起動。 |
| api で 400/403 | `GEMINI_API_KEY` が正しいか、`GEMINI_MODEL` 名が有効か。stderr ログ（端末）に詳細が出る。 |
| ollama で接続エラー | `ollama serve` が起動しているか、`ollama list` にモデルがあるか。 |
| 🤖 が流れない | [06](06-hooks-and-monitoring.md) の `mcp__.*` フックと権限を確認。 |
| 設定を変えたのに反映されない | `.env` 変更後は `claude mcp remove/add` で再登録するか `claude` 再起動。 |

---

[目次に戻る](../README.md) / 困ったら → [99. トラブルシューティング](99-troubleshooting.md)
