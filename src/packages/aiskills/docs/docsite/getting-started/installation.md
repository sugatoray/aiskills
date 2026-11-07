# Installation

Install the package globally with npm; its install step saves the skills and registers them with your agents.

**You'll need:** Node.js 18.17 or newer, and npm. `npx` (which comes with npm) must be able to reach the npm registry the first time it downloads the `skills` CLI.

## Install

```bash
npm install -g @sugatoray-ai/aiskills
```

npm runs the package's `postinstall` step, which:

1. saves the skills to `~/.config/sugatoray/aiskills/skills/`, replacing any older copy, and
2. runs `npx -y skills@1.7.6 add ~/.config/sugatoray/aiskills --global --skill '*' --yes`, which installs every skill for every agent `npx skills` detects.

npm 7 and later hide the output of install steps, so you won't see this happen. If step 2 fails (offline, behind a proxy, or with `--ignore-scripts`), the npm install still succeeds. Run it again with `aiskills install`.

> [!NOTE]
> pnpm and bun don't run install steps by default. After `pnpm add -g` or `bun add -g`, run `aiskills install` once.

## Choose what the install step does

The install step reads `AISKILLS_*` environment variables. For example, only the scrolls group, only for Claude Code:

```bash
AISKILLS_GROUPS=scrolls AISKILLS_AGENTS=claude-code npm install -g @sugatoray-ai/aiskills
```

To save the files but not register them, set `AISKILLS_SKIP_SKILLS_ADD=1`. To skip the step entirely, set `AISKILLS_SKIP_POSTINSTALL=1`. All the variables are in [Configure the npm install step](../guides/configure-npm-install.md).

## Check it worked

The package adds three commands: `aiskills`, `ais` (the same, shorter) and `aix` (the same as `aiskills --route`).

<!-- verify -->
```bash
aiskills --version
aiskills path
```

```text
0.4.0
~/.config/sugatoray/aiskills
```

`aiskills installed` lists the skills that `npx skills` has recorded as installed from that folder. See [Quickstart](quickstart.md).

## Without a global install

`npx` runs the package's `aiskills` command without a global install:

```bash
npx @sugatoray-ai/aiskills install -G scrolls
```

## Update

Install the newer version the same way. The install step replaces `~/.config/sugatoray/aiskills/skills/` with the new skills and runs `npx skills add` again:

```bash
npm install -g @sugatoray-ai/aiskills@latest
```

If you had chosen particular skills, agents or flags, run that `aiskills install ...` command again afterwards (or set the same `AISKILLS_*` variables for the npm install).

## Remove

npm doesn't run any step on uninstall, so remove the skills first:

```bash
aiskills uninstall --purge
npm uninstall -g @sugatoray-ai/aiskills
```

See [Remove everything](../guides/remove-everything.md).

See also: [Quickstart](quickstart.md) · [Environment variables](../reference/environment.md)
