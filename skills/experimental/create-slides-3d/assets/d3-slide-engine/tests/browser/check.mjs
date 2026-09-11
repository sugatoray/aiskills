import assert from "node:assert/strict";
import { existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { chromium } from "playwright";

const port = 4173;
const baseURL = `http://127.0.0.1:${port}`;
const fixture = `${baseURL}/tests/browser/fixture.html`;
const outputDir = join(process.cwd(), "test-results");
mkdirSync(outputDir, { recursive: true });

const browser = await chromium.launch({ headless: true });
try {
  const errors = [];
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => message.type() === "error" && errors.push(message.text()));

  await page.goto(fixture, { waitUntil: "networkidle" });
  await page.screenshot({ path: join(outputDir, "origin-desktop.png"), fullPage: true });
  assert.equal(await page.locator("svg").count(), 1);
  assert.equal(await page.locator("polygon").count(), 3);
  assert.equal(await page.locator("text").textContent(), "Origin");
  assert.ok(await page.locator("svg").getAttribute("aria-label"));
  assert.ok(existsSync(join(outputDir, "origin-desktop.png")));

  await page.keyboard.press("ArrowRight");
  await page.waitForTimeout(750);
  assert.match(page.url(), /#trajectory$/);
  assert.equal(await page.locator("polygon").count(), 6);
  assert.equal(await page.locator("text").textContent(), "Trajectory");
  await page.screenshot({ path: join(outputDir, "trajectory-desktop.png"), fullPage: true });

  await page.goto(`${fixture}#origin`, { waitUntil: "networkidle" });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.reload({ waitUntil: "networkidle" });
  assert.equal(await page.locator("text").textContent(), "Origin");
  const mobileBox = await page.locator("svg").boundingBox();
  assert.ok(mobileBox && mobileBox.width > 0 && mobileBox.height > 0);
  await page.screenshot({ path: join(outputDir, "origin-mobile.png"), fullPage: true });

  const reduced = await browser.newPage();
  await reduced.emulateMedia({ reducedMotion: "reduce" });
  await reduced.goto(fixture, { waitUntil: "networkidle" });
  assert.equal(await reduced.locator("polygon").count(), 3);
  await reduced.close();
  assert.deepEqual(errors, [], `browser errors: ${errors.join(" | ")}`);
  console.log("PASS browser rendering, navigation, responsive, screenshot, and reduced-motion checks");
} finally {
  await browser.close();
}
