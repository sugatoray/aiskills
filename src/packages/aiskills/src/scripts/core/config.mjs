// `aiskills config`: persistent defaults, like `git config`.
//
// Two JSON files, each a flat object of key: value:
//   user     ~/.config/sugatoray/aiskills.json   (aiskills config --global, the default)
//   project  ./.aiskills.json                    (aiskills config --project)
// The user file sits next to the install folder, not in it, so `uninstall --purge`
// keeps it. A setting is looked up in this order:
//   command-line option > AISKILLS_* variable > project file > user file
//   > remembered (aiskills.json in the install folder) > default.
// Imports nothing from the other core modules, so every one of them can use it.

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join, sep } from "node:path";

const TRUE = /^(1|true|yes|on)$/i;
const FALSE = /^(0|false|no|off)$/i;

/** The keys, the AISKILLS_* variable each stands for, and what values they take. */
export const CONFIG_KEYS = {
  agents: { env: "AISKILLS_AGENTS", kind: "list", about: "agents to install to (comma-separated, patterns allowed)" },
  color: { env: null, kind: "enum", values: ["auto", "always", "never"], about: "color the output: auto (on a terminal), always or never" },
  copy: { env: "AISKILLS_COPY", kind: "bool", about: "copy files into agent folders instead of symlinking" },
  groups: { env: "AISKILLS_GROUPS", kind: "list", about: "skill groups to install (comma-separated)" },
  layout: { env: "AISKILLS_LAYOUT", kind: "enum", values: ["flat", "nested"], about: "layout of the saved skills folder" },
  route: { env: "AISKILLS_ROUTE", kind: "bool", about: "hand skills that aren't bundled to npx skills (--route)" },
  scope: { env: "AISKILLS_SCOPE", kind: "enum", values: ["global", "project"], about: "install for the user (global) or the current project" },
  skills: { env: "AISKILLS_SKILLS", kind: "list", about: "skills to install (comma-separated, patterns allowed)" },
  "skills-version": { env: "AISKILLS_SKILLS_LIB_VERSION", kind: "string", about: "the skills CLI version npx runs" },
  stats: { env: "AISKILLS_STATS", kind: "bool", about: "add installs to the skills.sh install count" },
};

const orList = (values) => (values.length === 2 ? values.join(" or ") : `${values.slice(0, -1).join(", ")} or ${values.at(-1)}`);

/** Throws for a key that isn't one of CONFIG_KEYS. */
export function assertConfigKey(key) {
  if (!Object.hasOwn(CONFIG_KEYS, key)) throw new Error(`unknown config key: ${key} (keys: ${Object.keys(CONFIG_KEYS).sort().join(", ")})`);
  return CONFIG_KEYS[key];
}

/** A value as given on the command line (or found in a file), checked and normalized for <key>. */
export function parseConfigValue(key, raw) {
  const k = assertConfigKey(key);
  const v = String(raw).trim();
  if (k.kind === "bool") {
    if (TRUE.test(v)) return true;
    if (FALSE.test(v)) return false;
    throw new Error(`${key} must be true or false (or yes/no, on/off, 1/0); got '${v}'`);
  }
  if (k.kind === "enum") {
    const low = v.toLowerCase();
    if (!k.values.includes(low)) throw new Error(`${key} must be ${orList(k.values)}; got '${v}'`);
    return low;
  }
  if (k.kind === "list") {
    const items = v.split(",").map((s) => s.trim()).filter(Boolean);
    if (!items.length) throw new Error(`${key} needs at least one name`);
    return items.join(",");
  }
  if (!v) throw new Error(`${key} needs a value`);
  return v;
}

/** The two config files. */
export function configFiles({ home = homedir(), cwd = process.cwd() } = {}) {
  return { user: join(home, ".config", "sugatoray", "aiskills.json"), project: join(cwd, ".aiskills.json") };
}

/** A config file's contents ({} when it doesn't exist). */
export function readConfigFile(file) {
  if (!existsSync(file)) return {};
  let data;
  try {
    data = JSON.parse(readFileSync(file, "utf8"));
  } catch {
    throw new Error(`${file} is not valid JSON; fix it or delete it`);
  }
  if (!data || typeof data !== "object" || Array.isArray(data)) throw new Error(`${file} is not valid JSON; fix it or delete it`);
  return data;
}

/** Write a config file (keys sorted), creating its folder. */
export function writeConfigFile(file, data) {
  mkdirSync(dirname(file), { recursive: true });
  const sorted = Object.fromEntries(Object.entries(data).sort(([a], [b]) => a.localeCompare(b)));
  writeFileSync(file, JSON.stringify(sorted, null, 2) + "\n");
}

/** Every key set in one file ("user" or "project"), as { key: { value, origin, file } }. */
function entriesOf(origin, files = configFiles()) {
  const file = files[origin];
  const out = {};
  for (const [key, raw] of Object.entries(readConfigFile(file))) {
    if (!Object.hasOwn(CONFIG_KEYS, key)) continue; // a key from a newer aiskills: ignored
    try {
      out[key] = { value: parseConfigValue(key, raw), origin, file };
    } catch (err) {
      throw new Error(`${file}: ${err.message}`);
    }
  }
  return out;
}

/**
 * What is set, sorted by key: the project file over the user file, or one file only
 * (only: "user" | "project"). Each entry is { key, value, origin, file }.
 */
export function configList({ only = null } = {}) {
  const files = configFiles();
  const merged = only ? entriesOf(only, files) : { ...entriesOf("user", files), ...entriesOf("project", files) };
  return Object.entries(merged).sort(([a], [b]) => a.localeCompare(b)).map(([key, e]) => ({ key, ...e }));
}

/** One key's value and where it comes from ({ value, origin, file }), or undefined when it isn't set. */
export function configValue(key, { only = null } = {}) {
  assertConfigKey(key);
  return configList({ only }).find((e) => e.key === key);
}

/** A value as `aiskills config <key>` prints it. */
export const formatConfigValue = (v) => String(v);

/** A path as aiskills shows it: ~ for the home folder, . for the current one. */
export function displayPath(p, { home = homedir(), cwd = process.cwd() } = {}) {
  if (p === home || p.startsWith(home + sep)) return "~" + p.slice(home.length);
  if (p.startsWith(cwd + sep)) return "." + p.slice(cwd.length);
  return p;
}
