# License

The `@sugatoray-ai/aiskills` npm package is licensed under Apache-2.0. Each skill it bundles keeps its own license, declared in that skill's `SKILL.md`; today every bundled skill is MIT, not Apache-2.0.

## The package

| Part | License | Declared in |
| --- | --- | --- |
| The npm package: the `aiskills`, `ais` and `aix` commands and their code | [Apache-2.0](../../LICENSE) | `package.json` (`"license"`), `LICENSE` |

## Bundled skills

17 skills, sorted by name.

| Skill | Group | License | Declared in |
| --- | --- | --- | --- |
| [`artwallbg`](skills/artwallbg.md) | image-styles | MIT | [`SKILL.md`](https://github.com/sugatoray/aiskills/blob/master/skills/image-styles/artwallbg/SKILL.md) |
| [`code-review`](skills/code-review.md) | reviews | MIT | [`SKILL.md`](https://github.com/sugatoray/aiskills/blob/master/skills/development/reviews/code-review/SKILL.md) |
| [`commentdrop`](skills/commentdrop.md) | image-styles | MIT | [`SKILL.md`](https://github.com/sugatoray/aiskills/blob/master/skills/image-styles/commentdrop/SKILL.md) |
| [`create-issues-update-pr`](skills/create-issues-update-pr.md) | repo-related | MIT | [`SKILL.md`](https://github.com/sugatoray/aiskills/blob/master/skills/development/repo-related/create-issues-update-pr/SKILL.md) |
| [`create-lib-docs`](skills/create-lib-docs.md) | docs | MIT | [`SKILL.md`](https://github.com/sugatoray/aiskills/blob/master/skills/docs/create-lib-docs/SKILL.md) |
| [`dynamic-promo-video`](skills/dynamic-promo-video.md) | video-related | MIT | [`SKILL.md`](https://github.com/sugatoray/aiskills/blob/master/skills/video-related/dynamic-promo-video/SKILL.md) |
| [`network-flow`](skills/network-flow.md) | diagrams | MIT | [`SKILL.md`](https://github.com/sugatoray/aiskills/blob/master/skills/diagrams/network-flow/SKILL.md) |
| [`prodigy`](skills/prodigy.md) | personas | MIT | [`SKILL.md`](https://github.com/sugatoray/aiskills/blob/master/skills/personas/prodigy/SKILL.md) |
| [`scrolls-explainer`](skills/scrolls-explainer.md) | scrolls | MIT | [`SKILL.md`](https://github.com/sugatoray/aiskills/blob/master/skills/scrolls/scrolls-explainer/SKILL.md) |
| [`scrolls-help`](skills/scrolls-help.md) | scrolls | MIT | [`SKILL.md`](https://github.com/sugatoray/aiskills/blob/master/skills/scrolls/scrolls-help/SKILL.md) |
| [`scrolls-hide`](skills/scrolls-hide.md) | scrolls | MIT | [`SKILL.md`](https://github.com/sugatoray/aiskills/blob/master/skills/scrolls/scrolls-hide/SKILL.md) |
| [`scrolls-remove`](skills/scrolls-remove.md) | scrolls | MIT | [`SKILL.md`](https://github.com/sugatoray/aiskills/blob/master/skills/scrolls/scrolls-remove/SKILL.md) |
| [`scrolls-restore`](skills/scrolls-restore.md) | scrolls | MIT | [`SKILL.md`](https://github.com/sugatoray/aiskills/blob/master/skills/scrolls/scrolls-restore/SKILL.md) |
| [`scrolls-setup`](skills/scrolls-setup.md) | scrolls | MIT | [`SKILL.md`](https://github.com/sugatoray/aiskills/blob/master/skills/scrolls/scrolls-setup/SKILL.md) |
| [`scrolls-unhide`](skills/scrolls-unhide.md) | scrolls | MIT | [`SKILL.md`](https://github.com/sugatoray/aiskills/blob/master/skills/scrolls/scrolls-unhide/SKILL.md) |
| [`scrolls-update`](skills/scrolls-update.md) | scrolls | MIT | [`SKILL.md`](https://github.com/sugatoray/aiskills/blob/master/skills/scrolls/scrolls-update/SKILL.md) |
| [`stata-recipes`](skills/stata-recipes.md) | stata | MIT | [`SKILL.md`](https://github.com/sugatoray/aiskills/blob/master/skills/stata/stata-recipes/SKILL.md) |

The skills come from the [sugatoray/aiskills](https://github.com/sugatoray/aiskills) repo, whose own `LICENSE` covers them too.

## What this means

- **Running `aiskills`** (installing, listing, removing skills) uses the package, under Apache-2.0.
- **Using, copying or changing a skill** follows that skill's license in the table above.
- **External skills** you add with [`--route`](reference/cli.md#--route) or `aix` aren't part of the package; each keeps the license its own source gives it.

This page is generated from `package.json` and the skills' own `SKILL.md` files by `npm run docs:skills`.

See also: [Bundled skills](skills/README.md) · [Security model](concepts/security.md)
