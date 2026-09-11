# Create Slides 3D

`create-slides-3d` turns a concept into a single-page, keynote-like HTML
experience with D3.js-rendered 2.5D/3D-style SVG scenes, responsive layout,
keyboard navigation, and browser-verifiable interactions.

Install from this repository with:

```sh
npx skills add sugatoray/aiskills --skill create-slides-3d
```

Then invoke the skill with a concept, for example:

```text
$create-slides-3d Explain how an AI agent turns a goal into observable actions.
Create a single self-contained HTML page with a cinematic isometric visual story.
```

The output is intentionally a browser-native HTML page, not a `.pptx` file.

## Inspiration and attribution

This skill is based on the idea that the keynote page itself can be both the
slide experience and the rendering engine. The reference implementation is
Alejandro Saucedo’s [Ethical Institute keynote](https://ethical.institute/keynote/#D3),
which he originally shared in this [LinkedIn post](https://www.linkedin.com/posts/axsaucedo_gpt-6-astra-is-insane-so-instead-of-slides-ugcPost-7504056183541129216-R7Di).
This repository creates an original, reusable D3.js component architecture;
it does not copy the keynote’s source code, content, branding, or artwork.

## CI

The browser suite runs automatically for relevant pull requests and pushes to
`master`. To request a run from a pull request, add the exact label
`run-ci`. To start it from GitHub, open **Actions → create-slides-3d → Run
workflow** and select the branch.
