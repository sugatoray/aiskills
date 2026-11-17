# Maintaining romantic-marble-monument

For people developing this skill—not read as part of answering a
`$romantic-marble-monument` request (that is `../SKILL.md`).

## Layout

- `../SKILL.md` — invocation contract, generation workflow, acceptance checks,
  and adaptation rules.
- `../README.md` — human-facing installation, invocation, privacy, and file
  documentation; keep it aligned with the live workflow.
- `../CHANGELOG.md` — chronological record of notable skill changes.
- `../assets/PROMPT.md` — detailed, reusable image-generation brief and the
  source of truth for visual content, material, symbolism, text, and camera
  direction.
- `../assets/sample.png` — reference image used as the composition and visual
  template.
- `../assets/icon.svg` — generated skill icon used by the Skills interface.
- `../agents/openai.yaml` — OpenAI-agent interface metadata.
- `../meta/MAINTAINERS.md` — this maintenance guide; do not load it during
  ordinary skill use.

## Updating the skill

Keep `SKILL.md` concise and procedural. Put detailed visual direction in
`assets/PROMPT.md` so the prompt has one source of truth. Preserve these
invariants when editing:

- Require exactly one adult woman and one adult man.
- Support likeness-preserving and privacy-preserving fictional-face modes.
- Render both figures in identical ivory-white Carrara marble; express
  individual features through sculptural geometry rather than pigmentation.
- Keep the emotional focus on engagement, love, trust, compassion,
  companionship, joy, and a shared future.
- Exclude technical, scientific, professional, and career symbolism.
- Keep `A BRIGHTER TOMORROW TOGETHER` as the exact default pedestal
  inscription unless the user supplies replacement wording.
- Require legible, correctly spelled, unmirrored text and visual inspection of
  the generated result.
- Treat `assets/sample.png` as a reusable visual template. Replace it only when
  the new asset preserves or improves the intended composition and aesthetic.

When the generation contract changes, update both `SKILL.md` and
`assets/PROMPT.md` only where each file owns the relevant requirement. Keep
`agents/openai.yaml` aligned with the skill's name, purpose, and default
invocation.

## Validation

Run the skill validator and whitespace checks after changes:

```bash
python /root/.codex/skills/.system/skill-creator/scripts/quick_validate.py \
  path/to/romantic-marble-monument
git diff --check
```

For changes to `assets/PROMPT.md`, generate at least one representative image
and visually verify material consistency, anatomy, inscription accuracy,
symbolic restraint, lighting, and resemblance or anonymization as requested.

## Versioning

Record releases in `../CHANGELOG.md` using semantic versioning and Keep a
Changelog headings. Add a new release whenever a live invocation's workflow,
output contract, or required visual behavior changes. Documentation-only
corrections do not require a release. Keep `SKILL.md` frontmatter limited to
the fields accepted by the active skill validator.
