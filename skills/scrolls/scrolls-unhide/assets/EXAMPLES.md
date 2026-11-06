# /scrolls-unhide — Examples

> **Writing rule for this file.** Write it in ASD-STE100 Simplified Technical English, at about 80% conformance. Keep to these rules when you change it:
>
> - Use short sentences: 20 words max for instructions, 25 words max for descriptions.
> - Use the active voice. Use the imperative for instructions.
> - Put one instruction in one sentence.
> - Use simple, approved words. Use one word for one meaning.
> - Prefer bullet points to paragraphs.
> - Put each example in one `## Example: NN — Title` block, with four sections: **Premise**, **Usage**, **Caveats**, **Expected Output**.

`/scrolls-unhide` renames the hidden `docs/.scrolls/` folder to the visible `docs/scrolls/`. `/scrolls-hide` does the opposite.

---

## Example: 01 — Make the scrolls folder visible

### Premise

- The project has `docs/.scrolls/` and `SCROLLS.md` at the repository root.
- You want to see the folder in a normal directory list.

### Usage

```
/scrolls-unhide
```

### Caveats

- The skill uses `git mv` for tracked files. The history of the files stays.
- It updates references in the moved folder and in `SCROLLS.md` only.
- `CLAUDE.md` does not change.

### Expected Output

```
== docs/.scrolls ==
Moved: docs/.scrolls -> docs/scrolls
  Updated: docs/scrolls/STARTER.md
  Updated: ./SCROLLS.md
  Other references (within .) left for manual review:
    (none found)
```

---

## Example: 02 — Other files mention the old path

### Premise

- `CONTRIBUTING.md` says "Read docs/.scrolls/STARTER.md".

### Usage

```
/scrolls-unhide
```

### Caveats

- The script reports the file. It does not change it.
- The agent reads the file. It changes the reference only if it is a real, stale path.

### Expected Output

```
  Other references (within .) left for manual review:
    ./CONTRIBUTING.md
```

---

## Example: 03 — Monorepo: unhide all scrolls folders

### Premise

- The repository has hidden scrolls in several packages.

### Usage

```
/scrolls-unhide -t -r
```

### Caveats

- `-r` changes only `.scrolls` folders that have a `STARTER.md`.
- Each package `SCROLLS.md` changes only for its own folder.

### Expected Output

- One `== <path> ==` block for each folder found.

---

## Example: 04 — Unhide only one package

### Premise

- You want to change `packages/api` only.

### Usage

```
/scrolls-unhide -p packages/api
```

### Caveats

- `-p` can repeat. You cannot use `-p` with `-t` or `-l`.

### Expected Output

```
== packages/api/docs/.scrolls ==
Moved: packages/api/docs/.scrolls -> packages/api/docs/scrolls
```

---

## Example: 05 — The visible folder already exists

### Premise

- Both `docs/.scrolls/` and `docs/scrolls/` exist.

### Usage

```
/scrolls-unhide
```

### Caveats

- The skill does not merge or replace folders.

### Expected Output

```
SKIP: docs/.scrolls -> docs/scrolls already exists
```

---

## Example: 06 — New project: use setup instead

### Premise

- The project has no scrolls yet. You want them visible from the start.

### Usage

```
/scrolls-setup -u
```

### Caveats

- `/scrolls-unhide` is for existing projects only.

### Expected Output

- `docs/scrolls/` with the seven scroll files. No rename is necessary.

---

## Example: 07 — Nothing to unhide

### Premise

- The folder is already visible, or the project has no scrolls.

### Usage

```
/scrolls-unhide
```

### Caveats

- Without `-r`, the skill checks one location only.

### Expected Output

```
No .scrolls folder found under: <path>
Checked the exact default location only — pass -r/--recurse to search recursively instead.
If this project hasn't been set up yet, run /scrolls-setup first.
```

- Exit code: `1`.
