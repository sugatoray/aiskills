// `aiskills releases` (alias `rel`): the package's releases from the npm
// registry (`npm view <pkg> time dist-tags`), and with --downloads, download
// counts from api.npmjs.org. Everything here but npmView() and fetchJson()
// is pure, so it can be unit-tested (src/test/releases.test.mjs).

import { spawnSync } from "node:child_process";

import { childEnv } from "./installer.mjs";

const DAY = 86_400_000;
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const ms = (day) => Date.parse(`${day}T00:00:00Z`);
const iso = (t) => new Date(t).toISOString().slice(0, 10);
const addDays = (day, n) => iso(ms(day) + n * DAY);
const isDate = (s) => DATE.test(s) && !Number.isNaN(ms(s)) && iso(ms(s)) === s;
const fmt = (n) => n.toLocaleString("en-US");
const plural = (n, word) => `${n} ${word}${n === 1 ? "" : "s"}`;

/** npm versions that are not real releases: npm's staged-publish placeholder. */
const HIDDEN = /-stage$/;
/** npm's download counts start here. */
const NPM_DATA_START = "2015-01-10";
/** The longest range api.npmjs.org answers in one request (18 months). */
const MAX_RANGE_DAYS = 540;
/** Default number of releases shown. */
export const DEFAULT_COUNT = 5;
export const CHANGELOG_URL = "https://github.com/sugatoray/aiskills/blob/master/src/packages/aiskills/CHANGELOG.md";

// ------------------------------------------------------------------ parsing

/** "5" -> 5, "all" -> Infinity; anything else is an error. */
export function parseCount(value) {
  const v = String(value ?? "").trim().toLowerCase();
  if (v === "all") return Infinity;
  if (/^\d+$/.test(v) && Number(v) > 0) return Number(v);
  throw new Error(`invalid number of releases '${value}' (use a whole number of 1 or more, or all)`);
}

const UNITS = { d: 1, w: 7, m: 30, y: 365 };

/**
 * A --downloads period:
 *   all                     since the first publish (the default)
 *   <N><d|w|m|y>            the last N days, weeks (7 days), months (30 days) or years (365 days)
 *   <YYYY-MM-DD>:<YYYY-MM-DD>, <YYYY-MM-DD>:   a date range; an open end means npm's latest day
 */
export function parsePeriod(input) {
  if (input === undefined || input === true) return { kind: "all" };
  const s = String(input).trim().toLowerCase();
  if (s === "all") return { kind: "all" };
  let m = /^(\d+)([dwmy])$/.exec(s);
  if (m && Number(m[1]) > 0) return { kind: "last", days: Number(m[1]) * UNITS[m[2]] };
  m = /^(\d{4}-\d{2}-\d{2}):(\d{4}-\d{2}-\d{2})?$/.exec(s);
  if (m && isDate(m[1]) && (!m[2] || (isDate(m[2]) && m[1] <= m[2]))) return { kind: "range", start: m[1], end: m[2] };
  throw new Error(
    `invalid period '${input}'\n` +
      `  use all, <N><d|w|m|y> (7d, 2w, 1m = 30 days, 1y = 365 days), <YYYY-MM-DD>:<YYYY-MM-DD> or <YYYY-MM-DD>:`,
  );
}

/** Turn a parsed period into { start, end, label }, given the first publish and npm's latest day of data. */
export function resolvePeriod(period, { created, lastDay }) {
  let start;
  let end = lastDay;
  let label;
  if (period.kind === "all") {
    start = created ? iso(Date.parse(created)) : NPM_DATA_START;
    label = "all time";
  } else if (period.kind === "last") {
    start = addDays(lastDay, -(period.days - 1));
    label = period.days === 1 ? "in the last day" : `in the last ${period.days} days`;
  } else {
    start = period.start;
    if (period.end && period.end < lastDay) end = period.end;
    if (start > lastDay) throw new Error(`npm has no download counts after ${lastDay}; pick a period that starts on or before it`);
    label = `from ${start} to ${end}`;
  }
  if (start < NPM_DATA_START) start = NPM_DATA_START;
  if (start > end) start = end;
  return { start, end, label };
}

