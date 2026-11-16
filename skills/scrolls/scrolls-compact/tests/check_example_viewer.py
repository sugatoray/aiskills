#!/usr/bin/env python3
"""Static checks of assets/example-viewer.html (development only).

The viewer is a single page with one tab for the index (assets/EXAMPLES.md)
and one tab per example file (assets/examples/example_NNN.md). It is built by
scripts/build_example_viewer.py; never edit it by hand.

Run with: bash tests/test_example_viewer.sh
"""
import json
import re
import subprocess
import sys
from pathlib import Path

SKILL = Path(__file__).resolve().parent.parent
ASSETS = SKILL / "assets"
PAGE = ASSETS / "example-viewer.html"
BUILDER = SKILL / "scripts" / "build_example_viewer.py"
MARKED = "https://cdnjs.cloudflare.com/ajax/libs/marked/12.0.2/marked.min.js"

passed = failed = 0


def check(ok, name, detail=""):
    global passed, failed
    if ok:
        passed += 1
        print(f"PASS {name}")
    else:
        failed += 1
        print(f"FAIL {name}" + (f"\n     {detail}" if detail else ""))


def main():
    index = (ASSETS / "EXAMPLES.md").read_text(encoding="utf-8")
    files = sorted((ASSETS / "examples").glob("example_*.md"))
    nums = [f.stem.split("_")[1] for f in files]

    check(BUILDER.is_file(), "the builder exists: scripts/build_example_viewer.py")
    check(PAGE.is_file(), "assets/example-viewer.html exists")
    if not PAGE.is_file() or not BUILDER.is_file():
        return finish()
    html = PAGE.read_text(encoding="utf-8")

    r = subprocess.run([sys.executable, str(BUILDER), "--check"], capture_output=True, text=True)
    check(r.returncode == 0, "the page is up to date (run: python3 scripts/build_example_viewer.py)",
          (r.stdout + r.stderr).strip())

    # Embedded data: every source file, byte for byte.
    m = re.search(r'<script type="application/json" id="viewer-data">(.*?)</script>', html, re.S)
    check(m is not None, "the page embeds its data as JSON in #viewer-data")
    if m:
        data = json.loads(m.group(1))
        check(data.get("index") == index, "the data holds assets/EXAMPLES.md exactly")
        got = [e["num"] for e in data.get("examples", [])]
        check(got == nums, "the data holds every example file, in order", f"{got} != {nums}")
        same = all(e["text"] == f.read_text(encoding="utf-8") and e["path"] == f"examples/{f.name}"
                   for e, f in zip(data.get("examples", []), files))
        check(same, "each example's text and path match its file exactly")
        titles_ok = True
        for e, f in zip(data.get("examples", []), files):
            h1 = f.read_text(encoding="utf-8").splitlines()[0]
            want = re.match(r"# /scrolls-compact — (Example-\d\d): (.+)$", h1)
            if not want or e.get("label") != want.group(1) or e.get("title") != want.group(2):
                titles_ok = False
                print(f"     {f.name}: label/title {e.get('label')!r}/{e.get('title')!r} vs {h1!r}")
        check(titles_ok, "each example's label and title come from its first heading")

    # Tabs: Index, then one per example, in file order.
    tabs = re.findall(r'<a href="#([a-z0-9-]+)" role="tab"[^>]*data-tab="([a-z0-9-]+)"', html)
    want_tabs = ["index"] + [f"example-{n}" for n in nums]
    check([t[1] for t in tabs] == want_tabs, "the tab list is Index, then example-001 … example-NNN",
          f"{[t[1] for t in tabs][:5]}…")
    check(all(a == b for a, b in tabs), "each tab links to its own hash")
    panels = re.findall(r'<section class="tab" id="tab-([a-z0-9-]+)" role="tabpanel"', html)
    check(panels == want_tabs, "there is one panel per tab, in the same order")

    # Controls taken from the review page's "Combined file" tab.
    check('data-view="rendered"' in html and 'data-view="raw"' in html, "a Rendered / Markdown switch")
    check('id="jump"' in html, "a Jump to list")
    check(".doc .pc{" in html and ".doc .pc-label{" in html, "styles for the Note box around Premise and Caveats")
    check('data-step="prev"' in html and 'data-step="next"' in html, "Previous and Next buttons")

    # Page contract.
    t = re.search(r"<title>(.*?)</title>", html)
    check(t is not None and 2 <= len(t.group(1).split()) <= 4, "a <title> of two to four words",
          t.group(1) if t else "none")
    check('name="viewport"' in html, "a viewport meta tag")
    check("[hidden]{display:none!important}" in html, "[hidden] always hides (tabs switch)")
    check(re.search(r"@media \(prefers-color-scheme: ?dark\)\{:root:not\(\[data-theme=\"light\"\]\)", html)
          is not None, "dark colors under prefers-color-scheme, guarded by :root:not([data-theme=light])")
    check(':root[data-theme="dark"]' in html, "dark colors under :root[data-theme=dark] too")
    check(re.search(r"\bbody\{[^}]*background:", html) is not None, "body has an explicit background")
    srcs = re.findall(r'<script[^>]*\bsrc="([^"]+)"', html)
    check(srcs == [MARKED], "the only external script is marked 12.0.2 from cdnjs, as in the docsite", str(srcs))
    check_theme(html)
    return finish()


