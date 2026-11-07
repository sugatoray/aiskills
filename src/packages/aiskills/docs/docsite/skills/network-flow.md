# network-flow

Create working interactive network and architecture diagrams with moving packets, orthogonal connections, scenario playback, and selectable nodes. Use when the user invokes /network-flow or asks for live flowing diagrams, animated system architecture, request flows, RAG pipelines, or agent workflow visualizations. Accept descriptions, reference images, source material, or graph JSON. Deliver a self-contained HTML file with a working preview when supported; complete rendering, browser verification, and file delivery rather than stopping at a diagram description.

| Property | Value |
| --- | --- |
| Group | `diagrams-skills` (alias `diagrams`) |
| Version | 1.0.0 |
| Starts | When you ask for it: you type `/network-flow` (your agent doesn't start it on its own) |
| Needs | Python 3.9+ (stdlib only) for validation and HTML generation; modern browser with SVG and ResizeObserver for playback; optional Node.js and Playwright for browser checks |
| License | MIT |
| Source | [skills/diagrams/network-flow](https://github.com/sugatoray/aiskills/tree/master/skills/diagrams/network-flow) |

## Install

For one agent (leave out `-a` for every agent `npx skills` finds):

<!-- verify -->
```bash
aiskills install -s network-flow -a claude-code
```

```text
[aiskills] skills saved to ~/.config/sugatoray/aiskills/skills (flat layout)
[aiskills] bundled: network-flow
[aiskills] running: npx -y skills@1.7.6 add ~/.config/sugatoray/aiskills --global --skill network-flow --agent claude-code --yes
```

Or the whole `diagrams-skills` group:

```bash
aiskills install -G diagrams -a claude-code
```

Into the current project instead: add `-p`. To remove it:

```bash
aiskills uninstall -s network-flow
```

## What's inside

The files that ship with the skill, in `~/.config/sugatoray/aiskills/skills/network-flow/`:

- `CHANGELOG.md`
- `README.md`
- `SKILL.md`
- `agents/openai.yaml`
- `assets/examples/rag/README.md`
- `assets/examples/rag/generated/rag.html`
- `assets/examples/rag/generated/rag.json`
- `assets/examples/rag/original/rag_demo.html`
- `assets/examples/rag/original/rag_prompt.md`
- `assets/runtime/renderer.js`
- `assets/runtime/style.css`
- `assets/template.html`
- `meta/MAINTAINERS.md`
- `references/graph-schema.md`
- `references/layout.md`
- `references/telemetry.md`
- `references/verification.md`
- `scripts/network_flow.py`
- `scripts/render.py`
- `scripts/validate_graph.py`
- `tests/check_browser.cjs`
- `tests/test_graph.py`

See also: [All skills](README.md) · [README](https://github.com/sugatoray/aiskills/blob/master/skills/diagrams/network-flow/README.md) · [CHANGELOG](https://github.com/sugatoray/aiskills/blob/master/skills/diagrams/network-flow/CHANGELOG.md) · [Skill groups](../concepts/skill-groups.md)
