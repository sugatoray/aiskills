#!/usr/bin/env python3
"""Build assets/example-viewer.html from assets/EXAMPLES.md and assets/examples/.

Maintenance only: the skill does not run this. The page is one HTML file with
an Index tab (EXAMPLES.md) and one tab per example file, each shown rendered
or as Markdown. Links between the files open the matching tab.

Usage:
  python3 scripts/build_example_viewer.py           # write the page
  python3 scripts/build_example_viewer.py --check   # exit 1 if the page is stale

Checked by tests/test_example_viewer.sh. Never edit the page by hand.
"""
import html
import json
import re
import sys
from pathlib import Path

SKILL = Path(__file__).resolve().parent.parent
ASSETS = SKILL / "assets"
OUT = ASSETS / "example-viewer.html"
SOURCE_URL = "https://github.com/sugatoray/aiskills/blob/master/skills/scrolls/scrolls-compact/"
MARKED = "https://cdnjs.cloudflare.com/ajax/libs/marked/12.0.2/marked.min.js"
H1 = re.compile(r"# /scrolls-compact — (Example-\d\d): (.+)$")

# The banner's and the docsite's theme, Lights Out, copied from
# src/packages/aiskills/src/scripts/docs/themes.mjs. tests/check_example_viewer.py
# fails if the two differ, so change them together.
LIGHTS_OUT = {
    "fonts": {"display": '"Geist", system-ui, sans-serif', "body": '"Geist", system-ui, sans-serif',
              "mono": '"Geist Mono", ui-monospace, monospace'},
    "googleFonts": "family=Geist:wght@400;500;600;700&family=Geist+Mono:wght@400;500;600",
    "light": {"bg": "#ffffff", "surface": "#fafafa", "surface2": "#f4f4f5", "fg": "#09090b", "muted": "#66666e",
              "line": "#e4e4e7", "accent": "#0f6cbd", "accentSoft": "#e8f2fc", "accentFg": "#ffffff",
              "codeBg": "#fafafa", "codeFg": "#09090b"},
    "dark": {"bg": "#000000", "surface": "#0a0a0b", "surface2": "#16181c", "fg": "#e7e9ea", "muted": "#8b9096",
             "line": "#2f3336", "accent": "#1d9bf0", "accentSoft": "#071d2c", "accentFg": "#031321",
             "codeBg": "#0a0a0b", "codeFg": "#e7e9ea"},
}


def tokens(c, f):
    """The CSS variables, named and ordered as themes.mjs names them for the docsite."""
    return (f"--bg:{c['bg']};--surface:{c['surface']};--surface-2:{c['surface2']};--fg:{c['fg']};"
            f"--muted:{c['muted']};--line:{c['line']};--accent:{c['accent']};--accent-soft:{c['accentSoft']};"
            f"--accent-fg:{c['accentFg']};--code-bg:{c['codeBg']};--code-fg:{c['codeFg']};"
            f"--font-display:{f['display']};--font-body:{f['body']};--font-mono:{f['mono']};")


def load():
    index = (ASSETS / "EXAMPLES.md").read_text(encoding="utf-8")
    examples = []
    for f in sorted((ASSETS / "examples").glob("example_*.md")):
        text = f.read_text(encoding="utf-8")
        m = H1.match(text.splitlines()[0])
        if not m:
            sys.exit(f"{f.name}: the first line must be '# /scrolls-compact — Example-NN: Title'")
        examples.append({"num": f.stem.split("_")[1], "path": f"examples/{f.name}",
                         "label": m.group(1), "title": m.group(2), "text": text})
    return index, examples


