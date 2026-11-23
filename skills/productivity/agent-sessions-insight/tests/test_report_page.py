"""Browser tests for the report page (assets/agent-sessions-insight.html).
Need Playwright for Python and a Chromium; skipped otherwise. Cloud sessions: pip install playwright
(the browser is at /opt/pw-browsers/chromium, or set CHROMIUM_PATH)."""
import json, os, sys, tempfile, unittest
from pathlib import Path

SKILL = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(SKILL / "scripts"))
sys.path.insert(0, str(Path(__file__).resolve().parent))
import build_report  # noqa: E402
from test_build_report import INSIGHTS, data, row, summary  # noqa: E402

try:
    from playwright.sync_api import sync_playwright
except ImportError:                                  # pragma: no cover
    sync_playwright = None

TEMPLATE = SKILL / "assets" / "agent-sessions-insight.html"
TABS = ["overview", "frequency", "kinds", "habits", "friction", "agents", "numbers", "data"]


def chromium_path():
    env = os.environ.get("CHROMIUM_PATH")
    if env:
        return env
    return "/opt/pw-browsers/chromium" if os.path.exists("/opt/pw-browsers/chromium") else None


@unittest.skipIf(sync_playwright is None, "playwright for Python is not installed")
class Page(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls._pw = sync_playwright().start()
        cls.browser = cls._pw.chromium.launch(executable_path=chromium_path())
        cls._t = tempfile.TemporaryDirectory()
        cls.dir = Path(cls._t.name)

    @classmethod
    def tearDownClass(cls):
        cls.browser.close()
        cls._pw.stop()
        cls._t.cleanup()

    def open(self, path=TEMPLATE, hash_="", scheme="light"):
        ctx = self.browser.new_context(viewport={"width": 1200, "height": 800}, color_scheme=scheme)
        self.addCleanup(ctx.close)
        page = ctx.new_page()
        self.errors, self.requests = [], []
        page.on("console", lambda m: m.type == "error" and self.errors.append(m.text))
        page.on("pageerror", lambda e: self.errors.append(str(e)))
        page.on("request", lambda r: r.url.startswith("file:") or self.requests.append(r.url))
        page.goto(path.as_uri() + hash_)
        return page

    def build(self, name, d, insights=None):
        out = self.dir / name
        report = build_report.make_report(d, insights)
        out.write_text(build_report.embed(TEMPLATE.read_text(encoding="utf-8"), report), encoding="utf-8")
        return out

    def visible_panel(self, page):
        return page.eval_on_selector_all('[role="tabpanel"]', "ps => ps.filter(p => !p.hidden).map(p => p.id)")

    def test_demo_every_tab_renders_offline_without_errors(self):
        page = self.open()
        for tab in TABS:
            page.click(f'[role="tab"][data-tab="{tab}"]')
            self.assertEqual(self.visible_panel(page), ["panel-" + tab])
            self.assertTrue(page.inner_text("#panel-" + tab).strip(), tab + " panel is empty")
            self.assertEqual(page.evaluate("location.hash"), "#" + tab)
        self.assertEqual(self.errors, [])
        self.assertEqual(self.requests, [])

    def test_hash_opens_a_tab_and_arrow_keys_move(self):
        page = self.open(hash_="#friction")
        self.assertEqual(self.visible_panel(page), ["panel-friction"])
        page.focus('[role="tab"][data-tab="friction"]')
        page.keyboard.press("ArrowRight")
        self.assertEqual(self.visible_panel(page), ["panel-agents"])
        page.keyboard.press("ArrowLeft")
        page.keyboard.press("ArrowLeft")
        self.assertEqual(self.visible_panel(page), ["panel-habits"])

    def test_headline_numbers_come_from_the_data(self):
        page = self.open(self.build("h.html", data(), INSIGHTS))
        text = page.inner_text("#panel-overview")
        self.assertIn("You used coding agents on 2 of the last 30 days.", text)
        self.assertEqual(page.inner_text('[data-stat="sessions"]'), "2")
        self.assertEqual(page.inner_text('[data-stat="active_days"]'), "2")
        self.assertEqual(page.inner_text('[data-stat="prompts"]'), "5")

    def test_agents_tab_hidden_with_one_agent(self):
        page = self.open(self.build("one.html", data()))
        self.assertTrue(page.is_hidden('[role="tab"][data-tab="agents"]'))

    def test_charts_have_bars_tooltips_and_a_table(self):
        page = self.open(hash_="#frequency")
        bars = page.locator("#panel-frequency [data-chart='hour'] .bar")
        self.assertGreater(bars.count(), 1)
        bars.first.hover()
        tip = page.locator("#tooltip")
        self.assertTrue(tip.is_visible())
        self.assertRegex(tip.inner_text(), r"\d")
        self.assertGreater(page.locator("#panel-frequency [data-chart='hour'] table tr").count(), 1)
        self.assertGreater(page.locator("#panel-frequency [data-chart='timeline'] .dot").count(), 0)

    def test_exact_numbers_lists_every_summary_key(self):
        page = self.open(self.build("n.html", data()), hash_="#numbers")
        keys = page.eval_on_selector_all("#panel-numbers [data-key]", "els => els.map(e => e.dataset.key)")
        self.assertEqual(sorted(keys), sorted(summary()))

    def test_data_filter_narrows_rows(self):
        d = data(sessions=[row("alpha task"), row("beta task", agent="codex")],
                 summary=summary(per_agent={"claude-code": 1, "codex": 1}))
        page = self.open(self.build("f.html", d), hash_="#data")
        rows = page.locator("#sessions-table tbody tr:visible")
        self.assertEqual(rows.count(), 2)
        page.fill("#filter", "beta")
        self.assertEqual(rows.count(), 1)
        self.assertIn("beta task", rows.first.inner_text())

    def test_prompt_text_is_never_parsed_as_html(self):
        evil = '<img src=x onerror="window.pwned=1"><b id="injected">x</b>'
        ins = {"overview": [evil], "kinds": [{"name": evil, "sessions": 1, "projects": [evil], "examples": [evil]}],
               "habits": [evil, {"title": evil, "detail": evil, "evidence": evil}],
               "friction": [{"title": evil, "detail": evil, "evidence": evil}], "agents": [evil],
               "threads": [{"thread": evil, "next": evil, "when": evil}], "caveat": evil}
        page = self.open(self.build("x.html", data(sessions=[row(evil)]), ins), hash_="#data")
        for tab in TABS:
            if page.is_visible(f'[role="tab"][data-tab="{tab}"]'):
                page.click(f'[role="tab"][data-tab="{tab}"]')
        self.assertIsNone(page.evaluate("window.pwned"))
        self.assertEqual(page.locator("#injected").count(), 0)
        self.assertIn(evil, page.inner_text("#panel-data"))

    def test_empty_insights_show_a_note_not_a_blank_tab(self):
        page = self.open(self.build("e.html", data()), hash_="#kinds")
        self.assertIn("No reading", page.inner_text("#panel-kinds"))

    def test_dark_mode_changes_the_background(self):
        light = self.open().evaluate("getComputedStyle(document.body).backgroundColor")
        dark = self.open(scheme="dark").evaluate("getComputedStyle(document.body).backgroundColor")
        self.assertNotEqual(light, dark)

    def test_phone_width_has_no_horizontal_scroll(self):
        ctx = self.browser.new_context(viewport={"width": 375, "height": 800})
        self.addCleanup(ctx.close)
        page = ctx.new_page()
        page.goto(TEMPLATE.as_uri())
        for tab in TABS:
            page.click(f'[role="tab"][data-tab="{tab}"]')
            self.assertLessEqual(page.evaluate("document.documentElement.scrollWidth"), 375, tab)

    # ---------- evidence, threads, caveat, stacked months, leads, theme ----------
    def test_caveat_banner_shows_only_when_set(self):
        page = self.open(self.build("c1.html", data(), {"caveat": "Only Claude Code logs were found."}))
        self.assertTrue(page.is_visible("#caveat"))
        self.assertIn("What this is based on", page.inner_text("#caveat"))
        self.assertIn("Only Claude Code logs were found.", page.inner_text("#caveat"))
        page = self.open(self.build("c2.html", data()))
        self.assertTrue(page.is_hidden("#caveat"))

    def test_habits_are_numbered_cards_with_evidence(self):
        ins = {"habits": [{"title": "Test first", "detail": "Tests run in most sessions.", "evidence": "sample-app, Nov 1"},
                          "A plain sentence still works."]}
        page = self.open(self.build("hb.html", data(), ins), hash_="#habits")
        cards = page.locator("#panel-habits .habit")
        self.assertEqual(cards.count(), 2)
        self.assertEqual(cards.nth(0).locator("h3").inner_text(), "1. Test first")
        self.assertIn("Seen in: sample-app, Nov 1", cards.nth(0).inner_text())
        self.assertIn("A plain sentence still works.", cards.nth(1).inner_text())

    def test_friction_shows_evidence_and_open_threads(self):
        ins = {"friction": [{"title": "Long sessions.", "detail": "One ran 3 hours.", "evidence": "billing-api, Nov 3"}],
               "threads": [{"thread": "sample-app parser", "next": "Run the slow tests", "when": "Nov 2"}]}
        page = self.open(self.build("fr.html", data(), ins), hash_="#friction")
        text = page.inner_text("#panel-friction")
        self.assertIn("Seen in: billing-api, Nov 3", text)
        rows = page.locator("#threads tbody tr")
        self.assertEqual(rows.count(), 1)
        self.assertIn("sample-app parser", rows.first.inner_text())
        self.assertIn("Run the slow tests", rows.first.inner_text())
        self.assertIn("Nov 2", rows.first.inner_text())

    def test_no_threads_shows_a_note(self):
        page = self.open(self.build("nt.html", data()), hash_="#friction")
        self.assertIn("No open threads", page.inner_text("#panel-friction"))

    def test_month_bars_stack_by_agent_with_totals_and_legend(self):
        d = data(sessions=[row(), row(agent="codex"), row(start="2026-10-02T10:00:00+00:00")],
                 summary=summary(sessions=3, per_agent={"claude-code": 2, "codex": 1}, per_month={"2026-10": 1, "2026-11": 2}))
        page = self.open(self.build("st.html", d), hash_="#frequency")
        chart = page.locator("[data-chart='month']")
        cols = chart.locator(".col")
        self.assertEqual(cols.count(), 2)
        self.assertEqual(cols.nth(1).locator(".tot").inner_text(), "2")
        self.assertEqual(cols.nth(1).locator(".seg").count(), 2)
        self.assertEqual(cols.nth(0).locator(".tot").inner_text(), "1")
        self.assertIn("codex", chart.locator(".legend").inner_text())
        cols.nth(1).locator(".seg").first.hover()
        self.assertRegex(page.inner_text("#tooltip"), r"2026-11: \d+ session")
        self.assertIn("codex", chart.locator("table").text_content())

    def test_every_panel_opens_with_a_lead_sentence(self):
        page = self.open()
        for tab in TABS:
            page.click(f'[role="tab"][data-tab="{tab}"]')
            lead = page.locator(f"#panel-{tab} > p.lead")
            self.assertEqual(lead.count(), 1, tab)
            self.assertTrue(lead.inner_text().strip(), tab)

    def test_theme_button_overrides_the_system_setting(self):
        page = self.open(scheme="light")
        light = page.evaluate("getComputedStyle(document.body).backgroundColor")
        self.assertIn("Auto", page.inner_text("#theme-toggle"))
        page.click("#theme-toggle")
        self.assertEqual(page.evaluate("document.documentElement.dataset.theme"), "light")
        page.click("#theme-toggle")
        self.assertEqual(page.evaluate("document.documentElement.dataset.theme"), "dark")
        self.assertNotEqual(page.evaluate("getComputedStyle(document.body).backgroundColor"), light)
        page.click("#theme-toggle")
        self.assertIsNone(page.evaluate("document.documentElement.dataset.theme || null"))
        self.assertEqual(self.errors, [])


if __name__ == "__main__":
    unittest.main()
