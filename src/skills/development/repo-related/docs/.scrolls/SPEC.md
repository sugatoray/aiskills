# SPEC.md — Feature Spec

What repo-related (aiskills) does, feature by feature. Add a section per feature when it ships — describe *what* it does and *why* it matters to a user, not the implementation detail (that belongs in code comments or `WISDOM.md`).

Filled in from `skills/development/repo-related/create-issues-update-pr/CHANGELOG.md` (1.0.0 to 1.3.0, 2026-08-28 to 2026-09-21). The CHANGELOG stays the authoritative record; this file says what the skill does today.

## `/create-issues-update-pr`: issues for a PR's work, and a PR that lists them (1.0.0, PR #57)
Given a pull request (or work about to land on a branch), the skill files GitHub issues for that work, then rewrites the PR's title and description so the PR and its issues point at each other. It works against any GitHub repository the session can write to, through the GitHub MCP tools; it has no scripts.

- **One issue or an epic:** one flat issue for a single atomic change, or a parent epic with one child per distinct piece of work, linked through GitHub's native parent/child relationship (not just labels or a checklist). The branch's commits are the usual guide to the split.
- **Before creating:** it checks which issue types the repository supports and uses the closest fit (or none), and searches for existing issues so it doesn't file duplicates.
- **Grounded bodies:** each issue's body comes from the real commit, diff or files for that piece, and work that isn't committed yet is filed as such, not as done.
- **Verified:** after writing, it reads the PR and issues back rather than trusting the write call.

## The PR's issue list closes the issues (1.2.0, PR #66)
Every line of the PR's `## Issues` list reads `- Closes #N -- title`, the parent epic's included, and children are indented two spaces under their parent. GitHub closes each listed issue when the PR merges into the default branch, so the list does the closing, not just the describing.

## A Summary / Details / Issues description by default (1.3.0, PR #74)
When it writes or rewrites a PR description, the default shape is a short **Summary**, a **Details** section (root cause or approach, what changed, how it was verified), then the **Issues** list. A PR that already has its own still-accurate structure keeps it, and only the Issues section is added or refreshed. A generic, stale description is rewritten into the default shape, and the skill says so. The PR title is kept short, reusing the epic's title when there is one.

## Ways to install (1.1.0, 1.2.1)
- **Claude Code plugins:** its own single-skill plugin (`claude --plugin-dir skills/development/repo-related/create-issues-update-pr`), and the `repo-related-skills` family plugin (`/plugin install repo-related-skills@sugatoray` after `/plugin marketplace add sugatoray/aiskills`).
- **Other agents:** `agents/claude-code.yaml` and `agents/openai.yaml` for `npx skills add --agent <name>`. The skill may be invoked implicitly (`allow_implicit_invocation: true`).
- **GitLab Duo:** the frontmatter's `metadata` is a flat mapping (1.2.1), which GitLab Duo requires.
- **npm:** bundled in `@sugatoray-ai/aiskills` (group `repo-related`) since its first published version.

<!--
## <Feature name>
What it does, from a user's perspective. A pointer to where it lives in the code
(`path/to/file.ext:line`) if that saves the next reader time.
-->
