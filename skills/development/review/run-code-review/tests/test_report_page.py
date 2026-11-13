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
