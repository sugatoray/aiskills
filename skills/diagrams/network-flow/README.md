# network-flow

Create animated network and architecture diagrams as one offline HTML file.
Select scenarios, follow moving packets, and select a component to trace its
immediate connections. Includes pause/resume, replay, mobile layouts, and reduced
motion support.

```text
/network-flow [[
Explain a RAG system with ingestion, retrieval, reranking,
generation, citations, and a failed retrieval path.
]]
--theme dark-grid
--routing orthogonal
--scenarios ingest,answer,retry,all
--mode simulated
--output html
```

## Install

After the change reaches the default branch:

```sh
npx skills add sugatoray/aiskills --skill network-flow
npx skills add sugatoray/aiskills --skill network-flow --global
```

To install from a branch, append `#<branch>` to the repository. From a local
checkout, run `npx skills add . --skill network-flow`.

The optional Claude Code family plugin is `diagrams-skills@sugatoray`; register
this repository's marketplace first. Choose either the skills CLI or plugin to
avoid duplicate installations.

## Run the included example

From the repository root:

```sh
python3 skills/diagrams/network-flow/scripts/validate_graph.py \
  skills/diagrams/network-flow/examples/rag.json
python3 skills/diagrams/network-flow/scripts/render.py \
  skills/diagrams/network-flow/examples/rag.json \
  --output output/rag-network-flow.html
```

Open the generated HTML in a browser. Python generation uses only the standard
library; playback needs no server, package installation, API key, or network.
Use `examples/rag.html` to open the already generated example directly.

The original delivered demo is preserved separately in
[`assets/examples/rag_demo.html`](assets/examples/rag_demo.html), alongside its
exact [`rag_prompt.md`](assets/examples/rag_prompt.md) invocation.

## Scope

This release renders simulated flows. It does not collect network traffic or
connect to production systems. `--mode live`/`telemetry` and unsupported themes or
routing modes fail explicitly. A graph supports up to 24 nodes, directed edges,
ordered scenario steps, optional semantic colors, and optional responsive layouts.
Crossing wires do not imply connections; only edge endpoints define connectivity.

| Path | Purpose |
| --- | --- |
| [SKILL.md](SKILL.md) | Invocation instructions and options |
| [meta/MAINTAINERS.md](meta/MAINTAINERS.md) | Development and verification |
| [CHANGELOG.md](CHANGELOG.md) | Release history |
| [references/graph-schema.md](references/graph-schema.md) | Reusable graph contract |
| [assets/runtime/](assets/runtime/) | Original reusable renderer and styling |
| [examples/](examples/) | RAG configuration and standalone output |
| [tests/](tests/) | Validation and browser checks |

License: MIT. Visual inspiration: the interactive diagram in
[Vercel's Python announcement](https://vercel.com/blog/python-on-vercel-is-now-generally-available).
The implementation is original; no Vercel assets are distributed.
