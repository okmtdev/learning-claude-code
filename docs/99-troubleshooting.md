# 99. トラブルシューティング

## サブエージェントのログがモニターに流れない

1. **起動ディレクトリ**: `claude` をこのリポジトリのルートで起動しているか。
   `.claude/settings.json` はカレントのプロジェクト設定として読まれます。
2. **実行権限**: `chmod +x .claude/hooks/agent-logger.sh scripts/watch-agents.sh`
3. **設定の反映**: `settings.json` を編集したら `claude` を再起動。
   `/status` で設定ファイルが読まれているか確認できます。
4. **jq の有無**: `jq --version`。無くても SPAWN/DONE 行は出ますが、エージェント名が `?` になります。
   - macOS: `brew install jq` / Ubuntu: `sudo apt-get install jq`
5. **モニター側のファイル**: `watch-agents.sh` は `.claude/logs/agent-activity.log` を見ています。
   `cat` で直接中身を確認して、書き込み自体は起きているか切り分けましょう。

## フックを単体でテストしたい

Claude Code を介さず、手で JSON を流し込めます:

```bash
export CLAUDE_PROJECT_DIR="$PWD"
echo '{"tool_name":"Task","tool_input":{"subagent_type":"code-explorer","description":"テスト"}}' \
  | bash .claude/hooks/agent-logger.sh TASK_START

cat .claude/logs/agent-activity.log
```

`🚀 SPAWN agent=code-explorer ...` が追記されれば、フック側は正常です。

## サブエージェントが認識されない

- `/agents` で一覧を確認。
- `.claude/agents/*.md` のフロントマターに `name` と `description` があるか。
- `name` は小文字・ハイフンのみ（例 `code-explorer`）。

## スラッシュコマンドが出てこない

- `.claude/commands/*.md` に置かれているか。ファイル名がコマンド名になります。
- `/help` に出てこない場合は `claude` を再起動。

## テストが失敗する / 動かない

- Node.js 18 以上が必要（`node --version`）。`node --test` は 18+ で利用可能。
- `sandbox` ディレクトリ内で `npm test` を実行しているか。

## 権限プロンプトが多くて煩わしい

- 学習中は確認しながらが安全ですが、慣れたら `Shift+Tab` で auto-accept、
  または `.claude/settings.json` の `permissions.allow` でよく使うコマンドを事前許可できます。

## 変更を元に戻したい

```bash
git status          # 何が変わったか
git diff            # 差分
git checkout -- <file>   # 個別に破棄
git stash           # まとめて退避
```

---

[目次に戻る](../README.md)
