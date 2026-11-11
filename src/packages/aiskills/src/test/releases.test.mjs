// Unit tests for src/scripts/core/releases.mjs: the pure parts of
// `aiskills releases` (counts, periods, rows, buckets and rendering).
import assert from "node:assert/strict";
import { describe, test } from "node:test";

import {
  bucketize,
  compareVersions,
  parseCount,
  parsePeriod,
  pickBy,
  relativeAge,
  releaseRows,
  renderReleases,
  renderSeries,
  resolvePeriod,
  todayDate,
} from "../scripts/core/releases.mjs";

const VIEW = {
  time: {
    created: "2026-11-09T05:01:33.181Z",
    modified: "2026-11-11T18:03:59.204Z",
    "0.0.0-stage": "2026-11-09T05:01:33.181Z",
    "0.4.0": "2026-11-09T05:02:49.317Z",
    "0.5.0": "2026-11-09T13:23:22.303Z",
    "0.6.0": "2026-11-11T17:06:37.038Z",
    "0.7.0": "2026-11-11T18:03:58.985Z",
  },
  distTags: { latest: "0.7.0" },
};

const days = (start, counts) =>
  counts.map((downloads, i) => ({ day: new Date(Date.parse(start + "T00:00:00Z") + i * 86400000).toISOString().slice(0, 10), downloads }));

describe("parseCount", () => {
  test("whole numbers of 1 or more, and all", () => {
    assert.equal(parseCount("5"), 5);
    assert.equal(parseCount("12"), 12);
    assert.equal(parseCount("all"), Infinity);
    assert.equal(parseCount("ALL"), Infinity);
  });
  test("anything else is refused", () => {
    for (const bad of ["0", "-1", "1.5", "five", "", "5x"]) {
      assert.throws(() => parseCount(bad), /invalid number of releases/, bad);
    }
  });
});

describe("parsePeriod / resolvePeriod", () => {
  const ctx = { created: "2026-11-09T05:01:33.181Z", lastDay: "2026-11-10" };

  test("all runs from the first publish to npm's latest day", () => {
    assert.deepEqual(resolvePeriod(parsePeriod("all"), ctx), { start: "2026-11-09", end: "2026-11-10", label: "all time" });
    assert.deepEqual(parsePeriod(undefined), { kind: "all" });
  });

  test("<N><unit>: d, w, m (30 days) and y (365 days), any case, ending on npm's latest day", () => {
    assert.deepEqual(resolvePeriod(parsePeriod("7d"), ctx), { start: "2026-11-04", end: "2026-11-10", label: "in the last 7 days" });
    assert.equal(resolvePeriod(parsePeriod("2w"), ctx).start, "2026-10-28");
    assert.deepEqual(resolvePeriod(parsePeriod("1M"), ctx), { start: "2026-10-12", end: "2026-11-10", label: "in the last 30 days" });
    assert.equal(resolvePeriod(parsePeriod("1y"), ctx).start, "2025-11-11");
    assert.equal(resolvePeriod(parsePeriod("1d"), ctx).label, "in the last day");
  });

  test("date ranges: start:end and start: (until npm's latest day); end is capped at it", () => {
    assert.deepEqual(resolvePeriod(parsePeriod("2026-11-01:2026-11-05"), ctx), { start: "2026-11-01", end: "2026-11-05", label: "from 2026-11-01 to 2026-11-05" });
    assert.deepEqual(resolvePeriod(parsePeriod("2026-11-01:"), ctx), { start: "2026-11-01", end: "2026-11-10", label: "from 2026-11-01 to 2026-11-10" });
    assert.equal(resolvePeriod(parsePeriod("2026-11-01:2026-12-31"), ctx).end, "2026-11-10");
  });

  test("a range that starts after npm's latest day is an error", () => {
    assert.throws(() => resolvePeriod(parsePeriod("2026-11-20:"), ctx), /npm has no download counts after 2026-11-10/);
  });

  test("invalid periods are refused, listing the valid forms", () => {
    for (const bad of ["0d", "1.5m", "7days", "7", "d", "1h", "2026-11-31:", "2026-11-05:2026-11-01", "2026/11/01:", "yesterday"]) {
      assert.throws(() => parsePeriod(bad), /invalid period .*\n  use all, <N><d\|w\|m\|y>/, bad);
    }
  });
});

