# How to leave files out of the package

This guide is for maintainers of the [sugatoray/aiskills](https://github.com/sugatoray/aiskills) repo: use a `.skillsignore` to keep files, folders or whole skills out of the npm package.

The package is built from the repo's `skills/` folder when it is packed. A `.skillsignore` file, in `skills/` or any folder below it, lists what to leave out, in `.gitignore` syntax.

## Steps

1. Create or edit a `.skillsignore`, for example `skills/.skillsignore`:

   ```gitignore
   # every tests/ folder, at any depth
   **/tests/
   # all .log files except keep.log
   *.log
   !keep.log
   # ignoring a skill's folder drops the whole skill
   scrolls/wip-skill/
   ```

2. Build the package contents and look at them:

   ```bash
   cd src/packages/aiskills
   npm run vendor
   ```

   What was left out is listed under `ignored` in `.aiskills/layout.json`.

3. Run the tests, which compare the package with every git-tracked file under `skills/` that no `.skillsignore` excludes, then clean up:

   ```bash
   npm test
   npm run clean
   ```

## Variations

### Rules for one folder

A `.skillsignore` deeper down applies to its own folder and below, after the outer rules. Its `!` rules can re-include files an outer rule left out.

## Troubleshooting

- **`.skillsignore ignores <group>/<skill>/SKILL.md; to drop a skill, ignore the folder (<group>/<skill>/) instead`**: ignoring only a `SKILL.md` would leave a skill without a definition. Ignore the folder.
- **A pattern with a `/` in the middle doesn't match deeper files**: like `.gitignore`, a `/` in the middle anchors the pattern to the `.skillsignore`'s folder. Write `**/meta/MAINTAINERS.md` for any depth.
- **A `#` after a pattern**: is part of the pattern. Put comments on their own lines.

See also: [`.skillsignore` reference](../reference/skillsignore.md) · [Files and schemas](../reference/files.md#aiskillslayoutjson)
