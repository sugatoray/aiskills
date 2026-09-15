---
name: scroll-explode
description: Create a scroll-driven exploded-view or assembly/disassembly visualization. Use when an object should separate into parts while scrolling down and recombine while scrolling up, including electronics, watches, machines, furniture, shoes, cameras, vehicles, and product internals.
---

# /scroll-explode

A specialized `/scroll-sequence` modifier for exploded views.

## Syntax

```text
/visualize [[ object ]] | /scroll-explode
```

Examples:

```text
/visualize [[ MacBook exploding into components ]] | /scroll-explode
/visualize [[ how a mechanical watch is assembled ]] | /scroll-explode
```

## Semantic contract

Default scroll direction:

```text
scroll down:
assembled → loosened → separated → fully exploded

scroll up:
fully exploded → separated → loosened → assembled
```

If the wording is about **assembly**, invert the narrative emphasis while preserving reversible scrolling:

```text
top: exploded parts
bottom: fully assembled object
```

## Scene planning

Before rendering, infer or define:

- primary shell/body
- major subassemblies
- smaller visible components
- separation axes
- layering/depth order
- labels, if instructional
- final exploded spacing
- whether parts rotate while separating

Prefer physically legible trajectories. Components should not cross through each other unless the source animation intentionally does so.

## Visual modes

### A. Pre-rendered frame sequence
Best for photoreal product visuals and 3D-rendered explosions.

### B. SVG/DOM layered parts
Best for diagrams, schematics, educational assembly views, and editable artifacts.

### C. WebGL/3D
Use only when true interactive 3D is required and the environment supports it. Do not introduce 3D complexity just to imitate a pre-rendered sequence.

## Scroll mapping

Use a linear default mapping:

```text
0.00 assembled
0.15 shell begins separating
0.35 major modules separate
0.60 secondary parts separate
0.85 labels/spacing settle
1.00 fully exploded
```

Adapt these breakpoints to the object.

## Labeling rules

When explaining construction or assembly:
- label meaningful components;
- avoid labels baked into raster frames when editable HTML/SVG labels can be overlaid;
- keep labels attached visually to their corresponding part;
- prevent label collisions on narrow layouts.

## Product storytelling mode

For marketing/product hero usage:
- prioritize cinematic spacing and silhouette;
- keep labels minimal;
- allow copy/CTA overlays;
- use `cover` fit unless important components would be cropped.

## Instructional mode

For "how it is assembled":
- prioritize component clarity and ordering;
- use `contain`;
- optionally expose step numbers or part names;
- avoid decorative motion that obscures the assembly logic.

## Output contract

Deliver a reversible scroll-linked exploded-view artifact with:
- complete assembled and exploded endpoints,
- correct layering,
- responsive layout,
- reduced-motion fallback,
- semantic overlays,
- verification at multiple scroll positions.

## Anti-patterns

Avoid:
- random radial scattering with no mechanical logic;
- pieces clipping through each other;
- labels embedded irreversibly in generated frames when HTML labels are practical;
- autonomous animation that ignores scroll;
- a final state where the product structure is no longer understandable.
