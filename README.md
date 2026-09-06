# aiskills

A collection of curated aiskills.

## Custom Skills

## 🔥 Scrolls

Scrolls are a system of git-native markdown files, that together provide your project or parts of your project an agentic memory, which servives across multiple sessions and agents.

**Installation**:

Install with `npx skills` (RECOMMENDED). It works with Claude Code,
Codex, and other agents, and copies editable skill files into your
project. Choose skills by name (`scrolls-*`) and install interactively.

```sh
npx skills add sugatoray/aiskills               # project-level
npx skills add sugatoray/aiskills --global      # user-level (RECOMMENDED)
```

<details>
<summary><strong>Alternate: Claude Code plugin</strong></summary>

Installs the whole family as a managed, read-only bundle from this
repo's marketplace. Installing both this and `npx skills` leaves you
with every skill twice — pick one.

```
/plugin marketplace add sugatoray/aiskills
/plugin install scrolls-skills@sugatoray
```

</details>

**Getting Started**:

1. Initialize **Scorlls** persistent agentic memory.

```sh
# 1. start codex/claude or your agent of choice
# 2. navigate down to the folder where you want the agentic memory system to start
use skill: /scrolls-setup
```

2. Later on, after each development when you want to update the agentic memory state, run:

```sh
# from your agent session:
use skill: /scrolls-update
```

3. For help doc use: `/scrolls-help`.

> 💡 For more information, refer to the [**Scrolls README.md**](skills/scrolls/README.md).

## 📊 Stata

Skills for writing, reviewing, and reasoning about Stata code — turning a
plain-language description of what someone's trying to do into correct,
runnable Stata commands, with attention to the mistakes that run cleanly
but silently produce a wrong answer.

**Installation**:

Choose the skill by name: `stata-recipes` and install interactively.

```sh
npx skills add sugatoray/aiskills               # project-level
npx skills add sugatoray/aiskills --global      # user-level (RECOMMENDED)
```

<details>
<summary><strong>Alternate: Claude Code plugin</strong></summary>

Installs the whole family as a managed, read-only bundle from this
repo's marketplace. Installing both this and `npx skills` leaves you
with every skill twice — pick one.

```
/plugin marketplace add sugatoray/aiskills
/plugin install stata-skills@sugatoray
```

</details>

> 💡 For more information, refer to the [**Stata README.md**](skills/stata/README.md).

## 🛠️ Development

Skills for software-development workflows that aren't specific to any
one language or project — currently: filing GitHub issues for a PR's
work and keeping the PR's title/description in sync with them.

**Installation**:

Choose the skill by name: `create-issues-update-pr` and install interactively.

```sh
npx skills add sugatoray/aiskills               # project-level
npx skills add sugatoray/aiskills --global      # user-level (RECOMMENDED)
```

<details>
<summary><strong>Alternate: Claude Code plugin</strong></summary>

Installs the whole family as a managed, read-only bundle from this
repo's marketplace. Installing both this and `npx skills` leaves you
with every skill twice — pick one.

```
/plugin marketplace add sugatoray/aiskills
/plugin install repo-related-skills@sugatoray
```

</details>

> 💡 For more information, refer to the [**Development README.md**](skills/development/README.md).

## 🪪 Personal branding

Skills for building a person's own public-facing presence from
researched, sourced data — currently: researching a named individual
from public sources and building them a tasteful, professional personal
landing page (a sourced YAML data file first, then a self-contained
HTML page rendered from it).

**Installation**:

Choose the skill by name: `landing-page-builder` and install interactively.

```sh
npx skills add sugatoray/aiskills               # project-level
npx skills add sugatoray/aiskills --global      # user-level (RECOMMENDED)
```

<details>
<summary><strong>Alternate: Claude Code plugin</strong></summary>

Installs the whole family as a managed, read-only bundle from this
repo's marketplace. Installing both this and `npx skills` leaves you
with every skill twice — pick one.

