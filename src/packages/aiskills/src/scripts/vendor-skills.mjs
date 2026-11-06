#!/usr/bin/env node
// Copies the repo's skills into the package, FLATTENED, right before every
// `npm pack` / `npm publish` (the `prepack` script):
//
//   <repo>/skills/scrolls/scrolls-setup/...  ->  <package>/skills/scrolls-setup/...
//
// One folder per skill, one level deep, which is the layout
// `npx skills experimental_sync` looks for in node_modules. Nothing is lost:
//
//   <package>/.aiskills/layout.json   each skill's original nested path, plus
//                                     the list of files that sit outside any
//                                     skill folder (group READMEs, plugin.json,
//                                     meta/...)
//   <package>/.aiskills/nested/...    those files, at their original paths
//
// so `aiskills --nested` can rebuild <repo>/skills exactly, and the skill
// groups from marketplace.json keep working in both layouts. LICENSE and
// .claude-plugin/marketplace.json are copied too.
//
//   node src/scripts/vendor-skills.mjs          # (re)vendor    (npm run vendor)
//   node src/scripts/vendor-skills.mjs --clean  # remove copies (npm run clean)

import { cpSync, existsSync, mkdirSync, readdirSync, renameSync, rmSync, statSync, writeFileSync } from "node:fs";
import { basename, dirname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import { LAYOUT_REL, NESTED_EXTRAS_REL, readSkillName } from "./installer.mjs";

// Local build/runtime junk that is never part of a skill.
const JUNK = new Set(["node_modules", "__pycache__", ".pytest_cache", ".venv", ".DS_Store"]);
const isJunk = (name) => JUNK.has(name) || name.endsWith(".pyc");

// npm never ships files named .gitignore/.npmignore (and would treat them as
// ignore rules while packing). Rename them; the installer renames them back.
const RENAMES = { ".gitignore": "_gitignore", ".npmignore": "_npmignore" };
const SAFE_NAME = /^[A-Za-z0-9][A-Za-z0-9._-]*$/;

const toPosix = (p) => p.split(sep).join("/");

/** Every file under <dir> (posix paths relative to <dir>), skipping junk. */
function listFiles(dir) {
  const out = [];
  (function walk(d) {
    for (const ent of readdirSync(d, { withFileTypes: true })) {
      if (isJunk(ent.name)) continue;
      const p = join(d, ent.name);
      if (ent.isDirectory()) walk(p);
      else out.push(toPosix(relative(dir, p)));
    }
  })(dir);
  return out.sort();
}

function renameDotfiles(dir) {
  if (!existsSync(dir)) return;
  for (const ent of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, ent.name);
    if (ent.isDirectory()) renameDotfiles(p);
    else if (RENAMES[ent.name]) renameSync(p, join(dir, RENAMES[ent.name]));
  }
}

/** The nearest ancestor of <start> holding both skills/ and .claude-plugin/marketplace.json. */
export function findRepoRoot(start) {
  for (let dir = resolve(start, ".."); ; dir = dirname(dir)) {
    if (existsSync(join(dir, "skills")) && existsSync(join(dir, ".claude-plugin", "marketplace.json"))) return dir;
    if (dirname(dir) === dir) {
      throw new Error(`no ancestor of ${start} contains skills/ and .claude-plugin/marketplace.json`);
    }
  }
}

/** Remove everything vendor() writes. */
export function clean(pkgDir) {
  for (const p of ["skills", ".claude-plugin", ".aiskills", "LICENSE"]) rmSync(join(pkgDir, p), { recursive: true, force: true });
}

/**
 * Flatten <repoRoot>/skills into <pkgDir>/skills and record the nested layout.
 * Throws (changing nothing it hasn't cleaned) on a skill inside another skill,
 * an unsafe skill name, or two skills with the same name.
 * Returns the layout object written to .aiskills/layout.json.
 */