def render(index, examples):
    E = html.escape
    lines = sum(len(e["text"].splitlines()) for e in examples)
    tabs = ['<a href="#index" role="tab" data-tab="index">Index</a>']
    panels = [panel("index", "EXAMPLES.md", "Index", None, None)]
    options = ['<option value="index">Index</option>']
    for i, e in enumerate(examples):
        tid = f"example-{e['num']}"
        tip = f"{e['label']}: {e['title']}"
        tabs.append(f'<a href="#{tid}" role="tab" data-tab="{tid}" title="{E(tip)}" '
                    f'aria-label="{E(tip)}">{e["label"][-2:]}</a>')
        options.append(f'<option value="{tid}">{E(tip)}</option>')
        prev = f"example-{examples[i - 1]['num']}" if i else None
        nxt = f"example-{examples[i + 1]['num']}" if i + 1 < len(examples) else None
        panels.append(panel(tid, e["path"], tip, prev, nxt))
    data = json.dumps({"index": index, "examples": examples}, ensure_ascii=False).replace("</", "<\\/")
    return (TEMPLATE
            .replace("@@COUNT@@", str(len(examples)))
            .replace("@@INDEX_LINES@@", str(len(index.splitlines())))
            .replace("@@LINES@@", str(lines))
            .replace("@@TABS@@", "\n      ".join(tabs))
            .replace("@@OPTIONS@@", "".join(options))
            .replace("@@PANELS@@", "\n".join(panels))
            .replace("@@MARKED@@", MARKED)
            .replace("@@SOURCE_URL@@", SOURCE_URL)
            .replace("@@LIGHT@@", tokens(LIGHTS_OUT["light"], LIGHTS_OUT["fonts"]))
            .replace("@@DARK@@", tokens(LIGHTS_OUT["dark"], LIGHTS_OUT["fonts"]))
            .replace("@@FONTS@@", html.escape(f"https://fonts.googleapis.com/css2?{LIGHTS_OUT['googleFonts']}&display=swap"))
            .replace("@@DATA@@", data))


def panel(tid, path, heading, prev, nxt):
    E = html.escape
    hidden = "" if tid == "index" else " hidden"
    steps = ""
    if tid != "index":
        steps = ('<div class="steps">'
                 f'<button type="button" data-step="prev" data-to="{prev or ""}"{"" if prev else " disabled"}>← Previous</button>'
                 f'<button type="button" data-step="next" data-to="{nxt or ""}"{"" if nxt else " disabled"}>Next →</button>'
                 '</div>')
    return (f'<section class="tab" id="tab-{tid}" role="tabpanel" aria-label="{E(heading)}"{hidden}>\n'
            f'  <div class="panelhead"><span class="path mono">assets/{E(path)}</span>{steps}</div>\n'
            f'  <div class="doc" data-file="{E(path)}"></div>\n'
            f'  <pre class="raw" hidden></pre>\n'
            f'</section>')


