# Maintaining network-flow

For people developing this skill — not read as part of answering a
`/network-flow` request (that's `../SKILL.md`).

## Layout

- `../SKILL.md` — invocation entry point and option contract.
- `../README.md` — human-facing usage, installation, and navigation.
- `../CHANGELOG.md` — version history; update with `metadata.version`.
- `../agents/openai.yaml` — interface metadata; explicit invocation, like scrolls.
- `../assets/template.html` — generic shell; never embed a specific system here.
- `../assets/runtime/` — original generic styling and renderer.
- `../assets/examples/rag_demo.html` — original delivered standalone HTML snapshot.
- `../assets/examples/rag_prompt.md` — exact invocation for that snapshot; keep
  this pair together. Do not regenerate the snapshot from the newer renderer.
- `../scripts/` — standard-library schema validation and offline rendering.
- `../references/` — schema, routing, telemetry boundary, verification.
- `../examples/rag.json` — source for the generated `rag.html`; edit JSON first.
- `../tests/` — input-validation, serialization, and browser checks.

## Frontmatter validation

Keep the same flat metadata mapping as `scrolls-*`: name, type, author, quoted
version, quoted source_url. Preserve MIT license, compatibility, and explicit
invocation. Match metadata.name to the top-level name and folder.

With yamllint installed, from this directory:

```sh
awk '/^---$/{c++; if(c==2){exit}} c==1' ../SKILL.md | \
  yamllint --strict -d "{extends: default, rules: {line-length: disable, document-start: disable}}" -
```

Some generic skill validators reject repository-standard `compatibility` and
`disable-model-invocation`; do not remove those fields to satisfy an older schema.
Validate the complete frontmatter against peer skills and lint YAML separately.

## Checks

From the repository root:

```sh
python3 -m unittest discover -s skills/diagrams/network-flow/tests -p 'test_*.py'
python3 skills/diagrams/network-flow/scripts/validate_graph.py skills/diagrams/network-flow/examples/rag.json
python3 skills/diagrams/network-flow/scripts/render.py skills/diagrams/network-flow/examples/rag.json --output skills/diagrams/network-flow/examples/rag.html
node --check skills/diagrams/network-flow/assets/runtime/renderer.js
```

Install Playwright in a local development environment (and its Chromium browser),
then run `node skills/diagrams/network-flow/tests/check_browser.cjs`.
Set `NODE_PATH` if Playwright is installed elsewhere, and optionally
`NETWORK_FLOW_CHROMIUM` for an existing browser binary. `NETWORK_FLOW_SCREENSHOTS`
selects a scratch directory for desktop/mobile screenshots. Inspect those images.
Do not commit dependencies, caches, temporary outputs, or browser binaries.

Forward-test another system from a fresh prompt using this skill. Validate that
its labels, scenarios, and JSON are independent of RAG. Keep failure branches and
simulation labels honest. Measure complex routing before increasing the 24-node cap.

## Versioning and discovery

Bump `metadata.version` for visible behavior changes and keep this skill's
CHANGELOG and `../../.claude-plugin/plugin.json` version aligned while it is the
only diagrams skill. Register new family members in that group manifest and the
root marketplace. The diagrams family is independent of scrolls versioning.
