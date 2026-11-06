// Unit tests for the pure helpers in src/scripts/installer.mjs.
import assert from "node:assert/strict";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { after, before, describe, test } from "node:test";

import {
  envOptions,
  expandPatterns,
  globToRegExp,
  isGlob,
  isSourceSpec,
  loadGroups,
  packageSkillNames,
  selectedSkills,
  skillNamesIn,
  skillsForGroups,
  specSkillName,
} from "../scripts/installer.mjs";
import { tempDir, writeFixtureTree } from "./helpers.mjs";

let root;
before(() => {
  root = writeFixtureTree(tempDir());
});
after(() => rmSync(root, { recursive: true, force: true }));

const ALL = ["a1", "a2", "beta-one", "beta-two", "lonely"];
const matches = (glob, list) => list.filter((s) => globToRegExp(glob).test(s));

describe("isGlob", () => {
  test("detects *, ? and [", () => {
    for (const g of ["a*", "a?", "[ab]x", "*"]) assert.equal(isGlob(g), true, g);
    for (const s of ["abc", "a-b.c", "owner/repo@skill"]) assert.equal(isGlob(s), false, s);
  });
});

describe("globToRegExp", () => {
  const names = ["scrolls-hide", "scrolls-unhide", "scrolls-update", "scrolls-setup", "stata-recipes"];

  test("* matches any run of characters, including none", () => {
    assert.deepEqual(matches("scrolls-*", names), names.slice(0, 4));
    assert.deepEqual(matches("*", names), names);
    assert.deepEqual(matches("stata-recipes*", names), ["stata-recipes"]);
  });

  test("? matches exactly one character", () => {
    assert.deepEqual(matches("?????-recipes", names), ["stata-recipes"]);
    assert.deepEqual(matches("????-recipes", names), []);
  });

  test("[abc], ranges and negation", () => {
    assert.deepEqual(matches("scrolls-[hu]*", names), ["scrolls-hide", "scrolls-unhide", "scrolls-update"]);
    assert.deepEqual(matches("scrolls-[r-t]*", names), ["scrolls-setup"]);
    assert.deepEqual(matches("scrolls-[!hu]*", names), ["scrolls-setup"]);
    assert.deepEqual(matches("scrolls-[^hu]*", names), ["scrolls-setup"]);
  });

  test("matches the whole name only", () => {
    assert.equal(globToRegExp("croll*").test("scrolls-hide"), false);
    assert.equal(globToRegExp("scrolls").test("scrolls-hide"), false);
  });

  test("ignores case", () => {
    assert.equal(globToRegExp("SCROLLS-*").test("scrolls-hide"), true);
  });

  test("regex metacharacters are literal", () => {
    assert.equal(globToRegExp("a.b").test("a.b"), true);
    assert.equal(globToRegExp("a.b").test("axb"), false);
    assert.equal(globToRegExp("a+b(c)").test("a+b(c)"), true);
    assert.equal(globToRegExp("x[y").test("x[y"), true, "unclosed [ is literal");
  });
});

describe("expandPatterns", () => {
  test("canonicalises literal case and tracks literals", () => {
    const r = expandPatterns(["A1", "beta-*"], ALL);
    assert.deepEqual([...r.matched].sort(), ["a1", "beta-one", "beta-two"]);
    assert.deepEqual([...r.literals], ["a1"]);
    assert.deepEqual(r.unknown, []);
    assert.deepEqual(r.empty, []);
  });

  test("reports unknown literals and empty globs separately", () => {
    const r = expandPatterns(["nope", "zz*"], ALL);
    assert.deepEqual(r.unknown, ["nope"]);
    assert.deepEqual(r.empty, ["zz*"]);
    assert.equal(r.literals.has("nope"), true);
  });
});

