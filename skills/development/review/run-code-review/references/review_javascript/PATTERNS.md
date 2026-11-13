# JavaScript fix patterns

Before/after pairs for the findings that come up most. Use them to shape a suggested change;
adapt names, module style (ES modules or CommonJS) and formatting to the file under review, and
check the project's minimum Node or browser version (noted where a fix needs a recent one).

## Defaults that respect `0`, `""` and `false`

```js
// Before: a limit of 0 becomes 20
const limit = options.limit || 20;
```

```js
// After
const limit = options.limit ?? 20;
```

## Numeric sort without mutating the input

```js
// Before: sorts as strings, and reorders the caller's array
const ranked = scores.sort();
```

```js
// After
const ranked = [...scores].sort((a, b) => a - b);
```

`scores.toSorted((a, b) => a - b)` does the same from Node 20.

## Await every iteration

```js
// Before: returns before any email is sent; rejections are unhandled
users.forEach(async (user) => {
  await sendEmail(user);
});
```

```js
// After: one at a time
for (const user of users) {
  await sendEmail(user);
}
```

```js
// After: concurrently, when the calls are independent and the list is small
await Promise.all(users.map((user) => sendEmail(user)));
```

## Bounded concurrency

```js
// Before: one request per item, all at once
const pages = await Promise.all(urls.map((url) => fetchPage(url)));
```

```js
// After: at most `size` in flight
async function mapInBatches(items, size, fn) {
  const results = [];
  for (let i = 0; i < items.length; i += size) {
    const batch = items.slice(i, i + size);
    results.push(...(await Promise.all(batch.map(fn))));
  }
  return results;
}

const pages = await mapInBatches(urls, 8, fetchPage);
```

If the project already depends on `p-limit` or `p-map`, use that instead.

## Fetch with a timeout and a status check

```js
// Before: can hang forever; a 500 body is parsed as data
const res = await fetch(url);
const data = await res.json();
```

```js
// After (AbortSignal.timeout: Node 17.3+, current browsers)
const res = await fetch(url, { signal: AbortSignal.timeout(10_000) });
if (!res.ok) {
  throw new Error(`GET ${url} failed: ${res.status} ${res.statusText}`);
}
const data = await res.json();
```

## Errors that keep their cause

```js
// Before: no stack, original error lost
try {
  await saveOrder(order);
} catch (err) {
  throw "could not save order";
}
```

```js
// After (cause: Node 16.9+)
try {
  await saveOrder(order);
} catch (err) {
  throw new Error(`could not save order ${order.id}`, { cause: err });
}
```

## `catch` that reaches the awaited call

```js
// Before: the rejection bypasses this catch
async function loadUser(id) {
  try {
    return db.users.findById(id);
  } catch (err) {
    throw new UserLookupError(id, { cause: err });
  }
}
```

```js
// After
async function loadUser(id) {
  try {
    return await db.users.findById(id);
  } catch (err) {
    throw new UserLookupError(id, { cause: err });
  }
}
```

## Async route handler in Express 4

```js
// Before: a rejection never reaches the error middleware
app.get("/orders/:id", async (req, res) => {
  res.json(await orders.get(req.params.id));
});
```

```js
// After
app.get("/orders/:id", async (req, res, next) => {
  try {
    res.json(await orders.get(req.params.id));
  } catch (err) {
    next(err);
  }
});
```

## Text into the DOM

```js
// Before: XSS if `comment.body` contains markup
item.innerHTML = `<p>${comment.body}</p>`;
```

```js
// After
const p = document.createElement("p");
p.textContent = comment.body;
item.replaceChildren(p);
```

When markup must be rendered, sanitise it first (for example with DOMPurify) and say which
tags are allowed.

## Subprocess without a shell

```js
// Before: `branch` can inject commands
const { exec } = require("node:child_process");
exec(`git checkout ${branch}`, callback);
```

```js
// After
const { execFile } = require("node:child_process");
execFile("git", ["checkout", "--", branch], callback);
```

## Path containment

```js
// Before: "../../etc/passwd" escapes the uploads folder
const filePath = path.join(UPLOAD_DIR, req.params.name);
```

