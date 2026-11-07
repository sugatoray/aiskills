# How to choose the `skills` CLI version

Use this when you need a newer or different release of the `skills` CLI than the one `aiskills` pins.

Every `npx` call that `aiskills` makes runs one tested version of the `skills` CLI, `skills@1.7.6`, so a new release (or a compromised one) is never picked up without testing. `AISKILLS_SKILLS_VERSION` overrides it.

## Steps

1. Set the version for one command:

   <!-- verify -->
   ```bash
   AISKILLS_SKILLS_VERSION=latest aiskills skills --version
   ```

   ```text
   [aiskills] running: npx -y skills@latest --version
   ```

2. Or for every command, in your shell profile:

   ```bash
   export AISKILLS_SKILLS_VERSION=1.7.6
   ```

## Variations

Accepted values are an exact version (`1.7.6`, `1.8.0-beta.1`), `latest` or `next`. Anything else is refused before `npx` runs, so a typo can't turn into a different package:

<!-- verify -->
```bash
AISKILLS_SKILLS_VERSION='^1' aiskills find pdf
```

```text
[aiskills] AISKILLS_SKILLS_VERSION must be an exact version (e.g. 1.7.6), "latest" or "next"; got '^1'
```

## Troubleshooting

- **`-a` patterns or `--route` stop working on a newer version**: `aiskills` reads two pieces of `npx skills` text output (the "Valid agents:" list and `find` results). If a release changes them, go back to the pinned version and report it.

> [!WARNING]
> `latest` gives up the protection of the pinned version. Use it to try a release, not as a permanent setting.

See also: [`AISKILLS_SKILLS_VERSION`](../reference/environment.md#aiskills_skills_version) · [Security model](../concepts/security.md)
