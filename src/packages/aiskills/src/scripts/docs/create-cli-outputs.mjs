#!/usr/bin/env node
// Build the CLI outputs page: every aiskills command and what it prints, in color.
//
// Usage: node src/scripts/docs/create-cli-outputs.mjs [--check] [--out FILE]
//        (npm run cli-outputs, npm run cli-outputs:check)
//
// The commands, their groups and notes are in docs/cli-outputs/commands.json. Each
// one runs in the sandbox the docs examples use (src/test/helpers.mjs): a copy of
// the package laid out like `npm install -g`, a fresh home folder, the stand-in npx
// and npm, the sample registry data (DOCS_VIEW) and download counts (SAMPLE_API).
// Output is captured with FORCE_COLOR=1, sandbox paths are shown as a real install
// would have them, and the color codes become HTML spans in
// templates/cli-outputs-template.html. The page goes to
// docs/docsite/reference/cli-outputs.html, which reference/cli-outputs.md embeds.
//
// Two values differ between machines and runs: the Node.js version (`info`) and the
// time skills were saved (`saved by`). mask() hides them when pages are compared,
// so --check passes on any machine, and an unchanged page isn't rewritten.
//
// Used only to build the docs, so it is not published.

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { SKILLS_CLI_VERSION } from "../core/installer.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const PKG_DIR = resolve(HERE, "..", "..", "..");
export const CONFIG = join(PKG_DIR, "docs", "cli-outputs", "commands.json");
export const OUT = join(PKG_DIR, "docs", "docsite", "reference", "cli-outputs.html");
const TEMPLATE = join(HERE, "templates", "cli-outputs-template.html");
const INSTALLED_AT = "/usr/local/lib/node_modules/@sugatoray-ai/aiskills";

/** The commands, groups and notes. */
export function readConfig(file = CONFIG) {
  return JSON.parse(readFileSync(file, "utf8"));
}

const ESC = (s) => s.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c]);
const FG = { 30: "k", 31: "r", 32: "g", 33: "y", 34: "bl", 35: "m", 36: "c", 37: "w", 90: "gr", 91: "r", 92: "g", 93: "y", 94: "bl", 95: "m", 96: "c", 97: "w" };

/**
 * Terminal text to HTML: SGR color codes become <span class="t-…"> (t-b bold, t-d dim,
 * t-r/t-g/t-y/t-c… colors), other escape sequences are dropped, a carriage return
 * keeps what was written last on its line, and trailing blank space goes.
 */
