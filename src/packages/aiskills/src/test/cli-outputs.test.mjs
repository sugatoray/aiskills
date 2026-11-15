// The CLI outputs page (docs/docsite/reference/cli-outputs.html): every aiskills
// command and what it prints, in color. Built by src/scripts/docs/create-cli-outputs.mjs
// (npm run cli-outputs) from docs/cli-outputs/commands.json, by running each command
// in the same sandbox the docs examples use: the stand-in npx and npm, the sample
// registry data and download counts, AISKILLS_TODAY=2026-11-21.
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, test } from "node:test";
import { pathToFileURL } from "node:url";

import { PKG_SRC } from "./helpers.mjs";

const BUILDER = join(PKG_SRC, "src", "scripts", "docs", "create-cli-outputs.mjs");
const PAGE = join(PKG_SRC, "docs", "docsite", "reference", "cli-outputs.html");
const DOC = join(PKG_SRC, "docs", "docsite", "reference", "cli-outputs.md");
const load = () => import(pathToFileURL(BUILDER).href);
const posixOnly = { skip: process.platform === "win32" && "stand-in npm/npx are POSIX scripts" };

describe("create-cli-outputs: pieces", () => {
  test("ansiToHtml turns the CLI's color codes into spans, escapes HTML and drops other escapes", async () => {
    const { ansiToHtml } = await load();
    assert.equal(ansiToHtml("\x1b[2m[aiskills]\x1b[22m \x1b[31mbad <x> & y\x1b[39m"), '<span class="t-d">[aiskills]</span> <span class="t-r">bad &lt;x&gt; &amp; y</span>');
    assert.equal(ansiToHtml("\x1b[1mVERSION\x1b[22m \x1b[32mlatest\x1b[39m \x1b[36mcmd\x1b[39m \x1b[33mwarn\x1b[39m"),
      '<span class="t-b">VERSION</span> <span class="t-g">latest</span> <span class="t-c">cmd</span> <span class="t-y">warn</span>');
    assert.equal(ansiToHtml("\x1b[1m\x1b[36mboth\x1b[39m\x1b[22m"), '<span class="t-b t-c">both</span>');
    assert.equal(ansiToHtml("\x1b[?25lplain\x1b[0m text\x1b[K"), "plain text");
    assert.equal(ansiToHtml("spin\rdone\nnext  \n"), "done\nnext");
  });

  test("commands.json covers every command in --help, and each entry has a note", async () => {
    const { readConfig } = await load();
    const config = readConfig();
    const items = config.groups.flatMap((g) => g.items);
    const help = spawnSync(process.execPath, [join(PKG_SRC, "bin", "aiskills.mjs"), "--help"], { encoding: "utf8", env: { ...process.env, NO_COLOR: "1" } }).stdout;
    const commands = help.split("\nCommands:\n")[1].split("\n\n")[0].split("\n")
      .filter((l) => /^  \S/.test(l)).map((l) => l.trim().split(/[ ,]/)[0]);
    assert.ok(commands.length >= 12, commands.join(" "));
    for (const c of [...commands, "--version"]) {
      const names = c === "releases" ? ["releases", "rel"] : c === "help" ? ["help", "--help", "-h"] : [c];
      assert.ok(items.some((i) => names.includes(i.args[0])), `no example of '${c}' in commands.json`);
    }
    for (const i of items) assert.ok(i.note && i.note.length > 10, `${i.args.join(" ")}: needs a note`);
    assert.ok(items.some((i) => i.args.includes("--bogus") || i.args[0] === "bogus"), "an error example");
  });

  test("render fills the template: every command with its exit code, the colors switch, the version", async () => {
    const { render } = await load();
    const html = render(
      { groups: [{ id: "a", label: "Group A", items: [{ args: ["info"], note: "A note about info.", code: 0, out: "\x1b[1mvalue\x1b[22m" }, { args: ["bogus"], note: "An unknown command.", code: 1, out: "x" }] }] },
      { version: "9.9.9", today: "2026-11-21" },
    );
    assert.match(html, /<title>aiskills Command Outputs<\/title>/);
    assert.ok(html.includes('"cmd":"info"') && html.includes('"cmd":"bogus"'), "each command, in the page's data");
    assert.ok(html.includes("<code><span class=\"p\">$</span>aiskills ${esc(c.cmd)}</code>"), "shown as 'aiskills <command>'");
    // The colored output, as JSON in the page's script ("</" escaped so it can't end the script).
    assert.ok(html.includes('<span class=\\"t-b\\">value<\\/span>'), "the colored output");
    assert.ok(html.includes('"code":1'));
    assert.ok(html.includes('id="colors"'), "the colors switch");
    assert.ok(html.includes("9.9.9") && html.includes("2026-11-21"));
    assert.ok(!/\{\{[A-Z_]+\}\}/.test(html), "no placeholder left");
    assert.equal(html.split("<script").length, html.split("</script>").length);
  });

  test("mask hides only what differs between machines and runs: the node version and the save time", async () => {
    const { mask } = await load();
    const a = "node version : v22.23.4 (linux-x64)\nsaved by : aiskills 1.3.0-dev, 2026-11-14 17:03 UTC\nother 1.2.0";
    const b = "node version : v24.1.0 (darwin-arm64)\nsaved by : aiskills 1.3.0-dev, 2026-12-01 09:00 UTC\nother 1.2.0";
    assert.equal(mask(a), mask(b));
    assert.notEqual(mask(a), mask(a.replace("other 1.2.0", "other 1.2.1")));
  });
});

