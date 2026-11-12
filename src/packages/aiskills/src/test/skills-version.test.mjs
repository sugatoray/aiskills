// Which `skills` CLI version npx runs, and living with npm's release-age rules.
//
// 1. AISKILLS_SKILLS_LIB_VERSION takes an exact version, "latest"/"next", an npm
//    range (~1.7.4, 1.7.x, >=1.7.4 <1.8.0), or interval notation, where exactly
//    one of "...", "?" or "*" is an open end (plain ASCII, so it types the same
//    in every shell; no combinations like "?*"):
//    [x, ...) >=x   (x, ?) >x   [x, y) >=x <y   (..., x] <=x   (and the other mixes).
//    With a range, npm picks the newest version that its own rules allow, so a
//    min-release-age setting no longer blocks aiskills while the pinned
//    version is too new. The default stays the exact, tested pin.
// 2. npm's release-age settings (npm_config_min_release_age, _before,
//    _min_release_age_exclude) reach npx, so a one-off override works.
// 3. When npm refuses the version because of that rule, aiskills says so and
//    what to do.
// 4. npm run audit:skills checks a skills CLI version (advisories + age)
//    before a maintainer pins it.

import assert from "node:assert/strict";
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { after, describe, test } from "node:test";

import { PKG_SRC, sandbox, skillsArgs, skillsPackage } from "./helpers.mjs";
import { SKILLS_CLI_VERSION, cmdArgs, skillsVersionSpec } from "../scripts/core/installer.mjs";
import { auditSkills } from "../scripts/pack/audit-skills.mjs";

describe("skillsVersionSpec: AISKILLS_SKILLS_LIB_VERSION -> what npx is asked for", () => {
  test("exact versions and the latest/next tags pass through", () => {
    for (const v of ["1.7.6", "1.8.0-beta.1", "latest", "next"]) assert.equal(skillsVersionSpec(v), v);
  });

  test("npm ranges pass through", () => {
    for (const v of ["~1.7.4", "^1.7.0", "1.7.x", "1.x", "1.7", ">=1.7.4", ">=1.7.4 <1.8.0", "<=1.7.6", "1.7.4 - 1.7.6", "~1.7.4 || 2.x"]) {
      assert.equal(skillsVersionSpec(v), v, v);
    }
  });

  test("interval notation becomes an npm range", () => {
    const cases = {
      "[1.7.4, ...)": ">=1.7.4",
      "[1.7.4, ?)": ">=1.7.4",
      "(1.7.4, ...)": ">1.7.4",
      "(1.7.4,?)": ">1.7.4",
      "[1.7.4, *)": ">=1.7.4",
      "(1.7.4, *)": ">1.7.4",
      "(*, 1.7.6]": "<=1.7.6",
      "(*,1.7.6)": "<1.7.6",
      "[1.7.4, 1.8.0)": ">=1.7.4 <1.8.0",
      "[1.7.4,1.8.0)": ">=1.7.4 <1.8.0",
      "(1.7.0, 1.7.6]": ">1.7.0 <=1.7.6",
      "[1.7.4, 1.7.6]": ">=1.7.4 <=1.7.6",
      "(..., 1.7.6]": "<=1.7.6",
      "(?, 1.7.6]": "<=1.7.6",
      "(..., 1.7.6)": "<1.7.6",
      "(?, 1.7.6)": "<1.7.6",
      "(…, 1.7.6]": "<=1.7.6", // the Unicode ellipsis is still read as "..."
      "( 1.7 , 2 )": ">1.7 <2",
    };
    for (const [input, want] of Object.entries(cases)) assert.equal(skillsVersionSpec(input), want, input);
  });

  test("anything else is refused, naming AISKILLS_SKILLS_LIB_VERSION", () => {
    for (const v of [
      "1.0 && calc", "1.7.6; rm -rf ~", "file:../skills", "github:vercel-labs/skills", "beta", "1.7.6 %PATH%",
      "[1.7.4, ...]", "[1.7.4, ?]", // an open end needs ")"
      "[..., 1.7.6]", "[?, 1.7.6]", // an open start needs "("
      "(..., ...)", "(?, ?)", "(?, ...)", // no bounds at all: use "latest"
      "[1.7.4, ..)", "[1.7.4, ??)", "[1.7.4, **)", // two dots, two ? or two * aren't an open end
      "[1.7.4, ?*)", "[1.7.4, *?)", "[1.7.4, *...)", "(...?, 1.7.6]", "(?..., 1.7.6]", "(* ?, 1.7.6]", // only one of ..., ?, * at a time
      "[1.7.4, *]", "[*, 1.7.6]", "(*, *)", "(*, ?)", "(..., *)",
      "[1.8.0, 1.7.0)", // empty
      "[1.7.6, 1.7.6)", // empty
      "[1.7.4)", "[1.7.4, 1.8.0", "[a, b)",
    ]) {
      assert.throws(() => skillsVersionSpec(v), /AISKILLS_SKILLS_LIB_VERSION/, v);
    }
  });
});