describe("skillNamesIn / packageSkillNames", () => {
  test("reads frontmatter name:, quoted or not, falling back to the folder name", () => {
    assert.deepEqual([...packageSkillNames(root)].sort(), ALL);
  });

  test("a missing folder gives an empty set", () => {
    assert.equal(skillNamesIn(join(root, "nowhere")).size, 0);
  });

  test("skips node_modules", () => {
    const dir = tempDir();
    try {
      mkdirSync(join(dir, "node_modules", "x"), { recursive: true });
      writeFileSync(join(dir, "node_modules", "x", "SKILL.md"), "---\nname: hidden\n---\n");
      assert.equal(skillNamesIn(dir).size, 0);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});

describe("loadGroups", () => {
  test("one group per local plugin entry, with alias and skills", () => {
    const { groups, ungrouped } = loadGroups(root);
    assert.deepEqual(
      groups.map(({ name, alias, skills }) => ({ name, alias, skills })),
      [
        { name: "alpha-skills", alias: "alpha", skills: ["a1", "a2"] },
        { name: "beta-skills", alias: "beta", skills: ["beta-one", "beta-two"] },
      ],
    );
    assert.deepEqual(ungrouped, ["lonely"]);
  });

  test("a name without -skills is its own alias", () => {
    const dir = writeFixtureTree(tempDir(), {
      marketplace: { metadata: { pluginRoot: "./skills" }, plugins: [{ name: "Alpha", source: "./alpha" }] },
    });
    try {
      assert.equal(loadGroups(dir).groups[0].alias, "Alpha");
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  test("no marketplace.json: no groups, everything ungrouped", () => {
    const dir = writeFixtureTree(tempDir(), { marketplace: null });
    try {
      const r = loadGroups(dir);
      assert.equal(r.missing, true);
      assert.deepEqual(r.groups, []);
      assert.deepEqual(r.ungrouped, ALL);
      assert.throws(() => skillsForGroups(["alpha"], dir), /marketplace\.json/);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});

describe("skillsForGroups", () => {
  test("full name, alias and any letter case", () => {
    for (const g of ["alpha-skills", "alpha", "ALPHA", "Alpha-Skills"]) {
      assert.deepEqual(skillsForGroups([g], root), ["a1", "a2"], g);
    }
  });

  test("all and * mean every skill, including ungrouped ones", () => {
    assert.deepEqual(skillsForGroups(["all"], root), ALL);
    assert.deepEqual(skillsForGroups(["*"], root), ALL);
  });

  test("globs match names and aliases", () => {
    assert.deepEqual(skillsForGroups(["b*"], root), ["beta-one", "beta-two"]);
    assert.deepEqual(skillsForGroups(["*-skills"], root), ["a1", "a2", "beta-one", "beta-two"]);
  });

  test("several groups are unioned", () => {
    assert.deepEqual(skillsForGroups(["alpha", "beta"], root), ["a1", "a2", "beta-one", "beta-two"]);
  });

  test("unknown names and empty globs throw, listing the groups", () => {
    assert.throws(() => skillsForGroups(["nope"], root), /no group matches: nope[\s\S]*alpha-skills \(alpha\)/);
    assert.throws(() => skillsForGroups(["zz*"], root), /no group matches: zz\*/);
  });
});

describe("selectedSkills", () => {
  test("null means everything: nothing given, or -s *", () => {
    assert.equal(selectedSkills({ skills: [], groups: [] }, root), null);
    assert.equal(selectedSkills({ skills: ["*"], groups: ["alpha"] }, root), null);
  });

  test("unions -s (names and globs) with -G", () => {
    const r = selectedSkills({ skills: ["lonely", "beta-*"], groups: ["alpha"] }, root);
    assert.deepEqual(r.names, ["a1", "a2", "beta-one", "beta-two", "lonely"]);
    assert.deepEqual(r.unknown, []);
  });

  test("unknown literals are kept and reported", () => {
    const r = selectedSkills({ skills: ["a1", "owner/repo@ext"], groups: [] }, root);
    assert.deepEqual(r.names, ["a1", "owner/repo@ext"]);
    assert.deepEqual(r.unknown, ["owner/repo@ext"]);
  });

  test("a skill glob that matches nothing throws", () => {
    assert.throws(() => selectedSkills({ skills: ["zz*"], groups: [] }, root), /no skill matches: zz\*/);
  });

  test("a custom universe widens what -s can match", () => {
    const r = selectedSkills({ skills: ["ext*"], groups: [] }, root, new Set([...ALL, "external-one"]));
    assert.deepEqual(r.names, ["external-one"]);
  });
});

describe("isSourceSpec / specSkillName", () => {
  const cases = [
    // entry,                    isSourceSpec, specSkillName
    ["pdf", false, "pdf"],
    ["anthropics/skills@pdf", true, "pdf"],
    ["anthropics/skills", true, null],
    ["https://github.com/a/b", true, null],
    ["git@github.com:a/b.git", true, null],
    ["./local/dir", true, null],
    ["~/skills", true, null],
  ];
  for (const [entry, spec, name] of cases) {
    test(entry, () => {
      assert.equal(isSourceSpec(entry), spec);
      assert.equal(specSkillName(entry), name);
    });
  }
});

describe("envOptions", () => {
  const KEYS = ["AISKILLS_SCOPE", "AISKILLS_AGENTS", "AISKILLS_SKILLS", "AISKILLS_GROUPS", "AISKILLS_COPY", "AISKILLS_ROUTE"];
  const withEnv = (vars, fn) => {
    const saved = Object.fromEntries(KEYS.map((k) => [k, process.env[k]]));
    for (const k of KEYS) delete process.env[k];
    Object.assign(process.env, vars);
    try {
      return fn();
    } finally {
      for (const k of KEYS) (saved[k] === undefined ? delete process.env[k] : (process.env[k] = saved[k]));
    }
  };

  test("defaults: global, nothing selected, no copy, no route", () => {
    assert.deepEqual(
      withEnv({}, envOptions),
      { global: true, agents: [], skills: [], groups: [], copy: false, route: false },
    );
  });

  test("reads every AISKILLS_* variable", () => {
    const o = withEnv(
      {
        AISKILLS_SCOPE: "Project",
        AISKILLS_AGENTS: "claude-code, codex",
        AISKILLS_SKILLS: "a1,,b*",
        AISKILLS_GROUPS: "alpha",
        AISKILLS_COPY: "yes",
        AISKILLS_ROUTE: "1",
      },
      envOptions,
    );
    assert.deepEqual(o, {
      global: false,
      agents: ["claude-code", "codex"],
      skills: ["a1", "b*"],
      groups: ["alpha"],
      copy: true,
      route: true,
    });
  });
});
