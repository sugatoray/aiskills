# /scrolls-compact — Examples

> **Writing rule for this file.** Write the prose in ASD-STE100 Simplified Technical English, at about 80% conformance. Keep to these rules when you change it:
>
> - Use short sentences: 20 words max for instructions, 25 words max for descriptions.
> - Use the active voice. Use the imperative for instructions.
> - Put one instruction in one sentence.
> - Use simple, approved words. Use one word for one meaning.
> - Prefer bullet points to paragraphs.
> - Put each example in its own file, `examples/example_NNN.md`, as one `<!--- example:start fixture=… --->` block headed `## Example-NN`, with **Premise**, **Caveats**, then the prompt and its output.
> - Give each example file a title, a link back to this file, and a `Starts from:` line. Add its row to the table below.
> - Never edit an output by hand. `tests/test_examples.sh` replays every example and fails on any difference.

`/scrolls-compact` condenses old history in the scrolls. The full old text stays in git, at a checkpoint commit.

**How to read these examples**

- This file is the index. Find the example you need in the table, then read only its file under `examples/`. Examples that start from another example's state link to it.
- Every output is real. `tests/test_examples.sh` replays each example against the bundled script in a
  freshly built demo repository and fails if any output differs from what is shown here.
- Each prompt is what you type. The agent runs `scripts/compact.sh` with the same flags (step 1 of
  `SKILL.md`), and shows you its output. Between the plan and `--finalize`, the agent edits the files
  itself; those edits are shown as `bash` blocks.
- The `date` in each prompt's metadata is the clock: 08:00 UTC that day. The demo repository's commits
  have fixed dates and authors, so their hashes are the same on every run. The repository is shown at
  `/work/shop`.
- `bash` prompt blocks are commands you can run yourself to look at the result.

**The demo repository (`shop`)**

```text
shop/                              branch main, 5 commits
├── app/store.py
└── docs/.scrolls/
    ├── STARTER.md  SPEC.md  PLAN.md  HANDOFF.md
    ├── GAP_ANALYSIS.md  GAP_CONTEXT.md  WISDOM.md

8c94000  2026-10-06  Add product search (#12)   scrolls set up; SPEC, PLAN, HANDOFF, GAP files
7e09b64  2026-10-21  Add checkout (#18)
6d75305  2026-11-03  Add order history (#23)
9b2c58d  2026-11-12  Add wishlist (#27)         HANDOFF rewritten
4b02463  2026-11-14  Start gift cards           HANDOFF: one line added
```

Other fixtures: `busy-shop` (the same, plus 24 small commits on 2026-11-14), `monorepo` (the scrolls in
`packages/api/docs/.scrolls`), `fresh-shop` (every commit in the last two days), `no-scrolls`, `no-git`,
and `after-NN` / `condensed-NN` (the state Example-NN leaves, or leaves just before its `--finalize`).

| Example | File | Prompt | Shows | Starts from |
| --- | --- | --- | --- | --- |
| [01](examples/example_001.md) | `examples/example_001.md` | `/scrolls-compact`, `--finalize` | A full compaction with the default rules | `shop` |
| [02](examples/example_002.md) | `examples/example_002.md` | `-n` | Preview only | `shop` |
| [03](examples/example_003.md) | `examples/example_003.md` | `-y` | The commit rule wins | `busy-shop` |
| [04](examples/example_004.md) | `examples/example_004.md` | `--keep-days`, `--keep-commits`, `--trunk` | Tune the windows, or count on another branch | `busy-shop` |
| [05](examples/example_005.md) | `examples/example_005.md` | `--before` | Compact before a date | `shop` |
| [06](examples/example_006.md) | `examples/example_006.md` | `--base` | Compact up to a commit or tag | `shop` |
| [07](examples/example_007.md) | `examples/example_007.md` | `--before` + `--base` | --before and --base together | `shop` |
| [08](examples/example_008.md) | `examples/example_008.md` | `--include`, `--exclude` | Choose the files | `shop` |
| [09](examples/example_009.md) | `examples/example_009.md` | `-l`, `-t`, `-p` | Run from a subfolder | `shop` |
| [10](examples/example_010.md) | `examples/example_010.md` | `-r`, `-p` | A monorepo package | `monorepo` |
| [11](examples/example_011.md) | `examples/example_011.md` | `/scrolls-compact` | Nothing is old enough | `fresh-shop` |
| [12](examples/example_012.md) | `examples/example_012.md` | Refusals | Safety refusals | `shop` |
| [13](examples/example_013.md) | `examples/example_013.md` | Mistakes | Usage errors | `shop` |
| [14](examples/example_014.md) | `examples/example_014.md` | `-r` | No scrolls folder | `no-scrolls` |
| [15](examples/example_015.md) | `examples/example_015.md` | `/scrolls-compact` | Not a git repository | `no-git` |
| [16](examples/example_016.md) | `examples/example_016.md` | `--finalize` | An edit that breaks the rules | `shop` |
| [17](examples/example_017.md) | `examples/example_017.md` | `--finalize -n`, `--no-commit` | Check first, or stage without committing | [Example-01](examples/example_001.md), before its `--finalize` |
| [18](examples/example_018.md) | `examples/example_018.md` | `--finalize` | A commit hook rejects the commit | [Example-01](examples/example_001.md), before its `--finalize` |
| [19](examples/example_019.md) | `examples/example_019.md` | `--no-tag` | No checkpoint tag | [Example-01](examples/example_001.md), before its `--finalize` |
| [20](examples/example_020.md) | `examples/example_020.md` | `/scrolls-compact`, `--finalize` | A second compaction, a month later | [Example-01](examples/example_001.md), after it |
| [21](examples/example_021.md) | `examples/example_021.md` | `--list`, `--show`, `--extract`, `-o` | Read the old text back | [Example-01](examples/example_001.md), after it |
| [22](examples/example_022.md) | `examples/example_022.md` | `--list`, `--show`, `--extract` | After a squash merge and /scrolls-unhide | [Example-01](examples/example_001.md), after it |
| [23](examples/example_023.md) | `examples/example_023.md` | `git revert` | Undo a compaction | [Example-01](examples/example_001.md), after it |
