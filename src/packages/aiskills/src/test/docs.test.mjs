// Tests for the user documentation in docs/docsite/.
//
// The docs are held to the code, not the other way round:
//   - the structure and links pass the create-lib-docs checker, and the
//     llms.txt / llms-full.txt agent indexes are up to date;
//   - every command, alias, option, environment variable and error message
//     in src/scripts/ is documented in the reference pages;
//   - the fields of aiskills.json and layout.json are the ones the code writes;
//   - every example whose output is shown is run against the repo's real
//     skills (with the stand-in npx from helpers.mjs) and must print exactly
//     what the page shows.
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { cpSync, existsSync, readdirSync, readFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { after, before, describe, test } from "node:test";

import { PKG_SRC, REPO_ROOT, sandbox, tempDir } from "./helpers.mjs";

const DOCS = join(PKG_SRC, "docs", "docsite");
const SKILL_SCRIPTS = join(REPO_ROOT, "skills", "docs", "create-lib-docs", "scripts");
const SCRIPTS = join(PKG_SRC, "src", "scripts");
const SCRIPT_DIRS = ["core", "pack", "docs"].map((d) => join(SCRIPTS, d));
const python = spawnSync("python3", ["--version"]).status === 0 ? "python3" : null;

const read = (rel) => readFileSync(join(DOCS, rel), "utf8");
const scriptFiles = () => SCRIPT_DIRS.flatMap((d) => readdirSync(d).filter((f) => f.endsWith(".mjs")).map((f) => join(d, f)));
/** A script by file name, from whichever group it is in. */
const source = (file) => readFileSync(scriptFiles().find((p) => p.endsWith("/" + file)), "utf8");
const allSource = () => {
  const files = scriptFiles();
  assert.ok(files.length >= 9, `found only ${files.length} scripts under src/scripts/{core,pack,docs}`);
  return files.map((p) => readFileSync(p, "utf8")).join("\n");
};

/** Every *.md file under docs/docsite, as posix paths relative to it. */
function pages(dir = DOCS, rel = "") {
  const out = [];
  if (!existsSync(dir)) return out;
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    if (e.isDirectory()) out.push(...pages(join(dir, e.name), rel + e.name + "/"));
    else if (e.name.endsWith(".md")) out.push(rel + e.name);
  }
  return out.sort();
}

/** Heading lines of a page, outside code fences. */
function headings(text) {
  const out = [];
  let fence = null;
  for (const line of text.split("\n")) {
    const f = /^\s*(`{3,}|~{3,})/.exec(line);
    if (f) {
      if (fence === null) fence = f[1];
      else if (f[1][0] === fence[0] && f[1].length >= fence.length) fence = null;
      continue;
    }
    if (fence === null && /^#{1,6} /.test(line)) out.push(line);
  }
  return out;
}

const hasHeadingWith = (text, code) => headings(text).some((h) => h.includes("`" + code + "`"));

describe("docs/docsite structure", () => {
  test("has the landing page, every section, diagrams and the agent indexes", () => {
    for (const rel of ["README.md", "faq.md", "llms.txt", "llms-full.txt"]) {
      assert.ok(existsSync(join(DOCS, rel)), `missing ${rel}`);
    }
    for (const dir of ["getting-started", "tutorial", "guides", "concepts", "reference"]) {
      const files = existsSync(join(DOCS, dir)) ? readdirSync(join(DOCS, dir)).filter((f) => f.endsWith(".md")) : [];
      assert.ok(files.length > 0, `no pages in ${dir}/`);
    }
    const svgs = existsSync(join(DOCS, "images")) ? readdirSync(join(DOCS, "images")).filter((f) => f.endsWith(".svg")) : [];
    assert.ok(svgs.length >= 3, `expected at least 3 diagrams, found ${svgs.length}`);
  });

  test("passes the create-lib-docs checker (links, anchors, fences, reachability, llms.txt)", { skip: !python && "python3 not found" }, () => {
    const res = spawnSync(python, [join(SKILL_SCRIPTS, "check_docs.py"), DOCS], { encoding: "utf8" });
    assert.equal(res.status, 0, res.stdout + res.stderr);
  });

  test("llms.txt and llms-full.txt are up to date", { skip: !python && "python3 not found" }, () => {
    const dir = tempDir();
    try {
      cpSync(DOCS, join(dir, "docs"), { recursive: true });
      const res = spawnSync(python, [join(SKILL_SCRIPTS, "build_llms_txt.py"), join(dir, "docs")], { encoding: "utf8" });
      assert.equal(res.status, 0, res.stderr);
      for (const f of ["llms.txt", "llms-full.txt"]) {
        assert.equal(read(f), readFileSync(join(dir, "docs", f), "utf8"), `${f} is stale: run build_llms_txt.py`);
      }
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  test("every diagram is used, has a <title> and an opaque background", () => {
    const text = pages().map(read).join("\n");
    for (const svg of readdirSync(join(DOCS, "images")).filter((f) => f.endsWith(".svg"))) {
      const body = readFileSync(join(DOCS, "images", svg), "utf8");
      assert.ok(text.includes(`images/${svg}`), `${svg} isn't used by any page`);
      assert.match(body, /<title>[^<]+<\/title>/, `${svg} has no <title>`);
      assert.match(body, /<rect[^>]*width="100%"[^>]*height="100%"[^>]*fill="#[0-9a-fA-F]{3,6}"/, `${svg} has no opaque background`);
    }
  });

  test("is not published with the package", () => {
    const { files } = JSON.parse(readFileSync(join(PKG_SRC, "package.json"), "utf8"));
    assert.ok(!files.some((f) => f.startsWith("docs")), files.join(", "));
  });
});

