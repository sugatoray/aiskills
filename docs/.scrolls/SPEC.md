# SPEC.md — Feature Spec

What aiskills does, feature by feature. Add a section per feature when it ships — describe *what* it does and *why* it matters to a user, not the implementation detail (that belongs in code comments or `WISDOM.md`).

## `make link-skills`: use repo skills straight from source (#230, `8028d62`)
`make link-skills SKILL=<path>` links a skill, or every skill below a folder, into `.agents/skills/` and `.claude/skills/` as relative symlinks. Agents working in this repo then load skills from `skills/` directly: an edit takes effect at once, with nothing to reinstall. `make check-skill-links` fails on a broken link or a renamed skill, and `make test-scripts` runs the script's 59 checks. Linked so far: the scrolls family, `create-issues-update-pr`, `create-lib-docs`, `network-flow` and `run-code-review`. Code: `scripts/link-skills.sh`, `Makefile`.

## Release tags (`aiskills-vX.Y.Z`)
Every published npm release has an annotated git tag on the commit npm recorded as its `gitHead`, with the publish time in the message: `aiskills-v0.4.0`–`aiskills-v1.2.0` so far. New releases are tagged the same way (`src/packages/aiskills/docs/meta/MAINTAINERS.md` → Releasing, step 6).

<!--
## <Feature name>
What it does, from a user's perspective. A pointer to where it lives in the code
(`path/to/file.ext:line`) if that saves the next reader time.
-->
