# /scrolls-compact — Example-12: Safety refusals

[← All examples](../EXAMPLES.md) · The demo repository, the fixtures and how to read the blocks are described there.

Starts from: the `shop` demo repository.

<!--- example:start fixture=shop --->
## Example-12

Safety refusals. The skill reports the reason and changes nothing. It never commits, stashes or deletes your files to get past one.

### Premise

- The scrolls folder or the index is not clean, or `--base` is wrong.

### Caveats

- The skill stops with exit 3. It changes nothing.
- Do not commit, stash or delete files to get past a refusal. Decide yourself.

1️⃣ An uncommitted edit in the scrolls folder. The checkpoint would not contain it:

<!--- setup-block:start --->
```bash
echo '- [ ] SHOP-7: Coupons.' >> docs/.scrolls/PLAN.md
```
<!--- setup-block:end --->

<!--- prompt-block:start --->
```prompt
## ---
## metadata:
##   date: "2026-11-15"
##   agent: "claude-code"
## ---

/scrolls-compact
```
<!--- prompt-block:end --->

<!--- prompt-output:start --->
**Output** (exit 3):

```text
docs/.scrolls has uncommitted, untracked or ignored changes. The checkpoint would not contain them, so they could be lost. Commit or clear them first:
M docs/.scrolls/PLAN.md
```
<!--- prompt-output:end --->

2️⃣ An unrelated change is staged. It would end up in the compaction commit:

<!--- setup-block:start --->
```bash
git checkout -- docs/.scrolls/PLAN.md
echo '# coupons' >> app/store.py && git add app/store.py
```
<!--- setup-block:end --->

<!--- prompt-block:start --->
```prompt
## ---
## metadata:
##   date: "2026-11-15"
##   agent: "claude-code"
## ---

/scrolls-compact
```
<!--- prompt-block:end --->

<!--- prompt-output:start --->
**Output** (exit 3):

```text
Other changes are already staged and would end up in the compaction commit:
app/store.py
```
<!--- prompt-output:end --->

3️⃣ `--base` names a commit that is not an ancestor of HEAD:

<!--- setup-block:start --->
```bash
git reset -q && git checkout -- app/store.py
git switch -q -c spike HEAD~2 && git commit -q --allow-empty -m 'Spike' && git switch -q main
```
<!--- setup-block:end --->

<!--- prompt-block:start --->
```prompt
## ---
## metadata:
##   date: "2026-11-15"
##   agent: "claude-code"
## ---

/scrolls-compact --base=spike
```
<!--- prompt-block:end --->

<!--- prompt-output:start --->
**Output** (exit 3):

```text
--base=spike is not an ancestor of HEAD, so it can't mark what is old here.
```
<!--- prompt-output:end --->
<!--- example:end --->