describe("todayDate / relativeAge", () => {
  test("AISKILLS_TODAY sets today; it must be a real date", () => {
    assert.equal(todayDate({ AISKILLS_TODAY: "2026-11-12" }), "2026-11-12");
    assert.match(todayDate({}), /^\d{4}-\d{2}-\d{2}$/);
    assert.throws(() => todayDate({ AISKILLS_TODAY: "2026-13-01" }), /AISKILLS_TODAY must be a date/);
  });
  test("today, days, months and years", () => {
    const t = "2026-11-12";
    assert.equal(relativeAge("2026-11-12T23:00:00Z", t), "today");
    assert.equal(relativeAge("2026-11-11T01:00:00Z", t), "1 day ago");
    assert.equal(relativeAge("2026-11-09T01:00:00Z", t), "3 days ago");
    assert.equal(relativeAge("2026-08-12T01:00:00Z", t), "3 months ago");
    assert.equal(relativeAge("2026-10-12T01:00:00Z", t), "31 days ago");
    assert.equal(relativeAge("2024-11-01T01:00:00Z", t), "2 years ago");
    assert.equal(relativeAge("2026-11-20T01:00:00Z", t), "today");
  });
});

describe("releaseRows", () => {
  test("newest first, tags attached, placeholders hidden, the installed one marked", () => {
    const rows = releaseRows(VIEW, "0.6.0");
    assert.deepEqual(rows.map((r) => r.version), ["0.7.0", "0.6.0", "0.5.0", "0.4.0"]);
    assert.deepEqual(rows[0].tags, ["latest"]);
    assert.deepEqual(rows.map((r) => r.installed), [false, true, false, false]);
    assert.equal(rows[0].published, "2026-11-11T18:03:58.985Z");
  });
});

describe("compareVersions", () => {
  test("by number, and a prerelease before its release", () => {
    const sorted = ["0.9.0", "1.0.0-beta.10", "0.10.0", "1.0.0", "1.0.0-beta.2", "0.10.1"].sort(compareVersions);
    assert.deepEqual(sorted, ["0.9.0", "0.10.0", "0.10.1", "1.0.0-beta.2", "1.0.0-beta.10", "1.0.0"]);
  });
});

describe("releaseRows without publish times (a registry mirror that strips them)", () => {
  const MIRROR = { time: {}, distTags: { latest: "0.10.0" }, versions: ["0.0.0-stage", "0.8.0", "0.9.0", "0.10.0"] };

  test("lists the versions newest first by version number, with no publish date", () => {
    const rows = releaseRows(MIRROR, "0.9.0");
    assert.deepEqual(rows.map((r) => r.version), ["0.10.0", "0.9.0", "0.8.0"]);
    assert.deepEqual(rows.map((r) => r.published), [null, null, null]);
    assert.deepEqual(rows[0].tags, ["latest"]);
    assert.equal(rows[1].installed, true);
  });

  test("the table shows – for the date, says why, and still gives the update hint", () => {
    const out = renderReleases({
      pkg: "@sugatoray-ai/aiskills", rows: releaseRows(MIRROR, "0.9.0"), count: 5, installed: "0.9.0", latest: "0.10.0",
      today: "2026-11-12", registry: "https://npm.corp.example/",
    });
    assert.deepEqual(out.split("\n"), [
      "@sugatoray-ai/aiskills: 3 releases",
      "",
      "  VERSION  PUBLISHED  TAG",
      "  0.10.0   –          latest",
      "  0.9.0    –                  ← installed",
      "  0.8.0    –",
      "",
      "publish dates: not reported by https://npm.corp.example/",
      "update available: 0.9.0 → 0.10.0  (npm install -g @sugatoray-ai/aiskills@latest)",
    ]);
  });

  test("a version is 'not published' only if the versions list lacks it", () => {
    const out = renderReleases({ pkg: "p", rows: releaseRows(MIRROR, "0.11.0"), count: 5, installed: "0.11.0", latest: "0.10.0", today: "2026-11-12" });
    assert.match(out, /^installed: 0\.11\.0 \(not published on npm\)$/m);
  });
});

describe("pickBy / bucketize", () => {
  test("rows: days up to 31 days, weeks up to 183 days, then months", () => {
    assert.equal(pickBy(31), "day");
    assert.equal(pickBy(32), "week");
    assert.equal(pickBy(183), "week");
    assert.equal(pickBy(184), "month");
  });

  test("weeks run from the first day; a short last week is partial", () => {
    const b = bucketize(days("2026-11-01", [1, 1, 1, 1, 1, 1, 1, 2, 2, 2]), "week");
    assert.deepEqual(b.map((x) => [x.start, x.end, x.downloads, x.days, x.size]), [
      ["2026-11-01", "2026-11-07", 7, 7, 7],
      ["2026-11-08", "2026-11-10", 6, 3, 7],
    ]);
  });

  test("months follow the calendar; a month the period only partly covers is partial", () => {
    const b = bucketize(days("2026-10-30", [5, 5, 1, 1]), "month");
    assert.deepEqual(b.map((x) => [x.start, x.end, x.downloads, x.days, x.size]), [
      ["2026-10-30", "2026-10-31", 10, 2, 31],
      ["2026-11-01", "2026-11-02", 2, 2, 30],
    ]);
  });
});

