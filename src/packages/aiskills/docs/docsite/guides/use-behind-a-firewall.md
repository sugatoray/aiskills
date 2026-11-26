# How to use aiskills behind a firewall

Use this when npm can reach only a company registry mirror (JFrog Artifactory, Sonatype Nexus, Verdaccio, …), and github.com or git traffic is blocked.

`@sugatoray-ai/aiskills` and its one dependency, the pinned `skills` CLI, are ordinary npm registry packages: no `git+`, `github:` or URL dependencies and no install scripts. Installing bundled skills needs nothing else. Only two features reach GitHub, and both say so when they can't.

## Steps

1. Allow the packages in your registry. A remote repository that proxies `registry.npmjs.org` needs `@sugatoray-ai/aiskills` and `skills`, plus the `skills` CLI's own dependencies, `tar` and `yaml` (and theirs). With JFrog Curation or a similar policy, the exact versions are the ones in the package's `package.json`.

2. Install the package through your mirror, as usual:

   ```bash
   npm install -g @sugatoray-ai/aiskills
   ```

   npm installs the pinned `skills` CLI with it, so `aiskills` never downloads anything at run time.

3. Install the skills:

   ```bash
   aiskills install -a claude-code
   ```

   Behind a mirror or a proxy, the [skills.sh install count](../concepts/install-count.md) (a `git clone` of github.com in the background) is off by default, and the install says so:

   ```text
   [aiskills] not adding this install to the skills.sh count: npm uses a registry mirror (<host>); turn on with --stats
   ```

4. Check the setup: `aiskills info` shows `stats off` with the reason as its source.

## What needs GitHub

| Feature | Reaches | Behind a firewall |
| --- | --- | --- |
| Bundled skills (`install`, `uninstall`, `installed`, `upgrade`) | your npm registry only | works |
| The skills.sh install count | github.com, api.github.com, skills.sh | off by default; `--stats` turns it on |
| `--route` / `aix` with a bare name | skills.sh, then github.com | fails with [Could not search the skills registry](../reference/errors.md#could-not-search-the-skills-registry) |
| `--route` / `aix` with `owner/repo@skill` or a git URL | github.com, with `git clone` | fails with [Could not install a GitHub source](../reference/errors.md#could-not-install-a-github-source) |
| `--route` with a local path | nothing | works |

## Notes

- **What counts as a mirror:** any npm `registry` other than `registry.npmjs.org` or `registry.yarnpkg.com`. **A proxy:** npm's `https-proxy` or `proxy` setting, or `HTTPS_PROXY`, `HTTP_PROXY` or `ALL_PROXY`. Only the mirror's host is ever printed.
- **The pinned `skills` CLI is used only at its exact version.** With [`AISKILLS_SKILLS_LIB_VERSION`](../reference/environment.md#aiskills_skills_lib_version) set to another version, `aiskills` runs that version through `npx`, which downloads it from your registry at run time. See [Choose the `skills` CLI version](choose-the-skills-cli-version.md).
- **The `skills` CLI needs Node.js 22.20 or newer.** With `engine-strict=true` in your `.npmrc`, `npm install` refuses an older Node.js.
- **A release-age rule** (`min-release-age`, JFrog Curation's "immature package" condition) may block a new `skills` version for a few days or weeks after it is published. See [When npm's release-age rule blocks the pinned version](choose-the-skills-cli-version.md#when-npms-release-age-rule-blocks-the-pinned-version).

See also: [The skills.sh install count](../concepts/install-count.md) · [Security model](../concepts/security.md) · [FAQ: does aiskills work behind a firewall?](../faq.md#does-aiskills-work-behind-a-firewall-or-with-an-npm-mirror)