/** Today as YYYY-MM-DD (UTC), or AISKILLS_TODAY (for reproducible output). */
export function todayDate(env = process.env) {
  const t = env.AISKILLS_TODAY?.trim();
  if (!t) return iso(Date.now());
  if (!isDate(t)) throw new Error(`AISKILLS_TODAY must be a date (YYYY-MM-DD); got '${t}'`);
  return t;
}

/** "today", "1 day ago", "31 days ago", "3 months ago", "2 years ago". */
export function relativeAge(published, today) {
  const days = Math.round((ms(today) - ms(iso(Date.parse(published)))) / DAY);
  if (days <= 0) return "today";
  if (days < 45) return `${plural(days, "day")} ago`;
  if (days < 365) return `${plural(Math.round(days / 30), "month")} ago`;
  return `${plural(Math.floor(days / 365), "year")} ago`;
}

// ------------------------------------------------------------- npm + api

/** `npm view <pkg> time dist-tags --json`, through the user's npm config. */
export function npmView(pkg) {
  const win = process.platform === "win32";
  const res = spawnSync(win ? "npm.cmd" : "npm", ["view", pkg, "time", "dist-tags", "--json"], {
    encoding: "utf8",
    env: childEnv(),
    shell: win,
    timeout: 60_000,
    maxBuffer: 16 * 1024 * 1024,
  });
  const why = (res.error?.message ?? res.stderr ?? "")
    .split("\n")
    .map((l) => l.replace(/^npm (error|ERR!)\s*/i, "").trim())
    .find((l) => l && !/^(code|A complete log)/i.test(l));
  if (res.error || res.status !== 0) {
    throw new Error(`could not read the releases of ${pkg} from npm${why ? `: ${why}` : ""}`);
  }
  try {
    const data = JSON.parse(res.stdout);
    return { time: data.time ?? {}, distTags: data["dist-tags"] ?? {} };
  } catch {
    throw new Error(`could not read the releases of ${pkg} from npm: unexpected output from 'npm view'`);
  }
}

/** Base URL of the npm download counts API (AISKILLS_NPM_API_URL overrides it, for tests). */
export const apiBase = () => (process.env.AISKILLS_NPM_API_URL || "https://api.npmjs.org").replace(/\/+$/, "");

// Runs in a child `node` with NODE_USE_ENV_PROXY=1, so HTTPS_PROXY is honoured
// (plain fetch ignores it) and the CLI can stay synchronous.
const FETCH_SCRIPT = `
fetch(process.argv[1], { signal: AbortSignal.timeout(20000) })
  .then(async (r) => {
    const t = await r.text();
    if (!r.ok) { process.stderr.write("HTTP " + r.status); process.exit(2); }
    process.stdout.write(t);
  })
  .catch((e) => { process.stderr.write(String(e.cause?.code || e.cause?.message || e.message)); process.exit(3); });
`;

/** GET <url> and parse JSON; throws "could not reach <host>: <why>". */
export function fetchJson(url) {
  const res = spawnSync(process.execPath, ["-e", FETCH_SCRIPT, url], {
    encoding: "utf8",
    env: { ...childEnv(), NODE_USE_ENV_PROXY: "1", NODE_NO_WARNINGS: "1" },
    timeout: 30_000,
    maxBuffer: 16 * 1024 * 1024,
  });
  if (res.error || res.status !== 0) {
    throw new Error(`could not reach ${new URL(url).host}: ${(res.stderr || res.error?.message || "no answer").trim()}`);
  }
  try {
    return JSON.parse(res.stdout);
  } catch {
    throw new Error(`could not reach ${new URL(url).host}: the answer was not JSON`);
  }
}

/**
 * Download counts for <pkg>: npm's latest day, the per-version counts of the
 * last 7 days (the only per-version counts npm keeps), and the package's
 * daily totals over <period> (fetched in 18-month pieces).
 */