export function vendor({ repoRoot, pkgDir }) {
  const srcSkills = join(repoRoot, "skills");
  if (!existsSync(srcSkills) || !statSync(srcSkills).isDirectory()) throw new Error(`${srcSkills} not found`);

  const files = listFiles(srcSkills);
  const skillDirs = files.filter((f) => basename(f) === "SKILL.md").map((f) => dirname(f));
  if (skillDirs.includes(".")) throw new Error(`${srcSkills}/SKILL.md: a skill can't sit directly in skills/`);

  const nestedInside = skillDirs.filter((a) => skillDirs.some((b) => a !== b && a.startsWith(b + "/")));
  if (nestedInside.length) throw new Error(`skills inside other skills aren't supported: ${nestedInside.join(", ")}`);

  const skills = {};
  for (const dir of skillDirs) {
    const name = readSkillName(join(srcSkills, dir, "SKILL.md")) ?? basename(dir);
    if (!SAFE_NAME.test(name)) throw new Error(`skills/${dir}: skill name '${name}' can't be used as a folder name`);
    if (skills[name]) throw new Error(`two skills are both named '${name}': skills/${skills[name]} and skills/${dir}`);
    skills[name] = dir;
  }
  const owner = (f) => skillDirs.find((d) => f.startsWith(d + "/"));
  const extras = files.filter((f) => !owner(f));

  clean(pkgDir);
  const destSkills = join(pkgDir, "skills");
  for (const [name, dir] of Object.entries(skills)) {
    cpSync(join(srcSkills, dir), join(destSkills, name), { recursive: true, filter: (p) => !isJunk(basename(p)) });
  }
  const destExtras = join(pkgDir, NESTED_EXTRAS_REL);
  for (const f of extras) {
    mkdirSync(dirname(join(destExtras, f)), { recursive: true });
    cpSync(join(srcSkills, f), join(destExtras, f));
  }
  renameDotfiles(destSkills);
  renameDotfiles(destExtras);

  const layout = {
    format: 1,
    description:
      "skills/ is flat (skills/<name>/). 'skills' maps each skill to its original folder under the repo's skills/; " +
      "'extras' are files outside any skill folder, stored under .aiskills/nested/ at those same paths " +
      "(.gitignore/.npmignore renamed to _gitignore/_npmignore).",
    skills: Object.fromEntries(Object.entries(skills).sort(([a], [b]) => a.localeCompare(b))),
    extras,
  };
  mkdirSync(dirname(join(pkgDir, LAYOUT_REL)), { recursive: true });
  writeFileSync(join(pkgDir, LAYOUT_REL), JSON.stringify(layout, null, 2) + "\n");

  const license = join(repoRoot, "LICENSE");
  if (existsSync(license)) cpSync(license, join(pkgDir, "LICENSE"));
  const market = join(repoRoot, ".claude-plugin", "marketplace.json");
  if (existsSync(market)) {
    mkdirSync(join(pkgDir, ".claude-plugin"), { recursive: true });
    cpSync(market, join(pkgDir, ".claude-plugin", "marketplace.json"));
  } else {
    console.error(`[aiskills] warning: ${market} not found; skill groups will be unavailable`);
  }
  return layout;
}

// ------------------------------------------------------------------- main
const isMain = process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href;
if (isMain) {
  // This file lives at <package>/src/scripts/vendor-skills.mjs.
  const pkgDir = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
  try {
    if (process.argv.includes("--clean")) {
      clean(pkgDir);
      console.log("[aiskills] removed vendored skills/, .claude-plugin/, .aiskills/ and LICENSE");
    } else {
      const repoRoot = findRepoRoot(pkgDir);
      const layout = vendor({ repoRoot, pkgDir });
      console.error(
        `[aiskills] vendored ${Object.keys(layout.skills).length} skills (flat) and ` +
          `${layout.extras.length} other files from ${join(repoRoot, "skills")}`,
      );
    }
  } catch (err) {
    console.error(`[aiskills] cannot vendor: ${err?.message ?? err}`);
    process.exit(1);
  }
}
