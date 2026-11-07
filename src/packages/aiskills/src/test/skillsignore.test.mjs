// Tests for .skillsignore: the gitignore-style rule parser/matcher
// (src/scripts/skillsignore.mjs) and how vendor() applies it.
import assert from "node:assert/strict";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { describe, test } from "node:test";

import { isIgnored, parseIgnore } from "../scripts/pack/skillsignore.mjs";
import { vendor } from "../scripts/pack/vendor-skills.mjs";
import { syncSkills } from "../scripts/core/installer.mjs";
import { listTree, tempDir } from "./helpers.mjs";

/** Is <path> ignored by a single .skillsignore with <text> at the top? */
const ign = (text, path, isDir = false) => isIgnored([{ base: "", rules: parseIgnore(text) }], path, isDir);

describe("parseIgnore / isIgnored (gitignore syntax)", () => {
  test("a # after a pattern is part of the pattern, not a comment (like git)", () => {
    assert.equal(ign("*.log   # logs", "a.log"), false);
    assert.equal(ign("*.log   # logs", "a.log   # logs"), true);
  });

  test("blank lines and # comments are skipped; \\# is a literal #", () => {
    assert.deepEqual(parseIgnore("\n# comment\n   \n"), []);
    assert.equal(ign("\\#notes.md", "#notes.md"), true);
  });

  test("a name without / matches at any depth, files and folders", () => {
    assert.equal(ign("notes.md", "notes.md"), true);
    assert.equal(ign("notes.md", "a/b/notes.md"), true);
    assert.equal(ign("tests", "a/tests", true), true);
    assert.equal(ign("notes.md", "a/notes.md.bak"), false);
  });

  test("a leading or middle / anchors to the ignore file's folder", () => {
    assert.equal(ign("meta/x.md", "g/meta/x.md"), false, "like git: a middle / anchors");
    assert.equal(ign("**/meta/x.md", "g/meta/x.md"), true);
    assert.equal(ign("/notes.md", "notes.md"), true);
    assert.equal(ign("/notes.md", "a/notes.md"), false);
    assert.equal(ign("a/notes.md", "a/notes.md"), true);
    assert.equal(ign("a/notes.md", "x/a/notes.md"), false);
  });

  test("a trailing / matches folders only", () => {
    assert.equal(ign("build/", "x/build", true), true);
    assert.equal(ign("build/", "x/build", false), false);
  });

  test("* and ? stay within one folder name; [abc] classes", () => {
    assert.equal(ign("*.log", "a/b/c.log"), true);
    assert.equal(ign("a/*.log", "a/b/c.log"), false);
    assert.equal(ign("file?.txt", "file1.txt"), true);
    assert.equal(ign("file?.txt", "file10.txt"), false);
    assert.equal(ign("file[0-9].txt", "file7.txt"), true);
    assert.equal(ign("file[!0-9].txt", "file7.txt"), false);
  });

  test("** crosses folders", () => {
    assert.equal(ign("**/tmp", "a/b/tmp", true), true);
    assert.equal(ign("docs/**", "docs/x/y.md"), true);
    assert.equal(ign("a/**/z.md", "a/z.md"), true);
    assert.equal(ign("a/**/z.md", "a/b/c/z.md"), true);
  });

  test("! re-includes, and the last matching rule wins", () => {
    assert.equal(ign("*.md\n!README.md", "README.md"), false);
    assert.equal(ign("*.md\n!README.md", "OTHER.md"), true);
    assert.equal(ign("!README.md\n*.md", "README.md"), true);
    assert.equal(ign("\\!bang.md", "!bang.md"), true);
  });

  test("regex characters are literal", () => {
    assert.equal(ign("a+b(c).md", "a+b(c).md"), true);
    assert.equal(ign("a.md", "aXmd"), false);
  });

  test("rules from a deeper .skillsignore apply relative to its folder, after the outer ones", () => {
    const layers = [
      { base: "", rules: parseIgnore("*.md") },
      { base: "g/s", rules: parseIgnore("!keep.md\n/local.txt") },
    ];
    assert.equal(isIgnored(layers, "g/s/keep.md", false), false, "inner ! wins");
    assert.equal(isIgnored(layers, "g/other.md", false), true, "inner rules don't reach outside g/s");
    assert.equal(isIgnored(layers, "g/s/local.txt", false), true);
    assert.equal(isIgnored(layers, "g/s/sub/local.txt", false), false, "anchored to g/s");
  });
});

