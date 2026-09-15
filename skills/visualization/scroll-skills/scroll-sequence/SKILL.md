---
name: scroll-sequence
description: "Create a scroll-controlled visual sequence where discrete frames or states advance and reverse with scrolling. Use for cinematic product reveals, process animations, rendered frame sequences, storyboard-like transitions, and Apple-style pinned scroll experiences. Trigger when the user invokes /scroll-sequence directly or composes it with /visualize."
license: MIT
compatibility: "Modern web browsers with HTML5, CSS sticky positioning, and JavaScript; optional Canvas, SVG/DOM animation, or GSAP ScrollTrigger when appropriate."
metadata:
  - name: scroll-sequence
    type: skill
    author: sugatoray
    version: "1.0.0"
    source_url: "https://github.com/sugatoray/aiskills/tree/master/skills/visualization/scroll-skills/scroll-sequence"
---

# /scroll-sequence

Use this as a visualization modifier, especially after `/visualize`.

## Syntax

```text
/visualize [[ subject or source ]] | /scroll-sequence
```

Standalone use is also valid:

```text
/scroll-sequence [[ subject or source ]]
```

## Intent

Turn a subject, animation concept, source video, or existing frame set into a deterministic scroll-linked sequence.

The interaction model is:

```text
scroll progress → sequence progress → current state/frame
```

Scrolling down advances the sequence. Scrolling up reverses it.

## Input modes

Accept any of these:

1. **Concept**
   - Example: `MacBook opening and revealing internal components`
   - Generate or define the required visual states, then build the scroll experience.

2. **Video**
   - Extract a web-appropriate frame sequence first.

3. **Image sequence**
   - Use the supplied frames directly.

4. **DOM/SVG scene**
   - Animate discrete visual states rather than raster frames when that is more appropriate.

## Default behavior

- Pin/stick the visual while the sequence plays.
- Map the active scroll interval linearly to `[0,1]`.
- Use exact scroll-linked playback by default; no autonomous playback.
- Reverse naturally on upward scrolling.
- Keep textual narrative as HTML overlays.
- Use `contain` for instructional/process visuals and `cover` for cinematic hero sections unless context suggests otherwise.

## Frame-sequence implementation

For `N` frames:

```js
const index = Math.round(progress * (N - 1));
```

Preferred pipeline:

```text
source
  ↓
frames/states
  ↓
preload or progressive-load
  ↓
canvas / DOM / SVG renderer
  ↑
normalized scroll progress
```

## State-sequence implementation

For DOM/SVG scenes, define key states such as:

```text
0.00 → closed
0.25 → opening
0.50 → partially revealed
0.75 → expanded
1.00 → final state
```

Interpolate only where meaningful. If the user asks for discrete stepping, snap to states.

## Output contract

When asked to build:
- produce a working artifact;
- include all source files needed to run it;
- include a short README;
- provide a reduced-motion fallback;
- verify first, middle, and last sequence states.

## Verification

- first state visible at progress 0
- final state visible at progress 1
- reverse scroll works
- pinned interval is correct
- resize/orientation change works
- no blank sequence states
- no console errors
- acceptable loading behavior

## Composition

This is the general-purpose primitive.

Use `/scroll-explode` when the semantic motion is specifically assembly/disassembly or exploded-view motion.

Use `/scroll-scrub` when the user specifically wants scroll to scrub through supplied time-based media.
