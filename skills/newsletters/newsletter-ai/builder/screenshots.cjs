// Playwright-driven screenshot capture for a rendered report.html.
// Used to (re)generate the images README.md embeds under assets/images/.
//
// Usage:
//   node screenshots.cjs REPORT_HTML OUTPUT_DIR [SCENE_NAME ...]
// With no scene names, captures every scene in SCENES below. Prints one
// "wrote <path>" line per file on success; exits non-zero with an error
// on stderr on failure (missing file, bad scene name, page error, ...).
//
// CommonJS (not ESM) so NODE_PATH resolution works when Playwright is
// only installed globally rather than in a local node_modules/ — same
// reason tests/browser/check_download.cjs uses it.
const { chromium } = require("playwright");
const fs = require("node:fs");
const path = require("node:path");

// Each scene names one image README.md embeds. `hash` selects the tab,
// `theme` sets light/dark, `action` (optional) is a small interaction to
// perform before the shot (see runAction below).
const SCENES = [
  {
    name: "report-overview-light",
    hash: "home",
    theme: "light",
    action: null,
  },
  {
    name: "report-citations-dark",
    hash: "part1",
    theme: "dark",
    action: "click-first-citation",
  },
];

async function runAction(page, action) {
  if (!action) return;
  if (action === "click-first-citation") {
    await page.click(".tab-panel.active .accordion.open a[data-cite]");
    await page.waitForTimeout(400);
    return;
  }
  throw new Error(`unknown action: ${action}`);
}

async function captureScene(browser, reportHtmlPath, scene, outFile) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 940 } });
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  const fileUrl = "file://" + path.resolve(reportHtmlPath) + (scene.hash ? "#" + scene.hash : "");
  await page.goto(fileUrl, { waitUntil: "load" });
  if (errors.length) throw new Error(`page threw error(s) for scene ${scene.name}: ${errors.join(" | ")}`);
  if (scene.theme === "dark") {
    await page.evaluate(() => document.documentElement.setAttribute("data-theme", "dark"));
  }
  await runAction(page, scene.action);
  await page.evaluate(() => document.body.getBoundingClientRect()); // force layout/paint settle
  await page.screenshot({ path: outFile, fullPage: false });
  await page.close();
}

async function main() {
  const [, , reportHtmlPath, outputDir, ...requestedNames] = process.argv;
  if (!reportHtmlPath || !outputDir) {
    console.error("usage: node screenshots.cjs REPORT_HTML OUTPUT_DIR [SCENE_NAME ...]");
    process.exit(2);
  }
  if (!fs.existsSync(reportHtmlPath)) {
    console.error(`FAIL: report html not found: ${reportHtmlPath}`);
    process.exit(1);
  }
  const scenes = requestedNames.length
    ? requestedNames.map((n) => {
        const s = SCENES.find((sc) => sc.name === n);
        if (!s) {
          console.error(`FAIL: unknown scene: ${n} (known: ${SCENES.map((s2) => s2.name).join(", ")})`);
          process.exit(1);
        }
        return s;
      })
    : SCENES;

  fs.mkdirSync(outputDir, { recursive: true });
  const browser = await chromium.launch();
  try {
    for (const scene of scenes) {
      const outFile = path.join(outputDir, `${scene.name}.png`);
      await captureScene(browser, reportHtmlPath, scene, outFile);
      console.log(`wrote ${outFile}`);
    }
  } finally {
    await browser.close();
  }
}

main().catch((e) => {
  console.error("FAIL: " + (e && e.stack ? e.stack : e));
  process.exit(1);
});