describe("reference pages cover the code", () => {
  test("every command and alias in cli.mjs is in reference/cli.md, each command under its own heading", () => {
    const cli = read("reference/cli.md");
    const groups = [];
    let current = null;
    for (const line of source("cli.mjs").split("\n")) {
      const m = /^\s*case "([^"]+)":/.exec(line);
      if (m) (current ??= (groups.push([]), groups.at(-1))).push(m[1]);
      else current = null;
    }
    assert.ok(groups.length >= 10, `parsed ${groups.length} command groups`);
    for (const [command, ...aliases] of groups) {
      assert.ok(hasHeadingWith(cli, command), `no heading for \`${command}\` in reference/cli.md`);
      for (const a of aliases) assert.ok(cli.includes("`" + a + "`"), `alias \`${a}\` (of ${command}) not in reference/cli.md`);
    }
  });

  test("every option in cli.mjs has a heading in reference/cli.md", () => {
    const cli = read("reference/cli.md");
    const flags = new Set([...source("cli.mjs").matchAll(/a === "(-[^"]+)"/g)].map((m) => m[1]));
    flags.add("--");
    assert.ok(flags.size >= 18, `parsed ${flags.size} options`);
    for (const f of flags) assert.ok(hasHeadingWith(cli, f), `no heading for \`${f}\` in reference/cli.md`);
  });

  test("every environment variable the code reads has a heading in reference/environment.md", () => {
    const env = read("reference/environment.md");
    const code = allSource();
    const names = new Set([
      ...[...code.matchAll(/\bAISKILLS_[A-Z_]*[A-Z]\b/g)].map((m) => m[0]),
      ...[...code.matchAll(/process\.env\.([A-Z_]+)/g)].map((m) => m[1]),
    ]);
    assert.ok(names.has("AISKILLS_HOME") && names.has("INIT_CWD"), [...names].join(", "));
    for (const n of names) assert.ok(hasHeadingWith(env, n), `no heading for \`${n}\` in reference/environment.md`);
  });

  test("every error and warning message in src/scripts/core/, pack/ and docs/ is in reference/errors.md", () => {
    const errors = read("reference/errors.md");
    const code = allSource();
    // The first string literal passed to new Error(...), warn(...) or problems.push(...).
    const literal = /(?:new Error|\bwarn|problems\.push)\(\s*(`(?:[^`\\]|\\.)*`|"(?:[^"\\]|\\.)*")/g;
    const fragments = new Set();
    for (const [, lit] of code.matchAll(literal)) {
      // The longest fixed piece of the message (between ${...} and \n).
      const longest = lit
        .slice(1, -1)
        .split(/\$\{[^}]*\}|\\n/)
        .map((s) => s.trim())
        .sort((a, b) => b.length - a.length)[0];
      if (longest.length >= 10) fragments.add(longest);
    }
    assert.ok(fragments.size >= 30, `parsed ${fragments.size} messages`);
    const missing = [...fragments].filter((f) => !errors.includes(f));
    assert.deepEqual(missing, [], "messages missing from reference/errors.md");
  });

  test("reference/files.md lists every field of aiskills.json and layout.json", () => {
    const files = read("reference/files.md");
    const box = sandbox({ realSkills: true });
    try {
      assert.equal(box.run(["sync"]).status, 0);
      const fields = [
        ...Object.keys(JSON.parse(readFileSync(join(box.root, "aiskills.json"), "utf8"))),
        ...Object.keys(JSON.parse(readFileSync(join(box.root, ".aiskills", "layout.json"), "utf8"))),
      ];
      for (const f of fields) assert.ok(files.includes("`" + f + "`"), `field \`${f}\` not in reference/files.md`);
    } finally {
      box.cleanup();
    }
  });
});

