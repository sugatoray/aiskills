# CSS tooling

Commands to run during a review, and how to read them. Follow `SKILL.md` step 4: run what the
project already has, don't install into it, and treat output as leads to confirm.

Linters check the stylesheet; whether a rule applies, and what the page then looks like, can
only be checked in a browser against the real markup.

## Find what the project uses

```bash
ls .stylelintrc* stylelint.config.* .browserslistrc postcss.config.* tailwind.config.* .prettierrc* 2>/dev/null
git grep -nE '"(stylelint[a-z-]*|sass|sass-embedded|node-sass|less|postcss|autoprefixer|tailwindcss|lightningcss|purgecss|browserslist)"' -- '*package.json'
npx browserslist                                    # the browsers the project targets
git grep -n '!important' -- '*.css' '*.scss' '*.less' | wc -l
git grep -nE 'outline: *(none|0)\b' -- '*.css' '*.scss' '*.less' | head -20        # focus styles removed
git grep -nE '@import|url\(' -- '*.css' '*.scss' '*.less' | grep -E 'https?:|//' | head -20   # other origins
git grep -nE 'z-index: *[0-9]{3,}' -- '*.css' '*.scss' '*.less' | head -20
```

## Checks

| Purpose | Command | Notes |
| --- | --- | --- |
| Lint | `npx stylelint "src/**/*.{css,scss,less}"` | Needs a config; honours `.stylelintrc*`. With `stylelint-config-standard` it reports unknown properties and units, duplicate properties and selectors, and descending specificity. |
| Formatting | `npx prettier --check "src/**/*.{css,scss,less}"` | Only if the project uses Prettier. |
| Does it compile | `npx sass --no-source-map src/main.scss > /dev/null`, `npx lessc src/main.less > /dev/null` | Sass prints deprecation warnings for `@import`, global built-ins and `/` division. |
| Review the compiled output | `npx sass --style=expanded src/main.scss \| less` | Selector length and duplication show in the output, not the source. |
| Browser support of what the change uses | `npx browserslist`, then the feature's support table (MDN, caniuse) | `npx doiuse --browsers "$(npx browserslist \| paste -sd, -)" file.css` automates it where `doiuse` is available. |
| Specificity and size statistics | `npx wallace-cli file.css` | Selector count, maximum specificity, `!important` count, unique colours and font sizes. Where not available, review the compiled CSS by hand. |
| Unused rules | the browser's Coverage panel on the real pages; `npx purgecss --css dist/app.css --content "dist/**/*.html" --rejected` | Any static tool misses classes built in JavaScript. Treat "unused" as a lead. |
| Contrast and other accessibility checks | `npx pa11y http://localhost:8080/page`, `npx @axe-core/cli http://localhost:8080/page` | Needs the page served. Checks the rendered default state only. |
| Visual regression | the project's suite (Playwright `toHaveScreenshot`, Chromatic, Percy, BackstopJS) | Run it for the pages the changed selectors can reach. |

## Reading the output

- **`no-descending-specificity`** points at rules whose effect depends on source order. Each
  one is a possible override bug; many are harmless. Check the ones the change touches.
- **Unknown property or value** is usually a typo and a real defect: the declaration is
  dropped. Before reporting, rule out a newer feature the linter's data does not know yet.
- **A clean lint says nothing about whether the rule applies** or what it does to other pages.
- **Preprocessor deprecation warnings** are a migration cost, not a defect in the change,
  unless the change adds new uses.

## Checking in a browser

- **Which rule won.** The Styles panel shows every matching rule in cascade order with the
  losers struck through. Use it to confirm a "never applies" or "overridden" finding.
- **Computed values.** The Computed panel shows what a `var()`, a percentage or an inherited
  value resolved to.
- **States.** Force `:hover`, `:focus-visible`, `:active` and `:disabled` from the developer
  tools; check each has a visible style.
- **Sizes.** 320, 768 and 1280 CSS pixels wide, 200% zoom, a long word and a long translated
  string in each changed component.
- **Preferences.** Emulate `prefers-reduced-motion`, `prefers-color-scheme` and
  `forced-colors` from the rendering tools.
- **Direction.** Set `dir="rtl"` on `<html>` if the project supports right-to-left languages.
- **What else matches.** `document.querySelectorAll("<the changed selector>").length` in the
  console, on several pages.

## Reproducing a finding

A cascade finding fits in one file. State which rule wins and why:

```html
<!doctype html>
<meta charset="utf-8">
<title>Specificity</title>
<style>
  #sidebar a { color: black; }        /* specificity 1,0,1 */
  .nav-link.is-active { color: blue; } /* specificity 0,2,0: loses */
</style>
<nav id="sidebar"><a class="nav-link is-active" href="#">Home</a></nav>
<script>
  console.log(getComputedStyle(document.querySelector("a")).color);   // rgb(0, 0, 0)
</script>
```
