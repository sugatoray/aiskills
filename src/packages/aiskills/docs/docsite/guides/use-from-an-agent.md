# How to use aiskills from an AI agent or a script

Use this page when a program, not a person, runs `aiskills`: an AI coding agent, a setup script, or CI.

## Steps

1. **Never wait for input.** `aiskills` never prompts, and it passes `--yes` to every `npx skills add` and `npx skills remove`. `npx -y` also skips npx's own download prompt.

2. **Check before you change.** Read the groups as JSON, and preview removals with `-n`:

   <!-- verify -->
   ```bash
   aiskills groups --json
   ```

   ```text
   {
     "groups": [
       {
         "name": "scrolls-skills",
         "alias": "scrolls",
   …
     "ungrouped": []
   }
   ```

   The shape is `{ "groups": [{ "name", "alias", "description", "skills": [string] }], "ungrouped": [string] }`. See [Files and schemas](../reference/files.md#aiskills-groups---json).

3. **Install with explicit choices.** Name the skills or groups, the agents and the scope, so the result doesn't depend on what happens to be detected:

   ```bash
   aiskills install -g -G scrolls -a claude-code
   ```

4. **Branch on the exit code**, not on the text:

   | Exit code | Meaning |
   | --- | --- |
   | `0` | Success. For `uninstall`, also when there was nothing to remove. |
   | `1` | `aiskills` refused or failed: a bad option, an unknown name, a pattern that matched nothing, a failed lookup, an unsafe folder. No skill was installed or removed (the saved copy in `~/.config/sugatoray/aiskills/skills/` may have been refreshed). The message is on stderr and starts with `[aiskills]`. |
   | other | The exit code of `npx skills`, passed through. |

   <!-- verify -->
   ```bash
   aiskills install -G nope
   ```

   ```text
   [aiskills] skills saved to ~/.config/sugatoray/aiskills/skills (flat layout)
   [aiskills] no group matches: nope
     available: scrolls-skills (scrolls), stata-skills (stata), repo-related-skills (repo-related), docs-skills (docs), diagrams-skills (diagrams), personas-skills (personas), all
     see 'aiskills groups'
   ```

   Every error is listed, with its cause and fix, in [Errors and exit codes](../reference/errors.md).

5. **Read what's installed as JSON** with the passthrough. `aiskills` prints one `[aiskills] running: ...` line before the JSON, so parse from the first `[` of the JSON array, or call `npx -y skills@1.7.6 list --json -g` yourself:

   <!-- verify -->
   ```bash
   aiskills skills list --json -g
   ```

   ```text
   [aiskills] running: npx -y skills@1.7.6 list --json -g
   []
   ```

   Each row has `name`, `source`, `sourceType`, `scope` and `agents`. A row with `sourceType` `local` and `source` equal to `aiskills path` was installed by `aiskills`. See [Files and schemas](../reference/files.md#npx-skills-list---json-rows).

## Variations

### Unattended install from npm

`npm install` only adds the command, so run `aiskills install` after it. Its exit code tells a script whether it worked:

```bash
npm install -g @sugatoray-ai/aiskills
aiskills install -G scrolls -a claude-code
```

Or without a global install: `npx -y @sugatoray-ai/aiskills install -G scrolls -a claude-code`.

### No telemetry

`npx skills` sends anonymous usage data to `skills.sh` unless `DISABLE_TELEMETRY` or `DO_NOT_TRACK` is set. `aiskills` passes both through:

```bash
DO_NOT_TRACK=1 aiskills install -G scrolls -a claude-code
```

### External skills

Prefer `owner/repo@skill` over a bare name with `--route`. A bare name fails when the registry has several exact matches, the registry can change between runs, and a skill found by a lookup must be confirmed: with no terminal, `aiskills` stops with `not installing external skills without confirmation` unless you pass `-y`. Check what a lookup would install first with `-n`:

```bash
aix i -n -s pdf
```

Then pin what it found (`aix i -s anthropics/skills@pdf`), or pass `-y` once you've checked the source.

## Troubleshooting

- **Exit code 1 with `could not read the agent list from 'npx skills'`**: an `-a` pattern needs `npx skills`. Pass plain agent names instead of patterns.
- **The output has `npx skills` progress mixed in**: `npx skills` writes to the same terminal. Use the exit code, and `aiskills installed` afterwards.

See also: [CLI reference](../reference/cli.md) · [Errors and exit codes](../reference/errors.md) · [`llms.txt`](../llms.txt)