// ------------------------------------------------------------ examples

/**
 * Examples marked for verification:
 *
 *   <!-- verify -->                               (or: <!-- verify: list=a,owner/repo@b find=owner/repo@c -->)
 *   ```bash
 *   aiskills groups
 *   ```
 *
 *   ```text
 *   <the exact output; a line holding only "…" stands for any number of lines>
 *   ```
 *
 * `list=` sets what the stand-in `npx skills list --json` reports as installed
 * (a bare name comes from the install folder, owner/repo@name from GitHub);
 * `find=` sets the lines `npx skills find` prints.
 */
function examples() {
  const out = [];
  for (const page of pages()) {
    const lines = read(page).split("\n");
    for (let i = 0; i < lines.length; i++) {
      const m = /^(\s*)<!-- verify(?::\s*(.*?))?\s*-->$/.exec(lines[i]);
      if (!m) continue;
      const indent = m[1];
      const block = (start, lang) => {
        let j = start;
        while (j < lines.length && lines[j].trim() === "") j++;
        assert.equal(lines[j], indent + "```" + lang, `${page}:${j + 1}: expected a \`\`\`${lang} block after <!-- verify -->`);
        const end = lines.indexOf(indent + "```", j + 1);
        return { body: lines.slice(j + 1, end).map((l) => (l.startsWith(indent) ? l.slice(indent.length) : l)), end };
      };
      const cmd = block(i + 1, "bash");
      const output = block(cmd.end + 1, "text");
      const params = Object.fromEntries((m[2] ?? "").split(/\s+/).filter(Boolean).map((kv) => kv.split("=")));
      out.push({ where: `${page}:${i + 1}`, commands: cmd.body, expected: output.body, params });
    }
  }
  return out;
}

/** Split a shell line into words (single and double quotes, no expansion). */
function words(line) {
  const out = [];
  let cur = null;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === "'" || c === '"') {
      const end = line.indexOf(c, i + 1);
      cur = (cur ?? "") + line.slice(i + 1, end);
      i = end;
    } else if (/\s/.test(c)) {
      if (cur !== null) out.push(cur);
      cur = null;
    } else cur = (cur ?? "") + c;
  }
  if (cur !== null) out.push(cur);
  return out;
}

/** Does <actual> match <expected>, where a "…" line matches any run of lines? */
function linesMatch(expected, actual) {
  if (!expected.length) return !actual.length;
  if (expected[0] === "…") return actual.some((_, k) => linesMatch(expected.slice(1), actual.slice(k))) || linesMatch(expected.slice(1), []);
  return actual.length > 0 && expected[0] === actual[0] && linesMatch(expected.slice(1), actual.slice(1));
}

