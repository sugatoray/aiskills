"""Tests for scripts/build_report.py and the report template. Stdlib only.
Run from the skill directory: python3 -m unittest discover -s tests -v (or python3 -m pytest)."""
import io, json, re, subprocess, sys, tempfile, unittest
from contextlib import redirect_stderr, redirect_stdout
from pathlib import Path

SKILL = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(SKILL / "scripts"))
import build_report  # noqa: E402

TEMPLATE = SKILL / "assets" / "agent-sessions-insight.html"
BLOCK = re.compile(r'<script type="application/json" id="report-data">(.*?)</script>', re.S)


def summary(**over):
    s = dict(window_days=30, sessions=2, active_days=2, prompts=5, first="2026-11-01T10:00:00+00:00",
             last="2026-11-02T11:00:00+00:00", median_minutes=30.0, longest_minutes=45.0, median_gap_days=1,
             longest_gap_days=1, per_agent={"claude-code": 2}, per_month={"2026-11": 2},
             per_weekday={"Sun": 1, "Mon": 1}, per_hour={"10": 2}, projects=[["sample-app", 2]],
             tools=[["Bash", 4]], commands=[["/plan", 1]], doc_edits={"README.md": 1}, test_runs=2)
    s.update(over)
    return s


def row(prompt="add tests", agent="claude-code", start="2026-11-01T10:00:00+00:00"):
    return dict(agent=agent, id="abcd1234", project="sample-app", start=start, minutes=30.0, prompts=2,
                first_prompt=prompt, top_tools=[["Bash", 2]], commands=["/plan"])


def data(**over):
    d = dict(summary=summary(), sessions=[row(), row(start="2026-11-02T10:00:00+00:00")])
    d.update(over)
    return d


INSIGHTS = {
    "overview": ["You used coding agents on 2 of the last 30 days."],
    "kinds": [{"name": "Building tools", "sessions": 2, "projects": ["sample-app"], "examples": ["add tests"],
               "evidence": "project name and first prompts"}],
    "habits": ["Tests ran in every session.",
               {"title": "Docs as memory", "detail": "HANDOFF.md is edited most sessions.", "evidence": "sample-app, Nov 1"}],
    "friction": [{"title": "Long sessions", "detail": "One session ran 45 minutes.", "evidence": "sample-app, Nov 2"}],
    "agents": [],
    "threads": [{"thread": "sample-app parser", "next": "Run the slow tests", "when": "Nov 2"}],
    "caveat": "Only Claude Code logs were found on this machine.",
}


def embedded(html):
    blocks = BLOCK.findall(html)
    assert len(blocks) == 1, "expected exactly one report-data block"
    return json.loads(blocks[0])


class Base(unittest.TestCase):
    def setUp(self):
        self._t = tempfile.TemporaryDirectory()
        self.dir = Path(self._t.name)

    def tearDown(self):
        self._t.cleanup()

    def write(self, name, obj):
        p = self.dir / name
        p.write_text(obj if isinstance(obj, str) else json.dumps(obj))
        return p

    def run_main(self, *argv):
        out, err = io.StringIO(), io.StringIO()
        with redirect_stdout(out), redirect_stderr(err):
            try:
                code = build_report.main(list(argv))
            except SystemExit as e:          # argparse usage errors
                code = e.code
        return code, out.getvalue(), err.getvalue()


