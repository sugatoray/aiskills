# TypeScript review

What the type system adds to a review. TypeScript is JavaScript at run time, so read
`../review_javascript/REVIEW.md` as well: everything there (async, security, Node, browser)
applies unchanged. `PATTERNS.md` has the fix for the common items, `TOOLING.md` the commands.

The question behind most items here: **does the type say what is true at run time?** Types are
erased when the code is compiled. A type that is wrong is worse than no type, because the
compiler then vouches for the bug.

## Before you start

- **Compiler settings.** Read `tsconfig.json` (and what it `extends`). Note whether `strict` is
  on, and the extra checks that are not part of it: `noUncheckedIndexedAccess`,
  `exactOptionalPropertyTypes`, `noImplicitOverride`, `noFallthroughCasesInSwitch`,
  `noImplicitReturns`. With `strict` off, `null` and implicit `any` flow freely and several
  findings below become more severe. A change that turns a check off is a finding.
- **TypeScript version** (`devDependencies.typescript`). Don't suggest syntax it lacks:
  `satisfies` needs 4.9, `const` type parameters 5.0, `using` declarations 5.2.
- **How it is built and run:** `tsc`, a bundler, `ts-node`/`tsx`, or a runtime that strips types
  (Node's type stripping, Deno, Bun). Tools that transpile one file at a time need
  `isolatedModules`/`verbatimModuleSyntax`, and don't support `const enum` or namespaces that
  merge across files.
- **Lint rules:** is `typescript-eslint` configured with type information
  (`no-floating-promises`, `no-misused-promises`, `no-unsafe-*`)? If not, look for those
  mistakes by hand.

## Escape hatches

Each of these tells the compiler to stop checking. Every use in a change needs a reason.

- **`any`,** explicit or implicit (an untyped parameter, an untyped dependency, `JSON.parse`,
  `res.json()`, `catch (e)` without `useUnknownInCatchVariables`). `any` is contagious: one
  value turns everything it touches into `any`. Use `unknown` and narrow.
- **Type assertions** (`value as User`, `<User>value`). An assertion is a claim, not a check.
  `as unknown as T` and `as any` say the claim wouldn't pass even a loose check. Acceptable
  after a runtime check the compiler can't follow; otherwise replace with narrowing or
  validation.
- **Non-null assertion** (`user!.id`, `map.get(k)!`, `document.getElementById("x")!`): a crash
  postponed. Handle the `undefined` case, or throw with a message at the point of the
  assumption.
- **`@ts-ignore`** silences any error on the next line, including future ones. Use
  `@ts-expect-error` with a comment saying why: it fails when the error goes away. `@ts-nocheck`
  on a file is a finding in itself.
- **User-defined type guards that lie.** `function isUser(x: unknown): x is User` whose body
  checks one field, or nothing. The compiler trusts the signature completely.
- **`Function`, `object`, `{}`, `Object`** as types: they accept almost anything. Write the
  call signature, `Record<string, unknown>`, or the real shape.
- **Definite assignment `!`** on class fields (`name!: string`) without a guaranteed
  initialiser.

## Data that crosses a boundary

- **Unvalidated external data given a type.** HTTP request bodies and responses, `JSON.parse`,
  `localStorage`, environment variables, database rows, message payloads, `postMessage` data.
  Declaring `const body: CreateOrder = await req.json()` checks nothing. Validate at the
  boundary with the project's schema library (zod, valibot, io-ts, ajv) or a hand-written guard
  that tests every field, and derive the type from the schema so the two can't drift.
- **Types that don't survive serialisation.** A `Date` field arrives from JSON as a string;
  `Map`, `Set`, `bigint`, `undefined` properties and class instances don't round-trip.
- **Generated or hand-copied API types** out of date with the server.
- **`process.env.X`** is `string | undefined`; `Number(process.env.PORT)` may be `NaN`.

## Modelling

- **Optional-field bags where a discriminated union is meant.**
  `{ status: string; data?: T; error?: string }` allows states that can't happen (both, or
  neither). Model each state as its own member with a literal discriminant.
- **Non-exhaustive handling of a union or enum.** A `switch` or `if` chain with no check that
  every member is handled: adding a member compiles and silently falls through. Add a `never`
  check in the `default`.
- **`string` or `number` where a narrower type exists:** a union of literals for a fixed set,
  a branded type for IDs that must not be mixed (`UserId` against `OrderId`), a template
  literal type for a format.
- **`enum` pitfalls.** Numeric enums allow reverse mapping and arithmetic; `const enum` breaks
  under single-file transpilers; enums are not erasable syntax. A union of string literals, or
  an `as const` object with a derived type, is usually simpler. Follow what the project does.
