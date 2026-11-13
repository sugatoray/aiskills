# YAML review wisdom

Read this before forming findings on YAML, in a full review and in a security-only one.
**Constraints** are limits the review must stay within. **Traps** are things in the language
that mislead a reader. **Ditches** are the ways a review of this language goes off the road.
**Wisdom** is the judgement that keeps it on.

## Constraints

- **Run the tools first.** Syntax, duplicate keys, formatting and schema validity are for a
  parser, a linter and the consuming tool's own validator to decide, not for reading. Spend
  the review on what no tool judges: wrong values, permissions, injection, secrets.
- **The consumer defines correctness.** YAML that parses but that Kubernetes, the CI system
  or the application reads differently is wrong. Find the consumer before judging.
- **YAML 1.1 and 1.2 disagree,** and libraries implement one, the other, or a mixture. State
  which parser you checked with.
- **A pipeline or deployment file is code** and gets a code review: what runs, when, with
  which credentials.
- **A template is not YAML until it is rendered.** Review the output as well as the source.
- **The standard library of most languages has no YAML parser.** If nothing parsed a file,
  say so; do not report it as checked.

## Traps

- **Unquoted `yes`, `no`, `on`, `off` are booleans in YAML 1.1** and strings in 1.2. The
  two-letter code for Norway is the well-known casualty. The key `on:` in a GitHub workflow
  parses as the boolean `true` in a YAML 1.1 parser.
- **`3.10` is the number 3.1.** Versions need quotes.
- **A leading zero means octal in YAML 1.1** (`010` is 8) and decimal in 1.2.
- **`12:30` is a base-60 number in YAML 1.1** (750).
- **An unquoted date becomes a date object** in some parsers and stays a string in others.
- **An empty value, `~` and `null` are all null,** not an empty string.
- **Indentation is the structure.** One level out is a different key of a different mapping,
  still valid, and silently ignored by many readers. Tabs are not allowed for indentation.
- **Duplicate keys:** PyYAML keeps the last without a word; the JavaScript parsers reject.
- **`<<` merges one level deep.** A nested mapping given locally replaces the merged one.
- **`|` keeps line breaks and `>` folds them.** `|-` and `>-` drop the final newline.
- **`#` starts a comment only after whitespace,** and `: ` (colon, space) inside an unquoted
  value is a syntax error.
- **`*`, `&`, `!`, `@`, `{`, `[` and `%` at the start of a value are syntax.** A glob or a
  template expression there needs quotes.
- **A loader for one document fails or stops at `---`.**
- **`${{ }}` in a workflow is substituted before the shell sees the script.** Quoting inside
  the script does not help.

## Ditches

- **Checking indentation by eye** instead of running a parser.
- **Reporting `yamllint` style warnings** from a default configuration the project never
  adopted.
- **Reading a workflow for syntax and not for what it runs,** on which trigger, with which
  token.
- **Reviewing a Helm or Jinja template as if it were the manifest.**
- **Assuming the parser is PyYAML,** or that it is not.
- **Missing what was removed:** a job, a gate, a filter, a limit, a `permissions:` block.
- **Flagging every unpinned first-party action** with the weight of an untrusted one. Rate
  by who controls the reference.
- **Proposing JSON or TOML instead** in a review of a YAML change.

## Wisdom

- **Quote strings that look like something else:** versions, codes, times, octal modes.
- **Load with the safe loader, always;** treat any other loader as a finding to justify.
- **Pass event data to scripts through the environment,** never through `${{ }}` in `run:`.
- **Give every workflow a `permissions:` block** with the least it needs.
- **Pin what you do not control** to an immutable reference.
- **Validate with the tool that will read the file,** in its dry-run mode.
- **Print what the file parses to** when a value's type matters; it is quicker than arguing.
- **Keep secrets out;** reference a secret store.
- **Say what you did not check:** the parser and version, rendered output, repository
  settings, files left unparsed.
