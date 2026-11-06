#!/usr/bin/env node
// Generate the "Skills" section of the user docs from the bundled skills:
//   docs/docsite/skills/README.md     an overview, by group
//   docs/docsite/skills/<name>.md     one page per skill
//   docs/docsite/README.md            the list between <!-- skills:start --> and <!-- skills:end -->
//
// Usage: node src/scripts/build-skills-docs.mjs   (npm run docs:skills)
//
// "Bundled" means what the npm package really ships: the repo's skills/ is
// vendored into a temporary folder exactly as `npm pack` does (so
// .skillsignore applies), then synced the way `aiskills` saves it.
// Used only to build the docs, so it is not published.

import { mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { SKILLS_CLI_VERSION, loadGroups, syncSkills } from "./installer.mjs";
import { findRepoRoot, vendor } from "./vendor-skills.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const PKG_DIR = resolve(HERE, "..", "..");
const DOCS = join(PKG_DIR, "docs", "docsite");
const TREE = "https://github.com/sugatoray/aiskills/tree/master/skills/";
const BLOB = "https://github.com/sugatoray/aiskills/blob/master/skills/";
const START = "<!-- skills:start -->";
const END = "<!-- skills:end -->";

/**
 * The SKILL.md frontmatter fields the docs use:
 * { name, description, license, compatibility, manual, version, aliases }.
 * Values may be "quoted" (JSON-style escapes) or plain.
 */
export function frontmatter(md) {
  const fm = /^---\r?\n([\s\S]*?)\r?\n---/.exec(md)?.[1] ?? "";
  const value = (key) => {
    const m = new RegExp(`^\\s*${key}:\\s*(?:"((?:[^"\\\\]|\\\\.)*)"|(.+?))\\s*$`, "m").exec(fm);
    return m ? (m[1] !== undefined ? JSON.parse(`"${m[1]}"`) : m[2].replace(/^'(.*)'$/, "$1")) : null;
  };
  const aliases = /^\s*aliases:\s*\n((?:\s+-\s+.+\n?)+)/m.exec(fm);
  return {
    name: value("name"),
    description: value("description") ?? "",
    license: value("license"),
    compatibility: value("compatibility"),
    manual: value("disable-model-invocation") === "true",
    version: value("version"),
    aliases: aliases ? aliases[1].split("\n").map((l) => l.replace(/^\s+-\s+/, "").trim()).filter(Boolean) : [],
  };
}

/** The first sentence of <text>, at most ~160 characters. */
function summary(text) {
  const m = /^(.+?[.!?])(\s|$)/.exec(text);
  const s = m ? m[1] : text;
  return s.length > 160 ? s.slice(0, 157).replace(/\s+\S*$/, "") + "…" : s;
}

/** Every file under <dir>, as sorted posix paths. */
function files(dir, rel = "") {
  return readdirSync(dir, { withFileTypes: true })
    .flatMap((e) => (e.isDirectory() ? files(join(dir, e.name), rel + e.name + "/") : [rel + e.name]))
    .sort();
}

const cell = (s) => s.replace(/\|/g, "\\|").replace(/\n/g, " ");

/** Read what the package bundles: [{ name, path, fm, group, files }], plus the groups. */
function bundled(repoRoot) {
  const tmp = mkdtempSync(join(tmpdir(), "aiskills-docs-"));
  try {
    const pkgDir = join(tmp, "pkg");
    const root = join(tmp, "root");
    const layout = vendor({ repoRoot, pkgDir });
    syncSkills({ root, pkgDir, quiet: true, layout: "flat" });
    const { groups } = loadGroups(root);
    const groupOf = new Map(groups.flatMap((g) => g.skills.map((n) => [n, g])));
    const skills = Object.keys(layout.skills)
      .sort()
      .map((name) => ({
        name,
        path: layout.skills[name],
        fm: frontmatter(readFileSync(join(root, "skills", name, "SKILL.md"), "utf8")),
        group: groupOf.get(name) ?? null,
        files: files(join(root, "skills", name)),
      }));
    return { skills, groups };
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
}

function skillPage(s) {
  const { fm } = s;
  const starts = fm.manual
    ? `When you ask for it: you type \`/${s.name}\` (your agent doesn't start it on its own)`
    : `When you type \`/${s.name}\`, or your agent uses it when a task fits its description`;
  const rows = [
    ["Group", s.group ? `\`${s.group.name}\` (alias \`${s.group.alias}\`)` : "None: install it with `-s` or `-G all`"],
    ["Version", fm.version ?? "-"],
    ["Starts", starts],
    ...(fm.compatibility ? [["Needs", cell(fm.compatibility)]] : []),
    ...(fm.aliases.length ? [["Also answers to", fm.aliases.map((a) => `\`/${a}\``).join(", ") + " (described in the skill; not a separate skill)"]] : []),
    ["License", fm.license ?? "-"],
    ["Source", `[skills/${s.path}](${TREE}${s.path})`],
  ];
  const has = (f) => s.files.includes(f);
  const more = [
    ...(has("README.md") ? [`[README](${BLOB}${s.path}/README.md)`] : []),
    ...(has("CHANGELOG.md") ? [`[CHANGELOG](${BLOB}${s.path}/CHANGELOG.md)`] : []),
  ];
  const groupLine = s.group
    ? `\nOr the whole \`${s.group.name}\` group:\n\n\`\`\`bash\naiskills install -G ${s.group.alias} -a claude-code\n\`\`\`\n`
    : "";
  return `# ${s.name}

${fm.description}

| Property | Value |
| --- | --- |
${rows.map(([k, v]) => `| ${k} | ${v} |`).join("\n")}

## Install

For one agent (leave out \`-a\` for every agent \`npx skills\` finds):

<!-- verify -->
\`\`\`bash
aiskills install -s ${s.name} -a claude-code
\`\`\`

\`\`\`text
[aiskills] skills saved to ~/.config/sugatoray/aiskills/skills (flat layout)
[aiskills] bundled: ${s.name}
[aiskills] running: npx -y skills@${SKILLS_CLI_VERSION} add ~/.config/sugatoray/aiskills --global --skill ${s.name} --agent claude-code --yes
\`\`\`
${groupLine}
Into the current project instead: add \`-p\`. To remove it:

\`\`\`bash
aiskills uninstall -s ${s.name}
\`\`\`

## What's inside

The files that ship with the skill, in \`~/.config/sugatoray/aiskills/skills/${s.name}/\`:

${s.files.map((f) => `- \`${f}\``).join("\n")}

See also: [All skills](README.md)${more.length ? " · " + more.join(" · ") : ""} · [Skill groups](../concepts/skill-groups.md)
`;
}

function overview(skills, groups) {
  const table = (list) =>
    "| Skill | Version | What it does |\n| --- | --- | --- |\n" +
    list.map((s) => `| [\`${s.name}\`](${s.name}.md) | ${s.fm.version ?? "-"} | ${cell(summary(s.fm.description))} |`).join("\n");
  const sections = groups
    .filter((g) => g.skills.length)
    .map((g) => {
      const list = skills.filter((s) => s.group === g || s.group?.name === g.name);
      return `## ${g.name}\n\nAlias \`${g.alias}\`. Install the group with \`aiskills install -G ${g.alias}\`.\n\n${table(list)}\n`;
    });
  const loose = skills.filter((s) => !s.group);
  if (loose.length) {
    sections.push(`## Not in a group\n\nInstall these by name (\`-s\`) or with \`-G all\`.\n\n${table(loose)}\n`);
  }
  return `# Bundled skills

Every skill in this version of the package (${skills.length} skills in ${groups.filter((g) => g.skills.length).length} groups), with what it does and how to install it.

Install them all with \`aiskills install\`, or pick by group (\`-G\`), by name (\`-s\`) or by [pattern](../reference/patterns.md). \`aiskills groups\` shows the same grouping for the version you have installed.

${sections.join("\n")}
This section is generated from the skills' own \`SKILL.md\` files by \`npm run docs:skills\`.

See also: [Skill groups](../concepts/skill-groups.md) · [1. Install a group](../tutorial/01-install-a-group.md)
`;
}

