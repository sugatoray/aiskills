#!/usr/bin/env bash
# Compile the assembled paper to PDF, resolving citations and
# cross-references across as many passes as needed.
#
# Usage: build.sh <main.tex> [output-dir]
set -euo pipefail

if [ "$#" -lt 1 ]; then
  echo "Usage: $0 <main.tex> [output-dir]" >&2
  exit 1
fi

main_tex="$1"
outdir="${2:-$(dirname "$main_tex")}"
mkdir -p "$outdir"

if command -v latexmk >/dev/null 2>&1; then
  latexmk -pdf -interaction=nonstopmode -halt-on-error -outdir="$outdir" "$main_tex"
else
  echo "latexmk not found; falling back to a manual pdflatex/bibtex sequence" >&2
  tex_dir="$(dirname "$main_tex")"
  base="$(basename "$main_tex" .tex)"
  pdflatex -interaction=nonstopmode -halt-on-error -output-directory="$outdir" "$main_tex"
  if [ -f "$outdir/$base.aux" ] && grep -q '\\citation' "$outdir/$base.aux"; then
    # BIBINPUTS lets bibtex find references.bib next to main.tex even
    # when outdir is a separate build directory.
    BIBINPUTS="$tex_dir:" bibtex "$outdir/$base"
  fi
  pdflatex -interaction=nonstopmode -halt-on-error -output-directory="$outdir" "$main_tex"
  pdflatex -interaction=nonstopmode -halt-on-error -output-directory="$outdir" "$main_tex"
fi

log_file="$outdir/$(basename "$main_tex" .tex).log"
if [ -f "$log_file" ]; then
  echo "--- checking $log_file for problems ---"
  grep -nE '^! |Undefined control sequence|Citation .* undefined|Reference .* undefined|Overfull \\hbox' "$log_file" || echo "no fatal errors or undefined refs/citations found"
fi
