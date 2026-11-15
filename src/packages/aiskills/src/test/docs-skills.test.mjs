// Tests for the "Skills" section of the user docs (docs/docsite/skills/),
// generated from the bundled skills by src/scripts/build-skills-docs.mjs
// (npm run docs:skills).
//
// The expectations here are worked out independently from the vendored
// package (what really ships), not by calling the generator, except for the
// freshness check.
import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { after, before, describe, test } from "node:test";
import { pathToFileURL } from "node:url";

import { PKG_SRC, REPO_ROOT, listTree, sandbox } from "./helpers.mjs";
import { SKILLS_CLI_VERSION, loadGroups, packageLayout } from "../scripts/core/installer.mjs";

const DOCS = join(PKG_SRC, "docs", "docsite");
const SKILLS_DOCS = join(DOCS, "skills");
const GENERATOR = join(PKG_SRC, "src", "scripts", "docs", "build-skills-docs.mjs");
const load = () => import(pathToFileURL(GENERATOR).href);

/** A frontmatter field from a SKILL.md, the simple way: `key: "value"` or `key: value`. */
function field(md, key) {
  const fm = /^---\n([\s\S]*?)\n---/.exec(md)[1];
  const m = new RegExp(`^\\s*${key}:\\s*(?:"((?:[^"\\\\]|\\\\.)*)"|(.+))$`, "m").exec(fm);
  return m ? (m[1] !== undefined ? JSON.parse(`"${m[1]}"`) : m[2].trim()) : null;
}

const box = { current: null, names: [], layout: null, groupOf: new Map() };
before(() => {
  const b = sandbox({ realSkills: true });
  assert.equal(b.run(["sync"]).status, 0);
  box.current = b;
  box.layout = packageLayout(b.pkg);
  box.names = Object.keys(box.layout.skills).sort();
  for (const g of loadGroups(b.root).groups) for (const n of g.skills) box.groupOf.set(n, g);
});
after(() => box.current?.cleanup());

const page = (name) => readFileSync(join(SKILLS_DOCS, `${name}.md`), "utf8");

