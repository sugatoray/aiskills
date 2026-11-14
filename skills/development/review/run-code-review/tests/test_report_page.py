"""The HTML report in a real browser: the pinned header and the collapsible verdict.

Runs Chromium through Node's Playwright; skipped where `node` or the `playwright` package is missing.

Run: python3 -m pytest skills/development/review/run-code-review/tests
"""

import importlib.util
import json
import shutil
import subprocess
from pathlib import Path

import pytest

SKILL = Path(__file__).resolve().parents[1]
SCRIPT = SKILL / "scripts" / "render_report.py"
EXAMPLE = SKILL / "assets" / "report-example.json"


def _has_playwright() -> bool:
    if not shutil.which("node"):
        return False
    return subprocess.run(["node", "-e", "require('playwright')"], capture_output=True).returncode == 0


pytestmark = pytest.mark.skipif(not _has_playwright(), reason="needs node and the playwright package")

CHECKS = r"""
const { chromium } = require('playwright');
(async () => {
  const [page_url] = process.argv.slice(2);
  const out = { errors: [] };
  const b = await chromium.launch();
  const rect = (p, sel) => p.evaluate((s) => { const r = document.querySelector(s).getBoundingClientRect();
    return { top: r.top, bottom: r.bottom, height: r.height }; }, sel);
  const visible = (p, sel) => p.evaluate((s) => { const e = document.querySelector(s);
    const r = e.getBoundingClientRect(); return !!(r.width && r.height) && getComputedStyle(e).visibility !== 'hidden'; }, sel);

  // Desktop
  const ctx = await b.newContext({ viewport: { width: 1280, height: 900 } });
  const p = await ctx.newPage();
  p.on('pageerror', (e) => out.errors.push(e.message));
  await p.goto(page_url);
  const toggle = p.locator('#vtoggle');
  out.toggle_tag = await toggle.evaluate((e) => e.tagName);
  out.expanded_at_start = await toggle.getAttribute('aria-expanded');
  out.controls = await toggle.getAttribute('aria-controls');
  const open = await rect(p, '#pinned');
  await p.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await p.waitForTimeout(100);
  out.scrolled = await p.evaluate(() => window.scrollY > 500);
  out.pinned_after_scroll = await rect(p, '#pinned');
  out.counts_after_scroll = await rect(p, '#counts');
  out.side_after_scroll = await rect(p, 'nav.side');
  await p.click('nav.side a[href="#scope"]');
  await p.waitForTimeout(400);
  out.scope_heading = await rect(p, '#scope h2');
  out.pinned_at_scope = await rect(p, '#pinned');
  await toggle.click();
  await p.waitForTimeout(100);
  out.expanded_after_click = await toggle.getAttribute('aria-expanded');
  out.summary_visible_collapsed = await visible(p, '#vsummary');
  out.badge_visible_collapsed = await visible(p, '#vbadge');
  out.reason_visible_collapsed = await visible(p, '#vreason');
  out.pinned_open_height = open.height;
  out.pinned_collapsed_height = (await rect(p, '#pinned')).height;
  await p.reload();
  out.expanded_after_reload = await p.locator('#vtoggle').getAttribute('aria-expanded');
  await p.locator('#vtoggle').click();
  out.expanded_after_second_click = await p.locator('#vtoggle').getAttribute('aria-expanded');
  out.summary_visible_reopened = await visible(p, '#vsummary');

  // Phone
  const m = await (await b.newContext({ viewport: { width: 390, height: 844 } })).newPage();
  m.on('pageerror', (e) => out.errors.push(e.message));
  await m.goto(page_url);
  out.phone_expanded_at_start = await m.locator('#vtoggle').getAttribute('aria-expanded');
  out.phone_pinned_height = (await rect(m, '#pinned')).height;
  out.phone_scroll_width = await m.evaluate(() => document.documentElement.scrollWidth);
  console.log(JSON.stringify(out));
  await b.close();
})();
"""


@pytest.fixture(scope="module")
def page(tmp_path_factory):
    spec = importlib.util.spec_from_file_location("render_report", SCRIPT)
    rr = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(rr)
    folder = tmp_path_factory.mktemp("page")
    html = folder / "report.html"
    html.write_text(rr.render_html(json.loads(EXAMPLE.read_text(encoding="utf-8"))), encoding="utf-8")
    checks = folder / "checks.js"
    checks.write_text(CHECKS, encoding="utf-8")
    result = subprocess.run(["node", str(checks), html.resolve().as_uri()], capture_output=True, text=True, timeout=120)
    assert result.returncode == 0, result.stderr
    return json.loads(result.stdout.strip().splitlines()[-1])


def test_the_page_runs_without_errors(page):
    assert page["errors"] == []


def test_the_header_verdict_and_counts_stay_pinned_while_scrolling(page):
    assert page["scrolled"]
    assert abs(page["pinned_after_scroll"]["top"]) < 1
    assert page["counts_after_scroll"]["top"] >= 0
    assert page["counts_after_scroll"]["bottom"] <= page["pinned_after_scroll"]["bottom"] + 1


