# HTML review wisdom

Read this before forming findings on HTML, in a full review and in a security-only one.
**Constraints** are limits the review must stay within. **Traps** are things in the language
that mislead a reader. **Ditches** are the ways a review of this language goes off the road.
**Wisdom** is the judgement that keeps it on.

## Constraints

- **The supported browsers and clients bound every suggestion.** HTML email, embedded
  webviews and old browsers lack elements and attributes that current browsers have.
- **A template is not HTML until it is rendered.** Review the output as well as the source,
  and don't run a validator on unrendered template syntax.
- **The project's accessibility target is the standard to review against** (commonly WCAG
  level AA). Where there is none, say which standard a finding refers to.
- **Never scan a production site, or one you were not told to test.**
- **Markup is an interface for scripts, styles and tests.** Renaming an `id`, a class or a
  `data-` attribute, or changing element nesting, can break selectors the diff does not show.
- **Automated checks see the default state of one page.** They are leads, and their silence
  is not evidence.

## Traps

- **Browsers repair invalid HTML without reporting it.** A `<div>` inside a `<p>` closes the
  paragraph; a `<tr>` outside a table is dropped; the DOM is not what the source shows.
- **A `<button>` inside a form submits it** unless it has `type="button"`.
- **`placeholder` is not a label,** and `title` is not reliably announced.
- **Duplicate `id`s do not raise an error;** labels, ARIA references and fragment links use
  the first.
- **`alt` missing and `alt=""` mean opposite things:** the first makes a screen reader
  announce the file name or skip unpredictably, the second marks the image as decoration.
- **ARIA changes what is announced, not what the element does.** `role="button"` on a `<div>`
  adds no focus and no keyboard behaviour.
- **`display: none` and the `hidden` attribute remove content from assistive technology
  too;** `aria-hidden="true"` hides from assistive technology but leaves it focusable.
- **HTML escaping is not URL, script or CSS escaping.** A value safe between tags is not safe
  in `href`, in `<script>` or in an `on…` attribute.
- **Attribute values without quotes end at the first space.**
- **`async` scripts run in arrival order,** not document order; `defer` keeps the order.
- **`loading="lazy"` on the main above-the-fold image delays the largest paint.**
- **`<a href="#">` with a click handler** scrolls to the top and breaks open-in-new-tab.
- **`autocomplete="off"` is ignored for passwords by most browsers,** and switching it off
  elsewhere harms users of password managers and autofill.

## Ditches

- **Arguing indentation, attribute order and quote style** while an unlabelled form control
  or an unescaped value goes through.
- **Reporting the validator's full output.** Pick the errors that change the DOM, break
  accessibility or matter for security.
- **Declaring a page accessible because the automated checker passed.**
- **Adding ARIA to fix what a native element would fix.**
- **Reviewing only the default state:** not the error state, the empty state, the long
  string, the small screen, keyboard-only use.
- **Flagging every `|safe` or `v-html` as XSS** without tracing the value, or accepting one
  because "it comes from our database".
- **Reviewing the template and never looking at the rendered page.**
- **Demanding a rewrite to a different component model** in a review of a markup change.

## Wisdom

- **Use the element that already does the job:** `<button>`, `<a href>`, `<label>`,
  `<nav>`, `<main>`, `<table>` with headers, `<dialog>`. Native elements bring focus, keyboard
  behaviour and semantics for free.
- **The first rule of ARIA is not to use it** where HTML has an equivalent.
- **Let the template engine escape, and treat every exception as a finding to justify.**
- **Check with a keyboard and at 200% zoom.** Two minutes finds what no linter does.
- **Structure first, then style, then behaviour.** A page that makes sense with CSS and
  JavaScript off is usually accessible and robust.
- **Reserve space for what loads late:** images, embeds, fonts, banners.
- **Every third-party tag is code you run but did not review.** Weigh it that way.
- **Reproduce in a single file before rating.** A ten-line page that shows the DOM the
  browser builds ends most arguments.
- **Say what you did not check:** browsers, assistive technology, the rendered page.
