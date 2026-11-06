# /scrolls-hide — Examples

> **Writing rule for this file.** Write it in ASD-STE100 Simplified Technical English, at about 80% conformance. Keep to these rules when you change it:
>
> - Use short sentences: 20 words max for instructions, 25 words max for descriptions.
> - Use the active voice. Use the imperative for instructions.
> - Put one instruction in one sentence.
> - Use simple, approved words. Use one word for one meaning.
> - Prefer bullet points to paragraphs.
> - Put each example in one `## Example: NN — Title` block, with four sections: **Premise**, **Usage**, **Caveats**, **Expected Output**.

`/scrolls-hide` renames a visible `docs/scrolls/` folder to the hidden `docs/.scrolls/`. `/scrolls-unhide` does the opposite.

---

## Example: 01 — Hide the scrolls folder

### Premise

- The project has `docs/scrolls/` and `SCROLLS.md` at the repository root.
- You are at the repository root.

### Usage

```
/scrolls-hide
```

### Caveats

- The skill uses `git mv` for tracked files. The history of the files stays.
- It updates references in the moved folder and in `SCROLLS.md` only.
- `CLAUDE.md` does not change. It points at `SCROLLS.md`, not at the folder.

### Expected Output

```
== docs/scrolls ==
Moved: docs/scrolls -> docs/.scrolls
  Updated: docs/.scrolls/STARTER.md
  Updated: ./SCROLLS.md
  Other references (within .) left for manual review:
    (none found)
```

---

## Example: 02 — Other files mention the old path

### Premise

- `README.md` says "See docs/scrolls/ for memory".

### Usage

```
/scrolls-hide
```

### Caveats

- The script does not change `README.md`. It only reports it.
- The agent then reads each reported file. It changes a reference only if it is a real, stale path.

### Expected Output

```
  Other references (within .) left for manual review:
    ./README.md
```

- Then the agent updates `README.md` and tells you.

---

## Example: 03 — Monorepo: hide all scrolls folders

### Premise

- The repository has visible scrolls in several packages.
- You are in a subdirectory.

### Usage

```
/scrolls-hide -t -r
```

### Caveats

- `-t` starts at the repository root. `-r` finds every `scrolls` folder that has a `STARTER.md`.
- Folders without `STARTER.md` do not change.
- The search skips `node_modules`, `.git`, `vendor`, `dist`, `build` and similar folders.

### Expected Output

- One `== <path> ==` block for each folder found.

---

## Example: 04 — Hide only some packages

### Premise

- You want to hide `packages/api` and `packages/web` only.

### Usage

```
/scrolls-hide -p packages/api -p packages/web
```

### Caveats

- `-p` can repeat. You cannot use `-p` with `-t` or `-l`.

### Expected Output

```
== packages/api/docs/scrolls ==
Moved: packages/api/docs/scrolls -> packages/api/docs/.scrolls
...
== packages/web/docs/scrolls ==
Moved: packages/web/docs/scrolls -> packages/web/docs/.scrolls
...
```

---

## Example: 05 — The hidden folder already exists

### Premise

- Both `docs/scrolls/` and `docs/.scrolls/` exist.

### Usage

```
/scrolls-hide
```

### Caveats

- The skill does not merge or replace folders. Compare the two folders yourself.

### Expected Output

```
== docs/scrolls ==
SKIP: docs/scrolls -> docs/.scrolls already exists
```

---

## Example: 06 — Nothing to hide

### Premise

- The folder is already hidden, or the project has no scrolls.

### Usage

```
/scrolls-hide
```

### Caveats

- Without `-r`, the skill checks one location only.

### Expected Output

```
No scrolls folder found under: <path>
Checked the exact default location only — pass -r/--recurse to search recursively instead.
If this project hasn't been set up yet, run /scrolls-setup first.
```

- Exit code: `1`.

---

## Example: 07 — Change the default location

### Premise

- Your scrolls are always in `services/core`. You do not want to type `-p` each time.

### Usage

```
export DEFAULT_SCROLLS_RELPATH=services/core
/scrolls-hide
```

### Caveats

- The variable applies only when you give no `-p`, `-t` or `-l`.

### Expected Output

```
== services/core/docs/scrolls ==
Moved: services/core/docs/scrolls -> services/core/docs/.scrolls
```
