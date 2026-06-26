---
description: いまの設計/コード/結論について、Gemini(ask_gemini MCPツール)にセカンドオピニオンを求め、Claude自身の見解と突き合わせて差分を報告する。事前に gemini MCP の接続が必要。
argument-hint: [対象や論点(任意)]
allowed-tools: mcp__gemini__ask_gemini, Read, Grep, Glob
---

別モデル(Gemini)によるクロスチェックを行います。
別ターミナルで `./scripts/watch-agents.sh` を起動しておくと、Gemini 呼び出しが 🤖 MCP として流れます。

対象/論点: $ARGUMENTS （未指定なら直近の話題・変更を対象に）

手順:
1. まず **あなた(Claude)自身の見解** を簡潔にまとめる。
2. `ask_gemini` ツールに、同じ問いを「批判的にレビューして。見落とし・誤り・代替案を挙げて」という形で投げる。
   - 対象コードがあるなら、関連箇所を読み取ってプロンプトに十分な文脈を含めること。
3. 返ってきた Gemini の回答と自分の見解を比較し、次を報告する:
   - **一致点**
   - **相違点 / Gemini が指摘した見落とし**
   - **最終的なあなたの推奨**（Gemini に同意/不同意の理由も明記）

注意: Gemini の回答は鵜呑みにせず、根拠を吟味した上で採否を判断すること。
