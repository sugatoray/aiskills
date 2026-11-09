# Installation

Install the `aiskills` command with npm, then run `aiskills install` to save the skills and register them with your agents.

**You'll need:** Node.js 18.17 or newer, and npm. `npx` (which comes with npm) must be able to reach the npm registry the first time it downloads the `skills` CLI.

## Install

```bash
npm install -g @sugatoray-ai/aiskills
aiskills install
```

The first command only installs the package and its commands. It runs no install step: nothing is written to your home folder and no agent is changed. pnpm (`pnpm add -g`) and bun (`bun add -g`) work the same way.

`aiskills install`:

1. saves the skills to `~/.config/sugatoray/aiskills/skills/`, replacing any older copy, and
2. runs `npx -y skills@1.7.6 add ~/.config/sugatoray/aiskills --global --skill '*' --yes`, which installs every skill for every agent `npx skills` detects.

To choose, pass options. For example, only the scrolls group, only for Claude Code:

```bash
aiskills install -G scrolls -a claude-code
```

To save the skills without registering them, run `aiskills sync`. Every option is in the [CLI reference](../reference/cli.md).

## Check it worked

The package adds three commands: `aiskills`, `ais` (the same, shorter) and `aix` (the same as `aiskills --route`).

<!-- verify -->
```bash
aiskills --version
aiskills path
```

```text
0.5.0
~/.config/sugatoray/aiskills
```

`aiskills installed` lists the skills that `npx skills` has recorded as installed from that folder. See [Quickstart](quickstart.md).

## Without a global install

`npx` runs the package's `aiskills` command without a global install:

```bash
npx @sugatoray-ai/aiskills install -G scrolls
```

## Update

Install the newer version, then run `aiskills install` again. It replaces `~/.config/sugatoray/aiskills/skills/` with the new skills and runs `npx skills add` again:

```bash
npm install -g @sugatoray-ai/aiskills@latest
aiskills install
```

If you had chosen particular skills, agents or flags, run that `aiskills install ...` command instead.

## Remove

Remove the skills first, then the package:

```bash
aiskills uninstall --purge
npm uninstall -g @sugatoray-ai/aiskills
```

See [Remove everything](../guides/remove-everything.md).

See also: [Quickstart](quickstart.md) · [Set default choices](../guides/set-defaults.md)
