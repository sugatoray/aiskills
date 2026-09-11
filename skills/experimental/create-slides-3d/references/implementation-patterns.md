# Implementation patterns

This reference supports `$create-slides-3d` when the concept needs more than a
simple flat SVG. Keep the generated page’s code understandable and favor
small, composable functions.

## Coordinate system

Use a logical stage such as `1200 × 675` and render with an SVG `viewBox`. A
typical isometric projection is:

```js
function project([x, y, z], ox = 600, oy = 350, sx = 1, sy = 0.55, sz = 0.8) {
  return [ox + (x - y) * sx, oy + (x + y) * sy - z * sz];
}
```

Treat this as a starting point, not a universal camera. Keep projection and
screen-space label placement separate. Geometry may rotate or shear; labels
should remain ordinary readable text unless a deliberate, tested orientation
is part of the design.

## Projected box primitive

Represent a box with an origin, width, depth, height, and style. Project its
eight corners, draw the three visible faces as polygons, and order faces by
depth. Use a darker side, lighter top, and a soft offset shadow to establish
volume. Put labels in a separate overlay layer after geometry so they cannot be
accidentally mirrored or occluded.

## Scene data and transitions

Keep content out of drawing code:

```js
const slides = [
  {
    id: "origin",
    title: "A concept needs a shape",
    accent: "#7dd3fc",
    objects: [{ kind: "stack", x: 0, y: 0, z: 0, value: 0.7 }]
  }
];
```

Use stable keys in D3 joins (`.data(items, d => d.id)`). For slide changes,
update existing objects first, enter new objects second, and remove old ones
after their exit transition. Interrupt stale transitions before starting a new
one so rapid keyboard presses cannot leave competing animations behind.

## Navigation baseline

Use a single `state.index` and a `goTo(index, {pushState})` function. Clamp the
index, update the URL hash, update the active rail item, and render the scene in
one place. For direct file opening, parse the hash defensively and fall back to
the first slide. Keep controls as real `<button>` elements.

Recommended shortcuts:

| Key | Action |
| --- | --- |
| ArrowLeft / PageUp | Previous slide |
| ArrowRight / PageDown / Space / Enter | Next slide |
| Home / End | First / last slide |
| Escape | Close index/help overlay |
| `m` or `?` | Open help, if included |

## Responsive rules

- Keep the stage’s aspect ratio and center it with CSS; do not stretch x and y
  independently.
- Set a minimum readable font size and wrap or shorten headlines at narrow
  widths.
- Reduce particle counts and transition duration under
  `prefers-reduced-motion: reduce`.
- Make the navigation rail scrollable or collapse it into an index on small
  screens rather than letting it cover the focal object.

## Browser verification

At minimum, verify these invariants in a real browser:

1. The file loads from `file://` or the requested local URL.
2. D3 is available and the first scene contains visible SVG geometry and text.
3. Next, previous, Home, End, and hash navigation select the expected scenes.
4. Rapid next/previous actions do not duplicate stages or throw console errors.
5. Text is not mirrored, clipped, or hidden behind geometry at desktop and
   narrow viewport sizes.
6. Reduced-motion mode does not leave the page blank or unusable.

When using Playwright, capture at least the first scene and one dense scene at
`1440 × 900` and `390 × 844`; inspect screenshots as well as assertions.
