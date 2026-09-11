# D3 slide engine primitives

This is a reusable starter library for `$create-slides-3d`. It separates the
parts of a keynote-like rendering engine that are worth testing from the
browser-specific D3/SVG adapter.

```text
d3-slide-engine/
├── package.json
├── src/
│   ├── engine.js       # D3/SVG lifecycle and slide rendering
│   ├── geometry.js     # reusable projected shapes
│   ├── navigation.js   # pure slide/hash/keyboard state
│   └── projection.js   # camera and 2.5D projection math
└── tests/
    ├── geometry.test.js
    ├── navigation.test.js
    └── projection.test.js
```

## Design

- `projection.js` and `geometry.js` are deterministic and DOM-free, making
  them straightforward Red/Green TDD units.
- `navigation.js` owns clamping, URL hash parsing/formatting, and keyboard
  intent. It does not mutate the DOM.
- `engine.js` is the deliberately thin D3 adapter. It owns one SVG stage,
  stable keyed joins, transitions, resize handling, and accessibility labels.
- A slide is data, not a hard-coded branch. The engine accepts an array of
  `{ id, title, caption, accent, objects }` records.

## Use in a single HTML page

Copy `src/` into the generated page or inline the modules, then load D3 from a
pinned CDN. The engine’s API is intentionally small:

```js
const engine = createSlideEngine({ root, slides, d3 });
engine.mount();
engine.goTo("origin");
```

The generated page remains responsible for its own typography, art direction,
content, and optional controls. Keep labels in a separate SVG/HTML layer so
projected geometry cannot mirror or occlude them.

## Tests

From this directory, run:

```sh
npm install
npm test
```

The tests cover projection invariants, cube geometry, depth ordering, hash
state, bounds clamping, and keyboard intent. Add browser-level tests with
Playwright when changing `engine.js` or the generated page contract. The
included browser smoke suite checks real SVG output, readable labels,
navigation, URL hash state, desktop/mobile layout, screenshots, and reduced
motion in Chromium.
