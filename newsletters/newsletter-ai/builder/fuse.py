"""Embed the source report YAML into its rendered HTML report, and read
it back out again.

For "ease of distribution" (per the newsletter-ai skill's -o yaml / -r
flow): a rendered report.html is already fully self-contained (the
Jinja2 template bakes every section/item into static markup at build
time), but the original YAML it came from is separate. Fusing embeds a
byte-for-byte copy of that YAML *inside* the HTML too, so a single .html
file remains fully reproducible/editable even if its sidecar .yaml is
lost or never shipped, and other tooling can recover the exact source
data from the HTML alone.

The payload is base64-encoded specifically so it can never accidentally
contain a literal "</script" sequence and truncate the tag early — no
HTML/JS escaping logic is needed, and the round trip is exact for any
input text (including one that itself contains "</script>").
"""
from __future__ import annotations

import base64
import re

MARKER_ID = "report-source-yaml"
_SCRIPT_RE = re.compile(
    r'<script type="application/x-yaml-base64" id="%s"[^>]*>(.*?)</script>' % re.escape(MARKER_ID),
    re.S,
)


def embed_source(html: str, yaml_text: str) -> str:
    """Return `html` with `yaml_text` embedded as a hidden, base64-encoded
    <script> tag just before </body>. If `html` already has one (e.g. from
    an earlier fuse pass), it is replaced rather than duplicated."""
    payload = base64.b64encode(yaml_text.encode("utf-8")).decode("ascii")
    tag = (
        f'<script type="application/x-yaml-base64" id="{MARKER_ID}" '
        f'data-encoding="base64" data-filename="report.yaml">{payload}</script>'
    )
    if _SCRIPT_RE.search(html):
        return _SCRIPT_RE.sub(tag.replace("\\", "\\\\"), html, count=1)
    # Insert at the LAST "</body>" in the document, not the first: a page's
    # own markup/JS/comments may mention "</body>" as plain text earlier
    # (e.g. documentation), and splicing in there would corrupt the page.
    # The real closing tag is always the final one in a well-formed
    # single-page document.
    idx = html.rfind("</body>")
    if idx != -1:
        return html[:idx] + tag + html[idx:]
    return html + tag


def extract_source(html: str) -> "str | None":
    """Return the embedded YAML source text, or None if `html` has no
    fused payload."""
    m = _SCRIPT_RE.search(html)
    if not m:
        return None
    return base64.b64decode(m.group(1).strip()).decode("utf-8")
