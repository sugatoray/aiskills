# LaTeX

Skills for producing a LaTeX-formatted research paper from raw writeup
material — currently: assembling markdown documents, figures
(PNG/SVG/PDF), and HTML artifacts into a complete project in the
single-column arXiv/NeurIPS-derived preprint style Meta FAIR's public
papers commonly resemble, and compiling it to PDF.

**Installation**:

Choose the skill by name: `arxiv-paper-builder` and install
interactively.

```sh
npx skills add sugatoray/aiskills               # project-level
npx skills add sugatoray/aiskills --global      # user-level (RECOMMENDED)
```

<details>
<summary><strong>Alternate: Claude Code plugin</strong></summary>

Installs the whole family as a managed, read-only bundle from this
repo's marketplace. Installing both this and `npx skills` leaves you
with every skill twice — pick one.

```
/plugin marketplace add sugatoray/aiskills
/plugin install latex-skills@sugatoray
```

</details>

> 💡 For more information, refer to the
> [**arxiv-paper-builder README.md**](arxiv-paper-builder/README.md).

## What's here

- [`arxiv-paper-builder/`](arxiv-paper-builder/) — markdown + figures +
  HTML artifacts → a compiled LaTeX paper PDF.
- [`meta/MAINTAINERS.md`](meta/MAINTAINERS.md) — family-level
  maintainer notes (the shared Claude Code plugin manifest and its
  keep-in-sync rules). Not read at invocation time.
