# 3. Install into a project

After this step you can install skills for one project only, so they travel with that project instead of applying to every project you open.

**You'll need:** the previous steps, and a project folder.

## Install with `-p`

Run the command from the project's folder and add `-p` (`--project`):

<!-- verify -->
```bash
aiskills install -p -G stata -a claude-code
```

```text
[aiskills] skills saved to ~/.config/sugatoray/aiskills/skills (flat layout)
[aiskills] bundled: stata-recipes
[aiskills] running: npx -y skills@1.7.6 add ~/.config/sugatoray/aiskills --skill stata-recipes --agent claude-code --yes
```

Compare it with the global install in step 1: the command has no `--global`, and `aiskills` runs it from your current folder. `npx skills` then installs the skill into that project's agent folders (for Claude Code, `.claude/skills/`) and records it there.

The skill's source is still `~/.config/sugatoray/aiskills`, so `aiskills` can recognise it later.

## List and remove project skills

`installed` and `uninstall` take `-p` too, and look at the current folder:

```bash
aiskills installed -p
aiskills uninstall -p -G stata
```

Global and project installs are separate. A skill can be installed in both, and removing one leaves the other.

## Set it at npm install time

To make the npm install step install into a project, set `AISKILLS_SCOPE=project` and run `npm install` in that project. The install step uses the folder npm was started from (`INIT_CWD`):

```bash
AISKILLS_SCOPE=project AISKILLS_GROUPS=stata npm install --save-dev @sugatoray-ai/aiskills
```

For a project dependency, [`npx skills experimental_sync`](../guides/use-experimental-sync.md) is another way to install the skills, pinned by your lockfile.

## Recap

- `-p` installs, lists and removes skills in the current project.
- The default, `-g`, is for your user, in every project.
- `AISKILLS_SCOPE=project` does the same for the npm install step.

Reference: [`-p`, `--project`](../reference/cli.md#-p---project) · [`AISKILLS_SCOPE`](../reference/environment.md#aiskills_scope)

Next: [4. Add external skills](04-add-external-skills.md) · Previous: [2. Pick skills and agents](02-pick-skills-and-agents.md)