```
/plugin marketplace add sugatoray/aiskills
/plugin install personal-branding-skills@sugatoray
```

</details>

> 💡 For more information, refer to the [**Personal branding README.md**](skills/personal-branding/README.md).

[#scrolls-skills-sh-badge]: https://img.shields.io/badge/skills.sh-sugatoray/aiskills@scrolls--%7Bsetup,update,hide,unhide,help%7D-green
[#skills-sh-badge-scrolls-setup]: https://img.shields.io/badge/skills.sh-sugatoray/aiskills@scrolls--setup-green
[#skills-sh-badge-scrolls-update]: https://img.shields.io/badge/skills.sh-sugatoray/aiskills@scrolls--update-green
[#skills-sh-badge-scrolls-help]: https://img.shields.io/badge/skills.sh-sugatoray/aiskills@scrolls--help-green
[#skills-sh-badge-scrolls-hide]: https://img.shields.io/badge/skills.sh-sugatoray/aiskills@scrolls--hide-green
[#skills-sh-badge-scrolls-unhide]: https://img.shields.io/badge/skills.sh-sugatoray/aiskills@scrolls--unhide-green

| Skill Group | Skill Name | Short Description | Badge | 
|:---:|:---|:---|:---:|
| [Scrolls](skills/scrolls/README.md) | `scrolls-setup`  | Setup a repository-local agentic memory using the scrolls system: scans your repo or subfolder (based on your context) and creates a `docs/.scrolls/` folder for the memory files. | [![badge-scrolls][#skills-sh-badge-scrolls-setup]](https://www.skills.sh/sugatoray/aiskills/scrolls-setup) |
| [Scrolls](skills/scrolls/README.md) | `scrolls-update` | Update the repository-local agentic memory using the scrolls system. | [![badge-scrolls][#skills-sh-badge-scrolls-update]](https://www.skills.sh/sugatoray/aiskills/scrolls-update) |
| [Scrolls](skills/scrolls/README.md) | `scrolls-help`   | Show help doc for the scrolls system. | [![badge-scrolls][#skills-sh-badge-scrolls-help]](https://www.skills.sh/sugatoray/aiskills/scrolls-help) |
| [Scrolls](skills/scrolls/README.md) | `scrolls-hide`   | Hide the folder: `docs/scrolls` --> `docs/.scrolls`. | [![badge-scrolls][#skills-sh-badge-scrolls-hide]](https://www.skills.sh/sugatoray/aiskills/scrolls-hide) |
| [Scrolls](skills/scrolls/README.md) | `scrolls-unhide` | Unhide the folder: `docs/.scrolls` --> `docs/scrolls`. | [![badge-scrolls][#skills-sh-badge-scrolls-unhide]](https://www.skills.sh/sugatoray/aiskills/scrolls-unhide) |

| Skill Group | Skill Name | Short Description |
|:---:|:---|:---|
| [Stata](skills/stata/README.md) | `stata-recipes` | Turns a plain-language requirement into a runnable Stata `.do` file or command sequence — good-vs-bad Stata patterns, Python↔Stata interop, and a growing library of named recipes (ARDL, time-series and panel regression, Dickey-Fuller/unit-root/Im-Pesaran-Shin tests). |

| Skill Group | Skill Name | Short Description |
|:---:|:---|:---|
| [Development](skills/development/README.md) | `create-issues-update-pr` | Files GitHub issue(s) for a PR's work — one flat issue, or a parent epic plus children via GitHub's native parent/child relationship — then rewrites the PR's title (kept short) and description with an itemized, correctly nested issue list. |

| Skill Group | Skill Name | Short Description |
|:---:|:---|:---|
| [Personal branding](skills/personal-branding/README.md) | `landing-page-builder` | Researches a named person from public sources, structures the findings into a sourced YAML data file, and builds a tasteful, self-contained personal landing page from it — no generic AI-slop patterns. |
