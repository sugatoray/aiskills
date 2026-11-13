# CSS review wisdom

Read this before forming findings on CSS, Sass/SCSS and Less, in a full review and in a
security-only one. **Constraints** are limits the review must stay within. **Traps** are
things in the language that mislead a reader. **Ditches** are the ways a review of this
language goes off the road. **Wisdom** is the judgement that keeps it on.

## Constraints

- **The supported browsers bound every suggestion.** Read the `browserslist` or the stated
  support policy before proposing `:has()`, container queries, nesting, `@layer`, `dvh` or
  `color-mix()`, and check whether the build adds fallbacks.
- **CSS is global.** A selector reaches every page that loads the file. A change is reviewed
  against everything it can match, not only the component in the diff.
- **The project's method is the standard** (BEM, utilities, CSS modules, a design-token
  set). Review against it; don't import another.
- **Generated CSS is not reviewed.** Review the source and the build configuration.
- **A stylesheet cannot be judged without the markup it styles.** Say so when the markup was
  not available.
- **Lint output is a lead.** It knows nothing of the cascade on a real page.

## Traps

- **Specificity beats source order, and `!important` beats both;** `@layer` order beats
  specificity, and unlayered styles beat layered ones.
- **An unknown property or value drops that declaration silently.** A misspelling produces
  no error, only a style that does not apply.
- **One invalid selector in a comma-separated list invalidates the whole rule** (except
  inside `:is()` and `:where()`).
- **Vertical margins collapse** between siblings and between a parent and its first or last
  child.
- **Percentage padding and margin are relative to the container's width,** including top and
  bottom.
- **`z-index` only competes inside its stacking context,** and `opacity`, `transform`,
  `filter` and `position: fixed` each create one. A larger number does not always win.
- **`100vh` is taller than the visible area on mobile browsers;** `100vw` includes the
  scrollbar.
- **`position: sticky` does nothing when an ancestor has `overflow` set** to anything but
  `visible`, or when no inset is given.
- **`height: 100%` needs a parent with a definite height.**
- **Flex and grid items have `min-width: auto`,** so long content overflows instead of
  shrinking until `min-width: 0` is set.
- **`em` compounds through nesting;** `rem` does not.
- **`:hover` sticks on touch devices,** and `outline: none` removes the only focus indicator
  unless another is supplied.
- **`display: none` and `visibility: hidden` remove content from assistive technology;**
  `opacity: 0` does not.
- **`transition: all` animates properties that force layout,** and any animation runs for
  users who asked for reduced motion unless the media query is honoured.
- **In Sass, `/` is no longer division,** `@import` is deprecated in favour of `@use`, and a
  nested selector's output specificity is the sum of its ancestors'.

## Ditches

- **Arguing property order, quote style and units** that a formatter or linter owns.
- **Fixing an override with more specificity or `!important`,** which guarantees the next
  one.
- **Reviewing at one viewport, in one browser, with a mouse.**
- **Asking for a rewrite to a different methodology** in a review of a small change.
- **Demanding micro-optimisation of selectors.** Selector matching is rarely the cost;
  layout thrash, large images and unused CSS are.
- **Missing what the change reaches:** a broad selector (`a`, `button`, `.title`) altering
  pages nobody looked at.
- **Approving from the diff without seeing it rendered.** Layout bugs are invisible in text.
- **Treating colour and motion as taste.** Contrast, focus visibility and reduced motion are
  accessibility requirements with measurable thresholds.
- **Dismissing CSS as having no security impact** where styles are built from data.

## Wisdom

- **Keep specificity low and flat.** One class per rule is easy to override and to delete.
- **Use tokens** (custom properties or preprocessor variables) for colour, spacing and type,
  so a change is made once.
- **Let content set size.** Fixed heights and widths are where overflow, clipping and
  translation bugs come from.
- **Use logical properties** (`margin-inline`, `padding-block`, `inset-inline-start`) where
  right-to-left text is, or may be, supported.
- **Design the unhappy states:** the long word, the empty list, the missing image, 200%
  zoom, a narrow screen, forced colours.
- **Never remove a focus indicator without replacing it.**
- **Animate `transform` and `opacity`;** honour `prefers-reduced-motion`.
- **Delete with evidence.** Search markup, templates and script for a class before calling
  its rule dead: class names are often built at run time.
- **Reproduce in a single file before rating.** A ten-line page showing the computed style
  settles most cascade arguments.
- **Say what you did not check:** browsers, viewports, right-to-left, the rendered page.