describe("docs/docsite/skills/", () => {
  test("has an overview page and exactly one page per bundled skill", () => {
    assert.ok(existsSync(join(SKILLS_DOCS, "README.md")), "missing skills/README.md");
    const pages = readdirSync(SKILLS_DOCS).filter((f) => f.endsWith(".md") && f !== "README.md").map((f) => f.slice(0, -3)).sort();
    assert.deepEqual(pages, box.names);
  });

  test("is up to date with the skills (run: npm run docs:skills)", async () => {
    const { render } = await load();
    const { files, landing } = render({ repoRoot: REPO_ROOT });
    for (const [rel, text] of Object.entries(files)) {
      assert.equal(readFileSync(join(DOCS, rel), "utf8"), text, `${rel} is stale: run npm run docs:skills`);
    }
    assert.equal(readFileSync(join(DOCS, "README.md"), "utf8"), landing, "README.md's Skills section is stale");
  });


  test("the landing page has a Skills section right after Getting started, listing every skill page, then the explainers", () => {
    const readme = readFileSync(join(DOCS, "README.md"), "utf8");
    const sections = [...readme.matchAll(/^### (.+)$/gm)].map((m) => m[1]);
    assert.equal(sections[sections.indexOf("Getting started") + 1], "Skills", sections.join(", "));
    const body = readme.split("### Skills\n")[1].split("\n### ")[0];
    const links = [...body.matchAll(/^- \[[^\]]+\]\(([^)]+)\)/gm)].map((m) => m[1]);
    // The generated list (between the skills:start/end markers), then the hand-written explainer pages.
    const explainers = readdirSync(join(DOCS, "explainers")).filter((f) => f.endsWith(".md")).sort().map((f) => `explainers/${f}`);
    assert.deepEqual(links, ["skills/README.md", ...box.names.map((n) => `skills/${n}.md`), ...explainers]);
  });

  test("the overview lists every skill under its group, with its version", () => {
    const overview = readFileSync(join(SKILLS_DOCS, "README.md"), "utf8");
    for (const name of box.names) {
      const md = readFileSync(join(box.current.pkg, "skills", name, "SKILL.md"), "utf8");
      const row = overview.split("\n").find((l) => l.includes(`](${name}.md)`));
      assert.ok(row, `${name} missing from the overview`);
      assert.ok(row.includes(field(md, "version")), `${name}: version missing from its row`);
    }
    for (const g of new Set(box.groupOf.values())) assert.ok(overview.includes(`## ${g.name}`), `no section for ${g.name}`);
    // A "Not in a group" section only when some bundled skill has no group.
    if (box.names.some((n) => !box.groupOf.has(n))) assert.match(overview, /## Not in a group/);
    else assert.doesNotMatch(overview, /## Not in a group/);
  });

  test("each skill page shows its description, group, version, how it starts, and its source", () => {
    for (const name of box.names) {
      const md = readFileSync(join(box.current.pkg, "skills", name, "SKILL.md"), "utf8");
      const text = page(name);
      assert.match(text, new RegExp(`^# ${name}\\n`), `${name}: title`);
      assert.ok(text.includes(field(md, "description")), `${name}: description`);
      assert.ok(text.includes(`| Version | ${field(md, "version")} |`), `${name}: version`);
      const g = box.groupOf.get(name);
      assert.ok(
        text.includes(g ? `| Group | \`${g.name}\` (alias \`${g.alias}\`) |` : "| Group | None"),
        `${name}: group row`,
      );
      const manual = field(md, "disable-model-invocation") === "true";
      assert.ok(text.includes(manual ? `you type \`/${name}\`` : `\`/${name}\`, or your agent`), `${name}: how it starts`);
      const compat = field(md, "compatibility");
      if (compat) assert.ok(text.includes(compat), `${name}: compatibility`);
      const src = `https://github.com/sugatoray/aiskills/tree/master/skills/${box.layout.skills[name]}`;
      assert.ok(text.includes(src), `${name}: source link ${src}`);
    }
  });

  test("each skill page has a verified install example with the real output", () => {
    for (const name of box.names) {
      const text = page(name);
      assert.ok(
        text.includes(
          [
            "<!-- verify -->",
            "```bash",
            `aiskills install -s ${name} -a claude-code`,
            "```",
            "",
            "```text",
            "[aiskills] skills saved to ~/.config/sugatoray/aiskills/skills (flat layout)",
            `[aiskills] bundled: ${name}`,
            `[aiskills] running: npx -y skills@${SKILLS_CLI_VERSION} add ~/.config/sugatoray/aiskills --global --skill ${name} --agent claude-code --yes`,
            "[aiskills] adding this install to the skills.sh count in the background (turn off: --no-stats)",
            "```",
          ].join("\n"),
        ),
        `${name}: install example`,
      );
    }
  });

  test("each skill page lists exactly the files that ship with the skill", () => {
    for (const name of box.names) {
      const shipped = listTree(join(box.current.root, "skills", name)); // after sync: real dotfile names
      const text = page(name);
      const listed = [...text.split("## What's inside\n")[1].split("\n## ")[0].matchAll(/^- `([^`]+)`$/gm)].map((m) => m[1]);
      assert.deepEqual(listed, shipped, `${name}: files`);
    }
  });
});

describe("docs/docsite/license.md", () => {
  const LICENSE_PAGE = join(DOCS, "license.md");
  const text = () => readFileSync(LICENSE_PAGE, "utf8");
  const pkg = JSON.parse(readFileSync(join(PKG_SRC, "package.json"), "utf8"));

  test("exists, and opens with the package's license from package.json, linked to its LICENSE", () => {
    assert.ok(existsSync(LICENSE_PAGE), "missing license.md");
    const md = text();
    assert.match(md, /^# License\n\n/);
    const first = md.split("\n\n")[1];
    assert.ok(first.includes(`\`${pkg.name}\``) && first.includes(pkg.license), `first paragraph: ${first}`);
    assert.ok(md.includes(`| The npm package: the \`aiskills\`, \`ais\` and \`aix\` commands and their code | [${pkg.license}](../../LICENSE) | \`package.json\` (\`"license"\`), \`LICENSE\` |`));
  });

  test("has a table row for every bundled skill, with the license from its own SKILL.md", () => {
    const md = text();
    assert.ok(md.includes("| Skill | Group | License | Declared in |\n| --- | --- | --- | --- |"), "the skills table header");
    const rows = md.split("\n").filter((l) => /^\| \[`/.test(l));
    assert.equal(rows.length, box.names.length, "one row per bundled skill");
    for (const name of box.names) {
      const license = field(readFileSync(join(box.current.root, "skills", name, "SKILL.md"), "utf8"), "license") ?? "not stated";
      const group = box.groupOf.get(name)?.alias ?? "-";
      const src = `https://github.com/sugatoray/aiskills/blob/master/skills/${box.layout.skills[name]}/SKILL.md`;
      assert.ok(md.includes(`| [\`${name}\`](skills/${name}.md) | ${group} | ${license} | [\`SKILL.md\`](${src}) |`), `${name}: row`);
    }
  });

  test("says when the skills' licenses differ from the package's", () => {
    const licenses = new Set(box.names.map((n) => field(readFileSync(join(box.current.root, "skills", n, "SKILL.md"), "utf8"), "license")));
    if (licenses.size === 1 && !licenses.has(pkg.license)) {
      const [only] = licenses;
      assert.match(text(), new RegExp(`every bundled skill is ${only}, not ${pkg.license}`));
    }
  });

  test("is linked from the landing page under ### License, so the HTML docs get a License tab", async () => {
    const readme = readFileSync(join(DOCS, "README.md"), "utf8");
    assert.match(readme, /\n### License\n\n- \[License\]\(license\.md\): /);
    assert.ok(readme.indexOf("### License") > readme.indexOf("### Help"), "after Help");
    const { collect } = await import(pathToFileURL(join(PKG_SRC, "src", "scripts", "docs", "build-docs-html.mjs")).href);
    const tab = collect(DOCS).tabs.find((t) => t.label === "License");
    assert.ok(tab, "a License tab");
    assert.deepEqual(tab.pages, ["license.md"]);
  });
});

describe("the generator", () => {
  test("reads quoted frontmatter values, with escapes", async () => {
    const { frontmatter } = await load();
    const fm = frontmatter('---\nname: x\ndescription: "Says \\"hi\\" — twice"\nmetadata:\n  version: "1.2.3"\n  aliases:\n    - y\n    - z\n---\n# x\n');
    assert.equal(fm.name, "x");
    assert.equal(fm.description, 'Says "hi" — twice');
    assert.equal(fm.version, "1.2.3");
    assert.deepEqual(fm.aliases, ["y", "z"]);
  });

  test("only rewrites the marked Skills section of the landing page", async () => {
    const { render } = await load();
    const { landing } = render({ repoRoot: REPO_ROOT });
    const strip = (s) => s.replace(/<!-- skills:start -->[\s\S]*<!-- skills:end -->/, "");
    assert.equal(strip(landing), strip(readFileSync(join(DOCS, "README.md"), "utf8")));
    assert.match(landing, /### Skills\n\n<!-- skills:start -->/);
  });

  test("leaves no temporary folders behind", async () => {
    const { render } = await load();
    const before = readdirSync(tmpdir()).filter((f) => f.startsWith("aiskills-docs-")).length;
    render({ repoRoot: REPO_ROOT });
    assert.equal(readdirSync(tmpdir()).filter((f) => f.startsWith("aiskills-docs-")).length, before);
  });
});

describe("explainer pages in the docs (docs/docsite/explainers/)", () => {
  test("each one is an exact copy of its skill's bundled page (run: npm run docs:skills)", async () => {
    const { EXPLAINERS } = await load();
    assert.ok(EXPLAINERS && Object.keys(EXPLAINERS).length > 0, "build-skills-docs.mjs exports EXPLAINERS");
    assert.equal(EXPLAINERS["explainers/scrolls-explainer.html"], "skills/scrolls/scrolls-explainer/assets/scrolls-explainer.html");
    for (const [rel, src] of Object.entries(EXPLAINERS)) {
      const copy = join(DOCS, rel);
      assert.ok(existsSync(copy), `${rel} is missing: run npm run docs:skills`);
      assert.equal(readFileSync(copy, "utf8"), readFileSync(join(REPO_ROOT, src), "utf8"), `${rel} is stale: run npm run docs:skills`);
    }
  });
});

// Skill and group counts, and the group tables, are written by the generator between
// markers, so they can't go stale: <!-- count:skills -->17<!-- /count -->,
// <!-- count:groups -->, <!-- count:group:<alias> -->, and <!-- groups:start --> ... <!-- groups:end -->.
describe("skill and group counts in the docs", () => {
  const WORDS = "one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty";
  // A numeral, or a number word after "the/its/all/these/those" ("the seven skills"); not "one or two skills".
  const COUNT = new RegExp(`\\b(?:(?:all\\s+)?\\d+|(?:the|its|all|these|those)\\s+(?:${WORDS}))\\s+(?:bundled\\s+)?(?:skills|groups)\\b`, "gi");
  const MARKER = /<!-- count:([a-z0-9:-]+) -->(\d+)<!-- \/count -->/g;
  /** The README and every hand-written docs page (generated pages are checked elsewhere). */
  function pages() {
    const out = { "README.md": readFileSync(join(PKG_SRC, "README.md"), "utf8") };
    const walk = (dir, rel = "") => {
      for (const e of readdirSync(dir, { withFileTypes: true })) {
        const r = rel ? `${rel}/${e.name}` : e.name;
        if (e.isDirectory()) {
          if (r !== "skills") walk(join(dir, e.name), r);
        } else if (e.name.endsWith(".md") && r !== "license.md") out[`docs/docsite/${r}`] = readFileSync(join(dir, e.name), "utf8");
      }
    };
    walk(DOCS);
    return out;
  }
  const prose = (md) => md.replace(/^(`{3,})[^\n]*\n[\s\S]*?^\1\s*$/gm, ""); // drop code blocks: example output is verified separately
  const groups = () => {
    const seen = new Map();
    for (const [n, g] of box.groupOf) {
      if (!seen.has(g.name)) seen.set(g.name, { name: g.name, alias: g.alias, skills: [] });
      seen.get(g.name).skills.push(n);
    }
    return [...seen.values()];
  };

  test("no count of skills or groups is typed by hand: each is a generated marker", () => {
    const loose = [];
    for (const [rel, md] of Object.entries(pages())) {
      for (const m of prose(md).replace(MARKER, "N").matchAll(COUNT)) loose.push(`${rel}: "${m[0]}"`);
    }
    assert.deepEqual(loose, [], "write these as <!-- count:... --> markers (npm run docs:skills fills them)");
  });

  test("every count marker holds the real number", () => {
    const expected = { skills: box.names.length, groups: groups().length };
    for (const g of groups()) expected[`group:${g.alias}`] = g.skills.length;
    let n = 0;
    for (const [rel, md] of Object.entries(pages())) {
      for (const [, key, value] of md.matchAll(MARKER)) {
        n++;
        assert.ok(Object.hasOwn(expected, key), `${rel}: unknown count marker '${key}'`);
        assert.equal(Number(value), expected[key], `${rel}: count:${key}`);
      }
    }
    assert.ok(n >= 5, "the README and the docs use the markers");
  });

  test("the landing page's Skills list says how many skills and groups the package has", () => {
    const readme = readFileSync(join(DOCS, "README.md"), "utf8");
    assert.match(readme, new RegExp(`- \\[Bundled skills\\]\\(skills/README\\.md\\): all <!-- count:skills -->${box.names.length}<!-- /count --> skills in the package, in <!-- count:groups -->${groups().length}<!-- /count --> groups`));
  });

  test("the group tables in the README and Skill groups list every group with its skills", () => {
    const rows = groups()
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((g) => `| \`${g.name}\` | \`${g.alias}\` | ${g.skills.sort().join(", ")} |`);
    const want = ["| Group | Alias | Skills |", "| --- | --- | --- |", ...rows, `| \`all\` (built in) | | all <!-- count:skills -->${box.names.length}<!-- /count --> skills |`];
    for (const file of [join(PKG_SRC, "README.md"), join(DOCS, "concepts", "skill-groups.md")]) {
      const md = readFileSync(file, "utf8");
      const block = /<!-- groups:start -->\n([\s\S]*?)\n<!-- groups:end -->/.exec(md);
      assert.ok(block, `${file}: no <!-- groups:start --> ... <!-- groups:end --> table`);
      assert.deepEqual(block[1].split("\n"), want, file);
    }
  });

  test("the pages with markers are up to date (run: npm run docs:skills)", async () => {
    const { render } = await load();
    const { marked } = render({ repoRoot: REPO_ROOT });
    assert.ok(Object.keys(marked).length >= 3, "the generator fills the marked pages");
    for (const [rel, text] of Object.entries(marked)) {
      assert.equal(readFileSync(join(PKG_SRC, rel), "utf8"), text, `${rel} is stale: run npm run docs:skills`);
    }
  });
});
