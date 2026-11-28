---
name: iui
description: "Create interactive visual explanations and small interfaces. Use when the user invokes /iui or /IUI, or asks for an intelligent-UI-style explorable answer, walkthrough, comparison, calculator, or interface. Produce a working rendered experience when the host supports one, with an accessible standalone HTML fallback."
license: MIT
disable-model-invocation: true
metadata:
  name: iui
  type: skill
  author: sugatoray
  version: "1.0.0"
  source_url: "https://github.com/sugatoray/aiskills/tree/master/skills/productivity/iui"
---

# IUI — interactive visual answers

Interpret `/iui [[ topic or task ]]` and `/IUI [[ topic or task ]]` identically. The skill guides an assistant to create an interactive answer; it cannot turn on, impersonate, or guarantee access to ChatGPT's native Intelligent UI. Host support and rendering vary.

## Options

- `--format auto|walkthrough|compare|calculator|diagram`: default `auto`; select a form that helps the specific task. Do not silently treat an unknown format as supported.
- `--output auto|inline|html`: default `auto`. Prefer a working native interactive surface if actually available; otherwise generate and deliver a self-contained downloadable HTML file. For `html`, always deliver the actual file. For `inline`, report if the host cannot render it and offer the HTML fallback.
- `--theme light|dark`: default light. Respect explicit styling requests.

## Workflow

1. Identify the question, audience, evidence, and useful user decision. Ask only if an ambiguity changes the result. Label illustrative or simulated content. Research and cite sources as appropriate; do not invent data.
2. Select a focused interaction: stages for a process, controls for a calculation, choices for a comparison, or selectable nodes for a system. Keep a readable summary and explanatory context. For a trivial question, use a simple answer unless the user explicitly requests an interactive artifact.
3. Build a complete working interface, not a screenshot or code excerpt. Use descriptive text, visible state, labeled semantic controls, keyboard access, responsive layouts, sufficient contrast, and reduced motion. Avoid destructive actions, unsupported network requests, and external dependencies by default. Do not claim data is live unless it really is.
4. Test the actual output: check meaningful controls and changed results, keyboard behavior, desktop and mobile widths, horizontal overflow, and runtime errors. For calculations verify known values and edge cases. If a browser or a check is unavailable, disclose the limitation rather than claiming it passed.
5. Show the rendered result where the host supports it. Deliver a working downloadable HTML file whenever requested or required as a fallback. Include concise instructions for interaction; disclose when inline rendering or persistence is unavailable. Never claim to have published or enabled a host feature.

## Examples

```text
/iui [[ Explain how a RAG system retrieves and cites evidence. ]] --format walkthrough --output html
/IUI [[ Compare three model deployment approaches. ]] --format compare
/iui [[ Explore a fixed-rate mortgage by changing rate and principal. ]] --format calculator
```

See `assets/examples/rag_demo.html` for a self-contained illustrative walkthrough and `assets/examples/rag_prompt.md` for the invocation.
