#!/usr/bin/env node
// Copies <repo>/skills -> <package>/skills, plus the repo LICENSE and
// <repo>/.claude-plugin/marketplace.json (used by the CLI for skill groups),
// so the published tarball carries the skills folder intact. Runs on `prepack`,
// i.e. before every `npm pack` / `npm publish`.
//
//   node scripts/vendor-skills.mjs          # (re)vendor
//   node scripts/vendor-skills.mjs --clean  # remove vendored copies

import { cpSync, existsSync, mkdirSync, readdirSync, renameSync, rmSync, statSync } from "node:fs";
import { basename, dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const pkgDir = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const repoRoot = resolve(pkgDir, "..", "..");
const srcSkills = join(repoRoot, "skills");
const destSkills = join(pkgDir, "skills");
const srcLicense = join(repoRoot, "LICENSE");
const destLicense = join(pkgDir, "LICENSE");
const srcMarket = join(repoRoot, ".claude-plugin", "marketplace.json");
const destMarketDir = join(pkgDir, ".claude-plugin");

// Local build/runtime junk that is never part of a skill.
const JUNK = new Set([
  "node_modules",
  "__pycache__",
  ".pytest_cache",
  ".venv",
  ".DS_Store",
]);
const isJunk = (p) => JUNK.has(basename(p)) || p.endsWith(".pyc");

rmSync(destSkills, { recursive: true, force: true });
rmSync(destMarketDir, { recursive: true, force: true });
if (process.argv.includes("--clean")) {
  rmSync(destLicense, { force: true });
  console.log("[aiskills] removed vendored skills/, .claude-plugin/ and LICENSE");
  process.exit(0);
}

if (!existsSync(srcSkills) || !statSync(srcSkills).isDirectory()) {
  console.error(`[aiskills] cannot vendor: ${srcSkills} not found`);
  process.exit(1);
}

cpSync(srcSkills, destSkills, {
  recursive: true,
  filter: (src) => !isJunk(src),
});
if (existsSync(srcLicense)) cpSync(srcLicense, destLicense);
if (existsSync(srcMarket)) {
  mkdirSync(destMarketDir, { recursive: true });
  cpSync(srcMarket, join(destMarketDir, "marketplace.json"));
} else {
  console.error(`[aiskills] warning: ${srcMarket} not found; skill groups will be unavailable`);
}

// npm never ships files named .gitignore/.npmignore (and would treat them
// as ignore rules while packing). Rename them; the installer restores the
// original names when it saves the skills to ~/.config/sugatoray/aiskills.
const RENAMES = { ".gitignore": "_gitignore", ".npmignore": "_npmignore" };
(function walk(dir) {
  for (const ent of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, ent.name);
    if (ent.isDirectory()) walk(p);
    else if (RENAMES[ent.name]) renameSync(p, join(dir, RENAMES[ent.name]));
  }
})(destSkills);

console.error(`[aiskills] vendored ${srcSkills} -> ${destSkills}`);
