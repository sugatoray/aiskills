# HTML fix patterns

Before/after pairs for the findings that come up most. Use them to shape a suggested change,
adapted to the project's template language and component conventions.

## A real button instead of a clickable `<div>`

```html
<!-- Before: not focusable, no Enter/Space activation, no role announced -->
<div class="btn" onclick="save()">Save</div>
```

```html
<!-- After -->
<button type="button" class="btn" id="save">Save</button>
<script type="module">
  document.getElementById("save").addEventListener("click", save);
</script>
```

## Label every form control

```html
<!-- Before: the placeholder disappears on input and is not a reliable accessible name -->
<input type="text" name="email" placeholder="Email">
```

```html
<!-- After -->
<label for="email">Email</label>
<input type="email" id="email" name="email" autocomplete="email" required>
```

## Give a button inside a form a `type`

```html
<!-- Before: "Add row" submits the form, because a button's default type is submit -->
<form action="/orders" method="post">
  <button onclick="addRow()">Add row</button>
  <button>Place order</button>
</form>
```

```html
<!-- After -->
<form action="/orders" method="post">
  <button type="button" id="add-row">Add row</button>
  <button type="submit">Place order</button>
</form>
```

## `alt` text that matches the image's job

```html
<!-- Before: the first is announced by file name or skipped unpredictably; the second is noise -->
<img src="/charts/q3-revenue.png">
<img src="/img/divider.png" alt="divider image">
```

```html
<!-- After: describe what an informative image conveys; empty alt for decoration -->
<img src="/charts/q3-revenue.png" alt="Q3 revenue rose 12% to 4.1 million dollars">
<img src="/img/divider.png" alt="">
```

## Reserve space for images and defer the ones below the fold

```html
<!-- Before: content jumps when the image arrives; every image loads up front -->
<img src="/img/team.jpg" alt="The support team at the 2024 offsite">
```

```html
<!-- After: width and height give the browser the aspect ratio before the file loads -->
<img src="/img/team-800.jpg"
     srcset="/img/team-800.jpg 800w, /img/team-1600.jpg 1600w"
     sizes="(max-width: 800px) 100vw, 800px"
     width="800" height="533" loading="lazy" decoding="async"
     alt="The support team at the 2024 offsite">
```

Leave `loading="lazy"` off the image that is the largest element in the first viewport.

## Stop scripts blocking the parser

```html
<!-- Before: parsing stops while each script downloads and runs -->
<head>
  <script src="/js/vendor.js"></script>
  <script src="/js/app.js"></script>
</head>
```

```html
<!-- After: defer keeps document order and runs after parsing -->
<head>
  <script src="/js/vendor.js" defer></script>
  <script src="/js/app.js" defer></script>
</head>
```

`async` runs each script as soon as it arrives, in no fixed order: use it only for scripts
that depend on nothing else. `type="module"` scripts are deferred by default.

## Pin third-party scripts and styles

```html
<!-- Before: whatever the CDN serves runs with full access to the page -->
<script src="https://cdn.example.com/lib/4.2.0/lib.min.js"></script>
```

```html
<!-- After: the browser refuses the file if its hash differs -->
<script src="https://cdn.example.com/lib/4.2.0/lib.min.js"
        integrity="sha384-REPLACE_WITH_THE_HASH_OF_THE_EXACT_FILE"
        crossorigin="anonymous"></script>
```

Compute the hash from the exact file (`TOOLING.md`); a URL without a pinned version cannot be
given a stable hash.

## Links that open a new tab

```html
<!-- Before: on browsers that don't imply noopener, the new page can navigate this one -->
<a href="https://partner.example.com/offer" target="_blank">See the offer</a>
```

```html
<!-- After -->
<a href="https://partner.example.com/offer" target="_blank" rel="noopener noreferrer">See the offer</a>
```

## Sandbox embedded content

```html
<!-- Before: the framed page can run scripts, submit forms and navigate the top window -->
<iframe src="https://widgets.example.net/poll/42"></iframe>
```

```html
<!-- After: start from nothing and add only what the widget needs -->
<iframe src="https://widgets.example.net/poll/42"
        sandbox="allow-scripts allow-forms"
        referrerpolicy="no-referrer"
        title="Customer poll"></iframe>
```

Don't combine `allow-scripts` with `allow-same-origin` for content served from your own
origin: the framed page can then remove its own sandbox.

## Escaped output in templates

```html
<!-- Before (Jinja): |safe switches escaping off for a value a user controls -->
<p class="bio">{{ user.bio | safe }}</p>
<a href="{{ user.website }}">Website</a>
```

```html
<!-- After: let the engine escape; allow only http and https URLs, checked on the server -->
<p class="bio">{{ user.bio }}</p>
{% if user.website_is_http %}<a href="{{ user.website }}" rel="noopener noreferrer ugc">Website</a>{% endif %}
```

HTML escaping does not make a URL safe: `javascript:alert(1)` contains nothing to escape.
See `SECURITY.md`.

## Headings and landmarks that describe the page

```html
<!-- Before: levels picked for font size; nothing to navigate by -->
<div class="header">…</div>
<div class="content">
  <h1>Acme</h1>
  <h4>Pricing</h4>
  <h2>Small print</h2>
</div>
```

```html
<!-- After: one h1, levels that nest, landmarks for the regions -->
<header>…</header>
<main>
  <h1>Pricing</h1>
  <h2>Plans</h2>
  <h2>Small print</h2>
</main>
```

## Data tables with header cells

```html
<!-- Before -->
<table>
  <tr><td>Plan</td><td>Price</td></tr>
  <tr><td>Team</td><td>$12</td></tr>
</table>
```

```html
<!-- After -->
<table>
  <caption>Monthly price per user</caption>
  <thead><tr><th scope="col">Plan</th><th scope="col">Price</th></tr></thead>
  <tbody><tr><th scope="row">Team</th><td>$12</td></tr></tbody>
</table>
```