TEMPLATE = r"""<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>scrolls-compact Example Viewer</title>
<meta name="description" content="The worked examples of /scrolls-compact: the index and every example, one tab each.">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="stylesheet" href="@@FONTS@@">
<!-- Built by scripts/build_example_viewer.py from assets/EXAMPLES.md and assets/examples/. Do not edit by hand. -->
<style>
/* Theme: Lights Out, the banner's and the docsite's (src/packages/aiskills/src/scripts/docs/themes.mjs). */
:root{@@LIGHT@@}
@media (prefers-color-scheme: dark){:root:not([data-theme="light"]){@@DARK@@color-scheme:dark;}}
:root[data-theme="dark"]{@@DARK@@color-scheme:dark;}
*{box-sizing:border-box}
html{overflow-x:hidden}
body{margin:0;color:var(--fg);font:15px/1.6 var(--font-body);
  background:radial-gradient(1100px 380px at 50% -220px,color-mix(in srgb,var(--accent) 14%,transparent),transparent 72%) no-repeat,var(--bg)}
.wrap{max-width:1180px;margin:0 auto;padding-left:max(16px,env(safe-area-inset-left,0px));padding-right:max(16px,env(safe-area-inset-right,0px))}
header.top{border-bottom:1px solid var(--line);background:color-mix(in srgb,var(--bg) 72%,transparent);-webkit-backdrop-filter:saturate(180%) blur(14px);backdrop-filter:saturate(180%) blur(14px)}
header.top .wrap{padding-block:24px 0}
.kicker{font:500 12px/1.3 var(--font-mono);color:var(--muted);overflow-wrap:anywhere}
h1.page{font:700 clamp(28px,4vw,40px)/1.05 var(--font-display);letter-spacing:-.045em;margin:10px 0 8px;text-wrap:balance}
.lede{color:var(--muted);max-width:72ch;margin:0 0 16px}
.files{display:flex;flex-wrap:wrap;gap:10px;align-items:stretch;margin-bottom:18px}
.file{border:1px solid var(--line);border-radius:12px;padding:10px 14px;min-width:0;background:var(--surface)}
.file b{font:500 13px var(--font-mono);display:block}
.file span{font-size:13px;color:var(--muted);font-variant-numeric:tabular-nums}
.file.out{border-color:color-mix(in srgb,var(--accent) 55%,var(--line));background:var(--accent-soft)}
nav.tabs{display:flex;gap:2px;overflow-x:auto;scrollbar-width:thin}
nav.tabs a{position:relative;padding:10px 12px 12px;border-radius:8px 8px 0 0;color:var(--muted);text-decoration:none;font-weight:500;white-space:nowrap;font-variant-numeric:tabular-nums;transition:background .15s,color .15s}
nav.tabs a:hover{background:color-mix(in srgb,var(--fg) 6%,transparent);color:var(--fg)}
nav.tabs a[aria-selected="true"]{color:var(--fg);font-weight:700}
nav.tabs a[aria-selected="true"]::after{content:"";position:absolute;left:10px;right:10px;bottom:0;height:4px;border-radius:999px;background:var(--accent)}
nav.tabs a:focus-visible{outline:2px solid var(--accent);outline-offset:-2px}
main .wrap{padding-block:20px 60px}
[hidden]{display:none!important}
code,.mono{font-family:var(--font-mono);font-size:.9em}
.toolbar{display:flex;flex-wrap:wrap;gap:8px 12px;align-items:center;margin:0 0 14px}
.toolbar label{display:flex;gap:8px;align-items:center;min-width:0;flex:1 1 260px;max-width:520px;color:var(--muted);font-size:14px}
.seg{display:inline-flex;border:1px solid var(--line);border-radius:999px;overflow:hidden;background:var(--surface)}
.seg button{background:transparent;color:var(--muted);border:0;padding:6px 14px;font:500 13px var(--font-body);cursor:pointer}
.seg button[aria-pressed="true"]{background:var(--accent);color:var(--accent-fg)}
.seg button:focus-visible,.steps button:focus-visible{outline:2px solid var(--accent);outline-offset:-2px}
select{font:13px var(--font-body);padding:6px 12px;border:1px solid transparent;border-radius:999px;background:var(--surface-2);color:var(--fg);min-width:0;width:100%}
select:focus{border-color:var(--accent);outline:none;box-shadow:0 0 0 3px color-mix(in srgb,var(--accent) 22%,transparent)}
.panelhead{display:flex;flex-wrap:wrap;gap:8px 12px;align-items:center;justify-content:space-between;margin:0 0 10px}
.path{color:var(--muted);overflow-wrap:anywhere}
.steps{display:flex;gap:6px}
.steps button{background:transparent;color:var(--fg);border:1px solid var(--line);border-radius:999px;padding:5px 12px;font:500 13px var(--font-body);cursor:pointer;transition:background .15s}
.steps button:hover:not(:disabled){background:var(--surface-2)}
.steps button:disabled{color:var(--muted);opacity:.5;cursor:default}
.doc{background:var(--bg);border:1px solid var(--line);border-radius:16px;padding:clamp(16px,3vw,32px);min-width:0;overflow-wrap:anywhere}
.doc h1{font:700 clamp(24px,3vw,30px)/1.05 var(--font-display);letter-spacing:-.045em;margin:0 0 14px;text-wrap:balance}
.doc h2{font:650 22px/1.2 var(--font-display);letter-spacing:-.03em;margin-top:32px;padding-top:8px}
.doc h3{margin-top:18px;font-size:15px;letter-spacing:-.02em}
.doc p,.doc li{max-width:80ch}
.doc a{color:var(--accent);text-decoration-color:color-mix(in srgb,var(--accent) 40%,transparent)}
.doc a:hover{text-decoration-color:var(--accent)}
.doc :not(pre)>code{background:var(--surface-2);border:1px solid color-mix(in srgb,var(--line) 55%,transparent);padding:.05em .36em;border-radius:6px;overflow-wrap:anywhere}
.doc pre{background:var(--code-bg);color:var(--code-fg);border:1px solid var(--line);padding:12px 14px;border-radius:12px;overflow-x:auto;font:12.5px/1.55 var(--font-mono);transition:border-color .2s,box-shadow .2s}
.doc pre:hover{border-color:color-mix(in srgb,var(--accent) 55%,var(--line));box-shadow:0 0 0 4px color-mix(in srgb,var(--accent) 10%,transparent)}
.doc pre code{font-size:inherit}
.doc pre.fallback{white-space:pre-wrap;overflow-wrap:anywhere}
.doc blockquote{margin:0;padding:4px 14px;border-left:3px solid var(--line);color:var(--muted)}
.doc hr{border:0;border-top:1px solid var(--line)}
.doc table{border-collapse:collapse;display:block;overflow-x:auto;max-width:100%}
.doc th,.doc td{border-bottom:1px solid var(--line);padding:6px 10px;font-size:14px;vertical-align:top;text-align:left}
.doc th{background:transparent;color:var(--muted);font-weight:500}
.doc tr:hover td{background:color-mix(in srgb,var(--fg) 3%,transparent)}
pre.raw{background:var(--code-bg);color:var(--code-fg);border:1px solid var(--line);border-radius:12px;padding:14px;font:12.5px/1.55 var(--font-mono);white-space:pre-wrap;word-break:break-word;margin:0}
@media (prefers-reduced-motion:no-preference){html{scroll-behavior:smooth}}
@media (prefers-reduced-motion:reduce){*{transition:none!important}}
</style>
</head>
<body>
<header class="top">
  <div class="wrap">
    <div class="kicker">skills/scrolls/scrolls-compact/assets</div>
    <h1 class="page">/scrolls-compact examples</h1>
    <p class="lede">The index and every worked example, one tab each. Every output is real: <code>tests/test_examples.sh</code> replays each example against the bundled script and fails on any difference.</p>
    <div class="files" aria-label="Files">
      <div class="file"><b>EXAMPLES.md</b><span>the index · @@INDEX_LINES@@ lines</span></div>
      <div class="file out"><b>examples/example_NNN.md</b><span>@@COUNT@@ examples · @@LINES@@ lines</span></div>
    </div>
    <nav class="tabs" role="tablist" aria-label="Examples">
      @@TABS@@
    </nav>
  </div>
</header>

<main><div class="wrap">
  <div class="toolbar">
    <div class="seg" role="group" aria-label="View"><button type="button" data-view="rendered" aria-pressed="true">Rendered</button><button type="button" data-view="raw" aria-pressed="false">Markdown</button></div>
    <label><span style="white-space:nowrap">Jump to</span> <select id="jump">@@OPTIONS@@</select></label>
  </div>
@@PANELS@@
</div></main>

<script type="application/json" id="viewer-data">@@DATA@@</script>
<script src="@@MARKED@@"></script>
<script>
(() => {
  const DATA = JSON.parse(document.getElementById("viewer-data").textContent);
  const SOURCE = "@@SOURCE_URL@@";
  const files = {"EXAMPLES.md": {tab: "index", text: DATA.index}};
  DATA.examples.forEach(e => { files[e.path] = {tab: "example-" + e.num, text: e.text}; });
  const TABS = [...document.querySelectorAll("nav.tabs a[data-tab]")].map(a => a.dataset.tab);
  const esc = t => t.replace(/[&<>]/g, c => ({"&": "&amp;", "<": "&lt;", ">": "&gt;"})[c]);

  // Resolve a link written in one file (e.g. "../EXAMPLES.md" in "examples/x.md").
  function resolve(from, href){
    const parts = from.split("/").slice(0, -1);
    for (const p of href.split("/")) {
      if (p === "..") parts.pop(); else if (p && p !== ".") parts.push(p);
    }
    return parts.join("/");
  }

  for (const [path, f] of Object.entries(files)) {
    const panel = document.getElementById("tab-" + f.tab);
    const doc = panel.querySelector(".doc");
    panel.querySelector("pre.raw").textContent = f.text;
    if (window.marked && marked.parse) {
      doc.innerHTML = marked.parse(f.text);
      doc.querySelectorAll("a[href]").forEach(a => {
        const href = a.getAttribute("href");
        if (/^([a-z]+:|#)/i.test(href)) return;
        const [file, frag] = href.split("#");
        const target = resolve(path, file);
        a.dataset.src = target;
        if (files[target]) a.setAttribute("href", "#" + files[target].tab);
        else a.setAttribute("href", SOURCE + target + (frag ? "#" + frag : ""));
      });
    } else {
      doc.innerHTML = '<pre class="fallback">' + esc(f.text) + "</pre>";
    }
  }

  const jump = document.getElementById("jump");
  function show(tab){
    if (!TABS.includes(tab)) tab = "index";
    TABS.forEach(t => {
      document.getElementById("tab-" + t).hidden = t !== tab;
      document.querySelector(`nav.tabs a[data-tab="${t}"]`).setAttribute("aria-selected", t === tab ? "true" : "false");
    });
    jump.value = tab;
    const a = document.querySelector(`nav.tabs a[data-tab="${tab}"]`);
    a.scrollIntoView({block: "nearest", inline: "nearest"});
  }
  function go(tab){
    show(tab);
    if (location.hash !== "#" + tab) location.hash = tab;
    scrollTo(0, 0);
  }
  addEventListener("hashchange", () => { show(location.hash.slice(1)); scrollTo(0, 0); });
  // Switch at once on a click; the link still sets the hash, so Back works.
  document.addEventListener("click", e => {
    const a = e.target.closest('a[href^="#"]');
    if (a && TABS.includes(a.getAttribute("href").slice(1))) show(a.getAttribute("href").slice(1));
  });
  jump.addEventListener("change", () => go(jump.value));
  document.querySelectorAll("[data-step]").forEach(b => b.addEventListener("click", () => { if (b.dataset.to) go(b.dataset.to); }));

  function setView(v){
    document.querySelectorAll("[data-view]").forEach(b => b.setAttribute("aria-pressed", b.dataset.view === v ? "true" : "false"));
    document.querySelectorAll("section.tab").forEach(s => {
      s.querySelector(".doc").hidden = v !== "rendered";
      s.querySelector("pre.raw").hidden = v !== "raw";
    });
  }
  document.querySelectorAll("[data-view]").forEach(b => b.addEventListener("click", () => setView(b.dataset.view)));

  const start = location.hash.slice(1);
  if (!TABS.includes(start)) history.replaceState(null, "", "#index");
  show(location.hash.slice(1));
  document.body.dataset.ready = "true";
})();
</script>
</body>
</html>
"""


def main(argv):
    page = render(*load())
    if "--check" in argv:
        current = OUT.read_text(encoding="utf-8") if OUT.exists() else ""
        if current != page:
            print("assets/example-viewer.html is stale: run python3 scripts/build_example_viewer.py")
            return 1
        print("assets/example-viewer.html is up to date")
        return 0
    OUT.write_text(page, encoding="utf-8")
    print(f"wrote assets/example-viewer.html ({len(page) // 1024} KB)")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
