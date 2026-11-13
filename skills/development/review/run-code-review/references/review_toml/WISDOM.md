# TOML review wisdom

Read this before forming findings on TOML, in a full review and in a security-only one.
**Constraints** are limits the review must stay within. **Traps** are things in the language
that mislead a reader. **Ditches** are the ways a review of this language goes off the road.
**Wisdom** is the judgement that keeps it on.

## Constraints

- **Run the tools first.** Syntax, formatting and schema validity are for a parser, a
  formatter and the reading tool to decide, not for reading. Spend the review on what no
  tool judges: wrong values, dependency sources, build-time code, secrets.
- **The reader defines the schema.** TOML says only that a file parses; Cargo, a build
  backend or a linter says whether a key means anything.
- **A manifest is code.** It chooses what is downloaded, built and run.
- **Lock files are reviewed at the manifest** that produced them.
- **Python before 3.11 has no TOML parser in its standard library.** If nothing parsed a
  file, say so; do not report it as checked.

## Traps

- **A table header applies until the next header.** A key added at the bottom of the file
  belongs to the last table, not to the top level.
- **A table or key can be defined only once.** `[a]` twice is an error, and so is `a.b = 1`
  followed by `[a]`. A parent may still be defined after its child: `[a.b]` then `[a]`.
- **`[[name]]` appends to an array of tables;** `[name]` defines one table. Mixing the two
  for one name is an error.
- **A dot in a bare key nests.** `127.0.0.1 = "x"` is four levels of tables.
- **Bare values are typed.** `1.10` is a float, `2024-01-01` a date, `07:32:00` a time,
  `true` a boolean (lower case only). Only quotes make a string.
- **Double quotes process escapes, single quotes do not.** `"C:\Users"` is an error;
  `'C:\Users'` is not.
- **There is no null.** Absence is the only way to say "unset", and readers differ on what
  an empty string means.
- **Keys are case-sensitive,** and many tools treat `-` and `_` in names as different.
- **Inline tables are closed:** nothing can be added to one later, and in TOML 1.0 they
  cannot span lines or end with a comma.
- **A leading zero on an integer is an error;** `0o10` is octal.
- **Cargo's `"1.2"` is a caret range,** not an exact version; `"=1.2.0"` is exact.
- **An unknown key is rarely an error.** A misspelled setting silently keeps the default.

## Ditches

- **Reading for syntax** that a parser checks in milliseconds.
- **Commenting on alignment and key order** the project has no formatter for.
- **Reviewing a lock file line by line** instead of the manifest change that caused it.
- **Treating a manifest as data.** A new dependency, source, feature, build script or
  ignored rule is a behaviour change and is reviewed as code.
- **Missing where a key landed** because the diff shows the line and not the header above.
- **Missing what was removed:** a pin, a bound, a lint rule, a lock file update.
- **Proposing JSON or YAML instead** in a review of a TOML change.

## Wisdom

- **Read every changed key with its table header.** Open the file, not only the hunk.
- **Check each changed value against the tool's documentation** for that key.
- **Bound every dependency and name a commit for every git source.**
- **Treat anything that runs at build time as code:** backends, build scripts, task tables.
- **Print what the file parses to** when placement or type is in doubt.
- **Keep secrets out;** reference the environment or a secret store.
- **Validate with the tool that will read the file.**
- **Say what you did not check:** the parser and version, the lock file, files left
  unparsed.
