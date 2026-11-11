#!/usr/bin/env node
// Render a deterministic scene page (window.setT(t)) to PNG frames, and
// optionally encode them to a silent MP4.
//
//   node render.js index.html --preview 0,2,7,11          # look before a full render
//   node render.js index.html --thumbnail thumbnail.png   # frame 0 as the cover image
//   node render.js index.html --encode promo_silent.mp4   # full render + encode
//
// Options:
//   --duration S    seconds to render (default: window.DURATION from the page)
//   --fps N         frames per second (default 24)
//   --frames DIR    frame directory (default ./frames; emptied before a full render)
//   --preview LIST  comma-separated times; writes DIR/../preview/p_<t>.png and exits
//   --thumbnail F   write the t=0 frame to F (may be combined with the others)
//   --encode F      after rendering, encode frames to F with ffmpeg (libx264, yuv420p)
//   --width/--height  viewport (default 1280x720)
//
// Needs Playwright with a Chromium build (require('playwright')). If the
// browser lives elsewhere, set CHROMIUM_PATH.
"use strict";
const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

function parseArgs(argv) {
  const o = { fps: 24, frames: "frames", width: 1280, height: 720 };
  const rest = [];
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (!a.startsWith("--")) { rest.push(a); continue; }
    const key = a.slice(2);
    const val = argv[++i];
    if (val === undefined) throw new Error(`missing value for ${a}`);
    o[key] = val;
  }
  if (rest.length !== 1) throw new Error("usage: node render.js <page.html> [options]");
  o.page = path.resolve(rest[0]);
  o.fps = Number(o.fps);
  o.width = Number(o.width);
  o.height = Number(o.height);
  if (o.duration !== undefined) o.duration = Number(o.duration);
  return o;
}

async function main() {
  const o = parseArgs(process.argv.slice(2));
  if (!fs.existsSync(o.page)) throw new Error(`page not found: ${o.page}`);
  const { chromium } = require("playwright");
  const launch = process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {};
  const browser = await chromium.launch(launch);
  try {
    const page = await browser.newPage({ viewport: { width: o.width, height: o.height }, deviceScaleFactor: 1 });
    await page.goto("file://" + o.page, { waitUntil: "load" });
    await page.evaluate(() => document.fonts && document.fonts.ready);
    const hasSetT = await page.evaluate(() => typeof window.setT === "function");
    if (!hasSetT) throw new Error("page does not define window.setT(t)");
    const at = async (t, file) => {
      await page.evaluate((x) => window.setT(x), t);
      await page.screenshot({ path: file });
    };

    if (o.thumbnail) {
      await at(0, path.resolve(o.thumbnail));
      console.log(`thumbnail: ${o.thumbnail}`);
    }

    if (o.preview) {
      const dir = path.join(path.dirname(path.resolve(o.frames)), "preview");
      fs.mkdirSync(dir, { recursive: true });
      for (const s of String(o.preview).split(",").map((x) => x.trim()).filter(Boolean)) {
        const t = Number(s);
        if (!Number.isFinite(t)) throw new Error(`bad preview time: ${s}`);
        const f = path.join(dir, `p_${t.toFixed(2)}.png`);
        await at(t, f);
        console.log(`preview: ${f}`);
      }
      return;
    }

    if (o.thumbnail && !o.encode && o.duration === undefined) return; // thumbnail only

    const duration = o.duration ?? (await page.evaluate(() => window.DURATION));
    if (!(duration > 0)) throw new Error("no duration: pass --duration or set window.DURATION in the page");
    const dir = path.resolve(o.frames);
    fs.mkdirSync(dir, { recursive: true });
    for (const f of fs.readdirSync(dir)) if (/^f_\d+\.png$/.test(f)) fs.unlinkSync(path.join(dir, f)); // no stale frames
    const n = Math.round(duration * o.fps);
    for (let i = 0; i < n; i++) {
      await at(i / o.fps, path.join(dir, `f_${String(i).padStart(5, "0")}.png`));
      if (i % (o.fps * 5) === 0) process.stdout.write(`\rframe ${i}/${n}`);
    }
    console.log(`\rrendered ${n} frames (${duration}s @ ${o.fps}fps) to ${dir}`);

    if (o.encode) {
      const out = path.resolve(o.encode);
      const r = spawnSync("ffmpeg", ["-y", "-loglevel", "error", "-framerate", String(o.fps),
        "-i", path.join(dir, "f_%05d.png"), "-c:v", "libx264", "-preset", "veryfast", "-crf", "20",
        "-pix_fmt", "yuv420p", out], { stdio: "inherit" });
      if (r.status !== 0) throw new Error("ffmpeg encode failed");
      console.log(`encoded: ${out}`);
    }
  } finally {
    await browser.close();
  }
}

main().catch((e) => { console.error(`render.js: ${e.message}`); process.exit(1); });