describe("skillsVersionSpec: only plain spaces separate range parts", () => {
  test("tabs, newlines and Unicode spaces between parts are refused", () => {
    for (const v of [
      "1.7.4\n1.7.5", "1.7.4\r\n<1.8.0", ">=1.7.4\t<1.8.0", ">=1.7.4\u2028<1.8.0", ">=1.7.4\u00a0<1.8.0",
      ">=1.7.4\u3000<1.8.0", "1.7.4\n-\n1.7.6", "~1.7.4\n||\n2.x", "[1.7.4,\t1.8.0)", "(...,\n1.7.6]", "(\u00a0?, 1.7.6]",
    ]) {
      assert.throws(() => skillsVersionSpec(v), /AISKILLS_SKILLS_LIB_VERSION/, JSON.stringify(v));
    }
  });

  test("plain spaces still work, and a value's leading/trailing whitespace is trimmed (never passed on)", () => {
    assert.equal(skillsVersionSpec(">=1.7.4  <1.8.0"), ">=1.7.4  <1.8.0");
    assert.equal(skillsVersionSpec("[ 1.7.4 ,  1.8.0 )"), ">=1.7.4 <1.8.0");
    assert.equal(skillsVersionSpec("  1.7.6\n"), "1.7.6");
  });

  test("a typographic ellipsis (as autocorrect makes it) is read as \"...\", and lookalike digits are refused", () => {
    assert.equal(skillsVersionSpec("(…, 1.7.6]"), "<=1.7.6");
    for (const v of ["(…?, 1.7.6]", "１.7.6", "(…, １.7.6]"]) assert.throws(() => skillsVersionSpec(v), /AISKILLS_SKILLS_LIB_VERSION/, v);
  });
});

describe("cmdArgs: npx arguments for cmd.exe on Windows", () => {
  test("wraps a range's package spec in double quotes, where cmd.exe treats < > | ^ as text", () => {
    assert.deepEqual(cmdArgs(["-y", "skills@>=1.7.4 <1.8.0", "add", "C:\\Users\\Jane Doe\\x", "--yes"]), [
      "-y",
      '"skills@>=1.7.4 <1.8.0"',
      "add",
      '"C:\\Users\\Jane Doe\\x"',
      "--yes",
    ]);
    assert.deepEqual(cmdArgs(["-y", "skills@^1.7.0", "list"]), ["-y", '"skills@^1.7.0"', "list"]);
  });

  test("still refuses shell characters in every other argument", () => {
    assert.throws(() => cmdArgs(["-y", "skills@1.7.6", "add", "a&b"]), /refusing to pass shell characters to cmd\.exe: a&b/);
    assert.throws(() => cmdArgs(["-y", "skills@1.7.6", "find", "x|y"]), /x\|y/);
  });
});

