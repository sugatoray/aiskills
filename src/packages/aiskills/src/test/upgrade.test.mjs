// Unit tests for src/scripts/core/upgrade.mjs: the pure parts of
// `aiskills upgrade` (how aiskills was installed, the target version,
// agent ids, and the refresh plan).
import assert from "node:assert/strict";
import { join } from "node:path";
import { describe, test } from "node:test";

import { agentIds, detectInstall, installCommand, pickTarget, refreshPlan } from "../scripts/core/upgrade.mjs";

const P = ["@sugatoray-ai", "aiskills"];

describe("detectInstall", () => {
  test("a global npm install: under `npm root -g`", () => {
    const root = join("/usr", "local", "lib", "node_modules");
    const d = detectInstall(join(root, ...P), { npmGlobalRoot: root });
    assert.deepEqual(d, { method: "npm", global: true, globalRoot: root, entry: join(root, ...P, "bin", "aiskills.mjs") });
  });

  test("pnpm, bun and yarn global installs, from their folders", () => {
    const pnpmRoot = join("/home", "me", ".local", "share", "pnpm", "global", "5", "node_modules");
    const pnpm = detectInstall(join(pnpmRoot, ".pnpm", "@sugatoray-ai+aiskills@0.8.0", "node_modules", ...P), {});
    assert.equal(pnpm.method, "pnpm");
    assert.equal(pnpm.globalRoot, pnpmRoot);
    assert.equal(pnpm.entry, join(pnpmRoot, ...P, "bin", "aiskills.mjs"));
    assert.equal(detectInstall(join("/home", "me", ".bun", "install", "global", "node_modules", ...P), {}).method, "bun");
    assert.equal(detectInstall(join("/home", "me", ".config", "yarn", "global", "node_modules", ...P), {}).method, "yarn");
  });

  test("npx, a project dependency, and a source checkout can't upgrade themselves", () => {
    assert.deepEqual(detectInstall(join("/home", "me", ".npm", "_npx", "a1b2", "node_modules", ...P), {}), { method: "npx", global: false });
    assert.deepEqual(detectInstall(join("/work", "app", "node_modules", ...P), { npmGlobalRoot: "/usr/lib/node_modules" }), { method: "project", global: false });
    assert.deepEqual(detectInstall(join("/work", "aiskills", "src", "packages", "aiskills"), { npmGlobalRoot: "/usr/lib/node_modules" }), { method: "source", global: false });
  });
});

describe("installCommand", () => {
  test("each package manager's global install", () => {
    assert.deepEqual(installCommand("npm", "@sugatoray-ai/aiskills@0.9.0"), ["npm", ["install", "-g", "@sugatoray-ai/aiskills@0.9.0"]]);
    assert.deepEqual(installCommand("pnpm", "x@1"), ["pnpm", ["add", "-g", "x@1"]]);
    assert.deepEqual(installCommand("bun", "x@1"), ["bun", ["add", "-g", "x@1"]]);
    assert.deepEqual(installCommand("yarn", "x@1"), ["yarn", ["global", "add", "x@1"]]);
  });
});

describe("pickTarget", () => {
  const view = { distTags: { latest: "0.9.0", next: "1.0.0-beta.1" }, versions: ["0.7.0", "0.8.0", "0.9.0", "1.0.0-beta.1"], time: {} };

  test("latest by default; a tag or version on request", () => {
    assert.deepEqual(pickTarget(view, "0.8.0"), { target: "0.9.0", tag: "latest", change: "upgrade" });
    assert.deepEqual(pickTarget(view, "0.9.0"), { target: "0.9.0", tag: "latest", change: "none" });
    assert.deepEqual(pickTarget(view, "0.8.0", "next"), { target: "1.0.0-beta.1", tag: "next", change: "upgrade" });
    assert.deepEqual(pickTarget(view, "0.9.0", "0.7.0"), { target: "0.7.0", tag: null, change: "downgrade" });
  });

  test("a version or tag the registry doesn't have is an error", () => {
    assert.throws(() => pickTarget(view, "0.8.0", "0.8.5"), /no version or tag '0\.8\.5' of @sugatoray-ai\/aiskills on the registry/);
    assert.throws(() => pickTarget(view, "0.8.0", "beta"), /no version or tag 'beta'/);
    assert.throws(() => pickTarget({ distTags: {}, versions: [] }, "0.8.0"), /the registry reports no latest version/);
  });
});

describe("agentIds", () => {
  const known = ["aider-desk", "bob", "claude-code", "codex", "kilo", "kilo-cli", "qoder", "qoder-cn", "roo"];
  test("exact, punctuation-free, then the longest id a name starts or ends with", () => {
    assert.deepEqual(agentIds(["Claude Code", "Codex", "Qoder CN", "AiderDesk", "IBM Bob", "Kilo Code", "Roo Code"], known), {
      ids: ["claude-code", "codex", "qoder-cn", "aider-desk", "bob", "kilo", "roo"],
      unknown: [],
    });
  });
  test("names that match nothing are reported, not guessed", () => {
    assert.deepEqual(agentIds(["Codex", "Brand New Agent"], known), { ids: ["codex"], unknown: ["Brand New Agent"] });
  });
});

describe("refreshPlan", () => {
  const root = "/home/me/.config/sugatoray/aiskills";
  const row = (name, agents, source = root, sourceType = "local") => ({ name, agents, source, sourceType });
  const known = ["claude-code", "codex", "cursor"];

  test("one group per set of agents, only skills from the install folder, sorted", () => {
    const plan = refreshPlan([
      row("b", ["Claude Code", "Codex"]),
      row("a", ["Codex", "Claude Code"]),
      row("c", ["Cursor"]),
      row("pdf", ["Claude Code"], "anthropics/skills", "github"),
    ], root, known);
    assert.deepEqual(plan, {
      groups: [
        { skills: ["a", "b"], agents: ["claude-code", "codex"] },
        { skills: ["c"], agents: ["cursor"] },
      ],
      installed: ["a", "b", "c"],
      unknownAgents: [],
    });
  });

  test("agents that can't be mapped are reported; skills left with none are skipped", () => {
    const plan = refreshPlan([row("a", ["Codex", "Mystery"]), row("z", ["Mystery"])], root, known);
    assert.deepEqual(plan.groups, [{ skills: ["a"], agents: ["codex"] }]);
    assert.deepEqual(plan.unknownAgents, ["Mystery"]);
    assert.deepEqual(plan.installed, ["a", "z"]);
  });
});
