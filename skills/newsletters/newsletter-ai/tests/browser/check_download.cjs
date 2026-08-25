// Playwright-driven browser regression check for the "Download data"
// button: builds a report with `-r`, opens the real HTML in a real
// browser, clicks the button, and asserts the downloaded file is a
// byte-for-byte match for the source YAML (this catches bugs pure-Python
// round-trip tests cannot, e.g. atob() returning a binary string instead
// of decoded Unicode text for multi-byte characters like em-dashes).
//
// Invoked from tests/test_browser_download.py via subprocess — this file
// is the "test", the .py wrapper is what makes `pytest` able to run it
// and report pass/fail like any other test in tests/.
//
// CommonJS (not ESM) so that NODE_PATH resolution works when Playwright
// is only installed globally rather than in a local node_modules/.
const { chromium } = require("playwright");
const { readFileSync } = require("node:fs");
const path = require("node:path");

const reportHtmlPath = process.argv[2];
const sourceYamlPath = process.argv[3];
const outPath = process.argv[4];

function fail(msg) {
  console.error("FAIL: " + msg);
  process.exit(1);
}

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext({ acceptDownloads: true });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));

  await page.goto("file://" + path.resolve(reportHtmlPath), { waitUntil: "load" });

  if (errors.length) fail("page threw error(s): " + errors.join(" | "));

  const visible = await page.isVisible("#downloadDataBtn");
  if (!visible) fail("#downloadDataBtn did not become visible");

  const [download] = await Promise.all([
    page.waitForEvent("download", { timeout: 8000 }),
    page.click("#downloadDataBtn"),
  ]);

  await download.saveAs(outPath);
  const downloaded = readFileSync(outPath, "utf-8");
  const original = readFileSync(sourceYamlPath, "utf-8");

  if (downloaded !== original) {
    const origChars = [...original];
    const downChars = [...downloaded];
    let firstDiff = -1;
    for (let i = 0; i < Math.max(origChars.length, downChars.length); i++) {
      if (origChars[i] !== downChars[i]) { firstDiff = i; break; }
    }
    fail(
      `downloaded content does not match source byte-for-byte ` +
      `(len ${downloaded.length} vs ${original.length}, first diff at char ${firstDiff}: ` +
      `${JSON.stringify(origChars.slice(Math.max(0, firstDiff - 10), firstDiff + 10).join(""))} vs ` +
      `${JSON.stringify(downChars.slice(Math.max(0, firstDiff - 10), firstDiff + 10).join(""))})`
    );
  }

  console.log("OK");
  await browser.close();
})().catch((e) => { fail(String(e && e.stack || e)); });
