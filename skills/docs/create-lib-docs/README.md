# create-lib-docs

Writes top-grade, verified user documentation for a library, CLI or framework: Markdown pages plus
SVG diagrams, structured the way FastAPI, Pydantic, DuckDB and Effect structure theirs.

- **Sections:** landing page, Getting Started, a progressive Tutorial, How-to Guides, Concepts,
  Reference (with one anchor per error), FAQ.
- **For AI agents:** `llms.txt` and `llms-full.txt`.
- **Verified:** every fact comes from the code, `--help` and tests, and every snippet is run before
  it's published.

## Layout

```text
create-lib-docs/
├── agents/
│   └── openai.yaml        display name and invocation policy
├── meta/
│   └── MAINTAINERS.md
├── references/
│   ├── patterns.md        what to copy from FastAPI / Pydantic / DuckDB / Effect, and why
│   └── templates.md       page skeletons: landing, tutorial step, guide, concept, reference, error
├── scripts/
│   ├── check_docs.py      links, anchors, images, fences, reachability, llms.txt coverage
│   └── build_llms_txt.py  llms.txt + llms-full.txt from the landing page's sections
├── tests/
│   └── test_scripts.py
├── CHANGELOG.md
├── README.md
└── SKILL.md
```

- **Runtime instructions**: [`SKILL.md`](SKILL.md)
- **Development notes**: [`meta/MAINTAINERS.md`](meta/MAINTAINERS.md)
- **Version history**: [`CHANGELOG.md`](CHANGELOG.md)
- **Skill category**: [`../README.md`](../README.md)

## Usage

Invoke explicitly as `/create-lib-docs`. The skill sets `disable-model-invocation: true`, so it is
never loaded automatically, even when you ask for "docs like FastAPI's for this library". Options
are in `SKILL.md`: `--lib`, `--out`, `--update` and `--sections`.

Install it with `npx skills add sugatoray/aiskills` (choose `create-lib-docs`), or as part of the
`docs-skills` Claude Code plugin; see [`../README.md`](../README.md).

First used for callai's docs (32 pages, 0 checker problems):
[`sugatoray/devx` → `src/experiments/expt_callai/docs/callai/`](https://github.com/sugatoray/devx/tree/feat/dev_callai/src/experiments/expt_callai/docs/callai).
