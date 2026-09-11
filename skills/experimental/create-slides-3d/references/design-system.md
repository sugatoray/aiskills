# Editorial keynote design system

Use this reference when a generated page should approach the quality of a
cinematic keynote rather than a dashboard. It captures the visual logic of the
Ethical Institute keynote without copying its source code, text, branding, or
artwork.

## Composition

- Design on a logical `1920 × 1080` stage and scale it uniformly into the
  viewport. Keep a generous safe area (`96px` desktop) around the content.
- Give every scene one visual thesis, one dominant object or spatial system,
  one oversized headline, and one short supporting line.
- Prefer asymmetry, large negative space, and deliberate alignment over evenly
  filling the canvas.
- Put the visual engine behind the HTML content layer. Text should remain
  selectable, accessible, and unaffected by 3D transforms.

## Type

Use a three-level type system:

| Role | Guidance |
| --- | --- |
| Display | Large, light-to-medium weight sans-serif; tight tracking; 76–145px on a 1920px stage |
| Editorial | Italic serif for one short refrain or contrast line |
| Instrument | Monospace for IDs, timestamps, scene labels, and evidence metadata |

Do not use the same font size, weight, and casing for every label. Small labels
are metadata, not the main story.

## Color and material

Start with a near-black blue-green background, warm ivory ink, muted gray-green
secondary text, and one restrained accent. Shift the accent by narrative act
only when it communicates a real change in tone. Use gradients, thin strokes,
soft shadows, depth haze, and sparse glows to give geometry material—not neon
decoration.

## Motion

Motion should express travel through a system: camera drift, object emergence,
path drawing, or evidence links resolving. Avoid animating every element on
every slide. The first meaningful content must exist before a transition ends.
Respect `prefers-reduced-motion` by settling immediately while preserving the
same scene and information hierarchy.

## Interaction chrome

Keep the header and footer quiet: a small mono identity, a thin progress rail,
previous/next controls, and an index/help affordance. Support keyboard and
hash navigation. The rail should show where the audience is in the journey,
not behave like a row of dashboard tabs.

## 3D fallback rule

Treat Three.js/WebGL as an enhancement. The page must still communicate its
thesis with a static SVG or CSS composition if WebGL, the CDN, or graphics
initialization fails. Never let a missing graphics layer produce a blank page.
