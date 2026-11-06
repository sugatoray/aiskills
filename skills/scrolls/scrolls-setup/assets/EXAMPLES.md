# /scrolls-setup — Examples

> **Writing rule for this file.** Write it in ASD-STE100 Simplified Technical English, at about 80% conformance. Keep to these rules when you change it:
>
> - Use short sentences: 20 words max for instructions, 25 words max for descriptions.
> - Use the active voice. Use the imperative for instructions.
> - Put one instruction in one sentence.
> - Use simple, approved words. Use one word for one meaning.
> - Prefer bullet points to paragraphs.
> - Put each example in one `## Example: NN — Title` block, with four sections: **Premise**, **Usage**, **Caveats**, **Expected Output**.

`/scrolls-setup` creates the scrolls memory for a project one time. Use `/scrolls-update` after that, at the end of each session.

---

## Example: 01 — New project, at the repository root

### Premise

- The project has no `docs/.scrolls/`, no `SCROLLS.md`, no `CLAUDE.md` and no `AGENTS.md`.
- You are at the repository root.

### Usage

```
/scrolls-setup
```

### Caveats

- The skill reads the project name from `package.json`, `pyproject.toml` or `Cargo.toml`. If none exists, it uses the folder name.
- The memory files start almost empty. They fill up during later sessions.

### Expected Output

```
docs/.scrolls/
├── STARTER.md        # reading order; read this first
├── SPEC.md
├── HANDOFF.md
├── GAP_ANALYSIS.md
├── GAP_CONTEXT.md
├── PLAN.md
└── WISDOM.md
SCROLLS.md            # "read docs/.scrolls/STARTER.md first"
CLAUDE.md             # ## Access Scrolls Agentic Memory / See @SCROLLS.md.
AGENTS.md             # See @CLAUDE.md
```

- A report: the files created, and what to fill in next (`STARTER.md` orientation, the first `SPEC.md` entry).

---

## Example: 02 — You are in a subdirectory

### Premise

- You are in `src/api/`. The repository root is two levels up.

### Usage

```
/scrolls-setup        # the skill warns, then asks
/scrolls-setup -t     # put the scrolls at the repository root
/scrolls-setup -l     # put the scrolls here, with no warning
```

### Caveats

- Without a flag, the skill uses the current directory. It warns first, because a second scrolls system can be a mistake.
- `-t` fails outside a git repository. Use `-p` there.

### Expected Output

- Without a flag: a message that names `<cwd>/docs/.scrolls` and the repository root. The skill asks which one you want.
- With `-t`: the files from Example 01, at the repository root.

---

## Example: 03 — Monorepo: scrolls for one package

### Premise

- The repository has `packages/api` and `packages/web`.
- You want memory for `packages/api` only.

### Usage

```
/scrolls-setup -p packages/api/docs
```

### Caveats

- `-p` names the docs folder. It does not name the project folder.
- The skill can ask where `SCROLLS.md` must go. The answer depends on your repository layout.

### Expected Output

```
packages/api/docs/.scrolls/STARTER.md  (and the six other files)
packages/api/SCROLLS.md  (if you choose the package as the pointer location)
```

---

## Example: 04 — Make the folder visible

### Premise

- You want `docs/scrolls/`, not the hidden `docs/.scrolls/`.

### Usage

```
/scrolls-setup -u
```

### Caveats

- Use `-u` only for a new setup.
- For an existing hidden folder, use `/scrolls-unhide`.

### Expected Output

- The files from Example 01, in `docs/scrolls/`.
- `SCROLLS.md` points at `docs/scrolls/STARTER.md`.

---

## Example: 05 — Check for an existing scrolls folder first

### Premise

- You are not sure if the repository already has scrolls in a different location.

### Usage

```
/scrolls-setup -r
/scrolls-setup -t -r     # search the full repository
```

### Caveats

- `-r` does not change the location of the new folder. It only searches first.
- The search goes 8 levels deep. It skips `node_modules`, `.git`, `vendor`, `dist` and similar folders.

### Expected Output

- If the skill finds a scrolls folder, it shows the path. Then it asks if you want `/scrolls-update` on that folder.
- If it finds nothing, it continues as in Example 01.

---

## Example: 06 — The project already has a CLAUDE.md

### Premise

- `CLAUDE.md` exists with your own instructions. It has no scrolls pointer.

### Usage

```
/scrolls-setup
```

### Caveats

- The skill never replaces your content. It adds the stub near the top.
- A stub near the top makes sure that agents read the memory first.

### Expected Output

```markdown
# Project rules

## Access Scrolls Agentic Memory

See @SCROLLS.md.

Use tabs. ...
```

- The report says `CLAUDE.md` was updated, not created.

---

## Example: 07 — Run it again on a set-up project

### Premise

- The project has scrolls from an old version. It has no `SCROLLS.md` and no `AGENTS.md`.

### Usage

```
/scrolls-setup
```

### Caveats

- The skill does not change the seven scroll files. They can hold real state.
- It adds only the missing pointer files. You can safely run it many times.

### Expected Output

- `SCROLLS.md` created.
- `AGENTS.md` created.
- `CLAUDE.md`: stub added, or left alone if it already points at `SCROLLS.md`.

---

## Example: 08 — Two location flags at the same time

### Premise

- You typed `/scrolls-setup -t -p docs`.

### Usage

```
/scrolls-setup -t -p docs
```

### Caveats

- `-p`, `-t` and `-l` all select the location. Use only one of them.

### Expected Output

- The skill stops. It asks which location you want.