/** The Skills list for the landing page (between the markers). */
function landingList(skills) {
  return [
    `- [Bundled skills](skills/README.md): every skill in the package, by group, with what it does.`,
    ...skills.map((s) => `- [${s.name}](skills/${s.name}.md): ${summary(s.fm.description)}`),
  ].join("\n");
}

/**
 * Everything the generator writes: { files: { "skills/<x>.md": text }, landing: README.md text }.
 * <docs> is the docs folder whose README.md gets the Skills list.
 */
export function render({ repoRoot = findRepoRoot(PKG_DIR), docs = DOCS } = {}) {
  const { skills, groups } = bundled(repoRoot);
  const out = { "skills/README.md": overview(skills, groups) };
  for (const s of skills) out[`skills/${s.name}.md`] = skillPage(s);
  const readme = readFileSync(join(docs, "README.md"), "utf8");
  const i = readme.indexOf(START);
  const j = readme.indexOf(END);
  if (i < 0 || j < i) throw new Error(`${join(docs, "README.md")}: no ${START} ... ${END} markers`);
  const landing = readme.slice(0, i + START.length) + "\n" + landingList(skills) + "\n" + readme.slice(j);
  return { files: out, landing };
}

/** Write the pages, removing pages of skills that no longer exist. */
export function main() {
  const { files: out, landing } = render();
  const dir = join(DOCS, "skills");
  mkdirSync(dir, { recursive: true });
  for (const f of readdirSync(dir)) if (f.endsWith(".md") && !out[`skills/${f}`]) rmSync(join(dir, f));
  for (const [rel, text] of Object.entries(out)) writeFileSync(join(DOCS, rel), text);
  writeFileSync(join(DOCS, "README.md"), landing);
  console.error(`wrote ${Object.keys(out).length} pages to ${dir}`);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    main();
  } catch (err) {
    console.error(err.message);
    process.exitCode = 1;
  }
}
