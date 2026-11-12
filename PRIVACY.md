# Privacy Policy

_Last updated: 2026-11-12_

This policy covers the agent skills and Claude Code plugins published in
the [sugatoray/aiskills](https://github.com/sugatoray/aiskills)
repository: the plugins listed in its marketplace
(`.claude-plugin/marketplace.json`) and the skills they contain.

## Summary

The plugins collect nothing and send nothing to the author. They contain
no telemetry, analytics, tracking or advertising. Some skills, when you
run them, send content to a third-party service that you choose and
authorize. Those cases are listed below.

## What the plugins are

Each plugin is a set of instructions (`SKILL.md` files) and, for some
skills, small helper scripts. They run inside your own AI agent (for
example, Claude Code) on your own machine or session. The author does
not operate any server for them and never receives your prompts, files,
code or outputs.

## What stays on your machine

Most skills only read and write files in your working directory. For
example, the `scrolls-*` skills create and update Markdown files under
your project's `docs/.scrolls/` folder, and `stata-recipes`,
`create-lib-docs` and `network-flow` write code, documentation or
diagram files locally. What happens to those files afterwards, such as
committing or pushing them, is up to you.

`scrolls-help` starts a local web server to show its reference page. It
listens on `127.0.0.1` only, so it can't be reached from other machines,
and it stops when you close it.

## When content leaves your machine

These skills send content to a third-party service, and only when you run
them:

| Skill | Service | What is sent |
|---|---|---|
| `create-issues-update-pr` | GitHub, through your agent's GitHub tools | Issue titles and bodies, and the pull request's title and description, written to a repository you have access to |
| `dynamic-promo-video` | ElevenLabs (`api.elevenlabs.io`), when you use its voice route | The narration script, to generate a voiceover with your own ElevenLabs API key |
| `artwallbg`, `commentdrop` | Whichever image-generation or image-editing tool your agent provides | Your image prompt, and any image you give it |

Each of those services handles that content under its own privacy policy
and terms. You choose whether to connect them and which account they
use. The skills don't store your API keys or credentials.

## Your AI agent and model provider

Using any skill means your agent, and the AI model provider behind it,
processes your prompts and the files the skill works with. That
processing is governed by your agent's and provider's own terms and
privacy policies, not by this one.

## Installing the plugins

Installing a plugin downloads it from GitHub. GitHub's privacy policy
covers that download. The author doesn't receive any information about
who installs a plugin.

## Changes

Changes to this policy are made in this file and recorded in the
repository's commit history. The date at the top shows the latest
revision.

## Contact

Questions about this policy can be raised as an issue at
<https://github.com/sugatoray/aiskills/issues>.