describe("renderSeries", () => {
  const releases = releaseRows(VIEW, "0.7.0");
  const series = bucketize(days("2026-10-28", [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 402, 22]), "day");

  test("chart: bars scaled to the busiest row, runs of zeros collapsed, releases named", () => {
    const out = renderSeries(series, { by: "day", releases });
    assert.deepEqual(out.split("\n"), [
      "  2026-10-28 ▏                                0",
      "  …          (10 more days with 0 downloads)",
      "  2026-11-08 ▏                                0",
      "  2026-11-09 ██████████████████████████████ 402  0.4.0, 0.5.0 published",
      "  2026-11-10 █▋                              22",
    ]);
  });

  test("--ascii draws # bars", () => {
    const out = renderSeries(series, { by: "day", releases, ascii: true });
    assert.match(out, /2026-11-09 #{30} 402/);
    assert.match(out, /2026-11-10 #{2} {28}  22/);
  });

  test("table: period, downloads and releases, no bars, nothing collapsed", () => {
    const out = renderSeries(series, { by: "day", releases, table: true }).split("\n");
    assert.equal(out[0], "  DAY         DOWNLOADS  RELEASED");
    assert.equal(out.length, 15);
    assert.equal(out[13], "  2026-11-09        402  0.4.0, 0.5.0");
  });

  test("weekly and monthly rows are labelled, and partial ones say so", () => {
    const weeks = bucketize(days("2026-11-01", [1, 1, 1, 1, 1, 1, 1, 2, 2, 2]), "week");
    const out = renderSeries(weeks, { by: "week", releases: [] });
    assert.match(out, /^ {2}week of 2026-11-01 █+ +7$/m);
    assert.match(out, /week of 2026-11-08 .* 6  \(partial: 3 of 7 days\)$/m);
    const months = renderSeries(bucketize(days("2026-10-30", [5, 5, 1, 1]), "month"), { by: "month", releases: [], table: true });
    assert.match(months, /^ {2}MONTH +DOWNLOADS +RELEASED$/m);
    assert.match(months, /^ {2}2026-10 +10 +\(partial: 2 of 31 days\)$/m);
  });
});

describe("renderReleases", () => {
  const rows = releaseRows(VIEW, "0.6.0");

  test("the latest N, with dates, ages, tags, the installed marker and an update hint", () => {
    const out = renderReleases({ pkg: "@sugatoray-ai/aiskills", rows, count: 3, installed: "0.6.0", latest: "0.7.0", today: "2026-11-12" });
    assert.deepEqual(out.split("\n"), [
      "@sugatoray-ai/aiskills: latest 3 of 4 releases",
      "",
      "  VERSION  PUBLISHED                TAG",
      "  0.7.0    2026-11-11 (1 day ago)   latest",
      "  0.6.0    2026-11-11 (1 day ago)           ← installed",
      "  0.5.0    2026-11-09 (3 days ago)",
      "",
      "update available: 0.6.0 → 0.7.0  (npm install -g @sugatoray-ai/aiskills@latest)",
      "more: aiskills releases all",
    ]);
  });

  test("all of them, a version not on npm, and the 7-day downloads column", () => {
    const out = renderReleases({
      pkg: "@sugatoray-ai/aiskills", rows: releaseRows(VIEW, "0.8.0"), count: Infinity, installed: "0.8.0", latest: "0.7.0",
      today: "2026-11-12", perVersion: { "0.4.0": 162, "0.5.0": 140, "0.0.0-stage": 122 },
    });
    const lines = out.split("\n");
    assert.equal(lines[0], "@sugatoray-ai/aiskills: 4 releases");
    assert.equal(lines[2], "  VERSION  PUBLISHED                TAG     DOWNLOADS (7 DAYS)");
    assert.equal(lines[3], "  0.7.0    2026-11-11 (1 day ago)   latest                   –");
    assert.equal(lines[6], "  0.4.0    2026-11-09 (3 days ago)                         162");
    assert.ok(lines.includes("installed: 0.8.0 (not published on npm)"));
    assert.ok(!out.includes("more:"));
  });
});
