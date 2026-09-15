# Getting PNG/SVG/PDF/HTML source material into figures

## PNG and PDF — use directly

`\includegraphics[width=\linewidth]{figures/name}` works unchanged for
both; `pdflatex` handles either format natively. Prefer the source's own
format rather than round-tripping — don't rasterize a PDF figure to PNG
or vice versa, that only loses quality. For a raster (PNG/JPEG) figure,
check it's at least ~300 DPI at its intended print width before
including it; a screenshot saved at screen resolution will look visibly
soft in a printed/zoomed PDF.

## SVG — must be converted first

`pdflatex` cannot `\includegraphics` an `.svg` directly (only `lualatex`/
`xelatex` with the `svg` package and a working `inkscape` on PATH can,
and this template targets plain `pdflatex`). Convert every SVG to PDF
before referencing it:

```sh
scripts/convert_svg.sh figures/plot.svg figures/plot.pdf
```

The script tries `rsvg-convert`, then `inkscape`, then `cairosvg`, in
that order (whichever is actually installed), and only falls back to a
rasterized PNG — with an explicit warning — if none of the three vector
converters are available. A vector SVG source (a plot, a diagram) is
exactly the case where a raster fallback is most visible as a quality
regression, so treat that warning as worth telling the user about, not
silently swallowing.

## HTML artifacts — two different cases

**Case 1: the HTML is essentially a data table** (a rendered dataframe,
a results table export, a simple `<table>` with no charting). Extract
the table's data directly and emit a LaTeX table per
`markdown-to-latex.md`'s table conversion — this is lossless and doesn't
need a screenshot at all. Parse the `<table>`/`<tr>`/`<td>` structure
(or re-derive it from whatever generated the HTML, if that's easier)
rather than screenshotting rendered text.

**Case 2: the HTML is a rendered chart, plot, or dashboard** with no
simple tabular equivalent (a D3/Plotly/Chart.js visualization, a styled
report snippet). There's no way to keep this as anything but a raster
image in a static PDF — take a screenshot:

```sh
python3 scripts/render_html.py report.html figures/report.png \
  --width 1600 --height 1000 --scale 3 --selector "#chart"
```

- `--scale 3` (or higher) renders at 3x device pixel ratio so the PNG
  holds up at print resolution — the default `--scale 1` looks
  noticeably soft once placed in a two-column-width figure.
- `--selector` crops to one element's bounding box instead of the full
  viewport/page — use it whenever the HTML has any surrounding page
  chrome (nav bars, padding, a title the paper's own caption already
  states) that shouldn't appear inside the figure.
- Tell the user explicitly that interactivity (hover tooltips, pan/zoom)
  is lost in the print artifact — that's an inherent, not a bug-fixable,
  consequence of putting an HTML/JS visualization into a PDF.

This script needs Playwright's Chromium. In this environment it's
already installed at the path `PLAYWRIGHT_BROWSERS_PATH` points to —
don't run `playwright install`. In a different environment, install it
first (`pip install playwright && playwright install chromium`).

## Placement and naming

- Keep each figure's original basename where practical (traceability
  back to the source asset the user handed over) but sanitize it to be
  LaTeX-safe: no spaces, no characters besides letters/digits/hyphens/
  underscores, exactly one `.` (before the extension).
- One `\label{fig:<slug>}` / `\label{tab:<slug>}` per figure/table,
  placed immediately after `\caption{...}` — a label placed before the
  caption or attached to the wrong float silently resolves to the wrong
  number when referenced.
- Verify every file `\includegraphics` points at actually exists on
  disk *before* running the build — a missing figure produces a
  confusing "File `X.pdf' not found" deep in the LaTeX log rather than a
  clear upfront error; `scripts/build.sh` doesn't currently pre-check
  this, so do it as part of assembling `main.tex`, not after a failed
  build.
