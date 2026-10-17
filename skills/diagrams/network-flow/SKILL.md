---
name: network-flow
description: "Create working interactive network and architecture diagrams with moving packets, orthogonal connections, scenario playback, and selectable nodes. Use when the user invokes /network-flow or asks for live flowing diagrams, animated system architecture, request flows, RAG pipelines, or agent workflow visualizations. Accept descriptions, reference images, source material, or graph JSON. Deliver a self-contained HTML file with a working preview when supported; complete rendering, browser verification, and file delivery rather than stopping at a diagram description."
license: MIT
compatibility: "Python 3.9+ (stdlib only) for validation and HTML generation; modern browser with SVG and ResizeObserver for playback; optional Node.js and Playwright for browser checks"
disable-model-invocation: true
metadata:
  name: network-flow
  type: skill
  author: sugatoray
  version: "1.0.0"
  source_url: "https://github.com/sugatoray/aiskills/tree/master/skills/diagrams/network-flow"
---

# Network flow

Produce an interactive diagram using the bundled graph-driven renderer. Treat the
reference's visual language as inspiration; create original code and content.
Keep this file as the invocation entry point. Read the references below on demand;
leave README, CHANGELOG, and meta/MAINTAINERS for maintainers.

## Options and defaults

Interpret `/network-flow [[ system description ]]` followed by these options:

| Option | Default | Contract |
| --- | --- | --- |
| `--theme` | `dark-grid` | Dark dotted grid, service cards, semantic flow colors. |
| `--routing` | `orthogonal` | Route horizontal/vertical segments around cards. |
| `--scenarios` | Infer from the system | Ordered comma-separated scenario IDs; include `all`. |
| `--mode` | `simulated` | Scripted explanatory animation; never imply measured traffic. |
| `--output` | `html` | Return one working downloadable HTML file, not code alone. |

The slash-command `--output html` selects a format. The bundled CLI's `--output`
requires an actual path, such as `output/system-flow.html`. The bundled renderer
supports only the defaults above. Reject unsupported values clearly rather than
silently substituting. For measured traffic, read
[references/telemetry.md](references/telemetry.md) and implement an explicitly
requested adapter separately; never label this simulated renderer as telemetry.

## Workflow

1. **Model the system.** Extract components, directed connections, source/destination
   roles, meaningful scenarios, and failure/recovery branches. Infer routine
   presentation choices. Ask only if missing information changes system meaning.
   Identify assumptions and label fictional examples. Keep alternative failure
   outcomes explicit; do not depict both outcomes as one successful execution.
2. **Write graph JSON.** Read [references/graph-schema.md](references/graph-schema.md).
   Reuse the shape in `examples/rag.json`; replace its content for another system.
   Attach source provenance to evidence where relevant. Express simulated steps
   in order. Limit a diagram to 24 nodes; split larger systems into scoped diagrams.
3. **Lay out and validate.** Prefer curated wide/medium/narrow positions for complex
   graphs; use automatic row placement for small graphs. Read
   [references/layout.md](references/layout.md) for geometry and limitations.
   Run `python3 <skill-dir>/scripts/validate_graph.py <graph.json>`. Correct invalid
   identifiers, endpoints, scenario scopes, and overlapping layout cells first.
4. **Render the file.** Run:

   ```sh
   python3 <skill-dir>/scripts/render.py <graph.json> \
     --theme dark-grid --routing orthogonal --mode simulated \
     --output <output-dir>/system-flow.html
   ```

   Pass `--scenarios ingest,answer,retry,all` only when those scenario IDs exist.
   Work in the requested project/output directory; never edit the installed
   template to create a particular diagram. Do not overwrite unrelated files.
5. **Verify actual behavior.** Check desktop and mobile browser renders, card text,
   attached orthogonal paths, moving packets, scenario captions, pause/resume,
   replay, node focus, keyboard clear, and reduced-motion behavior. Read
   [references/verification.md](references/verification.md) and use the bundled
   browser check when available. Fix failures and rerun relevant checks. If browser
   verification is unavailable, disclose that limit; do not claim it passed.
6. **Deliver completely.** Provide the actual `.html` file through the host's file
   mechanism and a concise description of controls. Show an interactive preview
   when supported. If the host needs an HTML fragment, extract the body after
   generating the standalone file, preserve its scoped CSS and scripts, and keep
   the downloadable document as the deliverable. Do not stop at a static image,
   Mermaid diagram, unexecuted source snippet, or promised attachment. Never claim
   a file is hosted or published unless that separate action succeeded.

## Runtime behavior

- Keep layout stable while changing scenarios; emphasize active edges and nodes.
- Render HTML buttons above an SVG wire layer. Animate packets along actual paths
  at a consistent speed; keep a thin stationary track visible.
- Select a node to trace immediate incoming/outgoing edges within the active
  scenario. Select it again or press Escape to clear focus.
- Provide pause/resume and replay. Honor reduced motion without hiding topology.
- Resize and reroute without shrinking labels into unreadable miniature cards.
- Preserve graph text as text, not executable HTML. Keep generated files offline
  and free of external dependencies by default.

## Bundled example

`examples/rag.json` and its generated `examples/rag.html` cover ingestion,
retrieval, reranking, context assembly, generation, citation resolution, bounded
retry, and abstention. The handbook quotation is illustrative, not sourced policy.
The retry playback explicitly labels the exhausted path as an alternative outcome.

For the original delivered visual and its exact invocation, use
`assets/examples/rag_demo.html` and `assets/examples/rag_prompt.md`. These are a
preserved example pair; `examples/rag.json` remains the editable renderer fixture.

The design reference is the interactive architecture graphic in
[Vercel's Python announcement](https://vercel.com/blog/python-on-vercel-is-now-generally-available).
No Vercel source code, logos, or branded assets are bundled.
