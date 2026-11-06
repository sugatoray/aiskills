# /scrolls-update — Examples

> **Writing rule for this file.** Write it in ASD-STE100 Simplified Technical English, at about 80% conformance. Keep to these rules when you change it:
>
> - Use short sentences: 20 words max for instructions, 25 words max for descriptions.
> - Use the active voice. Use the imperative for instructions.
> - Put one instruction in one sentence.
> - Use simple, approved words. Use one word for one meaning.
> - Prefer bullet points to paragraphs.
> - Put each example in one `## Example: NN — Title` block, with four sections: **Premise**, **Usage**, **Caveats**, **Expected Output**.

`/scrolls-update` records the work of the current session in the scrolls memory. Run it at the end of each session.

---

## Example: 01 — End of a normal session

### Premise

- You added a feature and fixed a bug in this session.
- `docs/.scrolls/` exists at the repository root.

### Usage

```
/scrolls-update
```

### Caveats

- The skill changes only the files that need a change.
- Each file has its own update rule. `STARTER.md` gives these rules.

### Expected Output

```
Updated:
- HANDOFF.md      — overwritten with the current state
- SPEC.md         — new section for the shipped feature
- PLAN.md         — ticket marked [x]
- WISDOM.md       — new Trap entry for the bug
```

---

## Example: 02 — Nothing shipped in this session

### Premise

- You did research only. No feature is complete.

### Usage

```
/scrolls-update
```

### Caveats

- The skill does not add a `SPEC.md` entry for unfinished work.
- If the status is not clear, the skill asks you. It does not guess.

### Expected Output

- `HANDOFF.md` updated with open threads.
- `PLAN.md` updated if new work appeared.
- `SPEC.md` not changed.

---

## Example: 03 — You are in a subdirectory

### Premise

- You are in `src/api/`. The scrolls are at the repository root.

### Usage

```
/scrolls-update        # the skill warns first
/scrolls-update -t     # use the repository root
```

### Caveats

- Without `-t`, the skill looks only in `src/api/docs/`. It can miss the real scrolls.

### Expected Output

- Without a flag: a warning that names the current directory and the repository root.
- With `-t`: the update from Example 01.

---

## Example: 04 — The scrolls are not at the usual location

### Premise

- The scrolls are in `tools/cli/docs/.scrolls/`. You are at the repository root.

### Usage

```
/scrolls-update -r
```

### Caveats

- `-r` searches only when the exact location has no scrolls.
- If it finds more than one scrolls folder, it shows the list. Then it asks which one to update.
- It never updates more than one folder in one run.

### Expected Output

- One match: the update runs on `tools/cli/docs/.scrolls/`.
- Many matches: a list of paths and a question.

---

## Example: 05 — Monorepo package with a custom docs path

### Premise

- The package scrolls are in `packages/api/docs/.scrolls/`.

### Usage

```
/scrolls-update -p packages/api/docs
```

### Caveats

- `-p` names the docs folder. The skill checks `.scrolls` first, then `scrolls`.

### Expected Output

- The update runs on `packages/api/docs/.scrolls/`.

---

## Example: 06 — Old project with no SCROLLS.md

### Premise

- `/scrolls-setup` before version 2.0.0 created the project.
- `CLAUDE.md` points directly at `docs/.scrolls/STARTER.md`. `SCROLLS.md` and `AGENTS.md` do not exist.

### Usage

```
/scrolls-update
```

### Caveats

- The skill adds the missing pointer files each time. It never removes content.
- `CLAUDE.md` keeps the old direct reference and gets the new stub too.

### Expected Output

```
Pointer files:
- SCROLLS.md  — created
- CLAUDE.md   — stub "See @SCROLLS.md." added near the top
- AGENTS.md   — created
```

---

## Example: 07 — No scrolls in the project

### Premise

- The project has no scrolls folder.

### Usage

```
/scrolls-update
```

### Caveats

- The skill does not create scroll files.

### Expected Output

- A message: the project has no scrolls. Run `/scrolls-setup`.
- A hint to try `-t` or `-r`, if you ran it from a subdirectory.

---

## Example: 08 — The context was compacted or resumed

### Premise

- The session is long. The agent does not remember all of the work.

### Usage

```
/scrolls-update
```

### Caveats

- The skill also uses git history, not only the conversation.
- It runs `scripts/session_diff.sh` (or `.ps1`) to find the commits since the last scrolls update.

### Expected Output

```
== Uncommitted changes (working tree vs HEAD) ==
== docs/.scrolls was last touched at commit <sha> ==
== Commits since then ==
== Files changed since then, excluding docs/.scrolls itself ==
```

- Then the scroll updates, based on these commits.
