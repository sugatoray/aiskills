# JavaScript review

What to look for in JavaScript (Node.js and browser), beyond `../CROSS_LANGUAGE.md`. TypeScript
reviews read this file too; `../review_typescript/REVIEW.md` adds what the type system changes.
`PATTERNS.md` has the fix for the common items, `TOOLING.md` the commands, `SECURITY.md` the
security scope, and `WISDOM.md` the constraints and traps to keep in mind for every review.

## Before you start

- **Where it runs.** Node (which versions: `engines` in `package.json`, `.nvmrc`, the CI matrix,
  the `Dockerfile`), browsers (`browserslist`, the bundler's target), or both. Every suggestion
  must run there: for example `Array.prototype.at` needs Node 16.6, `structuredClone` Node 17,
  `AbortSignal.timeout` Node 17.3 and `toSorted`/`toReversed` Node 20.
- **Module system.** `"type": "module"` or `.mjs` means ES modules; otherwise `.js` is CommonJS.
  `require` in an ES module and top-level `await` in CommonJS both fail.
- **What the project enforces.** ESLint config (`eslint.config.js`, `.eslintrc*`), Prettier,
  the test runner, the package manager and its lock file. Don't hand-flag what they check.
- **Framework conventions** (React, Vue, Express, Fastify, Next.js): judge against the
  framework's documented patterns, not general taste.

## Correctness

- **`==` and `!=`.** Coercion makes `0 == ""`, `null == undefined` and `"1" == 1` true. Use
  `===`/`!==`; the one accepted exception is `x == null` to test for both `null` and `undefined`.
- **`||` used for defaults.** `count || 10` replaces `0`, `""` and `false`. Use `??` when only
  `null`/`undefined` should fall through.
- **`var`,** and assignment to an undeclared name (an implicit global in sloppy mode). Use
  `const`, and `let` where reassigned.
- **Lost `this`.** A method passed as a callback (`setTimeout(obj.method)`,
  `emitter.on("x", this.handle)`) loses its receiver. Bind it, or use an arrow function. Arrow
  functions as object methods have no own `this`.
- **Default `sort()` compares as strings:** `[10, 9, 1].sort()` gives `[1, 10, 9]`. Pass a
  comparator. `sort`, `reverse` and `splice` also mutate the array in place: a bug when the array
  is a prop, a shared constant or state.
- **`for...in` on an array** iterates keys as strings and includes inherited properties. Use
  `for...of`, or `Object.keys`/`entries` for objects.
- **`parseInt` without a radix, and on untrusted text:** `parseInt("12px")` is `12`,
  `parseInt("")` is `NaN`. `Number("")` is `0`. Validate, then check `Number.isNaN`/`isFinite`.
- **`NaN` comparisons:** `x === NaN` is always false; use `Number.isNaN(x)`.
- **Numbers above `2**53 - 1`** (database IDs, snowflakes, money in minor units of large
  amounts) lose precision, including through `JSON.parse`. Keep them as strings or `BigInt`.
- **Floats for money:** `0.1 + 0.2 !== 0.3`. Use integer minor units or a decimal library.
- **`Date` traps.** Months are zero-based; `new Date("2024-01-05")` is UTC but
  `new Date("2024-01-05T00:00")` is local; non-ISO strings parse differently per engine; setters
  mutate. Arithmetic across a daylight-saving change is off by an hour.
- **Shared references.** `Array(3).fill({})` and `Array(3).fill([])` put the same object in
  every slot. Spread and `Object.assign` copy one level only; nested objects are still shared.
- **Mutating arguments or module-level objects** that callers or other requests also hold.
- **Optional chaining hiding a bug.** `a?.b?.c` on something that must exist turns a loud
  failure into a silent `undefined` further on.
- **Objects used as maps with keys from input.** `"__proto__"`, `"constructor"` and
  `"toString"` collide with the prototype. Use `Map`, or `Object.create(null)`.
- **`typeof null === "object"`,** and `typeof` of an array is `"object"`: use `Array.isArray`.
- **`JSON.parse` unguarded** on input that may not be JSON; `JSON.stringify` dropping
  `undefined`, functions and symbols, throwing on cycles and `BigInt`.
- **Regular expressions with the `g` or `y` flag reused with `.test()`/`.exec()`** keep
  `lastIndex` between calls, so alternate calls fail.
- **`switch` fall-through** without a comment, and a missing `default`.
- **Automatic semicolon insertion:** a line starting with `(`, `[` or a template literal joins
  the previous line; `return` followed by a newline returns `undefined`.

## Async

- **Floating promises.** An async call with no `await`, `return`, `.catch` or explicit `void`:
  errors vanish and ordering is not what it reads as. In Node an unhandled rejection terminates
  the process by default (since 15).
- **`forEach` with an async callback** does not wait; neither do `map`/`filter` unless the
  result goes to `Promise.all`. `filter` with an async predicate keeps everything (a promise is
  truthy).
- **`await` in a loop** where the iterations are independent: sequential by accident. The
  opposite mistake is `Promise.all` over an unbounded list: thousands of concurrent requests.
  Batch, or use a concurrency limit.
- **`Promise.all` rejects on the first failure** and leaves the rest running unobserved. Use
  `Promise.allSettled` when every result matters.
- **`async` function as a `new Promise` executor,** or a promise wrapped in another promise:
  thrown errors are lost. Return the inner promise.
- **`try`/`catch` that doesn't cover the await.** `return promise` inside `try` leaves the
  `catch` unreached; `return await promise` reaches it.
- **Mixing callbacks and promises:** calling a callback twice, or both calling back and
  rejecting; an error-first callback whose error argument is ignored.
- **State read before an `await` and used after it.** Another request or event may have changed
  it in between; check-then-act across an `await` is a race.
- **No timeout or cancellation.** `fetch` waits indefinitely unless given
  `AbortSignal.timeout(ms)` or an `AbortController`.
- **Timers, listeners and subscriptions never removed:** `setInterval` without
  `clearInterval`, `addEventListener` without a matching removal, an `EventEmitter` gaining a
  listener per request.
- **Express 4 async handlers.** A rejected promise in `app.get(path, async (req, res) => …)` is
  not passed to the error middleware (Express 5 does this). Wrap, or call `next(err)`.

## Error handling

- **Throwing non-errors** (`throw "failed"`, `throw { code: 1 }`): no stack, and `instanceof
  Error` checks fail. Throw `Error` or a subclass; preserve the original with
  `new Error(message, { cause: err })` (Node 16.9+).
- **Empty `catch`,** or `catch (e) { console.log(e) }` followed by carrying on with missing
  data.
- **Catching everything to return a default** (`catch { return [] }`): the caller can't tell
  "none" from "the database is down".
- **`process.on("uncaughtException")` used to keep running:** the process is in an unknown
  state. Log, then exit and let the supervisor restart it.
- **`process.exit()` in library code or before output is flushed.** Set `process.exitCode`
  and return.
- **Error responses that leak** stack traces, SQL or internal paths to clients.

## Security

Read `SECURITY.md` for the full scope; it is part of every full review. The items that most
often matter in ordinary review: untrusted data into `innerHTML` and its relatives,
`child_process.exec` and queries built from template strings, prototype pollution in merges,
path traversal, `Math.random()` for tokens, secrets shipped to the browser, and a route
missing its authorisation check.

## Node.js

- **Synchronous or CPU-heavy work on a request path:** `fs.*Sync`, `crypto.pbkdf2Sync`,
  `zlib.*Sync`, `JSON.parse` of very large bodies, tight loops. The event loop serves nothing
  else meanwhile.
- **Streams piped with `.pipe()`:** errors don't propagate and the destination isn't closed.
  Use `stream.pipeline` (or `stream/promises`). Reading a large file or response fully into
  memory instead of streaming it; ignoring backpressure (`write()` returning `false`).
- **Unvalidated environment configuration** read as `process.env.X` all over the code; values
  are strings (`"false"` is truthy). Parse and validate once at startup.
- **No graceful shutdown:** `SIGTERM` not handled, server not closed, connections not drained.
- **Module-level state in a server** that leaks data between requests or grows without bound.
- **CommonJS/ESM interop:** `__dirname` in ES modules, default-import shape of a CommonJS
  package, missing file extensions in relative ES imports.

## Browser and UI

- Listeners, observers, timers and subscriptions cleaned up when the component or page goes.
- Layout thrashing: reading layout (`offsetHeight`, `getBoundingClientRect`) and writing styles
  alternately in a loop.
- Large synchronous work on the main thread; unthrottled `scroll`/`resize`/`input` handlers.
- Accessibility basics on new UI: semantic elements, labels, keyboard operation, focus handling.
- **React:** hook dependency arrays missing a value they use (stale closure) or omitted (effect
  runs every render); state mutated in place; index used as `key` for a list that reorders;
  effects without cleanup; state that duplicates props or other state; fetches in effects with
  no cancellation (out-of-order responses).

## Performance

- `includes`/`indexOf`/`find` inside a loop over large arrays: build a `Set` or `Map` once.
- Spreading the accumulator in `reduce` (`{ ...acc, [k]: v }`, `[...acc, x]`): quadratic.
- Chained `map().filter().map()` on large arrays in hot paths; repeated `JSON.parse`/`stringify`
  for cloning.
- Importing a whole library for one function in browser code (bundle size); no code splitting
  for a heavy, rarely used route.
- A query or request per item where a batch call exists.
- Caches (`Map`, memoise) with no size limit or expiry.

## Design and modules

- Side effects at import time (connecting, reading files, starting timers).
- Circular imports: a value that is `undefined` at first use.
- A function that takes many positional parameters or a boolean flag; prefer an options object.
- Inconsistent module style within a package (mixed default and named exports for the same
  kind of thing; mixed CommonJS and ES modules without a reason).
- Public API of a package: `exports` map, what is reachable by deep import, breaking changes.

## Tests

- Async tests that don't `await` or return the promise: they pass before the assertion runs.
- Assertions inside callbacks or `catch` blocks that may never execute; use
  `await expect(promise).rejects…` or `assert.rejects`.
- Fake timers and mocks not restored; module mocks that replace the unit under test.
- Snapshot tests of large output that nobody reads, updated wholesale to pass.
- Tests that depend on the real clock, time zone, locale, network or test order.

## Usually not worth a finding

- Semicolons, quotes, trailing commas, spacing: Prettier and ESLint.
- `function` against arrow functions, where `this` isn't involved.
- `for` loop against array methods when both are clear and the path isn't hot.
- Missing JSDoc on internal helpers.
