# 4. Add external skills

After this step you can install skills that aren't in this package, from the skills registry or GitHub, with the same command.

**You'll need:** the previous steps, and network access to `skills.sh` and GitHub.

## Without `--route`, only bundled skills

`aiskills` refuses a skill name it doesn't bundle, before it installs anything:

<!-- verify -->
```bash
aiskills install -s pdf
```

```text
[aiskills] skills saved to ~/.config/sugatoray/aiskills/skills (flat layout)
[aiskills] not provided by this package: pdf
  available: artwallbg, commentdrop, create-issues-update-pr, create-lib-docs, dynamic-promo-video, network-flow, prodigy, scrolls-explainer, scrolls-help, scrolls-hide, scrolls-remove, scrolls-restore, scrolls-setup, scrolls-unhide, scrolls-update, stata-recipes
  add --route to look them up with 'npx skills' instead
```

## Look it up with `--route`

With `--route`, a bare name that isn't bundled is looked up with `npx skills find`. If exactly one result has exactly that name, `aiskills` shows it and asks before installing anything. In a terminal, answering `y`:

<!-- verify: find=anthropics/skills@pdf tty=y -->
```bash
aiskills --route install -s pdf -a claude-code
```

```text
[aiskills] skills saved to ~/.config/sugatoray/aiskills/skills (flat layout)
[aiskills] 'pdf' is not bundled; looking it up with 'npx skills find pdf' ...
[aiskills] found anthropics/skills@pdf
[aiskills] found in the skills registry (not bundled; third-party code your agents may run):
    anthropics/skills@pdf  (1.2K installs)  for 'pdf'
Install 1 external skill from the registry? [y/N] y
[aiskills] external: anthropics/skills@pdf
[aiskills] running: npx -y skills@1.7.6 add anthropics/skills@pdf --global --agent claude-code --yes
```

Check the source (`anthropics/skills`) before you answer. Only `y` or `yes` installs; Enter or anything else stops with `nothing installed: not confirmed`. This is a safety check: an external skill is code from someone else that your agents may run.

In a script, or once you've checked the source, `-y` (`--yes`) answers yes in advance. Without a terminal and without `-y`, `aiskills` stops and installs nothing:

<!-- verify: find=anthropics/skills@pdf -->
```bash
aiskills --route install -s pdf -a claude-code -y
```

```text
[aiskills] skills saved to ~/.config/sugatoray/aiskills/skills (flat layout)
[aiskills] 'pdf' is not bundled; looking it up with 'npx skills find pdf' ...
[aiskills] found anthropics/skills@pdf
[aiskills] found in the skills registry (not bundled; third-party code your agents may run):
    anthropics/skills@pdf  (1.2K installs)  for 'pdf'
[aiskills] external: anthropics/skills@pdf
[aiskills] running: npx -y skills@1.7.6 add anthropics/skills@pdf --global --agent claude-code --yes
```

The example outputs above were produced with a stand-in registry that returns one result, `anthropics/skills@pdf` with 1.2K installs; the real registry may return other results and counts. If several results share the exact name, `aiskills` stops and lists them, and you pick one. It never chooses for you. To see what would be installed without installing anything, add `-n` (`--dry-run`).

`aix` is a shorter way to write `aiskills --route`:

```bash
aix i -s pdf -a claude-code
```

## Name the source yourself

An `owner/repo@skill` (or `owner/repo`, a git URL, or a local path) skips the lookup and goes straight to `npx skills add`. It isn't asked about, because you named the source:

<!-- verify -->
```bash
aix install -s anthropics/skills@docx
```

```text
[aiskills] skills saved to ~/.config/sugatoray/aiskills/skills (flat layout)
[aiskills] external: anthropics/skills@docx
[aiskills] running: npx -y skills@1.7.6 add anthropics/skills@docx --global --yes
```

This is the safer choice for third-party skills: you decide exactly which source is used.

## Bundled and external together

`-s` can mix both, and `-G` still selects bundled groups. Every lookup runs before anything is installed, so a failed lookup changes nothing:

```bash
aix install -G scrolls -s pdf -a claude-code
```

## See both kinds

`installed --route` lists every installed skill with its source: `bundled` for this package's skills, otherwise the source `npx skills` recorded.

<!-- verify: list=scrolls-setup,anthropics/skills@docx -->
```bash
aix installed
```

```text
docx                       anthropics/skills              -                      Claude Code
scrolls-setup              bundled                        scrolls-skills         Claude Code
```

## Recap

- Without `--route`, `aiskills` only manages bundled skills.
- With `--route` (or `aix`), a bare name is looked up, and installed only on a unique exact match that you confirm (`y` at the prompt, or `-y` in advance); `owner/repo@skill` is used as given, without asking.
- External skills are installed from their source; they are never copied into `~/.config/sugatoray/aiskills`.

Reference: [`--route`](../reference/cli.md#--route) · [`-y`](../reference/cli.md#-y---yes) · [Bundled and external skills](../concepts/bundled-and-external.md)

Next: [5. Uninstall](05-uninstall.md) · Previous: [3. Install into a project](03-install-into-a-project.md)
