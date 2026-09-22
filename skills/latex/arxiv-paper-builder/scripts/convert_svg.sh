#!/usr/bin/env bash
# Convert an SVG figure to PDF (pdflatex cannot \includegraphics an .svg
# directly). Tries, in order, whichever converter is actually on PATH:
# rsvg-convert, inkscape, cairosvg. Falls back to a high-DPI PNG only if
# none of those are available, and says so loudly since a raster fallback
# degrades print quality for line art.
#
# Usage: convert_svg.sh <input.svg> <output.pdf>
set -euo pipefail

if [ "$#" -ne 2 ]; then
  echo "Usage: $0 <input.svg> <output.pdf>" >&2
  exit 1
fi

in="$1"
out="$2"

if [ ! -f "$in" ]; then
  echo "error: input file not found: $in" >&2
  exit 1
fi

if command -v rsvg-convert >/dev/null 2>&1; then
  rsvg-convert -f pdf -o "$out" "$in"
  echo "converted via rsvg-convert: $out"
  exit 0
fi

if command -v inkscape >/dev/null 2>&1; then
  inkscape --export-type=pdf --export-filename="$out" "$in"
  echo "converted via inkscape: $out"
  exit 0
fi

if command -v cairosvg >/dev/null 2>&1; then
  cairosvg "$in" -o "$out"
  echo "converted via cairosvg: $out"
  exit 0
fi

# Raster fallback: only reached if no vector converter exists.
png="${out%.pdf}.png"
if command -v rsvg-convert >/dev/null 2>&1; then
  rsvg-convert -w 2400 -f png -o "$png" "$in"
elif python3 -c "import cairosvg" >/dev/null 2>&1; then
  python3 -c "import cairosvg; cairosvg.svg2png(url='$in', write_to='$png', output_width=2400)"
else
  echo "error: no SVG converter found (need rsvg-convert, inkscape, or cairosvg)" >&2
  exit 1
fi
echo "warning: no vector SVG->PDF converter found; rasterized instead: $png" >&2
echo "$png"
