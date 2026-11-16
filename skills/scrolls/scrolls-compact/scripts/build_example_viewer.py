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
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&family=Fraunces:opsz,wght@9..144,600&display=swap">
<!-- Built by scripts/build_example_viewer.py from assets/EXAMPLES.md and assets/examples/. Do not edit by hand. -->
<style>
:root{
  --bg:#f6f5f1; --panel:#ffffff; --ink:#1d2321; --muted:#5d6763; --line:#dcdcd4;
  --accent:#1f6f62; --accent-soft:#e2f0ec; --code:#f1f0ea;
  --f-display:"Fraunces", Georgia, serif;
  --f-body:"IBM Plex Sans", system-ui, -apple-system, "Segoe UI", sans-serif;
  --f-mono:"IBM Plex Mono", ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
}
@media (prefers-color-scheme: dark){:root:not([data-theme="light"]){
  --bg:#141917; --panel:#1b2220; --ink:#e4e8e5; --muted:#9aa5a0; --line:#2e3834;
  --accent:#6cc4b2; --accent-soft:#1d3530; --code:#202826; color-scheme:dark}}
:root[data-theme="dark"]{
  --bg:#141917; --panel:#1b2220; --ink:#e4e8e5; --muted:#9aa5a0; --line:#2e3834;
  --accent:#6cc4b2; --accent-soft:#1d3530; --code:#202826; color-scheme:dark}
*{box-sizing:border-box}
html{overflow-x:hidden}
body{background:var(--bg);color:var(--ink);font:15px/1.55 var(--f-body);margin:0}
.wrap{max-width:1180px;margin:0 auto;padding-left:max(16px,env(safe-area-inset-left,0px));padding-right:max(16px,env(safe-area-inset-right,0px))}
header.top{border-bottom:1px solid var(--line);background:var(--panel)}
header.top .wrap{padding-block:22px 0}
.kicker{font:500 12px/1.3 var(--f-mono);letter-spacing:.06em;text-transform:uppercase;color:var(--muted);overflow-wrap:anywhere}
h1.page{font:600 clamp(24px,3.4vw,34px)/1.15 var(--f-display);margin:8px 0 6px;text-wrap:balance}
.lede{color:var(--muted);max-width:72ch;margin:0 0 16px}
.files{display:flex;flex-wrap:wrap;gap:10px;align-items:stretch;margin-bottom:18px}
.file{border:1px solid var(--line);border-radius:6px;padding:10px 12px;min-width:0;background:var(--bg)}
.file b{font:500 13px var(--f-mono);display:block}
.file span{font-size:13px;color:var(--muted);font-variant-numeric:tabular-nums}
.file.out{border-color:var(--accent);background:var(--accent-soft)}
nav.tabs{display:flex;gap:2px;overflow-x:auto;margin-bottom:-1px;scrollbar-width:thin}
nav.tabs a{padding:10px 12px;border:1px solid transparent;border-bottom:none;border-radius:6px 6px 0 0;color:var(--muted);text-decoration:none;font-weight:500;white-space:nowrap;font-variant-numeric:tabular-nums}
nav.tabs a[aria-selected="true"]{background:var(--bg);border-color:var(--line);color:var(--ink)}
nav.tabs a:focus-visible{outline:2px solid var(--accent);outline-offset:-2px}
main .wrap{padding-block:20px 60px}
[hidden]{display:none!important}
code,.mono{font-family:var(--f-mono);font-size:.9em}
:not(pre)>code{background:var(--code);padding:1px 4px;border-radius:3px;overflow-wrap:anywhere}
.toolbar{display:flex;flex-wrap:wrap;gap:8px 12px;align-items:center;margin:0 0 14px}
.toolbar label{display:flex;gap:6px;align-items:center;min-width:0;flex:1 1 260px;max-width:520px;color:var(--muted);font-size:14px}
.seg{display:inline-flex;border:1px solid var(--line);border-radius:6px;overflow:hidden}
.seg button{background:var(--panel);color:var(--muted);border:0;padding:6px 12px;font:500 13px var(--f-body);cursor:pointer}
.seg button[aria-pressed="true"]{background:var(--accent);color:var(--bg)}
.seg button:focus-visible,.steps button:focus-visible{outline:2px solid var(--accent);outline-offset:-2px}
select{font:13px var(--f-body);padding:5px 8px;border:1px solid var(--line);border-radius:6px;background:var(--panel);color:var(--ink);min-width:0;width:100%}
.panelhead{display:flex;flex-wrap:wrap;gap:8px 12px;align-items:center;justify-content:space-between;margin:0 0 10px}
.path{color:var(--muted);overflow-wrap:anywhere}
.steps{display:flex;gap:6px}
.steps button{background:var(--panel);color:var(--ink);border:1px solid var(--line);border-radius:6px;padding:5px 10px;font:500 13px var(--f-body);cursor:pointer}
.steps button:disabled{color:var(--muted);opacity:.5;cursor:default}
.doc{background:var(--panel);border:1px solid var(--line);border-radius:8px;padding:clamp(16px,3vw,32px);min-width:0;overflow-wrap:anywhere}
.doc h1{font:600 26px/1.2 var(--f-display);margin:0 0 12px;text-wrap:balance}
.doc h2{font:600 21px/1.25 var(--f-display);margin-top:30px;padding-top:12px;border-top:1px solid var(--line)}
.doc h3{margin-top:18px;font-size:15px}
.doc p,.doc li{max-width:80ch}
.doc a{color:var(--accent)}
.doc pre{background:var(--code);padding:10px 12px;border-radius:6px;overflow-x:auto;font:12.5px/1.5 var(--f-mono)}
.doc pre code{background:none;padding:0;overflow-wrap:normal}
.doc pre.fallback{white-space:pre-wrap;overflow-wrap:anywhere}
.doc blockquote{margin:0;padding:4px 14px;border-left:3px solid var(--line);color:var(--muted)}
.doc table{border-collapse:collapse;display:block;overflow-x:auto;max-width:100%}
.doc th,.doc td{border:1px solid var(--line);padding:4px 8px;font-size:14px;vertical-align:top}
.doc th{background:var(--bg)}
pre.raw{background:var(--panel);border:1px solid var(--line);border-radius:8px;padding:14px;font:12.5px/1.5 var(--f-mono);white-space:pre-wrap;word-break:break-word;margin:0}
@media (prefers-reduced-motion:no-preference){html{scroll-behavior:smooth}}
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
