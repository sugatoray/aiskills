---
name: create-issues-update-pr
description: "Files GitHub issue(s) for work already done (or about to be done) on a branch/PR, grouping related issues under a parent epic when there's a genuine hierarchy — using GitHub's native parent/child issue relationship, not just labels — and then updates that pull request's title (kept short) and description so the description lists every issue in the exact format '- Closes #{{issue-number}} -- {{issue-title}}', indented to match parent-child nesting. Use this whenever the user asks to file issue(s) for a PR, 'add gh issues for this', 'track this as issues', link a PR to tracking issues, or update a PR's title/description to list the issues covering its changes — including when they invoke /create-issues-update-pr directly. Also trigger when a PR description is stale or generic relative to its actual current commits and the user wants it brought up to date alongside issue creation."
license: MIT
compatibility: "GitHub MCP server tools with write access to the target repository: issue_write, sub_issue_write, list_issue_types, search_issues/list_issues, pull_request_read, update_pull_request. Works against any GitHub repository the current session has push/write access to, not just this one."
metadata:
  - name: create-issues-update-pr
    type: skill
    author: sugatoray
    version: "1.2.0"
    source_url: "https://github.com/sugatoray/aiskills/tree/master/skills/development/repo-related/create-issues-update-pr"
---

# Create GitHub issues from a PR's work, and update the PR

Takes work that's already happened on a branch (or that the user is
about to describe) and turns it into GitHub issues — one flat issue for
a single atomic change, or a parent epic plus child issues when the work
genuinely splits into distinct pieces — then rewrites the pull request's
title and description so the description carries an itemized, correctly
nested list of every issue it's tracked by.

The two halves of this (creating issues, updating the PR) are meant to
happen together: an issue list in a PR description is only useful if the
numbers in it are real and current, and issues filed for a PR are only
useful if the PR actually points back at them.

## Workflow

