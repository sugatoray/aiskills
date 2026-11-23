"""Tests for scripts/make_demo.py, the generator of the template's demo data. Stdlib only."""
import io, json, re, shutil, sys, tempfile, unittest
from contextlib import redirect_stderr, redirect_stdout
from pathlib import Path

SKILL = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(SKILL / "scripts"))
import build_report  # noqa: E402
import make_demo  # noqa: E402

TEMPLATE = SKILL / "assets" / "agent-sessions-insight.html"
BLOCK = re.compile(r'<script type="application/json" id="report-data">(.*?)</script>', re.S)


def run(*argv):
    out, err = io.StringIO(), io.StringIO()
    with redirect_stdout(out), redirect_stderr(err):
        code = make_demo.main(list(argv))
    return code, out.getvalue(), err.getvalue()


class MakeDemo(unittest.TestCase):
    def setUp(self):
        self._t = tempfile.TemporaryDirectory()
        self.copy = Path(self._t.name) / "t.html"
        shutil.copy(TEMPLATE, self.copy)

    def tearDown(self):
        self._t.cleanup()

    def test_shipped_template_matches_a_fresh_build(self):
        html = TEMPLATE.read_text(encoding="utf-8")
        self.assertEqual(make_demo.render(html), html, "demo is stale: run python3 scripts/make_demo.py")

    def test_lives_in_scripts(self):
        self.assertEqual(Path(make_demo.__file__).resolve().parent, SKILL / "scripts")
        self.assertFalse((SKILL / "meta" / "make_demo.py").exists())

    def test_is_deterministic(self):
        self.assertEqual(make_demo.build_demo(), make_demo.build_demo())

    def test_demo_is_valid_marked_and_consistent(self):
        rep = make_demo.build_demo()
        build_report.validate_data(rep)
        build_report.validate_insights(rep["insights"])
        self.assertTrue(rep["meta"]["demo"])
        self.assertEqual(rep["summary"]["sessions"], len(rep["sessions"]))
        kinds = sum(k["sessions"] for k in rep["insights"]["kinds"])
        self.assertEqual(kinds, rep["summary"]["sessions"], "kinds should account for every session")

    def test_check_passes_on_the_shipped_template(self):
        code, out, _ = run("--check", "--template", str(self.copy))
        self.assertEqual(code, 0)
        self.assertIn("up to date", out)

    def test_check_fails_on_a_stale_template_and_changes_nothing(self):
        html = self.copy.read_text(encoding="utf-8")
        stale = BLOCK.sub('<script type="application/json" id="report-data">{}</script>', html)
        self.copy.write_text(stale, encoding="utf-8")
        code, _, err = run("--check", "--template", str(self.copy))
        self.assertEqual(code, 1)
        self.assertIn("stale", err)
        self.assertEqual(self.copy.read_text(encoding="utf-8"), stale)

    def test_write_mode_rebuilds_only_the_data_block(self):
        html = self.copy.read_text(encoding="utf-8")
        self.copy.write_text(BLOCK.sub('<script type="application/json" id="report-data">{}</script>', html), encoding="utf-8")
        code, out, _ = run("--template", str(self.copy))
        self.assertEqual(code, 0)
        self.assertIn("wrote", out)
        self.assertEqual(self.copy.read_text(encoding="utf-8"), html)
        self.assertTrue(json.loads(BLOCK.search(html).group(1).replace("\\u003c", "<"))["meta"]["demo"])


if __name__ == "__main__":
    unittest.main()
