#!/usr/bin/env python3
"""Render an HTML artifact to a static, print-resolution PNG.

pdflatex cannot embed live HTML/JS, so an interactive chart or dashboard
has to become a screenshot before it can go in as a \\includegraphics
figure. Use this only after references/figure-handling.md's "extract the
data into a LaTeX table instead" path doesn't apply (i.e. the HTML is a
genuine rendered chart/visualization, not just a data table in a <table>
tag).

Usage:
    python3 render_html.py <input.html> <output.png> \
        [--width 1600] [--height 1000] [--scale 3] [--selector "#chart"]

--selector, if given, screenshots just that element's bounding box
instead of the full viewport, so the figure isn't padded with page
chrome that doesn't belong in a paper.
"""
import argparse
import pathlib
import sys


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("input_html")
    parser.add_argument("output_png")
    parser.add_argument("--width", type=int, default=1600)
    parser.add_argument("--height", type=int, default=1000)
    parser.add_argument("--scale", type=float, default=3.0,
                         help="device scale factor; higher = crisper for print")
    parser.add_argument("--selector", default=None,
                         help="CSS selector to crop to, instead of the full page")
    args = parser.parse_args()

    input_path = pathlib.Path(args.input_html).resolve()
    if not input_path.exists():
        print(f"error: input file not found: {input_path}", file=sys.stderr)
        return 1

    try:
        from playwright.sync_api import sync_playwright
    except ImportError:
        print(
            "error: playwright is not installed. Install with "
            "`pip install playwright && playwright install chromium`, "
            "or use this environment's pre-installed browser (see "
            "PLAYWRIGHT_BROWSERS_PATH) if already configured.",
            file=sys.stderr,
        )
        return 1

    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page(
            viewport={"width": args.width, "height": args.height},
            device_scale_factor=args.scale,
        )
        page.goto(input_path.as_uri())
        page.wait_for_load_state("networkidle")

        if args.selector:
            locator = page.locator(args.selector)
            locator.wait_for(state="visible")
            locator.screenshot(path=args.output_png)
        else:
            page.screenshot(path=args.output_png, full_page=True)

        browser.close()

    print(f"wrote {args.output_png}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