describe("examples in the docs print what the docs show", () => {
  const box = { current: null };
  before(() => {
    box.current = sandbox({ realSkills: true });
  });
  after(() => box.current?.cleanup());

  test("there are verified examples on every kind of page", () => {
    const where = new Set(examples().map((e) => e.where.split("/")[0].split(":")[0]));
    for (const section of ["README.md", "getting-started", "tutorial", "guides", "reference"]) {
      assert.ok(where.has(section), `no <!-- verify --> example in ${section}`);
    }
  });

  test("every output block shown after an aiskills/ais/aix command is verified", () => {
    for (const page of pages()) {
      const lines = read(page).split("\n");
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].trim() !== "```bash") continue;
        const indent = lines[i].slice(0, lines[i].indexOf("`"));
        const end = lines.indexOf(indent + "```", i + 1);
        const cmds = lines.slice(i + 1, end).map((l) => l.trim()).filter((l) => l && !l.startsWith("#"));
        let j = end + 1;
        while (j < lines.length && lines[j].trim() === "") j++;
        const ours = cmds.length && cmds.every((l) => /^(\w+=\S+\s+)*(aiskills|ais|aix)\b/.test(l));
        if (!ours || lines[j]?.trim() !== "```text") continue;
        let k = i - 1;
        while (k >= 0 && lines[k].trim() === "") k--;
        assert.match(lines[k]?.trim() ?? "", /^<!-- verify/, `${page}:${i + 1}: output shown without <!-- verify -->`);
      }
    }
  });

  for (const ex of examples()) {
    test(`${ex.where}: ${ex.commands.filter((l) => !l.startsWith("#")).join(" ; ")}`, () => {
      const b = box.current;
      // A fresh install folder for each example, as npm install leaves it.
      rmSync(b.root, { recursive: true, force: true });
      assert.equal(b.run(["sync"]).status, 0);
      const rows = (ex.params.list ?? "").split(",").filter(Boolean).map((e) => {
        const m = /^(.+)@(.+)$/.exec(e);
        return m
          ? { name: m[2], scope: "global", agents: ["Claude Code"], source: m[1], sourceType: "github" }
          : { name: e, scope: "global", agents: ["Claude Code"], source: b.root, sourceType: "local" };
      });
      b.setList(rows);
      b.setFind((ex.params.find ?? "").split(",").filter(Boolean).map((s) => `${s} 1.2K installs`).join("\n") + "\n");
      let out = "";
      for (const line of ex.commands) {
        const text = line.replace(/\s+#.*$/, "").trim();
        if (!text || text.startsWith("#")) continue;
        const w = words(text);
        const env = {};
        while (/^\w+=/.test(w[0])) {
          const [k, ...v] = w.shift().split("=");
          env[k] = v.join("=");
        }
        const [cmd, ...args] = w;
        assert.ok(["aiskills", "ais", "aix"].includes(cmd), `${ex.where}: can only verify aiskills/ais/aix, not '${cmd}'`);
        const res = cmd === "aix" ? b.aix(args, { env }) : b.run(args, { env });
        out += res.out;
      }
      const home = b.home;
      const actual = out
        .replaceAll(home, "~")
        .split("\n")
        .map((l) => l.trimEnd());
      while (actual.length && actual.at(-1) === "") actual.pop();
      const expected = ex.expected.map((l) => l.trimEnd());
      assert.ok(
        linesMatch(expected, actual),
        `${ex.where}: output differs\n--- docs\n${expected.join("\n")}\n--- actual\n${actual.join("\n")}`,
      );
    });
  }
});

test("the docs mention every bundled skill group", () => {
  // Group names come from the repo's marketplace.json.
  const market = JSON.parse(readFileSync(join(REPO_ROOT, ".claude-plugin", "marketplace.json"), "utf8"));
  const text = pages().map(read).join("\n");
  for (const p of market.plugins.filter((p) => typeof p.source === "string")) {
    assert.ok(text.includes(p.name), `group ${p.name} isn't mentioned in the docs`);
  }
});