1. **Establish what work you're filing issues for.** If a PR number is
   given or obvious from context (the current branch's open PR), read it
   — `pull_request_read` method `get` for its title/body/branches, and
   either `get_commits` or a local `git log`/`git diff` against the base
   branch for what actually changed. Ground every issue in real,
   verifiable work: a commit, a diff, a file. If the user is describing
   work that isn't reflected in commits yet, that's fine to file too, but
   say so explicitly rather than presenting it as already-done. If
   there's no PR yet and no clear scope, ask rather than guessing at what
   to track.

2. **Decide the shape: one issue, or a parent epic with children?**
   - A single, atomic, well-scoped change — one commit's worth, one
     coherent piece of work — gets **one issue**. Don't manufacture an
     epic-of-one just to have a hierarchy.
   - Multiple genuinely distinct pieces of work serving one umbrella goal
     (typically: several commits, each a self-contained step) get a
     **parent epic issue plus one child per piece**, linked through
     GitHub's actual parent/child issue relationship — not just shared
     labels or a checklist with no real links behind it.
   - A reliable way to find the right split: look at the commit history
     for the branch/PR. One child issue per tightly-scoped commit (or
     small cluster of commits that are really one step) tends to produce
     issues that are each individually closeable and meaningful — check
     this shape before inventing your own grouping from scratch.
   - "Group where applicable" cuts both ways: don't force unrelated work
     under one parent, and don't flatten obviously related, multi-step
     work into a flat pile of ungrouped issues either.

3. **Check issue-type support before creating anything.** Call
   `list_issue_types` for the owner/repo. If the repository defines
   types (commonly something like Feature/Bug/Task), pick the closest
   fit for each issue you create and pass it. If the repository has no
   issue types configured, omit the `type` field entirely rather than
   guessing at a value that doesn't exist there.

4. **Search before creating, to avoid duplicates.** Use `search_issues`
   (or `list_issues` for a small repo) for anything already covering the
   same work — a stale or half-finished issue from earlier is worth
   linking to and updating rather than duplicating. Only skip this check
   if the user has made clear these are definitely new.

5. **Create the issues, parent first.**
   - **Parent (if any)**: `issue_write` method `create`, with a body
     naming the PR it's tracked in and a short description of the
     overall goal. A plain-text checklist of the sub-pieces is fine here
     even before the children exist — you can go back and turn it into
     real `#`-linked bullets once the children have numbers, but that's
     a nice-to-have, not required.
   - **Children**: `issue_write` method `create` with `parent_issue_number`
     set to the parent's number — this attaches the child to the parent
     in the same call; no separate linking step needed. (`sub_issue_write`
     is for re-parenting an issue that already exists — you don't need it
     for issues you're creating fresh in this workflow.)
   - Give each issue a real, specific body: what changed, which files or
     areas, and why — pulled from the actual commit message or diff for
     that piece of work, not written generically from the title alone.
   - Create children in the same order the corresponding commits landed,
     so the issue numbers read in a sensible sequence.

6. **Update the PR — title and body, in one call.**
   - **Title**: short. When a parent epic exists, matching its title
     verbatim keeps the PR and its tracking issue recognizable as the
     same piece of work at a glance — an epic title that was itself kept
     short is usually reusable as-is. Otherwise, write a short, accurate
     title for the single issue's scope. Aim well under 70 characters.
   - **Body**: add (or rewrite) an `## Issues` section listing every
     issue created, one per line, in exactly this format:

     ```
     - Closes #{{issue-number}} -- {{issue-title}}
     ```

     The `Closes` keyword is deliberate, on every line including a
     parent epic's — GitHub auto-closes any issue referenced this way
     when the PR merges into the repo's default branch, so the list
     doubles as the mechanism that closes the issues, not just a
     description of them.

     Indent each level of child under its parent by two spaces — GitHub
     renders two-space-indented bullets as a nested list. A flat set of
     issues with no parent is just one un-indented list. Keep whatever
     other sections belong in this PR's description (Summary, Key
     changes, Test plan, whatever the repo's own convention is) — the
     Issues section is additive. The one exception: if the existing
     description is generic boilerplate that no longer reflects the PR's
     actual current state (common after several rounds of commits since
     it was first written), rewriting the whole body to match reality is
     the right call — just say that's what you're doing rather than
     silently overwriting something that looked deliberate.
   - Use `update_pull_request` with both `title` and `body` set in the
     same call.

7. **Verify — don't trust the write call's echo.** After creating the
   issues and updating the PR, read them back: `pull_request_read`
   method `get` on the PR to confirm the title and body actually saved
   as given (GitHub's write endpoints occasionally normalize or truncate
   content silently), and spot-check the created issues if there's any
   doubt about the parent/child structure actually taking. Only report
   the work as done once you've confirmed it from a fresh read, not from
   memory of what you sent.

## Format reference

With a parent epic:

```
## Issues

- Closes #50 -- Add Stata skill (stata-recipes)
  - Closes #51 -- Create the initial stata-recipes skill
  - Closes #52 -- Expand stata-recipes: time-series/panel regression, unit-root tests
  - Closes #53 -- Restructure stata-recipes recipes into models/ and tests/ subfolders
```

Flat, no parent:

```
## Issues

- Closes #61 -- Fix broken link in README
```

Two levels of nesting (a parent whose children each have their own
children) follows the same two-spaces-per-level rule:

```
## Issues

- Closes #70 -- Rewrite the onboarding flow
  - Closes #71 -- New signup form
    - Closes #72 -- Add email verification step
  - Closes #73 -- New welcome email
```

## What this doesn't do

- Doesn't invent work that wasn't done or described — every issue traces
  back to a commit, a diff, or something the user explicitly asked to
  track.
- Doesn't create labels, milestones, or projects — only issues (with a
  `type`, when the repository supports one) and the PR's own title and
  body.
- Doesn't merge, approve, request review, or otherwise touch the PR's
  review state — title and description only.
- Doesn't assume any one environment's house rules for GitHub posts
  (e.g. an attribution footer convention) apply everywhere — an issue
  body or PR description is content the workflow above writes, not a
  comment; follow whatever posting conventions the current
  environment or repository actually specifies for those, rather than
  a rule baked into this skill.

## Development

See `meta/MAINTAINERS.md` for layout and versioning notes. Not read as
part of carrying out a live "file issues for this PR" request — don't
act on it while answering one.