def test_the_sidebar_and_section_links_stay_below_the_pinned_block(page):
    assert page["side_after_scroll"]["top"] >= page["pinned_after_scroll"]["bottom"] - 1
    assert page["scope_heading"]["top"] >= page["pinned_at_scope"]["bottom"] - 1


def test_the_verdict_collapses_to_its_badge_and_reason(page):
    assert page["toggle_tag"] == "BUTTON" and page["controls"] == "vsummary"
    assert page["expanded_at_start"] == "true"
    assert page["expanded_after_click"] == "false"
    assert not page["summary_visible_collapsed"]
    assert page["badge_visible_collapsed"] and page["reason_visible_collapsed"]
    assert page["pinned_collapsed_height"] < page["pinned_open_height"] - 20


def test_the_collapsed_state_is_remembered_and_reversible(page):
    assert page["expanded_after_reload"] == "false"
    assert page["expanded_after_second_click"] == "true" and page["summary_visible_reopened"]


def test_on_a_phone_the_verdict_starts_collapsed_and_nothing_scrolls_sideways(page):
    assert page["phone_expanded_at_start"] == "false"
    assert page["phone_pinned_height"] < 844 * 0.35
    assert page["phone_scroll_width"] <= 390


SEARCH_AND_THEME = r"""
const { chromium } = require('playwright');
(async () => {
  const [page_url] = process.argv.slice(2);
  const out = { errors: [] };
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 1280, height: 900 }, colorScheme: 'light' });
  const p = await ctx.newPage();
  p.on('pageerror', (e) => out.errors.push(e.message));
  p.on('dialog', (d) => { out.errors.push('dialog ' + d.message()); d.dismiss(); });
  await p.goto(page_url);
  const s = p.locator('#search');
  out.search_role = await s.getAttribute('role');
  out.search_placeholder = await s.getAttribute('placeholder');
  await p.locator('body').click({ position: { x: 5, y: 600 } });
  await p.keyboard.press('/');
  out.slash_focuses = await p.evaluate(() => document.activeElement && document.activeElement.id);
  const results = async () => p.evaluate(() => {
    const box = document.getElementById('search-results');
    const opts = [...box.querySelectorAll('[role=option]')];
    return { shown: !box.hidden, expanded: document.getElementById('search').getAttribute('aria-expanded'),
             count: opts.length, first: opts[0] ? opts[0].textContent : '', marks: [...box.querySelectorAll('mark')].map(m => m.textContent),
             status: (box.querySelector('.search-status') || {}).textContent || '', imgs: document.querySelectorAll('img').length };
  });
  await s.fill('innerHTML'); await p.waitForTimeout(150);
  out.one_term = await results();
  await s.fill('debug true'); await p.waitForTimeout(150);
  out.two_terms = await results();
  await s.fill('onerror'); await p.waitForTimeout(150);
  out.quoted_markup = await results();
  await s.fill('zzqqxx'); await p.waitForTimeout(150);
  out.no_match = await results();
  // Enter on a finding hidden by a filter: the filter is reset and the card opened.
  await p.locator('.chip', { hasText: 'Blocker' }).click();
  await s.fill('pull_request_target'); await p.waitForTimeout(150);
  await p.keyboard.press('ArrowDown'); await p.keyboard.press('Enter'); await p.waitForTimeout(500);
  out.after_enter = await p.evaluate(() => { const d = document.getElementById('finding-3'); const r = d.getBoundingClientRect();
    const pin = document.getElementById('pinned').getBoundingClientRect();
    return { hidden: d.hidden, open: d.open, top: r.top, below_pinned: r.top >= pin.bottom - 1, in_view: r.top < innerHeight,
             results_hidden: document.getElementById('search-results').hidden }; });
  // A hit outside the findings: the Tests section.
  await s.fill('deletes nothing'); await p.waitForTimeout(150);
  out.tests_hit = await results();
  await p.keyboard.press('Enter'); await p.waitForTimeout(500);
  out.tests_section = await p.evaluate(() => { const r = document.querySelector('#tests h2').getBoundingClientRect();
    return { top: r.top, below_pinned: r.top >= document.getElementById('pinned').getBoundingClientRect().bottom - 1 }; });
  await s.fill('deploy'); await p.waitForTimeout(150);
  await p.keyboard.press('Escape'); await p.waitForTimeout(100);
  out.after_escape = await p.evaluate(() => ({ value: document.getElementById('search').value, hidden: document.getElementById('search-results').hidden }));

  // The light/dark switch, as on the docsite.
  const t = p.locator('#theme');
  out.theme = { tag: await t.evaluate((e) => e.tagName), label_light: await t.getAttribute('aria-label'),
                moon_light: await p.locator('#theme .moon').isVisible(), sun_light: await p.locator('#theme .sun').isVisible() };
  await t.click(); await p.waitForTimeout(100);
  out.theme.after_click = await p.evaluate(() => document.documentElement.getAttribute('data-theme'));
  out.theme.label_dark = await t.getAttribute('aria-label');
  out.theme.sun_dark = await p.locator('#theme .sun').isVisible();
  out.theme.moon_dark = await p.locator('#theme .moon').isVisible();
  out.theme.bg_dark = await p.evaluate(() => getComputedStyle(document.body).backgroundColor);
  await p.reload();
  out.theme.after_reload = await p.evaluate(() => document.documentElement.getAttribute('data-theme'));
  const d = await (await b.newContext({ viewport: { width: 1280, height: 900 }, colorScheme: 'dark' })).newPage();
  await d.goto(page_url);
  out.theme.system_dark_label = await d.locator('#theme').getAttribute('aria-label');
  out.theme.system_dark_effective = await d.evaluate(() => document.documentElement.getAttribute('data-effective'));
  const m = await (await b.newContext({ viewport: { width: 390, height: 844 } })).newPage();
  await m.goto(page_url);
  out.phone = await m.evaluate(() => ({ pinned: document.getElementById('pinned').offsetHeight, width: document.documentElement.scrollWidth,
                                        search_visible: document.getElementById('search').getBoundingClientRect().width > 100 }));
  await m.locator('#search').fill('sql'); await m.waitForTimeout(150);
  out.phone.results = await m.evaluate(() => { const r = document.getElementById('search-results').getBoundingClientRect();
    return { left: r.left, right: r.right, shown: !document.getElementById('search-results').hidden }; });
  console.log(JSON.stringify(out));
  await b.close();
})();
"""


