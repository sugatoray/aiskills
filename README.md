<!-- 
[![](https://data.jsdelivr.com/v1/package/gh/sugatoray/aiskills/badge)](https://www.jsdelivr.com/package/gh/sugatoray/aiskills)
-->
[![#jsdelivr-badge-aiskill-repo]](https://www.jsdelivr.com/package/gh/sugatoray/aiskills)
[![#skills-sh-badge-aiskill-repo]](https://www.skills.sh/sugatoray/aiskills/)

[#skills-sh-badge-aiskill-repo]: https://img.shields.io/badge/skills.sh-sugatoray/aiskills-green
[#jsdelivr-badge-aiskill-repo]: https://img.shields.io/badge/jsdelivr-sugatoray/aiskills-orange

# aiskills

A collection of curated aiskills.

## Custom Skills

### 🔥 Scrolls

Scrolls are a system of git-native constellation of markdown files, that together provide your project or parts of your project an agentic memory, which servives across multiple sessions and agents.

<img width="1672" height="941" alt="image" src="https://github.com/user-attachments/assets/6515fd09-a523-4291-9bf9-9ce62e8ab699" />

**Installation**:

Install with `npx skills` (RECOMMENDED). It works with Claude Code,
Codex, and other agents, and copies editable skill files into your
project. Choose skills by name (`scrolls-*`) and install interactively.

```sh
npx skills add sugatoray/aiskills               # project-level
npx skills add sugatoray/aiskills --global      # user-level (RECOMMENDED)
```

<details>
<summary><strong>Alternate: npm package</strong></summary>

Installs every skill from this repo, saves them to
`~/.config/sugatoray/aiskills/skills` (flat, or the repo's nested layout with
`--nested`), and runs `npx skills add` on that folder. As a project
dependency it also works with `npx skills experimental_sync`. See [`src/packages/aiskills`](src/packages/aiskills/README.md).

```sh
npm install -g @sugatoray-ai/aiskills
aiskills install --group scrolls --global --agent claude-code   # one group only
aiskills --route install -s scrolls-setup,pdf                    # bundled + external (via npx skills)
aiskills uninstall --purge     # later: remove the skills + local folder
```

</details>

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

<details>
<summary><strong>Alternate: Codex plugin</strong></summary>

`skills/scrolls/.codex-plugin/plugin.json` packages the same five skills
as a local Codex plugin. Self-serve publishing to the official Codex
Plugin Directory isn't available yet, so install it from a clone:

```sh
git clone https://github.com/sugatoray/aiskills
codex plugins install aiskills/skills/scrolls --dev
```

Installing both this and `npx skills` leaves you with every skill
twice — pick one. Note: all five skills are explicit-command-only
(`disable-model-invocation: true`), which fails Codex's own bundled
plugin validator as of this writing — see
[`skills/scrolls/meta/MAINTAINERS.md`](skills/scrolls/meta/MAINTAINERS.md)
for the full caveat.

</details>

**Getting Started**:

1. Initialize **Scrolls** persistent agentic memory.

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

[#scrolls-skills-sh-badge]: https://img.shields.io/badge/skills.sh-sugatoray/aiskills@scrolls--%7Bsetup,update,hide,unhide,remove,restore,help,explainer%7D-green
[#skills-sh-badge-scrolls-setup]: https://img.shields.io/badge/skills.sh-sugatoray/aiskills@scrolls--setup-green
[#skills-sh-badge-scrolls-update]: https://img.shields.io/badge/skills.sh-sugatoray/aiskills@scrolls--update-green
[#skills-sh-badge-scrolls-help]: https://img.shields.io/badge/skills.sh-sugatoray/aiskills@scrolls--help-green
[#skills-sh-badge-scrolls-hide]: https://img.shields.io/badge/skills.sh-sugatoray/aiskills@scrolls--hide-green
[#skills-sh-badge-scrolls-unhide]: https://img.shields.io/badge/skills.sh-sugatoray/aiskills@scrolls--unhide-green
[#skills-sh-badge-scrolls-remove]: https://img.shields.io/badge/skills.sh-sugatoray/aiskills@scrolls--remove-green
[#skills-sh-badge-scrolls-restore]: https://img.shields.io/badge/skills.sh-sugatoray/aiskills@scrolls--restore-green
[#skills-sh-badge-scrolls-explainer]: https://img.shields.io/badge/skills.sh-sugatoray/aiskills@scrolls--explainer-green

| Skill Group | Skill Name | Skills.sh Skill Badge | Short Description | 
|:---:|:---|:---|:---|
| [Scrolls](skills/scrolls/README.md) | `scrolls-setup`  | [![badge-scrolls][#skills-sh-badge-scrolls-setup]](https://www.skills.sh/sugatoray/aiskills/scrolls-setup) | Setup a repository-local agentic memory using the scrolls system: </br><ul><li> scans your repo or subfolder (based on your context)</li><li> and creates a `docs/.scrolls/` folder for the memory files.</li></ul> |
| [Scrolls](skills/scrolls/README.md) | `scrolls-update` | [![badge-scrolls][#skills-sh-badge-scrolls-update]](https://www.skills.sh/sugatoray/aiskills/scrolls-update) | Update the repository-local agentic memory using the scrolls system. |
| [Scrolls](skills/scrolls/README.md) | `scrolls-help`   | [![badge-scrolls][#skills-sh-badge-scrolls-help]](https://www.skills.sh/sugatoray/aiskills/scrolls-help) | Show help doc for the scrolls system. |
| [Scrolls](skills/scrolls/README.md) | `scrolls-hide`   | [![badge-scrolls][#skills-sh-badge-scrolls-hide]](https://www.skills.sh/sugatoray/aiskills/scrolls-hide) | Hide the folder: `docs/scrolls` --> `docs/.scrolls`. |
| [Scrolls](skills/scrolls/README.md) | `scrolls-unhide` | [![badge-scrolls][#skills-sh-badge-scrolls-unhide]](https://www.skills.sh/sugatoray/aiskills/scrolls-unhide) | Unhide the folder: `docs/.scrolls` --> `docs/scrolls`. |
| [Scrolls](skills/scrolls/README.md) | `scrolls-remove` | [![badge-scrolls][#skills-sh-badge-scrolls-remove]](https://www.skills.sh/sugatoray/aiskills/scrolls-remove) | Remove the scrolls system and commit the removal (`maint(memory): scrolls-removed`), recording the previous commit for restore. |
| [Scrolls](skills/scrolls/README.md) | `scrolls-restore` | [![badge-scrolls][#skills-sh-badge-scrolls-restore]](https://www.skills.sh/sugatoray/aiskills/scrolls-restore) | Restore the scrolls memory from the latest `/scrolls-remove` checkpoint (or any commit) into the current code, or `--onto` another branch. |
| [Scrolls](skills/scrolls/README.md) | `scrolls-explainer` | [![badge-scrolls][#skills-sh-badge-scrolls-explainer]](https://www.skills.sh/sugatoray/aiskills/scrolls-explainer) | Show an interactive, offline page that animates what each scrolls command does, step by step, with keyboard navigation (`-o` copies it, `--build` regenerates it). |

---

### 🛠️ Development

Skills for software-development workflows that aren't specific to any
one project — currently: filing GitHub issues for a PR's work and
keeping the PR's title/description in sync with them, and thorough,
structured code review.

**Installation**:

Run one of the following, choose the skill by name: `create-issues-update-pr` or `run-code-review`, and install interactively.

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
/plugin install repo-related-skills@sugatoray   # create-issues-update-pr
/plugin install review-skills@sugatoray        # run-code-review
```

</details>

> 💡 For more information, refer to the [**Development README.md**](skills/development/README.md).

| Skill Group | Skill Name | Short Description |
|:---:|:---|:---|
| [Development](skills/development/README.md) | `create-issues-update-pr` | Files GitHub issue(s) for a PR's work — one flat issue, or a parent epic plus children via GitHub's native parent/child relationship — then rewrites the PR's title (kept short) and description with an itemized, correctly nested issue list. |
| [Development](skills/development/README.md) | `run-code-review` | Runs a thorough code review of a PR, branch, diff, files or repo at a senior/staff engineer's bar, and returns a structured report: a verdict, findings ranked by severity with file and line, and suggested code changes. Per-language checklists, fix patterns, tool commands, security scope and review wisdom for Python, JavaScript, TypeScript, Rust, shell, PowerShell, SQL, HTML, CSS, Markdown, XML, JSON, YAML and TOML. Options choose the languages (`-l`), the files (`-p`, `-t`, `--local`, `-r`, `--base`) and a security-only review (`-s`). |

---

### 📊 Stata

Skills for writing, reviewing, and reasoning about Stata code — turning a
plain-language description of what someone's trying to do into correct,
runnable Stata commands, with attention to the mistakes that run cleanly
but silently produce a wrong answer.

**Installation**:

Run one of the following, choose the skill by name: `stata-recipes` and install interactively.

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

| Skill Group | Skill Name | Short Description |
|:---:|:---|:---|
| [Stata](skills/stata/README.md) | `stata-recipes` | Turns a plain-language requirement into a runnable Stata `.do` file or command sequence — good-vs-bad Stata patterns, Python↔Stata interop, and a growing library of named recipes (ARDL, time-series and panel regression, Dickey-Fuller/unit-root/Im-Pesaran-Shin tests). |

---

### 📚 Docs

Skills for writing documentation people and AI agents can rely on: every fact taken from the code,
every example run before it is published.

**Installation**:

Run one of the following, choose the skill by name: `create-lib-docs` and install interactively.

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
/plugin install docs-skills@sugatoray
```

</details>

> 💡 For more information, refer to the [**Docs README.md**](skills/docs/README.md).

| Skill Group | Skill Name | Short Description |
|:---:|:---|:---|
| [Docs](skills/docs/README.md) | `create-lib-docs` | Writes verified user documentation for a library, CLI or framework, structured like FastAPI's, Pydantic's, DuckDB's and Effect's docs: Getting Started, Tutorial, How-to Guides, Concepts, Reference, FAQ, SVG diagrams, and `llms.txt` for AI agents. Every snippet is run before it is published. |

---

### 🗺️ Diagrams

Skills for interactive architecture and network diagrams: animated packets,
scenario playback, selectable components, and a single offline HTML file.

**Installation**:

Run one of the following, choose the skill by name: `network-flow` and install interactively.

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
/plugin install diagrams-skills@sugatoray
```

</details>

> 💡 For more information, refer to the [**Diagrams README.md**](skills/diagrams/README.md).

| Skill Group | Skill Name | Short Description |
|:---:|:---|:---|
| [Diagrams](skills/diagrams/README.md) | `network-flow` | Turns a system description into an interactive, offline HTML architecture diagram with flowing packets, orthogonal connections, scenario playback, and selectable components. Flows are simulated; no telemetry is collected. See [usage](skills/diagrams/network-flow/README.md). |

---

### 🧠 Personas

Skills that have the agent adopt an expert persona — how the best
practitioners in a role think, work, and grow.

**Installation**:

Run one of the following, choose the skill by name: `prodigy` and install interactively.

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
/plugin install personas-skills@sugatoray
```

</details>

> 💡 For more information, refer to the [**Personas README.md**](skills/personas/README.md).

| Skill Group | Skill Name | Short Description |
|:---:|:---|:---|
| [Personas](skills/personas/README.md) | `prodigy` | Acts as the top performer in a role or field (default: `response`) and returns a playbook: how they frame the problem, constraints, stakeholders and metrics; how they design and deliver; biggest pitfalls; operating principles and decision rules; and a learning plan with daily habits, projects and feedback loops. See [usage](skills/personas/prodigy/README.md). |

---

### 🎬 Video Related

Skills that produce videos from code, real screenshots, narration and music.

**Installation**:

Run one of the following, choose the skill by name: `dynamic-promo-video` and install interactively.

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
/plugin install video-related-skills@sugatoray
```

</details>

> 💡 For more information, refer to the [**Video Related README.md**](skills/video-related/README.md).

| Skill Group | Skill Name | Short Description |
|:---:|:---|:---|
| [Video Related](skills/video-related/README.md) | `dynamic-promo-video` | Builds a short (~25-45s) narrated promo or intro video for a library, app or product: animated HTML scenes with zoom/tilt camera moves over real screenshots, rendered with Playwright and ffmpeg, an ElevenLabs voiceover, and ducked background music. `--demo` / `--demo=self` build ready-made demo videos. See [usage](skills/video-related/dynamic-promo-video/README.md). |

---

### 🎨 Image styles

Skills for generating images in a variety of styles and applying visual styles or effects to existing images. The current skills create spray-painted art wall scenes and add simulated social comment overlays. See the [image styles guide](skills/image-styles/README.md).

```sh
npx skills add sugatoray/aiskills --skill artwallbg
npx skills add sugatoray/aiskills --skill commentdrop
```

For Claude Code, use `/plugin marketplace add sugatoray/aiskills` and `/plugin install image-styles-skills@sugatoray`. Choose one installation route.

## Working on this repository

The skills in `skills/` can be linked into `.agents/skills/` and `.claude/skills/`, so agents working in this repository use the source directly: an edit to a skill takes effect without reinstalling it. The scrolls family and `create-issues-update-pr` are linked. To link more, or check the links:

```sh
make link-skills SKILL=skills/scrolls      # one skill, or every skill below a folder
make check-skill-links                     # every link resolves to a skill of the same name
```

See [scripts/README.md](scripts/README.md).
