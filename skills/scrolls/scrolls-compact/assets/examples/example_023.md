# /scrolls-compact — Example-23: Undo a compaction

[← All examples](../EXAMPLES.md) · The demo repository, the fixtures and how to read the blocks are described there.

Starts from: the state [Example-01](example_001.md) leaves, after its `--finalize`.

<!--- example:start fixture=after-01 --->
## Example-23

Undo a compaction. It is one commit, so `git revert` brings the condensed text back. (`/scrolls-restore 4b02463 -f` would bring back the whole folder as it was.) The tag stays; delete it with `git tag -d` if you want.

### Premise

- You want the condensed text back.

### Caveats

- The compaction is one commit, so `git revert` undoes it.
- The checkpoint tag stays. Delete it with `git tag -d` if you want.

<!--- prompt-block:start --->
```bash
## ---
## metadata:
##   date: "2026-11-15"
##   agent: "claude-code"
## ---

git revert --no-edit HEAD >/dev/null
git log -1 --format=%s
sed -n '5,9p' docs/.scrolls/PLAN.md
ls docs/.scrolls
```
<!--- prompt-block:end --->

<!--- prompt-output:start --->
**Output**:

```text
Revert "maint(memory): scrolls-compacted"
- [x] SHOP-1: Product search. Merged in #12.
- [ ] SHOP-2: Saved carts.
- [x] SHOP-3: Checkout. Merged in #18.
- [x] SHOP-4: Order history. Merged in #23.
- [x] SHOP-5: Wishlist. Merged in #27.
GAP_ANALYSIS.md
GAP_CONTEXT.md
HANDOFF.md
PLAN.md
SPEC.md
STARTER.md
WISDOM.md
```
<!--- prompt-output:end --->
<!--- example:end --->