export function ansiToHtml(text) {
  const lines = String(text).split("\n").map((l) => l.split("\r").at(-1).trimEnd());
  while (lines.length && lines.at(-1) === "") lines.pop();
  const raw = lines.join("\n").replace(/\x1b\[[0-9;?]*[A-Za-ln-z]/g, "").replace(/\x1b\][^\x07]*\x07/g, "");
  const st = { b: false, d: false, fg: null };
  let html = "";
  let pos = 0;
  const emit = (seg) => {
    const cls = [st.b && "t-b", st.d && "t-d", st.fg && `t-${st.fg}`].filter(Boolean);
    html += cls.length ? `<span class="${cls.join(" ")}">${ESC(seg)}</span>` : ESC(seg);
  };
  for (const m of raw.matchAll(/\x1b\[([0-9;]*)m/g)) {
    if (m.index > pos) emit(raw.slice(pos, m.index));
    const codes = m[1].split(";").map((c) => Number(c || 0));
    for (let i = 0; i < codes.length; i++) {
      const c = codes[i];
      if (c === 0) Object.assign(st, { b: false, d: false, fg: null });
      else if (c === 1) st.b = true;
      else if (c === 2) st.d = true;
      else if (c === 22) st.b = st.d = false;
      else if (c === 39) st.fg = null;
      else if (FG[c]) st.fg = FG[c];
      else if (c === 38 || c === 48) i += codes[i + 1] === 5 ? 2 : 4;
    }
    pos = m.index + m[0].length;
  }
  if (pos < raw.length) emit(raw.slice(pos));
  return html;
}

/** Hide what differs between machines and runs: the Node.js version and platform, and save times. */
export function mask(text) {
  return String(text)
    .replace(/v\d+\.\d+\.\d+ \((?:aix|android|darwin|freebsd|linux|openbsd|sunos|win32)-[a-z0-9]+\)/g, "v<node> (<platform>)")
    .replace(/\d{4}-\d{2}-\d{2} \d{2}:\d{2} UTC/g, "<date> <time> UTC");
}

/** Run every command in commands.json in the docs sandbox; returns the config with code and out added to each item. */
export async function capture(config) {
  if (process.platform === "win32") throw new Error("create-cli-outputs needs a POSIX shell for the stand-in npx and npm");
  const { DOCS_VIEW, SAMPLE_API, sandbox } = await import("../../test/helpers.mjs");
  const box = sandbox({ realSkills: true, stats: true, globalNpm: true });
  try {
    await box.startApi();
    box.setView(DOCS_VIEW);
    box.setApi(SAMPLE_API);
    const groups = [];
    for (const g of config.groups) {
      const items = [];
      for (const item of g.items) {
        box.setList((item.list ?? []).map((name) => ({ name, scope: "global", agents: ["Claude Code"], source: box.root, sourceType: "local" })));
        box.setFind(item.find ? item.find + "\n" : "");
        const env = {
          FORCE_COLOR: "1",
          AISKILLS_HOME: undefined, // the sandbox's install root is the default one
          AISKILLS_TODAY: item.today ? config.today : undefined,
          ...(item.api ? {} : { AISKILLS_NPM_API_URL: undefined }),
        };
        const res = box.run(item.args, { env });
        const out = res.out.replaceAll(box.pkg, INSTALLED_AT).replaceAll(box.home, "~");
        items.push({ ...item, code: res.status, out });
      }
      groups.push({ ...g, items });
    }
    return { ...config, groups };
  } finally {
    box.cleanup();
  }
}

const shellArg = (a) => (/^[\w@%+=:,./-]+$/.test(a) ? a : `'${a.replace(/'/g, "'\\''")}'`);

/** The page, from captured commands. */
export function render(captured, { version, today, skillsCli = SKILLS_CLI_VERSION } = {}) {
  const data = {
    groups: captured.groups.map((g) => ({
      id: g.id,
      label: g.label,
      items: g.items.map((item, i) => {
        const html = ansiToHtml(item.out);
        return { id: `${g.id}-${i + 1}`, cmd: item.args.map(shellArg).join(" "), code: item.code, note: item.note, html, lines: html.split("\n").length };
      }),
    })),
  };
  const json = JSON.stringify(data).replaceAll("</", "<\\/");
  return readFileSync(TEMPLATE, "utf8")
    .replaceAll("{{VERSION}}", ESC(version))
    .replaceAll("{{TODAY}}", ESC(today))
    .replaceAll("{{SKILLS_CLI}}", ESC(skillsCli))
    .replace("{{DATA}}", () => json);
}

/** Command line: [--check] [--out <file>]. */
export async function main(argv = process.argv.slice(2)) {
  let check = false;
  let out = OUT;
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--check") check = true;
    else if (argv[i] === "--out") out = argv[++i];
    else throw new Error(`usage: create-cli-outputs.mjs [--check] [--out <file>]`);
  }
  const config = readConfig();
  const { version } = JSON.parse(readFileSync(join(PKG_DIR, "package.json"), "utf8"));
  const html = render(await capture(config), { version, today: config.today });
  const same = existsSync(out) && mask(readFileSync(out, "utf8")) === mask(html);
  if (check) {
    if (!same) throw new Error(`${out} is out of date: run npm run cli-outputs`);
    console.error(`${out} is up to date`);
    return;
  }
  if (same) console.error(`${out} is up to date`);
  else {
    writeFileSync(out, html);
    console.error(`wrote ${out} (${config.groups.reduce((n, g) => n + g.items.length, 0)} commands)`);
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((err) => {
    console.error(err.message);
    process.exitCode = 1;
  });
}
