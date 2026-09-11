---
name: create-slides-3d
description: Create a polished, single-page HTML presentation from a concept, using D3.js to render interactive 2.5D/3D-style SVG scenes, animated transitions, and presentation navigation. Use for visual explainers, keynote-like microsites, and concept-driven slide experiences; do not use for ordinary PowerPoint decks or data charts that do not need a presentation canvas.
metadata:
  short-description: Build D3.js 3D-style single-page slides from a concept
---

# Create Slides 3D

Turn a concept into one self-contained `index.html` (or another user-specified
HTML filename) that feels like an interactive keynote: each slide is a visual
scene, navigation is immediate, and the browser is the presentation surface.

The visual target is the referenced Ethical Institute keynote:
`https://ethical.institute/keynote/#D3`

Use it as a design reference for pacing, cinematic scale, restrained chrome,
deep visual scenes, keyboard navigation, and an index/help layer. Recreate the
interaction vocabulary and visual principles; do not copy its source code,
text, branding, or artwork.

## Deliverable contract

- Produce one HTML file that opens directly from disk with no build step.
- Use D3.js for scene construction, data binding, scales, geometry, animation,
  and interaction. Prefer SVG for labels and vector scenes; use HTML/CSS for
  interface chrome.
- Make the “3D” effect with D3-managed SVG projection, isometric geometry,
  perspective scaling, depth sorting, layered shadows, or a combination of
  these. D3 is not a 3D renderer: do not quietly substitute Three.js or a
  canvas/WebGL framework unless the user explicitly allows it.
- Keep text legible and semantically real HTML/SVG text. Never transform the
  entire scene with a negative scale or rotate labels into mirror writing.
  Transform geometry groups and counter-transform text when necessary.
- Load D3 from a pinned CDN URL unless the user asks for a fully offline file.
  If offline delivery is requested, vendor the required D3 runtime into the
  HTML and say so in the handoff.
- Do not require npm, a server, a framework, a bundler, or a generated asset
  folder for the default deliverable.

## Build workflow

1. Interpret the concept as a visual thesis. Decide what changes from slide to
   slide, what the audience should notice first, and which spatial metaphor
   makes the concept memorable.
2. Create a short slide/scene storyboard before coding. Each scene should have
   one dominant composition, one concise headline, and at most a few supporting
   labels or controls. Favor visual progression over a grid of cards.
3. Define a small scene model in JavaScript, for example:
   `{ id, eyebrow, title, caption, objects, camera, accent }`. Render every
   scene through a shared SVG stage and shared transition functions so the
   experience feels coherent.
4. Build a responsive coordinate system. Use a `viewBox`, calculate a uniform
   scale from the viewport, and keep critical labels inside a safe area. Resize
   without changing the scene’s semantic ordering.
5. Implement reusable D3 primitives appropriate to the concept: projected
   boxes, planes, nodes, links, stacks, paths, particles, rings, or a focal
   object. Assign explicit depth/z values and sort before rendering so nearer
   geometry consistently occludes farther geometry.
6. Add restrained presentation chrome: progress indicator, previous/next
   controls, keyboard support, slide index, and a help affordance when useful.
   Support ArrowLeft/ArrowRight, Space/Enter, Home/End, and Escape for closing
   overlays. Add reduced-motion behavior and usable focus styles.
7. Add scene transitions that explain the change: move the camera, interpolate
   object positions/opacities, or morph geometry. Avoid gratuitous motion and
   do not make the first meaningful content depend on animation finishing.
8. Verify the actual file in a browser at desktop and narrow viewport sizes.
   Check that every slide can be reached, labels remain readable, controls do
   not overlap the art, and the console has no uncaught errors. If Playwright
   is available, use it; otherwise use the browser’s own inspection tools and
   document the limitation.

The reusable starter components live in `assets/d3-slide-engine/`. Copy or
adapt them into generated pages; keep content and art direction in the page
itself. Read its README and tests before extending the primitives.

## Visual and interaction quality bar

- Establish a clear focal point, depth hierarchy, and contrast before adding
  decoration.
- Use a compact palette with one or two accents. Let depth, scale, and motion
  carry the “3D” impression.
- Keep headlines short enough to remain readable at the smallest supported
  viewport. Put longer explanation in captions, notes, or an optional index.
- Use `aria-label`, visible focus states, button elements for controls, and
  meaningful slide titles. Decorative SVG should be `aria-hidden` when it does
  not convey independent meaning.
- Preserve URL state when practical, such as `#slide-03`, and make browser
  back/forward navigation sensible. Do not make hash handling brittle.
- Avoid inaccessible color-only encodings, tiny labels, excessive blur, and
  full-screen mouse-only interactions.

## Completion report

Report the generated file path, the concept/storyboard in one sentence, the
main interaction controls, the D3 loading mode, and browser checks performed.
If a check could not run, state that explicitly rather than implying the page
was verified.

For the detailed geometry, scene-model, accessibility, and verification
patterns, read [references/implementation-patterns.md](references/implementation-patterns.md).
