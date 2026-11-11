# @sugatoray-ai/aiskills

`@sugatoray-ai/aiskills` installs Sugato Ray's agent skills (scrolls, stata, personas, diagrams, docs, development) into Claude Code, Codex, Cursor and every other agent the [`skills`](https://www.npmjs.com/package/skills) CLI supports.

The skills ship inside the npm package, are saved to `~/.config/sugatoray/aiskills/skills/`, and are registered with your agents by `npx skills add`. The `aiskills` command then installs, lists and removes them by name, by group or by pattern, and with `--route` it manages skills from other sources too.

```bash
npm install -g @sugatoray-ai/aiskills
aiskills install
```

That is all most people need: `npm install` only adds the `aiskills` command, and `aiskills install` saves the skills and registers every one with the agents it finds. To choose a group and an agent yourself:

<!-- verify -->
```bash
aiskills install -G scrolls -a claude-code
```

```text
[aiskills] skills saved to ~/.config/sugatoray/aiskills/skills (flat layout)
[aiskills] bundled: scrolls-help, scrolls-hide, scrolls-remove, scrolls-restore, scrolls-setup, scrolls-unhide, scrolls-update
[aiskills] running: npx -y skills@1.7.6 add ~/.config/sugatoray/aiskills --global --skill scrolls-help --skill scrolls-hide --skill scrolls-remove --skill scrolls-restore --skill scrolls-setup --skill scrolls-unhide --skill scrolls-update --agent claude-code --yes
[aiskills] adding this install to the skills.sh count in the background (turn off: --no-stats)
```

`npx skills` then prints its own progress and installs the seven skills for Claude Code.

## Features

