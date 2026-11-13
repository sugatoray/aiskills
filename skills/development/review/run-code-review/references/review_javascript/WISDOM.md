# JavaScript review wisdom

Read this before forming findings on JavaScript, in a full review and in a security-only
one. TypeScript reviews read it too. **Constraints** are limits the review must stay within.
**Traps** are things in the language that mislead a reader. **Ditches** are the ways a review
of this language goes off the road. **Wisdom** is the judgement that keeps it on.

## Constraints

- **The runtime and its version bound every suggestion:** `engines` in `package.json`,
  `.nvmrc`, the `browserslist`, the bundler's target. Don't suggest a feature the target lacks
  unless the build transpiles or polyfills it.
- **The module system is fixed by the project.** ESM and CommonJS differ in `require`,
  top-level `await`, `__dirname` and default-export interop; suggestions must match `"type"`
  and the file extension.
- **Don't run `npm install` or change the lock file** to make a tool work. Installing runs
  third-party scripts.
- **Browser code is public.** Anything shipped to the client can be read and changed by the
  user; a control that exists only there is not a control.
- **A linter's verdict is a lead,** confirmed against the code before it becomes a finding.
- **Exported functions and HTTP routes are contracts** with callers the diff does not show.

## Traps

- **`forEach` ignores returned promises.** `array.forEach(async …)` starts every call and
  waits for none; errors become unhandled rejections.
- **A promise without `await`, `return` or `.catch`** runs detached: its failure is lost and
  the caller continues early.
- **`||` replaces every falsy value** (`0`, `""`, `false`, `NaN`); `??` replaces only `null`
  and `undefined`.
- **`==` coerces.** `0 == ""`, `null == undefined`, `"1" == 1` are all true.
- **`typeof null` is `"object"`,** `typeof NaN` is `"number"`, and `NaN !== NaN`.
- **`Array.prototype.sort` sorts as strings by default:** `[10, 9, 1].sort()` gives
  `[1, 10, 9]`. It also sorts in place, as do `reverse` and `splice`.
- **`parseInt("08abc")` returns `8`** and `Number("")` returns `0`: lenient parsing hides bad
  input.
- **Numbers are 64-bit floats.** Integers above `2^53 - 1` lose precision, so large ids from
  JSON are silently changed; `0.1 + 0.2 !== 0.3`.
- **`JSON.stringify` drops `undefined`, functions and symbols,** turns `NaN` into `null`, and
  throws on `BigInt` and cycles. `JSON.parse` output is unvalidated.
- **`this` depends on the call, not the definition.** A method passed as a callback loses it;
  arrow functions never have their own.
- **Object spread and `Object.assign` copy one level.** Nested objects are still shared.
- **`Date` months start at 0,** parsing of non-ISO strings varies by engine, and a date-only
  ISO string is UTC while a date-time one without an offset is local.
- **`try`/`catch` does not catch what a callback or un-awaited promise throws later.**
- **`for…in` walks inherited enumerable keys** and yields strings, including array indices.

## Ditches

- **Arguing semicolons, quotes and arrow-versus-function** while an unhandled rejection sits
  in the diff.
- **Flagging every framework escape hatch as XSS** without checking where the value comes
  from, or missing a real one because "React escapes".
- **Reviewing the source and not what ships:** bundler configuration, environment variable
  exposure and source maps decide what the browser receives.
- **Reporting every `npm audit` advisory,** including ones in development tooling that never
  reaches production and ones the change did not add.
- **Proposing a new dependency for a ten-line function,** or a framework migration in a
  review of a bug fix.
- **Trusting mocks.** A test that mocks `fetch` and the database proves the mocks agree with
  each other.
- **Assuming sequential execution.** Between an `await` and the next line, other requests ran
  and shared state may have changed.
- **Missing the unhappy path:** the rejected promise, the non-2xx response, the empty array,
  the `undefined` property three levels down.

## Wisdom

- **Follow every promise to where it is awaited or handled.** Most async bugs are visible that
  way.
- **Validate at the boundary, then trust the shape inside.** One schema check where data
  enters beats defensive checks scattered through the code.
- **Keep untrusted data as data:** `textContent` not markup, argument arrays not command
  strings, bound parameters not query strings.
- **Prefer the platform:** `URL`, `URLSearchParams`, `structuredClone`, `crypto`,
  `AbortController`, `Intl`. Each replaces a hand-rolled version with known bugs.
- **Every outbound call needs a timeout and an error path.** `fetch` has neither by default.
- **Immutability is cheap insurance:** return new arrays and objects rather than mutating
  arguments the caller still holds.
- **Reproduce in `node -e` or the console before rating.** Coercion and async ordering are
  easier to show than to argue.
- **Say what you did not check:** browsers not tested, the production build not inspected.
