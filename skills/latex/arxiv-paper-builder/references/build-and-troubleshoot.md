# Building the PDF and reading the log

## Preferred build

```sh
scripts/build.sh path/to/main.tex path/to/outdir
```

This runs `latexmk -pdf -interaction=nonstopmode -halt-on-error`, which
automatically re-runs `pdflatex`/`bibtex` as many times as needed to
resolve citations and cross-references (usually 2-3 passes) — don't
manually re-invoke `pdflatex` in a loop when `latexmk` is available, it
already does the correct fixed-point iteration and stops when nothing
changes.

If `latexmk` isn't installed, the script falls back to a manual
`pdflatex → bibtex → pdflatex → pdflatex` sequence — the double final
`pdflatex` pass is required, not redundant: the first resolves citations
inserted by `bibtex`, the second resolves any cross-reference numbers
that shifted as a result.

## Reading the log for problems

The build script already greps the `.log` for the patterns below and
prints matches; treat "no fatal errors or undefined refs/citations
found" as the bar for done, not merely "a PDF file appeared" — a build
can produce a PDF while silently leaving `??` where a figure/table
number belongs.

| Log pattern | Likely cause | Fix |
| --- | --- | --- |
| `! Undefined control sequence` | An unescaped LaTeX-special character leaked from markdown prose (`_`, `%`, `&`, `#`, `$`, `~`, `^`), or a command from a package that isn't loaded | Check `markdown-to-latex.md`'s escaping table; confirm the relevant `\usepackage` is present |
| `! LaTeX Error: File 'X.pdf' not found` | A figure path is wrong, or an SVG hasn't been converted yet | Re-check `figure-handling.md`'s conversion step; verify the file exists on disk at that exact path before rebuilding |
| `Citation 'X' undefined` | Missing `.bib` entry, or `bibtex`/`latexmk` didn't get to re-run after adding one | Add the entry to `references.bib`; rerun the build (not just `pdflatex` alone) |
| `Reference 'X' undefined` | A `\label` is missing, misspelled, or the referencing `\ref`/`\Cref` ran before the label's pass completed | Grep for the exact label string in both the `\label{}` and `\ref{}`/`\Cref{}` calls; if they match, just rebuild — it's often a stale first pass |
| `Overfull \hbox` warnings | A long unbreakable string (a URL, a wide inline code snippet, a wide table) exceeds the line width | Not usually fatal — worth fixing only if it visibly overflows the margin in the rendered PDF; wrap code with `\seqsplit` or a `breaklines`-enabled `lstlisting`, shrink wide tables with `\small` or `resizebox` |
| `Package inputenc Error` | A stray Unicode character (smart quotes, an em-dash from markdown, a non-ASCII symbol) that the input encoding doesn't expect | `main.tex` already loads `[utf8]{inputenc}`, which covers the common case; if it still errors, the specific glyph likely needs a LaTeX macro equivalent (e.g. `\textemdash`) instead of the raw character |

## Before calling it done

- Confirm the PDF actually opens and has the expected number of pages —
  a `\halt-on-error` build that "succeeds" with zero new pages since the
  template skeleton usually means the section content didn't actually
  get inserted into `main.tex`.
- Skim for any literal `??` in the rendered output (grep is unreliable
  here since it's inside compiled PDF text, not the source) — check the
  log's undefined-reference lines instead, which is exactly what
  produces a `??` in the final PDF.
- Confirm every figure that was supposed to appear actually shows
  content, not a broken/empty image box — a corrupted or zero-byte
  conversion (e.g. `convert_svg.sh` fell through to its raster fallback
  and the rasterizer failed silently) can still let `\includegraphics`
  succeed on an unreadable file in some LaTeX distributions.