THEMES = SKILL.parents[2] / "src" / "packages" / "aiskills" / "src" / "scripts" / "docs" / "themes.mjs"


def check_theme(html):
    """The page uses the banner's theme, Lights Out, exactly as themes.mjs defines it."""
    if not THEMES.is_file() or subprocess.run(["node", "--version"], capture_output=True).returncode:
        print("SKIP theme checks (needs this repository's themes.mjs and node)")
        return
    js = ("import(process.argv[1]).then(m => { const t = m.THEMES.find(x => x.id === 'lightsout');"
          " const k = (c, f) => `--bg:${c.bg};--surface:${c.surface};--surface-2:${c.surface2};--fg:${c.fg};"
          "--muted:${c.muted};--line:${c.line};--accent:${c.accent};--accent-soft:${c.accentSoft};"
          "--accent-fg:${c.accentFg};--code-bg:${c.codeBg};--code-fg:${c.codeFg};"
          "--font-display:${f.display};--font-body:${f.body};--font-mono:${f.mono};`;"
          " console.log(JSON.stringify({banner: m.DEFAULT_THEME, light: k(t.light, t.fonts),"
          " dark: k(t.dark, t.fonts), fonts: m.fontsHref(t)})); })")
    r = subprocess.run(["node", "--input-type=module", "-e", js, THEMES.as_uri()], capture_output=True, text=True)
    want = json.loads(r.stdout)
    banner = (SKILL.parents[2] / "src/packages/aiskills/docs/banner/config.yaml").read_text(encoding="utf-8")
    check('theme: "lightsout"' in banner, "the banner uses Lights Out (docs/banner/config.yaml)")
    m = re.search(r":root\{([^}]*)\}", html)
    check(m is not None and m.group(1) == want["light"], "light colors and fonts are Lights Out's, from themes.mjs",
          m.group(1)[:120] if m else "no :root block")
    dark = re.findall(r'(?::root:not\(\[data-theme="light"\]\)|:root\[data-theme="dark"\])\{([^}]*)\}', html)
    check(len(dark) == 2 and all(d == want["dark"] + "color-scheme:dark;" for d in dark),
          "dark colors and fonts are Lights Out's, in both dark blocks", str([d[:80] for d in dark]))
    check(f'<link rel="stylesheet" href="{html_escape(want["fonts"])}">' in html, "it loads Lights Out's fonts (Geist)")
    check("--surface-2" in html and "var(--panel)" not in html and "--f-body" not in html,
          "it uses the docsite's variable names, not the old ones")
    check(re.search(r'nav\.tabs a\[aria-selected="true"\]::after\{[^}]*background:var\(--accent\)', html) is not None,
          "the open tab has Lights Out's accent bar")
    check("backdrop-filter" in html, "the header is frosted, as in Lights Out")


def html_escape(s):
    return s.replace("&", "&amp;")


def finish():
    print(f"\n{passed} passed, {failed} failed")
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
