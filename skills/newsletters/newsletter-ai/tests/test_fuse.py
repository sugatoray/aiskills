"""Red/Green tests for builder/fuse.py — embedding the source YAML text
into the rendered HTML report (for single-file distribution) and
extracting it back out. Base64-encoded so the payload can never
prematurely close the <script> tag it lives in, regardless of what
characters (including literal "</script") appear in the YAML.
"""
import pathlib
import sys

ROOT = pathlib.Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "builder"))

import fuse  # noqa: E402


SIMPLE_HTML = "<html><head></head><body><p>hi</p></body></html>"
YAML_TEXT = "meta:\n  title: Hello World\nsections: []\n"


def test_embed_then_extract_round_trips_exactly():
    fused = fuse.embed_source(SIMPLE_HTML, YAML_TEXT)
    assert fuse.extract_source(fused) == YAML_TEXT


def test_embed_adds_exactly_one_script_tag():
    fused = fuse.embed_source(SIMPLE_HTML, YAML_TEXT)
    assert fused.count('id="report-source-yaml"') == 1


def test_embed_inserts_before_closing_body():
    fused = fuse.embed_source(SIMPLE_HTML, YAML_TEXT)
    assert fused.index('id="report-source-yaml"') < fused.index("</body>")


def test_extract_returns_none_when_not_fused():
    assert fuse.extract_source(SIMPLE_HTML) is None


def test_round_trip_survives_a_literal_closing_script_tag_in_the_yaml():
    tricky = 'meta:\n  title: "</script><script>alert(1)</script>"\nsections: []\n'
    fused = fuse.embed_source(SIMPLE_HTML, tricky)
    # the dangerous substring must not appear verbatim in the fused HTML's
    # <script> body — only inside the base64 payload, which cannot contain it
    script_body = fused.split('id="report-source-yaml"')[1].split("</script>")[0]
    assert "</script>" not in script_body.lower().replace(" ", "")
    assert fuse.extract_source(fused) == tricky


def test_embed_inserts_at_the_real_closing_body_tag_not_a_decoy_earlier_in_the_page():
    # a page whose own markup/JS/comments mention "</body>" as plain text
    # (e.g. documentation) before the real closing tag — the payload must
    # land at the actual end of <body>, not get spliced into that earlier
    # text and corrupt the page.
    html_with_decoy = (
        "<html><head></head><body>"
        "<script>/* inserted right before </body> in fuse.py */ console.log('ok');</script>"
        "<p>content</p>"
        "</body></html>"
    )
    fused = fuse.embed_source(html_with_decoy, YAML_TEXT)
    # the decoy comment must survive completely intact and un-split
    assert "/* inserted right before </body> in fuse.py */ console.log('ok');" in fused
    # the fused tag must appear once, after the decoy script, right before the real </body>
    assert fused.index('id="report-source-yaml"') > fused.index("console.log('ok')")
    assert fuse.extract_source(fused) == YAML_TEXT


def test_embed_payload_is_base64(monkeypatch=None):
    import base64

    fused = fuse.embed_source(SIMPLE_HTML, YAML_TEXT)
    start = fused.index(">", fused.index('id="report-source-yaml"')) + 1
    end = fused.index("</script>", start)
    payload = fused[start:end].strip()
    assert base64.b64decode(payload).decode("utf-8") == YAML_TEXT


def test_embed_is_idempotent_replacing_previous_payload():
    once = fuse.embed_source(SIMPLE_HTML, "meta:\n  title: A\nsections: []\n")
    twice = fuse.embed_source(once, "meta:\n  title: B\nsections: []\n")
    assert twice.count('id="report-source-yaml"') == 1
    assert fuse.extract_source(twice) == "meta:\n  title: B\nsections: []\n"
