# aiskills

A collection of curated aiskills.

## Custom Skills

## 🔥 Scrolls

Scrolls are a system of git-native markdown files, that together provide your project or parts of your project an agentic memory, which servives across multiple sessions and agents.

**Installation**:

Two ways in. **The Claude Code plugin** installs the whole family as a
managed, read-only bundle from this repo's marketplace. **`npx skills`**
copies editable skill files into your project so you can hack on them.
Pick one — installing both leaves you with every skill twice.

<details>
<summary><strong>Claude Code plugin</strong></summary>

```
/plugin marketplace add sugatoray/aiskills
/plugin install scrolls-skills@sugatoray
```

</details>

<details>
<summary><strong>Codex, and other agents (or editable copies in Claude Code)</strong></summary>

Choose the skills by the name: `scrolls-*` and install interactively.

```sh
npx skills add sugatoray/aiskills               # project-level
npx skills add sugatoray/aiskills --global      # user-level (RECOMMENDED)
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
