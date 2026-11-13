# JSON review wisdom

Read this before forming findings on JSON, in a full review and in a security-only one.
**Constraints** are limits the review must stay within. **Traps** are things in the language
that mislead a reader. **Ditches** are the ways a review of this language goes off the road.
**Wisdom** is the judgement that keeps it on.

## Constraints

- **Run the tools first.** Syntax, duplicate keys, formatting and schema validity are for a
  parser, a formatter and a validator to decide, not for reading. Spend the review on what
  no tool judges: wrong values, compatibility, secrets, dangerous settings.
- **The reader defines the dialect.** `tsconfig.json` and editor settings allow comments;
  `package.json` does not. Judge a file by the tool that reads it.
- **An exchanged shape is an API.** Key names, types and optionality are a contract with
  systems the diff does not show.
- **Generated JSON is reviewed at its source:** lock files, snapshots, exports.
- **Say which parser checked the file,** and which files nothing checked.

## Traps

- **Numbers have no size or precision in the grammar; parsers supply one.** JavaScript
  rounds integers above 2^53; Python keeps them.
- **Duplicate keys are not forbidden by the grammar.** Most parsers keep the last without a
  warning; others reject the document or return every pair.
- **`NaN`, `Infinity`, comments, trailing commas and single quotes are not JSON,** but
  Python's `json` writes and reads the first two, and several tools accept the rest.
- **A byte-order mark is rejected by strict parsers** and invisible in an editor.
- **`null`, a missing key, `""`, `0` and `[]` are five different things** to a careful
  reader and one thing to a careless one.
- **`"false"` and `"0"` are true** wherever a string is tested for truth.
- **Key order is not significant,** yet some readers depend on it and some writers change it.
- **`1` and `1.0` are the same number to some parsers and different types to others.**
- **A formatter passing is not a parser passing.**
- **A schema that allows additional properties accepts a misspelled key.**
- **`JSON.stringify` drops `undefined` and functions, and writes `NaN` as `null`.**

## Ditches

- **Reading for commas and brackets** that a parser checks in milliseconds.
- **Commenting on indentation or key order** the project has no rule for.
- **Reviewing a lock file line by line** instead of the manifest change that caused it.
- **Calling a file valid** because one lenient tool accepted it.
- **Treating configuration as data.** A changed script, dependency, permission or flag is a
  behaviour change and is reviewed as code.
- **Missing what is absent:** a key removed, a default now applying, a lock file not updated.
- **Proposing YAML or TOML instead** in a review of a JSON change.

## Wisdom

- **Check each changed value against the code that reads it.** That is where the defects are.
- **Validate at the boundary with a schema,** and reject unknown keys in files people edit.
- **Carry identifiers, money and large counts as strings or integer minor units.**
- **Build and parse with a library;** never with string operations.
- **Keep secrets out;** reference the environment or a secret store.
- **Reproduce with a three-line document** in the consumer's own parser before rating.
- **Say what you did not check:** the schema used, consumers not found, files left unparsed.
