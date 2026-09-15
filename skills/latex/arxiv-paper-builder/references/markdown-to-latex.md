# Converting markdown prose to LaTeX

## Prefer pandoc for the bulk conversion, when it's on PATH

`pandoc -f markdown+tex_math_dollars-auto_identifiers -t latex input.md -o body.tex`
handles the mechanical syntax (emphasis, lists, tables, code blocks, most
math) far more robustly than hand-rolled regex, and correctly escapes
literal LaTeX-special characters that appear in prose. Treat its output
as a first pass, then hand-fix the parts that need this template's own
conventions:

- Pandoc emits its own `\section{}`/`\subsection{}` nesting from
  markdown headings — keep it, just verify the levels landed where
  `section-mapping.md` says they should (pandoc doesn't know a paper's
  canonical section order, only the source doc's heading depth).
- Pandoc's figure output (`\includegraphics` wrapped in its own
  `figure`/`\caption` scaffolding) references the *original* image path
  (including `.svg`) — repoint it at the converted `.pdf`/`.png` under
  `figures/` per `figure-handling.md` before compiling.
- Pandoc turns `[text](url)` into `\href{url}{text}` assuming `hyperref`
  is loaded (it is, in `main.tex`) — no fix needed there.
- Pandoc's citation handling only kicks in for pandoc-style `[@key]`
  syntax with `--citeproc`; without that flag (the invocation above
  omits it deliberately, since this template uses `natbib`/`\citep` not
  a CSL), `[@key]` passes through as literal bracketed text — convert it
  by hand per the citations section below.

If pandoc isn't available, apply the manual rules below directly.

## Manual conversion rules

| Markdown | LaTeX |
| --- | --- |
| `# Heading` | `\section{Heading}` (or `\subsection`/`\subsubsection` per nesting depth and where it lands in the canonical order — see `section-mapping.md`) |
| `**bold**` | `\textbf{bold}` |
| `*italic*` / `_italic_` | `\textit{italic}` |
| `` `code` `` | `\texttt{code}` |
| fenced code block | `\begin{verbatim}...\end{verbatim}`, or `\begin{lstlisting}` if `listings` is loaded and syntax highlighting matters |
| `$inline math$` | passes through unchanged — markdown math delimiters already match LaTeX's |
| `$$display math$$` | `\[...\]` or `\begin{equation}...\end{equation}` if it needs a number/label |
| pipe table | `\begin{table}...\begin{tabular}{...}` using `\toprule`/`\midrule`/`\bottomrule` (`booktabs`, already loaded) — see the worked example below |
| `![alt](path)` | `\begin{figure}\centering\includegraphics{...}\caption{alt}\label{fig:slug}\end{figure}` — see `figure-handling.md` for the path/format handling before this step |
| `[text](url)` | `\href{url}{text}` |
| footnote reference | `\footnote{...}` |
| `> blockquote` | `\begin{quote}...\end{quote}` |
| `---` horizontal rule | omit, or `\bigskip` if it's marking an intentional visual break within a section |

### Table example

Markdown:

```
| Model | Accuracy | Params |
| --- | --- | --- |
| Baseline | 71.2 | 12M |
| Ours | 78.9 | 14M |
```

LaTeX:

```latex
\begin{table}
  \centering
  \caption{Comparison against baseline.}
  \label{tab:comparison}
  \begin{tabular}{lrr}
    \toprule
    Model & Accuracy & Params \\
    \midrule
    Baseline & 71.2 & 12M \\
    Ours     & 78.9 & 14M \\
    \bottomrule
  \end{tabular}
\end{table}
```

## Escaping literal special characters

Prose copied verbatim from markdown can contain characters that mean
something else in LaTeX. Escape these when they appear as literal text
(never inside math mode, and never inside a `verbatim`/`lstlisting`
block, which don't need escaping):

| Character | Escape as |
| --- | --- |
| `%` | `\%` |
| `_` (outside math/code) | `\_` |
| `&` (outside a table row) | `\&` |
| `#` | `\#` |
| `$` (a literal dollar sign, not math delimiter) | `\$` |
| `{` `}` (literal braces, not grouping) | `\{` `\}` |
| `~` | `\textasciitilde{}` |
| `^` | `\textasciicircum{}` |
| `\` (a literal backslash) | `\textbackslash{}` |

This is the single most common cause of a build that fails with
"Undefined control sequence" or "Missing $ inserted" after a bulk
markdown-to-LaTeX pass — an unescaped `_` or `%` in prose (a variable
name, a percentage, a filename) that LaTeX reads as a subscript operator
or comment marker. Grep the converted `.tex` for bare occurrences of
these characters outside math/code before the first build.

## Citations

Markdown source material carries citations in one of a few shapes;
normalize whichever is present into `.bib` entries plus `\citep`/`\citet`
calls:

- **Pandoc-style `[@key]` or `[@key1; @key2]`** — map directly to
  `\citep{key}` / `\citep{key1,key2}`; `[-@key]` (suppress author) maps
  to a bare `\citeyear{key}` if that distinction matters, otherwise
  `\citep` is fine.
- **Inline textual `(Author, Year)`** — turn into `\citep{authorYear}`
  and add a matching `.bib` entry; construct the key as
  `firstauthorlastname` + year (lowercase, no spaces), matching the
  convention in `assets/template/references.bib`'s example entry.
- **An existing `.bib` file already provided alongside the markdown** —
  use it as-is (merge into `references.bib`, don't regenerate entries
  that already exist); this is the fully-lossless case.
- **A manually-written "References" list at the end of a markdown
  file** — each entry becomes one `.bib` entry; extract title/authors/
  year/venue as given, don't fabricate missing fields (leave them out of
  the `.bib` entry rather than guessing a journal name or page range
  that wasn't stated).

After conversion, every `\citep`/`\citet` key must resolve to a
`references.bib` entry — `scripts/build.sh`'s log check flags
`Citation ... undefined` if one doesn't.