class Template(unittest.TestCase):
    def test_has_one_data_block_with_valid_demo_data(self):
        report = embedded(TEMPLATE.read_text(encoding="utf-8"))
        build_report.validate_data(report)
        build_report.validate_insights(report["insights"])
        self.assertEqual(report["summary"]["sessions"], len(report["sessions"]))
        agents = {}
        for r in report["sessions"]:
            agents[r["agent"]] = agents.get(r["agent"], 0) + 1
        self.assertEqual(report["summary"]["per_agent"], agents)
        self.assertGreaterEqual(len(agents), 2, "the demo should show the Agents tab")

    def test_is_offline_and_never_uses_innerhtml(self):
        html = TEMPLATE.read_text(encoding="utf-8")
        self.assertIsNone(re.search(r'(src|href)\s*=\s*["\']?\s*(https?:)?//', html), "no remote resource loads")
        self.assertNotIn("@import", html)
        self.assertNotIn("fetch(", html)
        for bad in ("innerHTML", "outerHTML", "insertAdjacentHTML", "document.write"):
            self.assertNotIn(bad, html)

    def test_supports_light_and_dark(self):
        self.assertIn("prefers-color-scheme: dark", TEMPLATE.read_text(encoding="utf-8"))

    def test_theme_override_and_reduced_motion(self):
        html = TEMPLATE.read_text(encoding="utf-8")
        self.assertIn(':root[data-theme="dark"]', html)
        self.assertIn(':root:not([data-theme="light"])', html)
        self.assertIn("prefers-reduced-motion: no-preference", html)
        self.assertNotRegex(html.split("prefers-reduced-motion")[0], r"transition\s*:", "transitions only under no-preference")

    def test_demo_shows_every_insight_kind(self):
        ins = embedded(TEMPLATE.read_text(encoding="utf-8"))["insights"]
        self.assertTrue(ins["caveat"])
        self.assertTrue(ins["threads"])
        self.assertTrue(any(isinstance(h, dict) and h.get("evidence") for h in ins["habits"]))
        self.assertTrue(all(f.get("evidence") for f in ins["friction"]))


class Build(Base):
    def test_embeds_data_insights_and_meta(self):
        code, out, _ = self.run_main("--data", str(self.write("d.json", data())), "--insights",
                                     str(self.write("i.json", INSIGHTS)), "-o", str(self.dir / "r.html"))
        self.assertEqual(code, 0)
        report = embedded((self.dir / "r.html").read_text(encoding="utf-8"))
        self.assertEqual(report["summary"], summary())
        self.assertEqual(len(report["sessions"]), 2)
        self.assertEqual(report["insights"], INSIGHTS)
        self.assertEqual(report["meta"]["window_days"], 30)
        self.assertIn("generated", report["meta"])
        self.assertIn("2 sessions", out)

    def test_only_the_data_block_changes(self):
        self.run_main("--data", str(self.write("d.json", data())), "-o", str(self.dir / "r.html"))
        tpl, html = TEMPLATE.read_text(encoding="utf-8"), (self.dir / "r.html").read_text(encoding="utf-8")
        self.assertEqual(BLOCK.sub("", tpl), BLOCK.sub("", html))

    def test_insights_are_optional(self):
        code, _, _ = self.run_main("--data", str(self.write("d.json", data())), "-o", str(self.dir / "r.html"))
        self.assertEqual(code, 0)
        ins = embedded((self.dir / "r.html").read_text(encoding="utf-8"))["insights"]
        self.assertEqual(ins, {"overview": [], "kinds": [], "habits": [], "friction": [], "agents": [], "threads": [], "caveat": ""})

    def test_every_lt_is_escaped_so_a_prompt_cannot_close_the_block(self):
        evil = '</script><script>window.pwned=1</script><img src=x onerror="window.pwned=1">'
        self.run_main("--data", str(self.write("d.json", data(sessions=[row(evil)]))), "-o", str(self.dir / "r.html"))
        html = (self.dir / "r.html").read_text(encoding="utf-8")
        block = BLOCK.search(html).group(1)
        self.assertNotIn("<", block)
        self.assertEqual(embedded(html)["sessions"][0]["first_prompt"], evil)

    def test_default_output_is_in_the_working_directory(self):
        d = self.write("d.json", data())
        r = subprocess.run([sys.executable, str(SKILL / "scripts" / "build_report.py"), "--data", str(d)],
                           cwd=self.dir, capture_output=True, text=True)
        self.assertEqual(r.returncode, 0, r.stderr)
        self.assertTrue((self.dir / "agent-sessions-insight.html").is_file())

    def test_demo_is_byte_identical(self):
        code, out, _ = self.run_main("--demo", "-o", str(self.dir / "demo.html"))
        self.assertEqual(code, 0)
        self.assertEqual((self.dir / "demo.html").read_bytes(), TEMPLATE.read_bytes())
        self.assertIn("demo", out)

    def test_demo_takes_no_data(self):
        code, _, err = self.run_main("--demo", "--data", str(self.write("d.json", data())), "-o", str(self.dir / "x.html"))
        self.assertEqual(code, 2)
        self.assertIn("--demo", err)

    def test_collector_output_builds(self):
        import collect
        home = self.dir / "home"
        p = home / ".claude" / "projects" / "-w-sample-app"
        p.mkdir(parents=True)
        (p / "s1.jsonl").write_text(json.dumps({"type": "user", "sessionId": "s1", "timestamp": "2026-11-20T10:00:00Z",
                                                "cwd": "/w/sample-app", "message": {"content": "hello"}}) + "\n")
        out = self.dir / "data.json"
        self.assertEqual(collect.main(["--home", str(home), "--out", str(out), "--days", "3650"]), 0)
        code, _, err = self.run_main("--data", str(out), "-o", str(self.dir / "r.html"))
        self.assertEqual(code, 0, err)


