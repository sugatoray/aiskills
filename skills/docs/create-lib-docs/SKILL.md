---
name: create-lib-docs
description: "Writes top-grade, verified user documentation for a library, CLI or framework as a folder of Markdown pages plus SVG diagrams, structured the way FastAPI, Pydantic, DuckDB and Effect structure theirs: a landing page with a 30-second example, Getting Started, a progressive Tutorial with runnable steps, task-oriented How-to Guides, Concepts (explanations with diagrams), an exhaustive Reference (CLI flags, API, config, output schemas, one anchor per error with cause and fix), FAQ/troubleshooting, and llms.txt / llms-full.txt so AI agents can load the docs. Every fact is taken from the code, --help output and tests (never from memory), and every snippet is run before it is published. Use this whenever the user asks to write, create, restructure or overhaul documentation / docs / a user guide / a manual / API reference for a library, package, CLI or framework, wants docs 'like FastAPI's / Pydantic's / DuckDB's / Effect's', wants docs that help both humans and AI agents, or invokes /create-lib-docs."
license: MIT
disable-model-invocation: true
metadata:
  name: create-lib-docs
  type: skill
  author: sugatoray
  version: "1.2.0"
  source_url: "https://github.com/sugatoray/aiskills/tree/master/skills/docs/create-lib-docs"
---

# Creating library documentation

Good library docs answer four different questions, and the best projects keep them on separate
pages instead of mixing them: *teach me* (tutorial), *help me do X* (how-to guide), *explain why*
(concepts), *tell me exactly* (reference). FastAPI, Pydantic, DuckDB and Effect all follow that split,
each with its own strengths. This skill reproduces it for any library, adds what AI agents need
(stable anchors, exact schemas, `llms.txt`), and refuses to publish anything unverified: a
plausible-looking snippet that doesn't run is worse than no snippet.

`references/patterns.md` lists what to borrow from each reference project, and `references/templates.md`
has the page skeletons. Read both before planning the docs.

## Options

Read the invocation text for these, in any order:

- **`--lib <path>`**: the library's root folder (where its code, tests and `pyproject.toml` /
  `package.json` / `Cargo.toml` live). Default: the current project.
- **`--out <dir>`**: where the docs go. Default: `<lib>/docs/<lib-name>/`. If the user names a
  folder in plain words ("inside docs/callai/"), that wins.
- **`--update`**: the docs already exist. Refresh them against the current code instead of
  starting over. Keep page paths and heading anchors stable, because people and agents link to them.
- **`--sections a,b,...`**: write only these sections (e.g. `reference,guides`).

## Steps

### 1. Learn the library from primary sources only

Docs written from memory drift into fiction. Build an inventory from what the code *does*:

- **Public surface.** Every CLI flag (run `--help`, and read the parser), every public function and
  class (exports, `__all__`, `index.ts`), every config key, environment variable, output field,
  exit code and error message. Write the inventory to a scratch file. The Reference pages are
  built from it, and step 6 checks against it.
- **Behaviour.** Tests, conformance or fixture suites, the design doc, the changelog, and the
  project's own notes (e.g. `docs/.scrolls/`). Tests show real inputs and outputs. Changelogs
  show which behaviour is deliberate.
- **Limits.** Known gaps, refusals and platform caveats. Good docs say what the library does *not*
  do, and what happens if you try.
- Run the library. Capture real output for the examples. If it needs network access or
  credentials you don't have, use the project's own fakes or stubs and say so in the example.
  Don't invent output.

### 2. Plan the information architecture

Map the inventory onto the sections in `references/patterns.md` → "Information architecture". The
default tree, with an `index` per section:

```
docs/<lib>/
├── README.md            landing: what/why in 3 lines, 30-second example, features, map of the docs
├── getting-started/     why-<lib>, installation, quickstart (first success in < 5 minutes)
├── tutorial/            numbered, progressive; each step builds on the last; ends with "Recap"
├── guides/              task recipes ("How to …"), self-contained, any order
├── concepts/            explanations and mental models, with diagrams
├── reference/           exhaustive and dry: CLI, API, config, schemas, errors (one anchor each)
├── faq.md               troubleshooting + questions people actually ask
├── license.md           the library's license, and a table of what each bundled part uses
├── images/              SVG diagrams (text-based, diffable)
├── llms.txt             index for AI agents (generated)
└── llms-full.txt        every page in reading order, one file (generated)
```

Drop a section only if the library really has nothing for it, e.g. a one-function library needs no
tutorial. Size the tutorial to the learning path, not to the feature count. FastAPI's has ~50 short
steps; a small CLI needs 5–10. Write the plan (page list, one line each) before writing pages.

