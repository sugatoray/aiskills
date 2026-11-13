# CSS review

What to look for in CSS (`.css`, and the `.scss` and `.less` preprocessors), beyond
`../CROSS_LANGUAGE.md`. CSS fails quietly: an invalid declaration is dropped, an unknown
selector matches nothing, and a rule that loses the cascade does nothing, all without an
error. `PATTERNS.md` has the fix for the common items, `TOOLING.md` the commands, `SECURITY.md`
the security scope, and `WISDOM.md` the constraints and traps to keep in mind for every CSS
review.

## Before you start

- **Which browsers.** `browserslist` in `package.json` or `.browserslistrc`, or the project's
  support statement. Every feature suggested or accepted must work there or have a fallback.
- **How styles are organised.** Plain stylesheets, a preprocessor, CSS Modules, a utility
  framework (Tailwind), CSS-in-JS, a design-token system, a naming convention (BEM). Review
  against the convention in use; don't propose a different one.
- **What the project enforces.** `stylelint` config, Prettier, an autoprefixer or PostCSS
  pipeline (so vendor prefixes should not be written by hand).
- **Where the rule applies.** Global CSS reaches every page. Find what else matches the
  selector before judging a change to it.

## Correctness and the cascade

- **A rule that never applies:** a selector that matches nothing after a markup change, or
  one beaten by a more specific or later rule. Check in the browser, not by reading.
- **A declaration the browser drops:** a misspelled property or value, a missing unit
  (`margin: 10`), a unit on a unitless property, an invalid colour. The rest of the rule still
  applies, which hides it.
- **`!important`** used to win a specificity fight. It moves the fight up a level and the next
  override needs it too. Acceptable in utility classes and overrides of third-party styles.
- **High-specificity selectors:** ids, long descendant chains, selectors tied to the DOM
  shape (`.page > div > ul li a`). They break when markup moves and can only be overridden by
  something worse.
- **Source-order dependence:** two rules of equal specificity where the result depends on
  which file is bundled last.
- **Shorthand resetting longhands.** `background: red` after `background-image: …` removes the
  image; `font:` resets `line-height`; `margin: 0` after `margin-top`.
- **Overly broad selectors** (`div`, `*`, `a`, `[class*="col"]`) in a shared stylesheet, and
  element selectors scoped to nothing.
- **Custom properties:** a `var(--x)` with no fallback where `--x` may be undefined (the
  declaration becomes invalid at computed-value time and falls back to inherited or initial,
  not to the previous declaration), and typos in names, which are not reported.
- **`z-index` on a non-positioned element,** or escalating values (`9999`) fighting a stacking
  context that a parent's `transform`, `opacity` or `filter` created.
- **Margin collapse, percentage heights with no definite parent height, `100vh` on mobile**
  where browser chrome changes the viewport height.

## Layout and responsiveness

- **Fixed widths and heights** on containers of text: content overflows or is clipped when the
  text is longer, translated, or zoomed.
- **Breakpoints** written against one device's width rather than where the layout breaks;
  overlapping `min-width`/`max-width` ranges that leave a 1px gap or double-match.
- **`overflow: hidden`** hiding content or focus rings rather than fixing the overflow.
- **Layout by `position: absolute`, floats or negative margins** where flexbox or grid states
  the intent.
- **Physical properties** (`margin-left`, `text-align: left`) in a project that supports
  right-to-left languages, where logical ones (`margin-inline-start`, `text-align: start`)
  are needed.
- **Text units:** `px` font sizes that ignore the user's default size; `line-height` with a
  unit, which is inherited as a fixed length.

## Accessibility

- **`outline: none` or `outline: 0`** with no replacement focus style. Keyboard users lose
  their place. Style `:focus-visible` instead of removing the outline.
- **Contrast** below 4.5:1 for body text or 3:1 for large text and interface components (WCAG
  level AA), including placeholder, disabled-looking and hover states.
- **Content hidden the wrong way.** `display: none` and `visibility: hidden` hide from
  assistive technology too; visually hidden text for screen readers needs the clip pattern.
- **Animation with no `prefers-reduced-motion` alternative** for large movement, parallax or
  flashing.
- **Information carried only by colour** or by a CSS `content:` string, which not every
  assistive technology reads and which cannot be translated or selected.
- **`order`, `flex-direction: row-reverse` or grid placement** that makes the visual order
  differ from the DOM order, and so from the focus and reading order.
- **Text in images or fixed-size boxes** that cannot reflow at 200% zoom; tap targets smaller
  than about 24 by 24 CSS pixels.

## Performance

- **Animating layout properties** (`width`, `height`, `top`, `left`, `margin`) where
  `transform` and `opacity` can run on the compositor.
- **`will-change` applied broadly or permanently:** each use can cost a layer's worth of
  memory.
- **`@import` in a stylesheet:** each one is a further request discovered only after its
  parent loads. Bundle, or use `<link>`.
- **Web fonts** with no `font-display`, many weights and families, or no fallback stack with
  similar metrics (layout shift when the font arrives).
- **Unused CSS** shipped to every page, and large frameworks imported whole for a few classes.
- **Expensive effects over large areas:** `filter`, `backdrop-filter`, big `box-shadow` blur
  on scrolling content.
- **Missing dimensions or `aspect-ratio`** on media, causing layout shift.

## Maintainability

- **Magic numbers** (`top: 37px`, `margin-left: -3px`) with no explanation of what they
  compensate for.
- **Hard-coded colours, sizes and spacing** in a project that has tokens or custom properties.
- **Duplicated rule blocks** and near-identical components; dead rules left behind after
  markup was removed.
- **Vendor prefixes written by hand** in a project with autoprefixer, or prefixed properties
  with no unprefixed declaration after them.
- **Browser hacks** with no comment naming the browser and the bug.
- **Preprocessors:** nesting more than about three levels (it produces the long selectors
  above), `@extend` across files (surprising selector groups and ordering), mixins that
  duplicate large blocks, and `&-suffix` class construction that makes class names
  impossible to search for.
- **Deprecated Sass:** `@import` and the global built-in functions, which the Sass module
  system (`@use`, `sass:math`) replaces. Check the Sass version before flagging.

## Security

Read `SECURITY.md` for the full scope. The items that most often matter in ordinary review:
untrusted values interpolated into styles, user-supplied stylesheets, third-party stylesheets
and fonts loaded from other origins, and `url()` values pointing at unexpected hosts.

## Usually not worth a finding

- Property order, quote style, colour notation (`#fff` against `white`), `0` against `0px`.
- Formatting a formatter owns.
- Shorthand against longhand where both are correct and nothing is reset.
- A naming style different from your preference but consistent within the project.
