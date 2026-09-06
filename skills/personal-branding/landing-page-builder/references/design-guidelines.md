# Design guidelines: tasteful, professional, not generic

The test for every design decision below: would this specific person
recognize this page as *theirs*, or does it look like it was generated
for anyone? A landing page assembled from the same hero-gradient +
three-icon-feature-grid + rounded-card pattern used everywhere else is a
failure even if every fact on it is correct.

Read this after the YAML data exists and is approved — design decisions
below (accent color, tone, section rhythm) should be chosen to fit
*this* person's field and material, not picked before you know what
you're building for.

## Let the person's field and material drive the direction

Before touching typography or color, decide a point of view from the
actual data: a marine biologist's page can afford to feel airy and
photographic; a security researcher's can afford to feel dense and
monospace-accented; a novelist's can afford generous negative space and
serif-forward type. Write down (mentally or in a comment to yourself,
not on the page) the one or two adjectives you're designing toward
before writing CSS. If nothing in the data suggests a direction, default
to quiet, confident, editorial — not loud.

## Typography

- Pick **one display face** (headings, name, tagline) and **one body
  face** (paragraphs, labels) — never more than two families. A serif
  display paired with a clean grotesk body (or vice versa) reads more
  considered than two grotesks that are almost the same.
- Load from Google Fonts with a real fallback stack
  (`font-family: 'Fraunces', Georgia, serif;`), and choose faces that
  suit the direction from the previous section rather than a reflexive
  Inter-for-everything default. Some options worth reaching for over the
  obvious default, depending on direction: `Fraunces`, `Newsreader`,
  `Source Serif 4`, `Libre Caslon Text` for a warmer/editorial display;
  `Space Grotesk`, `General Sans` (self-host if not on a free CDN),
  `IBM Plex Sans`, `Inter` for a clean/technical body or display.
- Use a real modular type scale (e.g. a 1.25–1.333 ratio), not
  arbitrary pixel values chosen per element. Set it up with CSS custom
  properties once, at the top of the stylesheet.
- Body copy: 1.5–1.7 line-height, a measure (line length) around
  60–75 characters — set body text containers with a `max-width` in
  `ch` units, don't let paragraphs stretch full-viewport-width on large
  screens.
- Fluid sizing with `clamp()` for headline and hero text so it scales
  smoothly between mobile and desktop instead of jumping at breakpoints.

## Color

- One neutral scale (a handful of off-white/off-black/gray steps — not
  pure `#fff`/`#000`, which reads flat and cheap) plus **one** accent
  hue used deliberately and sparingly (links, one highlighted element,
  hover states) — not washed across every section as a background tint.
- Choose the accent to fit the person's field/material rather than
  defaulting to blue or purple: a warm terracotta or ochre for a
  designer/writer, a deep forest or teal for anything environmental/
  scientific, a restrained ink-navy or charcoal for finance/law/academic
  contexts, and so on. This is a judgment call from the data, not a
  lookup table — the point is picking *something* deliberate over the
  reflexive default.
- **Never** the default purple-to-blue gradient hero. If a gradient is
  used at all, it should be a subtle, tonal, low-contrast one (two close
  shades of the same hue), not a loud multi-hue sweep.
- Check contrast: body text against its background should meet WCAG AA
  (4.5:1 for normal text, 3:1 for large text) — verify by eye against
  the actual hex values you chose, don't assume a palette is accessible
  just because it looks fine on a bright monitor.
- Respect `prefers-color-scheme` when reasonable, but a single
  well-executed light (or dark) design is better than a rushed
  half-implemented toggle — don't add a theme switch that hasn't
  actually been tested in both states.

## Layout and composition

- Vary section rhythm. Don't give every section the same
  container-padding-heading-body-cards shape. Concretely, choose from a
  mix like: a full-bleed statement/pull-quote section, a two-column
  asymmetric bio-plus-photo (or bio-plus-monogram) section, a horizontal
  or left-rail timeline for career history, a tag-cloud or inline-list
  treatment for skills (not a grid of identical icon cards), a simple
  list-with-hover treatment for projects/publications rather than
  uniform three-across cards for everything.
- Real asymmetry: unequal column widths, text that doesn't always start
  at the same left edge, a hero that isn't perfectly centered — small
  deviations from a rigid symmetric grid are what make a page feel
  designed rather than templated. Keep it disciplined (align to an
  underlying grid) rather than random.
- Generous whitespace between sections (large vertical rhythm, e.g.
  `clamp(4rem, 10vw, 8rem)` between major sections) — cramped sections
  are one of the fastest tells of a low-effort page.
- Mobile-first: write the base styles for narrow viewports, add
  `min-width` media queries to enhance for wider ones. Test that nothing
  overflows horizontally at 360px wide.

## Motion

- Subtle and purposeful only: a gentle fade/rise on scroll into view, a
  hover-state transition on links/buttons (150–250ms, ease-out). No
  parallax scrolling, no auto-playing carousels, no confetti/particle
  backgrounds, no typewriter-effect hero text.
- Wrap any scroll-triggered animation in a `prefers-reduced-motion:
  reduce` check that disables it.

## Content presentation — avoid these specifically

- No emoji used as section headers, bullet points, or icons (✨ 🚀 💡
  etc.) — they read as AI-generated filler, not as this person's voice.
- No fabricated stats or counters ("500+ projects completed", "10 years
  of excellence") unless the YAML data actually supports the specific
  number — and even then, prefer stating it in prose over a big
  animated counter widget.
- No stock "hero" photography (generic laptop-on-desk, generic
  handshake, generic city skyline) standing in for a real photo the
  person doesn't have — use the monogram/initials treatment from
  "Images" below instead of a stock substitute.
- No placeholder social icons that link to `#` or nowhere — only render
  a social link that has a real URL in the YAML; omit the icon entirely
  otherwise (see `page-structure.md`).
- No Lorem ipsum or "your content here" filler under any circumstances —
  every word on the shipped page should come from the approved YAML.

## Images: the monogram fallback

When `headshot_url` is absent from the YAML (per `data-schema.md`'s
guidance on when to omit it), don't leave an empty gap or use a generic
silhouette icon. Design a simple, deliberate monogram/initial treatment
(the person's initials, set in the display typeface, on a solid or
subtly textured background using the accent color) sized and placed
where a photo would otherwise go. Done well this reads as an intentional
design choice, not a missing asset.

## Technical baseline

- Semantic HTML (`<header>`, `<nav>`, `<main>`, `<section>`,
  `<footer>`, proper heading levels in order — one `<h1>` for the
  person's name).
- Every image has meaningful `alt` text; every link has visible focus
  styles (don't remove the focus outline without replacing it with
  something equally visible).
- Self-contained single file unless the target explicitly calls for a
  build step: inline `<style>`, inline (or CDN-loaded, per the current
  environment's rules on external resources) fonts, no server
  dependency to view it.
- Ship it responsive by construction, not "responsive enough" — check
  the layout at a phone width, a tablet width, and a wide desktop width
  before calling it done.

## Final check before delivering

Read back over "Content presentation — avoid these specifically" against
the actual page you produced. If any item on that list is present,
that's a defect to fix before showing the user the page, not a
stylistic choice to leave in.