Always write `license.md`, and link it from the landing page under its own `### License` section,
so a site built from those sections gets a License tab. It says, in its first sentence, what license
the library itself uses (the SPDX id, linked to the `LICENSE` file), then gives a table. When the
library bundles or vendors parts with their own licenses (plugins, skills, templates, fonts, data),
the table has one row per part: its name, its license, and where that license is declared. Take
every value from the files themselves (`package.json`/`pyproject.toml`, `LICENSE`, each part's own
metadata), never from memory, and say plainly when parts differ from the library. Generate the
table if the parts can change, so it can't go stale.

### 3. Write the pages

Use the skeletons in `references/templates.md`. Rules that apply everywhere:

- **One job per page.** Never mix tutorial, how-to, explanation and reference on one page. Link
  between them instead: a tutorial step ends with "Reference: [`--flag`](…)", and a reference entry
  links to the guide that uses it.
- **Lead with the answer.** Each page opens with a one-sentence summary (it becomes the page's
  `llms.txt` description), then the shortest working example, then detail.
- **Complete, copy-pasteable snippets.** Include imports and setup. Don't add `$ ` prompts inside
  copyable blocks; put output in its own block labelled as output. Always label the fence language
  (`bash`, `python`, `json`, `toml`, `text`).
- **Show the output** of every example: the real output from step 1, trimmed with `…` only where
  noise doesn't matter.
- **Admonitions** use GitHub alert syntax so they render on GitHub and stay plain Markdown:
  `> [!NOTE]`, `> [!TIP]`, `> [!IMPORTANT]`, `> [!WARNING]`, `> [!CAUTION]`. Keep them rare: more than
  two per screen and readers skip them all.
- **Name things one way.** Pick one term per concept, use it everywhere, and define it once (a
  glossary entry in Concepts or the FAQ).
- **Navigation.** Every page ends with `Next:` / `Previous:` links (tutorial) or `See also:`
  (everything else). Every page is reachable from `README.md`.
- **Write for agents too.** Agents read the Markdown source and can't see images, so:
  - give every diagram a text equivalent next to it (a list, a table or the steps);
  - give every reference entry a stable heading anchor (`#--resume`, `#harnessnotfound`);
  - show exact schemas as JSON with field types;
  - add a guide on using the library *from* an agent (non-interactive use, machine-readable
    output, exit codes, failure modes).
- **Plain language.** Second person, present tense, short sentences, no marketing ("blazing",
  "seamless", "powerful"). Say what happens, including what can go wrong.

### 4. Draw the diagrams

Diagrams are hand-written SVG in `images/`, so they diff, review and render everywhere:

- Explain the shape of the system: architecture, a run's lifecycle, data flow, precedence order,
  concurrency. Don't draw decoration.
- Use an opaque light background and dark text (a `<rect>` filling the canvas), so the diagram stays
  legible on GitHub's dark theme. Use system sans-serif and monospace font stacks, with text at
  least 13px.
- Embed with meaningful alt text: `![Architecture: CLI and Python API share one run path …](images/architecture.svg)`.
- Render each SVG to PNG (Playwright or a headless browser) and look at it before publishing:
  check for clipped text, overlaps and arrows pointing nowhere.

### 5. Generate the agent indexes

Run `scripts/build_llms_txt.py <docs-dir>`. It reads `README.md`'s sections and links in order, and
writes:

- **`llms.txt`**: title, summary, and one `- [Title](path): description` line per page, grouped by
  section ([llms.txt convention](https://llmstxt.org/), as Pydantic and Effect publish).
- **`llms-full.txt`**: every page's Markdown in reading order, each preceded by its path.

Re-run it whenever a page changes. Both files are generated, so never edit them by hand.

### 6. Verify everything before calling it done

- `python3 scripts/check_docs.py <docs-dir>` must pass. It checks:
  - relative links and `#anchors` resolve;
  - images exist and have alt text;
  - every code fence has a language;
  - every page is reachable from `README.md`;
  - `llms.txt` lists every page;
  - `license.md` exists and has a table.
- **Run every snippet.** Shell commands and code examples run, and their output matches what the
  page shows (allowing for timestamps, ids and durations). Where the real dependency is
  unavailable, run against the project's fakes or stubs and say so on the page.
- **Check the reference against the inventory** from step 1. Every flag, function, config key, env
  var, output field and error appears, and nothing documented doesn't exist. A quick check is to
  diff the flags in `reference/cli.md` against `--help`.
- Read each page once as a newcomer (is anything used before it's explained?) and once as an agent
  (could you call the library correctly from this page alone?).

### 7. Report

Tell the user:
- where the docs are, and the page count per section;
- what was verified and how: snippets run, against what, and any stubs used;
- anything left unverified or undocumented, and why.

Link the landing page. If the project keeps a changelog or project notes, add an entry there too.