@pytest.fixture(scope="module")
def features(tmp_path_factory):
    spec = importlib.util.spec_from_file_location("render_report", SCRIPT)
    rr = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(rr)
    folder = tmp_path_factory.mktemp("features")
    html = folder / "report.html"
    html.write_text(rr.render_html(json.loads(EXAMPLE.read_text(encoding="utf-8"))), encoding="utf-8")
    checks = folder / "features.js"
    checks.write_text(SEARCH_AND_THEME, encoding="utf-8")
    result = subprocess.run(["node", str(checks), html.resolve().as_uri()], capture_output=True, text=True, timeout=120)
    assert result.returncode == 0, result.stderr
    return json.loads(result.stdout.strip().splitlines()[-1])


def test_search_is_a_combobox_reached_with_slash(features):
    assert features["errors"] == []
    assert features["search_role"] == "combobox" and features["search_placeholder"] == "Search the report"
    assert features["slash_focuses"] == "search"


def test_search_finds_findings_by_any_field_and_marks_the_terms(features):
    one = features["one_term"]
    assert one["shown"] and one["expanded"] == "true" and one["count"] >= 1
    assert "The query is written into the page as HTML" in one["first"]
    assert "innerHTML" in one["marks"]
    two = features["two_terms"]
    assert two["count"] >= 1 and "`debug` is set twice" not in two["first"] and "debug is set twice" in two["first"]
    assert {"debug", "true"} <= {m.lower() for m in two["marks"]}


def test_quoted_markup_is_searched_as_text_and_never_runs(features):
    hit = features["quoted_markup"]
    assert hit["count"] >= 1 and hit["imgs"] == 0


def test_no_match_says_so(features):
    none = features["no_match"]
    assert none["count"] == 0 and "No matches" in none["status"]


def test_enter_opens_a_finding_even_when_a_filter_hid_it(features):
    after = features["after_enter"]
    assert not after["hidden"] and after["open"] and after["below_pinned"] and after["in_view"]
    assert after["results_hidden"]


def test_search_reaches_sections_beyond_the_findings_and_escape_clears(features):
    assert features["tests_hit"]["count"] >= 1 and "Tests" in features["tests_hit"]["first"]
    assert features["tests_section"]["below_pinned"]
    assert features["after_escape"] == {"value": "", "hidden": True}


def test_the_light_dark_switch_matches_the_docsite(features):
    theme = features["theme"]
    assert theme["tag"] == "BUTTON"
    assert theme["label_light"] == "Switch to dark theme" and theme["moon_light"] and not theme["sun_light"]
    assert theme["after_click"] == "dark" and theme["label_dark"] == "Switch to light theme"
    assert theme["sun_dark"] and not theme["moon_dark"]
    assert theme["bg_dark"] != "rgb(247, 247, 245)"
    assert theme["after_reload"] == "dark"
    assert theme["system_dark_label"] == "Switch to light theme" and theme["system_dark_effective"] == "dark"


def test_the_search_fits_on_a_phone(features):
    phone = features["phone"]
    assert phone["search_visible"] and phone["width"] <= 390 and phone["pinned"] < 844 * 0.35
    assert phone["results"]["shown"] and phone["results"]["left"] >= 0 and phone["results"]["right"] <= 390

