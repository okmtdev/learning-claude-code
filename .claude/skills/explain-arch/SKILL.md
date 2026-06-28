---
name: explain-arch
description: このリポジトリの仕組み（フックによる可視化・サブエージェント・MCP連携）を調査して初心者向けに説明する。「どういう仕組み?」「アーキテクチャ教えて」のときに使う。
argument-hint: [調べたいトピック 例: 可視化の仕組み]
context: fork
agent: Explore
allowed-tools: Read, Grep, Glob
---

次のトピックについて、このリポジトリ内を調査して初心者向けに説明してください: $ARGUMENTS
（未指定なら「フックによるエージェント可視化の仕組み」を対象に）

進め方:
1. 関連ファイルを Grep / Glob / Read で特定する（例: `.claude/settings.json`, `.claude/hooks/`, `scripts/`, `mcp-servers/`）。
2. 仕組みを「データの流れ」として図解的に説明する。
3. 根拠を `file:line` 付きで示す。推測と事実を区別する。

このスキルは `context: fork` で **独立したサブエージェント(Explore)** として動きます。
調査でメインの会話コンテキストを汚さず、結論だけを返せるのが利点です
（Monitor には 🚀 SPAWN / ✅ DONE が流れます）。
