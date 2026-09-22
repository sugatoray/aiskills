# Romantic Marble Monument

`romantic-marble-monument` transforms a photograph of one adult woman
and one adult man into a museum-quality neoclassical Carrara-marble engagement
monument. It preserves the couple's emotional connection while enforcing a
coherent carved-stone material, romantic symbolism, and the inscription
`A BRIGHTER TOMORROW TOGETHER`.

Install from this repository with:

```sh
npx skills add sugatoray/aiskills --skill romantic-marble-monument
```

Then attach a couple photograph and invoke the skill, for example:

```text
$romantic-marble-monument Transform this engagement photograph into a
romantic Carrara-marble monument while preserving both people's likenesses.
```

For a reusable template that does not expose the original couple's identity:

```text
$romantic-marble-monument Use fictional adult faces for privacy while
preserving the pose, engagement ring, emotional tone, and museum composition.
```

## What it preserves

- The relationship, pose, expressions, and emotional character of the source.
- Recognizable facial geometry when likeness preservation is requested.
- Exactly one adult woman and one adult man.
- A joyful engagement theme centered on love, trust, compassion,
  companionship, and a shared future.

## What it controls

- Both figures use the same ivory-white Carrara marble, including faces, eyes,
  hair, facial hair, hands, clothing, and accessories.
- Contemporary clothing becomes modest, flowing Greco-Roman drapery.
- Books and symbolic artifacts use humanistic themes rather than technical,
  scientific, professional, or career references.
- The default pedestal inscription is spelled exactly and never mirrored.
- Warm museum lighting, natural perspective, and medium depth of field keep the
  result cinematic but believable.

## Privacy mode

When privacy is requested, the skill replaces both identities with clearly
fictional adult faces. It may follow broad appearance guidance, but it does not
claim that a generated face depicts or imitates a real person.

## Files

- [`SKILL.md`](SKILL.md) — invocation workflow and acceptance checks.
- [`assets/PROMPT.md`](assets/PROMPT.md) — detailed generation brief and visual
  requirements.
- [`assets/sample.png`](assets/sample.png) — composition and visual template.
- [`agents/openai.yaml`](agents/openai.yaml) — OpenAI-agent interface metadata.
- [`meta/MAINTAINERS.md`](meta/MAINTAINERS.md) — development and validation
  guidance.
- [`CHANGELOG.md`](CHANGELOG.md) — notable changes to the skill.