class Validation(Base):
    def bad_data(self, obj, needle):
        code, _, err = self.run_main("--data", str(self.write("d.json", obj)), "-o", str(self.dir / "r.html"))
        self.assertEqual(code, 2)
        self.assertIn(needle, err)
        self.assertFalse((self.dir / "r.html").exists())

    def bad_insights(self, obj, needle):
        code, _, err = self.run_main("--data", str(self.write("d.json", data())), "--insights",
                                     str(self.write("i.json", obj)), "-o", str(self.dir / "r.html"))
        self.assertEqual(code, 2)
        self.assertIn(needle, err)

    def test_data_not_json(self):
        self.bad_data("{nope", "not valid JSON")

    def test_data_without_summary(self):
        self.bad_data({"sessions": []}, "summary")

    def test_summary_missing_a_key(self):
        s = summary(); del s["per_month"]
        self.bad_data(data(summary=s), "per_month")

    def test_sessions_not_a_list(self):
        self.bad_data(data(sessions={}), "sessions")

    def test_insights_unknown_key(self):
        self.bad_insights({**INSIGHTS, "overveiw": []}, "overveiw")

    def test_insights_overview_must_be_strings(self):
        self.bad_insights({"overview": [1]}, "overview")

    def test_kind_needs_a_name_and_a_count(self):
        self.bad_insights({"kinds": [{"sessions": 1}]}, "kinds")
        self.bad_insights({"kinds": [{"name": "x", "sessions": -1}]}, "kinds")

    def test_friction_needs_title_and_detail(self):
        self.bad_insights({"friction": [{"title": "x"}]}, "friction")
        self.bad_insights({"friction": [{"title": "x", "detail": "y", "evidence": 3}]}, "friction")

    def test_habit_objects_need_a_title_and_detail(self):
        self.bad_insights({"habits": [{"detail": "y"}]}, "habits")
        self.bad_insights({"habits": [{"title": "x", "detail": "y", "evidence": ["z"]}]}, "habits")
        self.bad_insights({"habits": [3]}, "habits")

    def test_threads_need_thread_and_next(self):
        self.bad_insights({"threads": [{"thread": "x"}]}, "threads")
        self.bad_insights({"threads": [{"thread": "x", "next": "y", "when": 1}]}, "threads")
        self.bad_insights({"threads": "x"}, "threads")

    def test_caveat_must_be_a_string(self):
        self.bad_insights({"caveat": ["x"]}, "caveat")


if __name__ == "__main__":
    unittest.main()