describe("vendor() with .skillsignore", () => {
  const withRepo = (files, fn) => {
    const dir = tempDir();
    try {
      for (const [rel, body] of Object.entries(files)) {
        mkdirSync(join(dir, "repo", rel, ".."), { recursive: true });
        writeFileSync(join(dir, "repo", rel), body);
      }
      return fn({ repoRoot: join(dir, "repo"), pkgDir: join(dir, "pkg"), dir });
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  };
  const SKILL = (name) => `---\nname: ${name}\n---\n`;

  test("ignored files and folders don't ship, in skills or in the extras", () => {
    withRepo(
      {
        "skills/.skillsignore": "tests/\n*.log\n**/meta/MAINTAINERS.md\n", // a middle "/" anchors, so "**/" for any depth
        "skills/g/meta/MAINTAINERS.md": "x",
        "skills/g/README.md": "group",
        "skills/g/one/SKILL.md": SKILL("one"),
        "skills/g/one/run.log": "x",
        "skills/g/one/tests/t.sh": "x",
        "skills/g/one/refs/a.md": "a",
      },
      (o) => {
        const layout = vendor(o);
        assert.deepEqual(listTree(join(o.pkgDir, "skills")), ["one/SKILL.md", "one/refs/a.md"]);
        assert.deepEqual(listTree(join(o.pkgDir, ".aiskills", "nested")), ["g/README.md"]);
        assert.deepEqual(layout.extras, ["g/README.md"]);
        assert.deepEqual(layout.ignored, ["g/meta/MAINTAINERS.md", "g/one/run.log", "g/one/tests/"]);
      },
    );
  });

  test(".skillsignore files themselves never ship", () => {
    withRepo(
      { "skills/.skillsignore": "# nothing\n", "skills/g/.skillsignore": "", "skills/g/one/SKILL.md": SKILL("one"), "skills/g/one/.skillsignore": "" },
      (o) => {
        vendor(o);
        const all = [...listTree(join(o.pkgDir, "skills")), ...listTree(join(o.pkgDir, ".aiskills"))];
        assert.ok(!all.some((p) => p.endsWith(".skillsignore")), all.join(", "));
      },
    );
  });

  test("a nested .skillsignore applies to its own folder; ! re-includes", () => {
    withRepo(
      {
        "skills/.skillsignore": "*.md\n!SKILL.md\n",
        "skills/g/one/SKILL.md": SKILL("one"),
        "skills/g/one/.skillsignore": "!keep.md\n",
        "skills/g/one/keep.md": "k",
        "skills/g/one/drop.md": "d",
        "skills/g/two/SKILL.md": SKILL("two"),
        "skills/g/two/keep.md": "not re-included here",
      },
      (o) => {
        vendor(o);
        assert.deepEqual(listTree(join(o.pkgDir, "skills")), ["one/SKILL.md", "one/keep.md", "two/SKILL.md"]);
      },
    );
  });

  test("ignoring a skill's folder drops the skill", () => {
    withRepo(
      { "skills/.skillsignore": "g/wip/\n", "skills/g/one/SKILL.md": SKILL("one"), "skills/g/wip/SKILL.md": SKILL("wip") },
      (o) => {
        const layout = vendor(o);
        assert.deepEqual(Object.keys(layout.skills), ["one"]);
        assert.ok(!existsSync(join(o.pkgDir, "skills", "wip")));
      },
    );
  });

  test("ignoring only a SKILL.md is refused", () => {
    withRepo({ "skills/.skillsignore": "g/one/SKILL.md\n", "skills/g/one/SKILL.md": SKILL("one"), "skills/g/one/x.md": "x" }, (o) => {
      assert.throws(() => vendor(o), /ignores g\/one\/SKILL\.md.*ignore the folder/);
    });
  });

  test("--nested rebuilds the repo minus ignored files and .skillsignore files", () => {
    withRepo(
      {
        "skills/.skillsignore": "*.log\n",
        "skills/g/README.md": "group",
        "skills/g/one/SKILL.md": SKILL("one"),
        "skills/g/one/a.log": "x",
      },
      (o) => {
        vendor(o);
        const root = join(o.dir, "home");
        syncSkills({ root, pkgDir: o.pkgDir, layout: "nested", quiet: true });
        assert.deepEqual(listTree(join(root, "skills")), ["g/README.md", "g/one/SKILL.md"]);
        assert.equal(readFileSync(join(root, "skills", "g", "README.md"), "utf8"), "group");
      },
    );
  });

  test("without any .skillsignore nothing changes and layout.ignored is empty", () => {
    withRepo({ "skills/g/one/SKILL.md": SKILL("one"), "skills/g/one/x.log": "x" }, (o) => {
      const layout = vendor(o);
      assert.deepEqual(layout.ignored, []);
      assert.deepEqual(listTree(join(o.pkgDir, "skills")), ["one/SKILL.md", "one/x.log"]);
    });
  });
});
