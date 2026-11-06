// .skillsignore: gitignore-style rules for leaving files out of the package.
//
// A .skillsignore can sit in any folder under the repo's skills/; its rules
// apply to that folder and below. Supported syntax (a subset of .gitignore):
//
//   # comment          blank lines and lines starting with # are skipped
//   \#file, \!file     a literal leading # or !
//   name               matches a file or folder with that name at any depth
//   /name, a/name      a leading or middle "/" anchors to the ignore file's folder
//   name/              a trailing "/" matches folders only
//   *  ?  [abc] [!a]   within one path segment
//   **                 across segments: "**/x", "x/**", "a/**/b"
//   !pattern           re-include something an earlier rule excluded
//
// The last matching rule wins, and rules in a deeper .skillsignore come after
// the outer ones. As in git, a file inside an ignored folder can't be
// re-included (the folder is never descended into).
//
// Used only at pack time (vendor-skills.mjs), so it is not published.

export const IGNORE_FILE = ".skillsignore";

/** Translate one glob (no leading "/", no trailing "/") to a regex source. */
function globToSource(glob) {
  let re = "";
  for (let i = 0; i < glob.length; i++) {
    const c = glob[i];
    if (c === "*") {
      if (glob[i + 1] === "*") {
        // "**/" -> any number of folders (incl. none); "**" elsewhere -> anything
        if (glob[i + 2] === "/") {
          re += "(?:.*/)?";
          i += 2;
        } else {
          re += ".*";
          i += 1;
        }
      } else re += "[^/]*";
    } else if (c === "?") re += "[^/]";
    else if (c === "[") {
      const close = glob.indexOf("]", i + 2);
      if (close === -1) {
        re += "\\[";
        continue;
      }
      let body = glob.slice(i + 1, close);
      if (body[0] === "!") body = "^" + body.slice(1);
      re += "[" + body.replace(/\\/g, "\\\\") + "]";
      i = close;
    } else re += c.replace(/[.+^${}()|\\\]/]/g, "\\$&");
  }
  return re;
}

/**
 * Parse .skillsignore text into rules:
 *   [{ pattern, negate, dirOnly, regex }]
 * `regex` matches a path relative to the ignore file's folder (posix "/").
 */
export function parseIgnore(text) {
  const rules = [];
  for (let line of text.split(/\r?\n/)) {
    line = line.replace(/\s+$/, "");
    if (!line || line.startsWith("#")) continue;
    let negate = false;
    if (line.startsWith("!")) {
      negate = true;
      line = line.slice(1);
    } else if (line.startsWith("\\#") || line.startsWith("\\!")) {
      line = line.slice(1);
    }
    let dirOnly = false;
    if (line.endsWith("/")) {
      dirOnly = true;
      line = line.slice(0, -1);
    }
    if (!line) continue;
    const anchored = line.includes("/");
    const body = globToSource(line.replace(/^\//, ""));
    const regex = new RegExp(anchored ? `^${body}$` : `^(?:.*/)?${body}$`);
    rules.push({ pattern: line, negate, dirOnly, regex });
  }
  return rules;
}

/**
 * Is <path> (posix, relative to the skills/ root) ignored?
 * <layers> is [{ base, rules }], outermost first; each layer only applies to
 * paths under its `base` folder ("" = the skills/ root).
 */
export function isIgnored(layers, path, isDir) {
  let ignored = false;
  for (const { base, rules } of layers) {
    if (base && path !== base && !path.startsWith(base + "/")) continue;
    const rel = base ? path.slice(base.length + 1) : path;
    if (!rel) continue;
    for (const r of rules) {
      if (r.dirOnly && !isDir) continue;
      if (r.regex.test(rel)) ignored = !r.negate;
    }
  }
  return ignored;
}