export function fetchDownloads(pkg, period, { created } = {}) {
  const api = apiBase();
  const lastDay = fetchJson(`${api}/downloads/point/last-day/${pkg}`).end;
  if (!isDate(lastDay ?? "")) throw new Error(`could not reach ${new URL(api).host}: no latest day in its answer`);
  const range = resolvePeriod(period, { created, lastDay });
  const perVersion = fetchJson(`${api}/versions/${encodeURIComponent(pkg)}/last-week`).downloads ?? {};
  const counts = new Map();
  for (let s = range.start; s <= range.end; ) {
    const e = [addDays(s, MAX_RANGE_DAYS - 1), range.end].sort()[0];
    for (const d of fetchJson(`${api}/downloads/range/${s}:${e}/${pkg}`).downloads ?? []) counts.set(d.day, d.downloads);
    s = addDays(e, 1);
  }
  const days = [];
  for (let d = range.start; d <= range.end; d = addDays(d, 1)) days.push({ day: d, downloads: counts.get(d) ?? 0 });
  return { ...range, lastDay, total: days.reduce((n, d) => n + d.downloads, 0), perVersion, days };
}

// ------------------------------------------------------------------ shaping

/** Releases newest first: { version, published, tags, installed }; placeholders left out. */
export function releaseRows({ time, distTags }, installed) {
  const tagsOf = {};
  for (const [tag, v] of Object.entries(distTags ?? {})) (tagsOf[v] ??= []).push(tag);
  return Object.entries(time ?? {})
    .filter(([v]) => v !== "created" && v !== "modified" && !HIDDEN.test(v))
    .map(([version, published]) => ({ version, published, tags: tagsOf[version] ?? [], installed: version === installed }))
    .sort((a, b) => b.published.localeCompare(a.published));
}

/** Row size for a chart of <nDays>: day (≤ 31), week (≤ 183), else month. */
export const pickBy = (nDays) => (nDays <= 31 ? "day" : nDays <= 183 ? "week" : "month");

const daysInMonth = (ym) => new Date(Date.UTC(Number(ym.slice(0, 4)), Number(ym.slice(5, 7)), 0)).getUTCDate();

/** Group daily counts into rows: { start, end, downloads, days, size } (days < size: partial). */
export function bucketize(days, by) {
  const out = [];
  const push = (chunk, size) =>
    out.push({ start: chunk[0].day, end: chunk.at(-1).day, downloads: chunk.reduce((n, d) => n + d.downloads, 0), days: chunk.length, size });
  if (by === "day") for (const d of days) push([d], 1);
  else if (by === "week") for (let i = 0; i < days.length; i += 7) push(days.slice(i, i + 7), 7);
  else {
    const months = new Map();
    for (const d of days) (months.get(d.day.slice(0, 7)) ?? months.set(d.day.slice(0, 7), []).get(d.day.slice(0, 7))).push(d);
    for (const [ym, chunk] of months) push(chunk, daysInMonth(ym));
  }
  return out;
}

/** Versions published within a row. */
const publishedIn = (row, releases) =>
  releases
    .filter((r) => {
      const d = iso(Date.parse(r.published));
      return d >= row.start && d <= row.end;
    })
    .map((r) => r.version)
    .reverse();

// ---------------------------------------------------------------- rendering

const BAR_WIDTH = 30;
const EIGHTHS = ["", "▏", "▎", "▍", "▌", "▋", "▊", "▉"];

function bar(value, max, ascii) {
  if (ascii) return "#".repeat(max ? Math.round((value / max) * BAR_WIDTH) : 0);
  if (!value || !max) return "▏";
  const units = (value / max) * BAR_WIDTH;
  let full = Math.floor(units);
  let frac = Math.round((units - full) * 8);
  if (frac === 8) [full, frac] = [full + 1, 0];
  return "█".repeat(full) + EIGHTHS[frac] || "▏";
}

const UNIT_WORD = { day: "day", week: "week", month: "month" };
const rowLabel = (row, by) => (by === "week" ? `week of ${row.start}` : by === "month" ? row.start.slice(0, 7) : row.start);

/** The per-row notes: releases in it, and whether it is partial. */
function rowNotes(row, releases, { short = false } = {}) {
  const notes = [];
  const pub = publishedIn(row, releases);
  if (pub.length) notes.push(short ? pub.join(", ") : `${pub.join(", ")} published`);
  if (row.days < row.size) notes.push(`(partial: ${row.days} of ${row.size} days)`);
  return notes.join("  ");
}