```js
// After
const base = path.resolve(UPLOAD_DIR);
const filePath = path.resolve(base, req.params.name);
if (!filePath.startsWith(base + path.sep)) {
  return res.status(400).json({ error: "invalid file name" });
}
```

## Parameterised queries

```js
// Before: SQL injection
const rows = await db.query(`SELECT id FROM users WHERE email = '${email}'`);
```

```js
// After (placeholder syntax depends on the driver: $1, ?, :name)
const rows = await db.query("SELECT id FROM users WHERE email = $1", [email]);
```

For MongoDB, make sure a value that should be a string is one before it reaches a filter:

```js
if (typeof req.body.email !== "string") {
  return res.status(400).json({ error: "email must be a string" });
}
const user = await users.findOne({ email: req.body.email });
```

## Tokens and secret comparison

```js
// Before: predictable token, timing-dependent comparison
const token = Math.random().toString(36).slice(2);
if (signature === expected) accept();
```

```js
// After
const crypto = require("node:crypto");

const token = crypto.randomBytes(32).toString("base64url");

const a = Buffer.from(signature);
const b = Buffer.from(expected);
if (a.length === b.length && crypto.timingSafeEqual(a, b)) accept();
```

## Maps keyed by input

```js
// Before: a key of "__proto__" or "constructor" collides with the prototype
const counts = {};
for (const word of words) {
  counts[word] = (counts[word] || 0) + 1;
}
```

```js
// After
const counts = new Map();
for (const word of words) {
  counts.set(word, (counts.get(word) ?? 0) + 1);
}
```

## Streams with error propagation

```js
// Before: an error in any stage leaves the others open
fs.createReadStream(src).pipe(zlib.createGzip()).pipe(fs.createWriteStream(dest));
```

```js
// After
const { pipeline } = require("node:stream/promises");

await pipeline(fs.createReadStream(src), zlib.createGzip(), fs.createWriteStream(dest));
```

## Lookup inside a loop

```js
// Before: O(orders × blocked)
const flagged = orders.filter((o) => blockedIds.includes(o.customerId));
```

```js
// After
const blocked = new Set(blockedIds);
const flagged = orders.filter((o) => blocked.has(o.customerId));
```

## Accumulating without copying each time

```js
// Before: copies the accumulator on every step (quadratic)
const byId = users.reduce((acc, u) => ({ ...acc, [u.id]: u }), {});
```

```js
// After
const byId = new Map(users.map((u) => [u.id, u]));
```

## Configuration parsed once

```js
// Before: "false" is truthy; a missing value surfaces far from here
if (process.env.ENABLE_CACHE) startCache(process.env.CACHE_TTL);
```

```js
// After
function readConfig(env = process.env) {
  const ttl = Number.parseInt(env.CACHE_TTL ?? "300", 10);
  if (!Number.isInteger(ttl) || ttl <= 0) {
    throw new Error(`CACHE_TTL must be a positive integer, got ${JSON.stringify(env.CACHE_TTL)}`);
  }
  return { cacheEnabled: env.ENABLE_CACHE === "true", cacheTtlSeconds: ttl };
}

const config = readConfig();
if (config.cacheEnabled) startCache(config.cacheTtlSeconds);
```

## React effect with cleanup and complete dependencies

```jsx
// Before: stale `userId`, no cancellation, out-of-order responses can win
useEffect(() => {
  fetchProfile(userId).then(setProfile);
}, []);
```

```jsx
// After
useEffect(() => {
  const controller = new AbortController();
  fetchProfile(userId, { signal: controller.signal })
    .then(setProfile)
    .catch((err) => {
      if (err.name !== "AbortError") setError(err);
    });
  return () => controller.abort();
}, [userId]);
```

## A test that waits for its assertion

```js
// Before: passes before the promise settles, and if it never rejects
test("rejects an unknown id", () => {
  getOrder("nope").catch((err) => {
    expect(err.code).toBe("NOT_FOUND");
  });
});
```

```js
// After (Jest/Vitest)
test("rejects an unknown id", async () => {
  await expect(getOrder("nope")).rejects.toMatchObject({ code: "NOT_FOUND" });
});
```

With `node:test`: `await assert.rejects(getOrder("nope"), { code: "NOT_FOUND" });`
