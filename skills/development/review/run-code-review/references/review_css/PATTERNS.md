# CSS fix patterns

Before/after pairs for the findings that come up most. Use them to shape a suggested change,
adapted to the project's naming, tokens and browser support.

## Lower specificity instead of `!important`

```css
/* Before: the id forces the override to shout */
#sidebar .nav ul li a { color: #333; }
.nav-link.active { color: #0a58ca !important; }
```

```css
/* After: one class each, so order and intent decide */
.nav-link { color: #333; }
.nav-link.is-active { color: #0a58ca; }
```

Where third-party CSS must be overridden and the browsers in scope support it, a cascade
layer puts the third-party rules below your own regardless of specificity:

```css
@layer vendor, app;
@import url("vendor.css") layer(vendor);

@layer app {
  .nav-link.is-active { color: #0a58ca; }
}
```

## Keep a visible focus style

```css
/* Before: keyboard users cannot see where they are */
button:focus { outline: none; }
```

```css
/* After: no ring on mouse click, a clear one for keyboard focus */
button:focus-visible {
  outline: 2px solid #0a58ca;
  outline-offset: 2px;
}
```

## Animate `transform`, and respect reduced motion

```css
/* Before: animating left forces layout on every frame */
.drawer { position: fixed; left: -320px; transition: left 300ms; }
.drawer.is-open { left: 0; }
```

```css
/* After */
.drawer { position: fixed; left: 0; transform: translateX(-100%); transition: transform 300ms; }
.drawer.is-open { transform: translateX(0); }

@media (prefers-reduced-motion: reduce) {
  .drawer { transition: none; }
}
```

## Unitless `line-height`

```css
/* Before: children inherit the computed 24px, whatever their own font size */
body { font-size: 16px; line-height: 24px; }
h1 { font-size: 40px; }            /* 40px text on 24px lines: the lines overlap */
```

```css
/* After: the ratio is inherited and applied to each element's own font size */
body { font-size: 1rem; line-height: 1.5; }
h1 { font-size: 2.5rem; line-height: 1.2; }
```

## Let content set the size

```css
/* Before: longer or translated text overflows the box */
.badge { width: 80px; height: 24px; }
```

```css
/* After */
.badge { min-inline-size: 5rem; padding: 0.25rem 0.5rem; }
```

## A fallback for a custom property that may be missing

```css
/* Before: if --brand is not defined, color is not the earlier value but the inherited one */
.title { color: #1a1a1a; color: var(--brand); }
```

```css
/* After */
.title { color: var(--brand, #1a1a1a); }
```

## Longhand when only one part should change

```css
/* Before: the shorthand resets background-image, -repeat, -position and the rest */
.hero { background-image: url("hero.jpg"); background-size: cover; }
.hero.is-dark { background: #111; }
```

```css
/* After */
.hero.is-dark { background-color: #111; }
```

## Visually hidden, still announced

```css
/* Before: removed from the accessibility tree as well */
.sr-only { display: none; }
```

```css
/* After */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  margin: -1px;
  padding: 0;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
  border: 0;
}
```

## Logical properties for bidirectional layouts

```css
/* Before: the icon sits on the wrong side in right-to-left languages */
.icon { margin-right: 8px; float: left; }
```

```css
/* After */
.icon { margin-inline-end: 0.5rem; float: inline-start; }
```

## Web fonts that don't hide the text

```css
/* Before: text is invisible until the font arrives */
@font-face {
  font-family: "Brand";
  src: url("/fonts/brand.woff2") format("woff2");
}
```

```css
/* After: fallback text shows first and is swapped when the font loads */
@font-face {
  font-family: "Brand";
  src: url("/fonts/brand.woff2") format("woff2");
  font-display: swap;
}

body { font-family: "Brand", system-ui, sans-serif; }
```

## Mobile viewport height

```css
/* Before: taller than the visible area when the mobile browser's toolbar is showing */
.screen { height: 100vh; }
```

```css
/* After: the first declaration is the fallback for browsers without dynamic viewport units */
.screen { min-height: 100vh; min-height: 100dvh; }
```

## Flatten deep preprocessor nesting

```scss
// Before: compiles to .card .body ul li a:hover, specificity 0,3,3
.card {
  .body {
    ul {
      li {
        a { &:hover { color: $link-hover; } }
      }
    }
  }
}
```

```scss
// After
.card__link:hover { color: $link-hover; }
```

## Sass modules instead of `@import` and global functions

```scss
// Before: @import and global percentage() are deprecated in Dart Sass
@import "tokens";
.col { width: percentage(1 / 3); }
```

```scss
// After
@use "sass:math";
@use "tokens";
.col { width: math.percentage(math.div(1, 3)); }
```
