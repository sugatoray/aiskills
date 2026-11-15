# /scrolls-compact — Example-18: A commit hook rejects the commit

[← All examples](../EXAMPLES.md) · The demo repository, the fixtures and how to read the blocks are described there.

Starts from: the state [Example-01](example_001.md) leaves, just before its `--finalize` (its step 2 edits are in place).

<!--- example:start fixture=condensed-01 --->
## Example-18

A commit hook rejects the commit (exit 4). The compaction stays staged; never retry with `--no-verify`.

### Premise

- The repository has a strict `commit-msg` hook.

### Caveats

- The compaction stays staged (exit 4).
- Never retry with `--no-verify`.

The repository has a strict `commit-msg` hook:

<!--- setup-block:start --->
```bash
printf '#!/bin/sh\necho "commit-msg: use a Conventional Commits type" >&2\nexit 1\n' > .git/hooks/commit-msg
chmod +x .git/hooks/commit-msg
```
<!--- setup-block:end --->

<!--- prompt-block:start --->
```prompt
## ---
## metadata:
##   date: "2026-11-15"
##   agent: "claude-code"
## ---

/scrolls-compact --finalize
```
<!--- prompt-block:end --->

<!--- prompt-output:start --->
**Output** (exit 4):

```text
commit-msg: use a Conventional Commits type

git commit failed; the compaction is left staged. Fix the cause, then run:
  git commit -F /work/shop/.git/SCROLLS_COMPACT_MSG
(Never retry with --no-verify.)
```
<!--- prompt-output:end --->

After the hook is fixed (here: removed), finish with the printed command, then tag the checkpoint:

<!--- prompt-block:start --->
```bash
## ---
## metadata:
##   date: "2026-11-15"
##   agent: "claude-code"
## ---

rm .git/hooks/commit-msg
git commit -q -F .git/SCROLLS_COMPACT_MSG && git tag scrolls-compact/20261115-4b02463 4b02463
git log -1 --format=%s && git tag
```
<!--- prompt-block:end --->

<!--- prompt-output:start --->
**Output**:

```text
maint(memory): scrolls-compacted
scrolls-compact/20261115-4b02463
```
<!--- prompt-output:end --->
<!--- example:end --->