- **Mutability.** Parameters and public properties that shouldn't be mutated typed `readonly`
  / `ReadonlyArray<T>` / `Readonly<T>`. `readonly` is compile-time and shallow; it does not
  freeze.
- **Indexing typed as always present.** `Record<string, T>` and `T[]` indexing return `T`, not
  `T | undefined`, unless `noUncheckedIndexedAccess` is on. `arr[0].name` on a possibly empty
  array, `byId[id].x` for an unknown id.
- **Optional (`x?: T`) against `x: T | undefined`:** the first lets callers omit the key, the
  second forces a decision. Options are fine optional; required-but-nullable data is not.
- **Overuse of `Partial<T>`,** especially as a function's input for an update: every field
  optional, including ones that must never be cleared. Pick the fields: `Pick<T, "a" | "b">`.
- **Unnecessary or unconstrained generics.** A type parameter used once adds nothing (it is
  `unknown` with extra steps); `<T>(x: any): T` is an assertion in disguise.
- **Missing return types on exported functions.** Inference makes the public contract depend
  on the implementation; an accidental `Promise<any>` or widened union leaks out.
- **`interface` against `type`:** follow the codebase. Not a finding unless declaration merging
  is happening by accident.
- **Wrapper object types:** `String`, `Number`, `Boolean` instead of `string`, `number`,
  `boolean`.
- **Wide literals.** An object literal meant as a constant table without `as const` or
  `satisfies`: keys and values widen to `string`, and lookups stop being checked.

## Null and undefined

- With `strictNullChecks`: is every `T | null | undefined` narrowed before use, without `!`?
- `if (value)` used to narrow a `number | undefined` or `string | undefined` also excludes `0`
  and `""`.
- `Array.prototype.find`, `Map.prototype.get`, `String.prototype.match`,
  `document.querySelector` return possibly-missing values; check how each result is used.
- Functions that return `null` in one place and `undefined` in another for "nothing".

## Async

- **A promise where a value or `void` is expected.** An `async` function passed as an event
  handler, `forEach` callback or `Array.prototype.filter` predicate type-checks (a promise is
  assignable to `void`, and truthy) and is wrong. `no-misused-promises` catches it.
- **Unawaited promises** in a function typed to return `Promise<void>`: the caller's `await`
  resolves before the work is done.
- `async` functions that never await (unneeded promise wrapping), and `Promise<T>` return types
  on functions that can also throw synchronously before the first `await`.

## Classes and functions

- `private` is compile-time only (and reachable with `obj["field"]`); `#field` is enforced at
  run time. Don't rely on `private` for secrets.
- Parameter properties, `override` without `noImplicitOverride`, and methods used as callbacks
  that lose `this` (declare `this: void` or use arrow properties).
- Overloads whose implementation signature accepts combinations no overload allows; overloads
  where one union-typed signature would do.
- Function parameters are checked bivariantly for methods: a callback typed too narrowly can
  be passed and then called with the wider type. Prefer function-typed properties under
  `strictFunctionTypes`.

## Modules and public API

- **`import type` / `export type`** for type-only imports, required under
  `verbatimModuleSyntax`/`isolatedModules`; without them a type-only import can keep a module
  (and its side effects) in the bundle or create a runtime cycle.
- **Exported types are API.** Renaming a property, narrowing a parameter or widening a return
  type is a breaking change for consumers even when the JavaScript is unchanged.
- **Barrel files** (`index.ts` re-exporting everything): circular imports, slow builds, and
  defeated tree-shaking. `export *` leaking internals.
- **Path aliases** (`paths` in `tsconfig`) only affect type checking: the bundler or runtime
  must resolve them too.
- **Declaration files:** a hand-written `.d.ts` or `declare module` that doesn't match the
  JavaScript it describes; `declare global` augmentations that affect the whole program.
- **Library packages:** `types`/`exports` in `package.json` pointing at files that are built
  and shipped; `skipLibCheck` hiding errors in the package's own declarations.

## Tests

- Tests type-checked at all? Many setups transpile tests without checking; then a test can
  call the API in a way the types forbid.
- Mocks cast with `as any`/`as unknown as T` that no longer match the real interface. Prefer
  typed helpers (`vi.mocked`, `jest.mocked`, `satisfies`).
- For libraries with non-trivial types, type-level tests (`expectTypeOf`, `tsd`,
  `// @ts-expect-error` cases) so the public types don't regress.

## Usually not worth a finding

- `interface` against `type`, `Array<T>` against `T[]`, where the file is consistent.
- An explicit annotation the compiler would infer, or the reverse, on a local.
- `any` inside a narrow, well-commented adapter around an untyped dependency.
- Type-level cleverness you would have written differently but that is correct and readable.