describe("the committed page", () => {
  test("docs/docsite/reference/cli-outputs.html is up to date (run: npm run cli-outputs)", posixOnly, async () => {
    const { capture, readConfig, render, mask } = await load();
    assert.ok(existsSync(PAGE), "the page is missing: run npm run cli-outputs");
    const { version } = JSON.parse(readFileSync(join(PKG_SRC, "package.json"), "utf8"));
    const fresh = render(await capture(readConfig()), { version, today: readConfig().today });
    assert.equal(mask(readFileSync(PAGE, "utf8")), mask(fresh), "stale: run npm run cli-outputs");
  });

  test("the captured commands ran as expected: exit 0, except the error example", posixOnly, async () => {
    const { capture, readConfig } = await load();
    for (const g of (await capture(readConfig())).groups) {
      for (const i of g.items) {
        const bad = i.args.includes("--bogus") || i.args[0] === "bogus";
        assert.equal(i.code, bad ? 1 : 0, `aiskills ${i.args.join(" ")} exited ${i.code}:\n${i.out}`);
        // --version and path print a bare value for scripts; everything else has color.
        if (!["--version", "path"].includes(i.args[0])) assert.ok(i.out.includes("\x1b["), `aiskills ${i.args.join(" ")}: captured without color`);
        assert.ok(!i.out.includes("/tmp/") && !i.out.includes("aiskills-test-"), `aiskills ${i.args.join(" ")}: a sandbox path leaked`);
      }
    }
  });
});

describe("the docs show it", () => {
  test("a Reference page embeds it, and the landing page lists that page next to the CLI reference", () => {
    assert.ok(existsSync(DOC), "missing reference/cli-outputs.md");
    const doc = readFileSync(DOC, "utf8");
    assert.match(doc, /^# /m);
    assert.match(doc, /<iframe data-page="cli-outputs\.html" title="[^"]+"/);
    assert.match(doc, /\[Open [^\]]+\]\(cli-outputs\.html\)/);
    const landing = readFileSync(join(PKG_SRC, "docs", "docsite", "README.md"), "utf8");
    const reference = landing.split("\n### Reference\n")[1].split("\n### ")[0];
    const links = [...reference.matchAll(/\]\(([^)]+\.md)\)/g)].map((m) => m[1]);
    assert.equal(links[links.indexOf("reference/cli.md") + 1], "reference/cli-outputs.md", "listed right after the CLI reference");
  });

  test("npm run cli-outputs builds it, cli-outputs:check checks it, and npm run docs includes it", () => {
    const { scripts } = JSON.parse(readFileSync(join(PKG_SRC, "package.json"), "utf8"));
    assert.equal(scripts["cli-outputs"], "node src/scripts/docs/create-cli-outputs.mjs");
    assert.equal(scripts["cli-outputs:check"], "node src/scripts/docs/create-cli-outputs.mjs --check");
    assert.match(scripts.docs, /npm run cli-outputs && .*npm run docs:html/);
  });
});
