# Maintaining create-slides-3d

For people developing this skill — not read as part of answering a
`$create-slides-3d` request (that's `../SKILL.md`).

## Layout

- `../SKILL.md` — the invocation contract and core workflow.
- `../README.md` — human-facing installation and usage examples.
- `../references/implementation-patterns.md` — detailed projection,
  scene-model, navigation, responsive, accessibility, and browser-verification
  guidance; keep it linked from `SKILL.md`.
- `../assets/d3-slide-engine/` — reusable D3/SVG engine starter, pure
  projection/geometry/navigation modules, and Node tests.
- `../agents/openai.yaml` — OpenAI-agent interface metadata.
- `../meta/MAINTAINERS.md` — this maintenance guide; it is not loaded during
  ordinary skill use.

## Updating the skill

Keep `SKILL.md` focused on decisions that materially improve generated
single-page D3 presentations. Put substantial implementation detail in the
reference document so the entrypoint remains easy to load. Preserve the
following invariants when editing:

- The default output is one browser-openable HTML file with no build step.
- D3.js remains the scene-rendering technology for the default workflow.
- 3D-style geometry must not make text unreadable or mirrored.
- Generated pages must include responsive behavior, keyboard-accessible
  navigation, reduced-motion handling, and explicit browser verification.
- The Ethical Institute keynote is a visual reference only; do not copy its
  source, content, branding, or artwork.

## Validation

Run the skill validator after changes:

```bash
python /root/.codex/skills/.system/skill-creator/scripts/quick_validate.py \
  skills/experimental/create-slides-3d
```

Also run `git diff --check`. If the skill gains executable helpers or a
generated example, add focused tests and verify the behavior in a real browser
when the change affects rendering or interaction.

## Versioning

The skill currently has no `metadata.version` or `CHANGELOG.md`. If it gains
versioned behavior, add both and bump the version whenever a live invocation’s
workflow, output contract, or interaction requirements change. Documentation-
only typo and formatting fixes do not require a version bump.