/**
 * The downloads breakdown: a bar chart (default) or a plain table (table: true).
 * In the chart, a run of 3+ empty rows is collapsed to its first and last row.
 */
export function renderSeries(rows, { by, releases = [], table = false, ascii = false }) {
  const labels = rows.map((r) => rowLabel(r, by));
  const valueWidth = Math.max(...rows.map((r) => fmt(r.downloads).length), 1);
  if (table) {
    const head = { day: "DAY", week: "WEEK", month: "MONTH" }[by];
    const w = Math.max(head.length, ...labels.map((l) => l.length));
    const dw = Math.max("DOWNLOADS".length, valueWidth);
    const lines = [`  ${head.padEnd(w)}  ${"DOWNLOADS".padStart(dw)}  RELEASED`];
    rows.forEach((r, i) => lines.push(`  ${labels[i].padEnd(w)}  ${fmt(r.downloads).padStart(dw)}  ${rowNotes(r, releases, { short: true })}`.trimEnd()));
    return lines.join("\n");
  }
  const w = Math.max(...labels.map((l) => l.length));
  const max = Math.max(...rows.map((r) => r.downloads));
  const line = (r, i) =>
    `  ${labels[i].padEnd(w)} ${bar(r.downloads, max, ascii).padEnd(BAR_WIDTH)} ${fmt(r.downloads).padStart(valueWidth)}  ${rowNotes(r, releases)}`.trimEnd();
  const lines = [];
  for (let i = 0; i < rows.length; ) {
    let j = i;
    while (j < rows.length && rows[j].downloads === 0 && !publishedIn(rows[j], releases).length) j++;
    if (j - i >= 3) {
      lines.push(line(rows[i], i));
      lines.push(`  ${"…".padEnd(w)} (${plural(j - i - 2, `more ${UNIT_WORD[by]}`)} with 0 downloads)`);
      lines.push(line(rows[j - 1], j - 1));
      i = j;
    } else {
      lines.push(line(rows[i], i));
      i++;
    }
  }
  return lines.join("\n");
}

/**
 * The release table. With perVersion (from fetchDownloads), adds the
 * 7-day downloads column ("–" = no count yet).
 */
export function renderReleases({ pkg, rows, count, installed, latest, today, perVersion, command = "aiskills releases" }) {
  const shown = rows.slice(0, count);
  const head = shown.length < rows.length ? `latest ${shown.length} of ${plural(rows.length, "release")}` : plural(rows.length, "release");
  const cells = shown.map((r) => ({
    version: r.version,
    published: `${iso(Date.parse(r.published))} (${relativeAge(r.published, today)})`,
    tag: r.tags.join(","),
    downloads: perVersion ? (r.version in perVersion ? fmt(perVersion[r.version]) : "–") : null,
    installed: r.installed,
  }));
  const w = (key, title) => Math.max(title.length, ...cells.map((c) => c[key].length));
  const [vw, pw, tw] = [w("version", "VERSION"), w("published", "PUBLISHED"), w("tag", "TAG")];
  const dt = "DOWNLOADS (7 DAYS)";
  const dw = perVersion ? w("downloads", dt) : 0;
  const lines = [`${pkg}: ${head}`, ""];
  const row = (v, p, t, d, mark) =>
    `  ${v.padEnd(vw)}  ${p.padEnd(pw)}  ${t.padEnd(tw)}${perVersion ? `  ${d.padStart(dw)}` : ""}${mark ? `  ${mark}` : ""}`.trimEnd();
  lines.push(row("VERSION", "PUBLISHED", "TAG", dt));
  for (const c of cells) lines.push(row(c.version, c.published, c.tag, c.downloads ?? "", c.installed ? "← installed" : ""));
  const notes = [];
  const published = rows.some((r) => r.version === installed);
  if (!published && installed) notes.push(`installed: ${installed} (not published on npm)`);
  else if (latest && installed && latest !== installed && rows.findIndex((r) => r.version === latest) < rows.findIndex((r) => r.version === installed)) {
    notes.push(`update available: ${installed} → ${latest}  (npm install -g ${pkg}@latest)`);
  }
  if (shown.length < rows.length) notes.push(`more: ${command} all`);
  if (notes.length) lines.push("", ...notes);
  return lines.join("\n");
}