describe("aiskills with AISKILLS_SKILLS_LIB_VERSION", () => {
  const sb = sandbox();
  after(() => sb.cleanup());

  test("a range or interval reaches npx as the matching npm range", () => {
    for (const [input, spec] of [["~1.7.4", "skills@~1.7.4"], ["[1.7.4, 1.8.0)", "skills@>=1.7.4 <1.8.0"], ["(..., 1.7.6]", "skills@<=1.7.6"], ["(?, 1.7.6]", "skills@<=1.7.6"], ["(*, 1.7.6]", "skills@<=1.7.6"]]) {
      const r = sb.run(["install"], { env: { AISKILLS_SKILLS_LIB_VERSION: input } });
      assert.equal(r.status, 0, r.out);
      assert.ok(r.calls.length > 0);
      for (const c of r.calls) assert.equal(skillsPackage(c), spec, input);
    }
  });

  test("the logged command quotes a range that has spaces", () => {
    const r = sb.run(["install"], { env: { AISKILLS_SKILLS_LIB_VERSION: "[1.7.4, 1.8.0)" } });
    assert.match(r.out, /running: npx -y 'skills@>=1\.7\.4 <1\.8\.0' add /);
    const dry = sb.run(["install", "-n"], { env: { AISKILLS_SKILLS_LIB_VERSION: "[1.7.4, 1.8.0)" } });
    assert.match(dry.out, /\[dry-run\] npx -y 'skills@>=1\.7\.4 <1\.8\.0' add /);
  });

  test("a bad value stops before anything runs", () => {
    const r = sb.run(["install"], { env: { AISKILLS_SKILLS_LIB_VERSION: "[1.8.0, 1.7.0)" } });
    assert.equal(r.status, 1);
    assert.match(r.out, /AISKILLS_SKILLS_LIB_VERSION/);
    assert.deepEqual(r.calls, []);
  });

  test("an override is announced once per command, even where npx's command isn't printed", () => {
    const NOTE = "[aiskills] using skills@<=1.7.6 from AISKILLS_SKILLS_LIB_VERSION, not the tested " + SKILLS_CLI_VERSION;
    const r = sb.run(["install"], { env: { AISKILLS_SKILLS_LIB_VERSION: "(..., 1.7.6]" } });
    assert.equal(r.status, 0, r.out);
    assert.equal(r.out.split(NOTE).length - 1, 1, r.out);
    sb.setList([]);
    const ls = sb.run(["installed"], { env: { AISKILLS_SKILLS_LIB_VERSION: "(..., 1.7.6]" } });
    assert.ok(ls.out.includes(NOTE), ls.out);
    const dry = sb.run(["install", "-n"], { env: { AISKILLS_SKILLS_LIB_VERSION: "latest" } });
    assert.ok(dry.out.includes("[aiskills] using skills@latest from AISKILLS_SKILLS_LIB_VERSION, not the tested " + SKILLS_CLI_VERSION), dry.out);
  });

  test("1.0.0 removed the old name AISKILLS_SKILLS_VERSION: it's ignored, so the pinned version runs", () => {
    const r = sb.run(["install"], { env: { AISKILLS_SKILLS_VERSION: "(..., 1.7.6]" } });
    assert.equal(r.status, 0, r.out);
    assert.ok(r.calls.length > 0);
    for (const c of r.calls) assert.equal(skillsPackage(c), "skills@" + SKILLS_CLI_VERSION);
    assert.doesNotMatch(r.out, /deprecated|AISKILLS_SKILLS_VERSION/);
  });

  test("with both set, only AISKILLS_SKILLS_LIB_VERSION is read", () => {
    const r = sb.run(["install"], { env: { AISKILLS_SKILLS_LIB_VERSION: "~1.7.4", AISKILLS_SKILLS_VERSION: "latest" } });
    assert.equal(r.status, 0, r.out);
    for (const c of r.calls) assert.equal(skillsPackage(c), "skills@~1.7.4");
    assert.doesNotMatch(r.out, /AISKILLS_SKILLS_VERSION/);
  });

  test("a bad value under the old name no longer stops an install", () => {
    const r = sb.run(["install"], { env: { AISKILLS_SKILLS_VERSION: "1.0 && calc" } });
    assert.equal(r.status, 0, r.out);
    for (const c of r.calls) assert.equal(skillsPackage(c), "skills@" + SKILLS_CLI_VERSION);
  });

  test("aiskills info ignores the old name too", () => {
    const r = sb.run(["info"], { env: { AISKILLS_SKILLS_VERSION: "latest" } });
    assert.equal(r.status, 0, r.out);
    assert.match(r.out, new RegExp("skills CLI : skills@" + SKILLS_CLI_VERSION.replace(/\./g, "\\.") + "  \\(pinned, tested\\)"));
  });

  test("the CHANGELOG lists the removal under 1.0.0, and the code and help no longer mention the old name", () => {
    const log = readFileSync(join(PKG_SRC, "CHANGELOG.md"), "utf8");
    const v1 = log.slice(log.indexOf("## [1.0.0]"), log.indexOf("## [0.9.0]"));
    assert.match(v1, /### Removed[\s\S]*AISKILLS_SKILLS_VERSION/);
    for (const file of ["src/scripts/core/installer.mjs", "src/scripts/core/cli.mjs"]) {
      assert.doesNotMatch(readFileSync(join(PKG_SRC, file), "utf8"), /AISKILLS_SKILLS_VERSION|OLD_SKILLS_LIB_VERSION_VAR/, file);
    }
  });

  test("no announcement for the pinned version, set or not", () => {
    for (const env of [{}, { AISKILLS_SKILLS_LIB_VERSION: SKILLS_CLI_VERSION }]) {
      const r = sb.run(["install"], { env });
      assert.doesNotMatch(r.out, /from AISKILLS_SKILLS_LIB_VERSION/, JSON.stringify(env));
    }
  });

  test("the docs say a typographic … is read as ...", () => {
    for (const page of ["docs/docsite/guides/choose-the-skills-cli-version.md", "docs/docsite/reference/environment.md"]) {
      assert.match(readFileSync(join(PKG_SRC, page), "utf8"), /typographic `…`[^.]*is read as `\.\.\.`/, page);
    }
  });

  test("--help documents AISKILLS_SKILLS_LIB_VERSION with its forms", () => {
    const { out } = sb.run(["--help"]);
    assert.match(out, /AISKILLS_SKILLS_LIB_VERSION/);
    assert.match(out, /\[1\.7\.4, \.\.\.\)/);
    assert.match(out, /"\.\.\.", "\?" or "\*"/);
    assert.doesNotMatch(out, /…/, "help shows only plain ASCII forms");
  });
});

describe("npm's release-age settings reach npx", () => {
  const sb = sandbox();
  after(() => sb.cleanup());

  test("npm_config_min_release_age, _before and _min_release_age_exclude are kept; npm's own variables still aren't", () => {
    const r = sb.run(["install"], {
      env: {
        npm_config_min_release_age: "0",
        npm_config_before: "2026-11-01",
        npm_config_min_release_age_exclude: "skills",
        npm_config_global: "true",
        npm_lifecycle_event: "npx",
      },
    });
    assert.equal(r.status, 0, r.out);
    const add = r.calls.find((c) => skillsArgs(c)[0] === "add");
    assert.deepEqual(add.npmEnv.sort(), ["npm_config_before", "npm_config_min_release_age", "npm_config_min_release_age_exclude"]);
  });
});

describe("when npm's release-age rule blocks the skills CLI", () => {
  const sb = sandbox();
  after(() => sb.cleanup());
  const NOTARGET = { FAKE_NOTARGET: "11/2/2026, 9:53:24 AM" };
  const PINNED = `skills@${SKILLS_CLI_VERSION}`;

  test("install explains it and what to do", () => {
    const r = sb.run(["install"], { env: NOTARGET });
    assert.notEqual(r.status, 0);
    assert.match(r.out, new RegExp(`No matching version found for ${PINNED} with a date before`), "npm's own error is still shown");
    assert.match(r.out, new RegExp(`npm's release-age rule \\(min-release-age or before\\) blocked ${PINNED}: npm only installs versions published before 11/2/2026, 9:53:24 AM, and this one is newer`));
    assert.match(r.out, /wait until it is old enough/);
    assert.match(r.out, /npm_config_min_release_age=0 aiskills/);
    assert.match(r.out, new RegExp(`AISKILLS_SKILLS_LIB_VERSION='\\(\\.\\.\\., ${SKILLS_CLI_VERSION.replace(/\./g, "\\.")}\\]'`));
    assert.doesNotMatch(r.out, /…/, "the suggestion can be copied as is, on any OS");
  });

  test("commands that read npx skills' output (installed) explain it too", () => {
    const r = sb.run(["installed"], { env: NOTARGET });
    assert.match(r.out, /npm's release-age rule/);
    assert.match(r.out, /could not read 'npx skills list'/);
  });

  test("other npx failures get no such note", () => {
    const r = sb.run(["install"], { env: { FAKE_EXIT: "1" } });
    assert.notEqual(r.status, 0);
    assert.doesNotMatch(r.out, /release-age/);
  });
});

describe("npm run audit:skills", () => {
  const NOW = new Date("2026-11-11T12:00:00Z");
  /** A stand-in for `npm`: install --package-lock-only writes a lockfile; view and audit return canned JSON. */
  const fakeNpm = ({ resolved = "1.7.6", published = "2026-11-03T00:17:11Z", vulns = {} } = {}) => {
    const calls = [];
    const run = (args, { cwd }) => {
      calls.push(args);
      if (args[0] === "install") {
        writeFileSync(join(cwd, "package-lock.json"), JSON.stringify({ packages: { "": {}, "node_modules/skills": { version: resolved } } }));
        return { status: 0, stdout: "" };
      }
      if (args[0] === "view") return { status: 0, stdout: JSON.stringify({ [resolved]: published }) };
      if (args[0] === "audit") {
        const counts = { info: 0, low: 0, moderate: 0, high: 0, critical: 0, ...vulns };
        const total = Object.values(counts).reduce((a, b) => a + b, 0);
        return { status: total ? 1 : 0, stdout: JSON.stringify({ metadata: { vulnerabilities: { ...counts, total }, dependencies: { total: 8 } } }) };
      }
      return { status: 1, stdout: "" };
    };
    return { run, calls };
  };

  test("checks the pinned version by default and passes a clean, old-enough version", () => {
    const npm = fakeNpm();
    const res = auditSkills({ run: npm.run, now: NOW });
    assert.equal(res.ok, true, res.lines.join("\n"));
    assert.ok(npm.calls[0].includes(`skills@${SKILLS_CLI_VERSION}`), JSON.stringify(npm.calls[0]));
    assert.ok(npm.calls[0].includes("--package-lock-only") && npm.calls[0].includes("--ignore-scripts"));
    assert.match(res.lines.join("\n"), /skills@1\.7\.6: published 2026-11-03, 8 days ago/);
    assert.match(res.lines.join("\n"), /0 critical, 0 high, 0 moderate, 0 low in 8 packages/);
  });

  test("fails on a high or critical advisory anywhere in the tree", () => {
    for (const vulns of [{ critical: 1 }, { high: 2 }]) {
      const res = auditSkills({ run: fakeNpm({ vulns }).run, now: NOW });
      assert.equal(res.ok, false, JSON.stringify(vulns));
      assert.match(res.lines.join("\n"), /FAIL/);
    }
    assert.equal(auditSkills({ run: fakeNpm({ vulns: { moderate: 1 } }).run, now: NOW }).ok, true, "moderate is reported, not fatal");
  });

  test("fails on a version younger than 7 days (users with min-release-age would be blocked)", () => {
    const res = auditSkills({ run: fakeNpm({ published: "2026-11-09T00:00:00Z" }).run, now: NOW });
    assert.equal(res.ok, false);
    assert.match(res.lines.join("\n"), /only 2 days old/);
    assert.equal(auditSkills({ run: fakeNpm({ published: "2026-11-09T00:00:00Z" }).run, now: NOW, minAgeDays: 1 }).ok, true);
  });

  test("takes a version or range to check, and reports the version it resolved to", () => {
    const npm = fakeNpm({ resolved: "1.7.4", published: "2026-10-19T20:35:25Z" });
    const res = auditSkills({ version: "[1.7.4, 1.7.6)", run: npm.run, now: NOW });
    assert.equal(res.ok, true, res.lines.join("\n"));
    assert.ok(npm.calls[0].includes("skills@>=1.7.4 <1.7.6"), JSON.stringify(npm.calls[0]));
    assert.match(res.lines.join("\n"), /skills@>=1\.7\.4 <1\.7\.6 resolves to 1\.7\.4/);
  });

  test("is an npm script", () => {
    const { scripts } = JSON.parse(readFileSync(join(PKG_SRC, "package.json"), "utf8"));
    assert.equal(scripts["audit:skills"], "node src/scripts/pack/audit-skills.mjs");
  });
});