- **Skills in one package**: 13 skills in 7 groups, at the version you installed.
- **Nothing happens behind your back**: `npm install` runs no install step. Your agents change only when you run `aiskills install`, so it works the same under npm, pnpm and bun.
- **Counted on skills.sh**: installs through `aiskills` count towards each skill's installs on skills.sh, like `npx skills add` does; off with `--no-stats`. See [The skills.sh install count](concepts/install-count.md).
- **Pick what you want**: by skill (`-s`), by group (`-G scrolls`), by agent (`-a codex`), with glob patterns (`-s 'scrolls-*'`).
- **Global or per project**: `-g` (default) or `-p`.
- **Clean uninstall**: full, partial, per agent or per project, with `--dry-run` and `--purge`.
- **External skills too**: `--route` (or the `aix` command) looks up and installs skills that aren't bundled.
- **Two layouts**: flat (one folder per skill) or `--nested` (the repo's own folders).
- **Short commands**: `ais` is `aiskills`; `aix` is `aiskills --route`; `i`, `r`, `ls`, `g`, `f`, `p`, `h` are aliases.
- **Safe by default**: a pinned `skills` CLI, checked registry results, and no runtime dependencies.

## Documentation

### Getting started

- [Why aiskills](getting-started/why-aiskills.md): what the package adds on top of `npx skills`, and when you don't need it.
- [Installation](getting-started/installation.md): install with npm, run `aiskills install`, and check it worked.
- [Quickstart](getting-started/quickstart.md): see the groups, install one for one agent, check it, and remove it.

### Skills

<!-- skills:start -->
- [Bundled skills](skills/README.md): every skill in the package, by group, with what it does.
- [create-issues-update-pr](skills/create-issues-update-pr.md): Files GitHub issue(s) for work already done (or about to be done) on a branch/PR, grouping related issues under a parent epic when there's a genuine…
- [create-lib-docs](skills/create-lib-docs.md): Writes top-grade, verified user documentation for a library, CLI or framework as a folder of Markdown pages plus SVG diagrams, structured the way FastAPI,…
- [dynamic-promo-video](skills/dynamic-promo-video.md): Build a short narrated promo/intro video (HTML scenes, zoom/tilt, voiceover, music) for a library, app or product.
- [network-flow](skills/network-flow.md): Create working interactive network and architecture diagrams with moving packets, orthogonal connections, scenario playback, and selectable nodes.
- [prodigy](skills/prodigy.md): Act as the top performer in a given role or field and produce a five-part playbook: (1) how they understand the problem, constraints, stakeholders and…
- [scrolls-help](skills/scrolls-help.md): Shows a crisp, example-driven reference for the whole scrolls skill family (/scrolls-setup, /scrolls-update, /scrolls-hide, /scrolls-unhide,…
- [scrolls-hide](skills/scrolls-hide.md): Converts an already-set-up docs/scrolls/ working-memory folder from visible (scrolls) to dotfile-hidden (.scrolls), renaming the folder and rewriting the…
- [scrolls-remove](skills/scrolls-remove.md): Removes a docs/.scrolls/ (or docs/scrolls/) project-memory system from a git repository — the exact opposite of /scrolls-setup.
- [scrolls-restore](skills/scrolls-restore.md): Restores a docs/.scrolls/ (or docs/scrolls/) project-memory system from git history — the counterpart to /scrolls-remove.
- [scrolls-setup](skills/scrolls-setup.md): Sets up a minimal docs/.scrolls/ working-memory system for a project — a small set of cross-session memory files (STARTER.md, SPEC.md, HANDOFF.md,…
- [scrolls-unhide](skills/scrolls-unhide.md): Converts an already-set-up docs/.scrolls/ working-memory folder from dotfile-hidden (.scrolls) to visible (scrolls), renaming the folder and rewriting the…
- [scrolls-update](skills/scrolls-update.md): Updates an existing docs/.scrolls/ project-memory system (STARTER.md, SPEC.md, HANDOFF.md, GAP_ANALYSIS.md, GAP_CONTEXT.md, PLAN.md, WISDOM.md, and any…
- [stata-recipes](skills/stata-recipes.md): Turns a plain-language description of a data/statistics task into correct, runnable Stata code — a .do file or command sequence, not pseudocode.
<!-- skills:end -->

### Tutorial

- [1. Install a group](tutorial/01-install-a-group.md): list the groups and install one for one agent.
- [2. Pick skills and agents](tutorial/02-pick-skills-and-agents.md): choose skills by name and pattern, and send them to several agents.
- [3. Install into a project](tutorial/03-install-into-a-project.md): install skills for one project instead of for your user.
- [4. Add external skills](tutorial/04-add-external-skills.md): install skills that aren't bundled with `--route` and `aix`.
- [5. Uninstall](tutorial/05-uninstall.md): preview and remove some or all of the skills.

### How-to guides

- [Set default choices](guides/set-defaults.md): make skills, agents and scope the defaults with `AISKILLS_*` variables.
- [Use the package with `npx skills experimental_sync`](guides/use-experimental-sync.md): install the skills from a project's `node_modules`, pinned by your lockfile.
- [Keep the repo's nested layout](guides/keep-the-nested-layout.md): browse or edit the skills in the folders they have in the repo.
- [Run any `npx skills` command](guides/run-npx-skills-directly.md): pass arguments straight to `npx skills`, with `:root` for the install folder.
- [Remove everything](guides/remove-everything.md): uninstall the skills, the folder and the npm package, in the right order.
- [Use aiskills from an AI agent or a script](guides/use-from-an-agent.md): run it non-interactively, read its output and exit codes, and handle failures.
- [Choose the `skills` CLI version](guides/choose-the-skills-cli-version.md): run a different `skills` release than the pinned one.
- [Leave files out of the package](guides/leave-files-out.md): for maintainers: keep files or whole skills out with `.skillsignore`.

### Concepts

- [How aiskills works](concepts/how-it-works.md): the package, the install folder and `npx skills`, and who owns what.
- [Skill groups](concepts/skill-groups.md): where groups and their aliases come from, and how membership is worked out.
- [Layouts: flat and nested](concepts/layouts.md): the two shapes of the install folder and how the choice is made.
- [Bundled and external skills](concepts/bundled-and-external.md): what `--route` changes for install, uninstall and listing.
- [Security model](concepts/security.md): what the package touches, and the protections that are tested.
- [The skills.sh install count](concepts/install-count.md): how installs through aiskills are counted on skills.sh, and how to turn it off.

### Reference

- [CLI](reference/cli.md): every command, alias and option of `aiskills`, `ais` and `aix`.
- [Patterns](reference/patterns.md): the glob syntax for `-s`, `-G` and `-a`, and what each matches against.
- [Environment variables](reference/environment.md): every variable `aiskills` reads.
- [Files and schemas](reference/files.md): what is written where, and the fields of `aiskills.json`, `layout.json` and `npx skills list --json`.
- [`.skillsignore`](reference/skillsignore.md): the rule syntax for leaving files out of the package.
- [Errors and exit codes](reference/errors.md): every error and warning, with its cause and fix.

### Help

- [FAQ and troubleshooting](faq.md): answers to common questions and fixes for common problems.

### License

- [License](license.md): the package's license, and a table of the license each bundled skill uses.

## Ways to read these docs

- **These Markdown pages**, on GitHub or in your editor.
- **One web page** with tabs, search and 11 colour themes, online at <https://sugatoray.github.io/aiskills/>, or open `docs/docsite/index.html` (in the repo, next to this page) in a browser. The gear at its top right picks a theme (Lights Out by default), and the moon/sun button switches light and dark.
- **For AI agents:** [`llms.txt`](llms.txt) (an index of every page) or [`llms-full.txt`](llms-full.txt) (every page in one file).

Also see the package [CHANGELOG](../../CHANGELOG.md) and [SECURITY.md](../../SECURITY.md).
