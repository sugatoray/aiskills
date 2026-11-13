# TypeScript security review

The security scope for TypeScript. TypeScript is JavaScript at run time, so read
`../review_javascript/SECURITY.md` first: every source, sink and check there applies
unchanged. This file adds what the type system changes. It is read for the security pass of
a full review, and on its own, with `WISDOM.md`, when the review runs with `-s`/`--security`.
Rate findings with `../SEVERITY.md` and report them with `../REPORT_TEMPLATE.md`.

## Scope

In scope: everything in the JavaScript security scope, plus the places where a type gives
false assurance about data that crosses a trust boundary.

Establish first:

- **Types are erased.** Nothing in a type annotation exists at run time. A value typed
  `UserId` or `Role` holds whatever the request contained.
- **Where data is validated.** Find the schema library (zod, valibot, io-ts, ajv, class-validator)
  or hand-written guards, and which boundaries they cover.
- **How strict the compiler is.** With `strict` off, or `any` flowing in from untyped
  dependencies, the checks below are not being made by the compiler either.

## Where untrusted data enters

As in JavaScript. In TypeScript, look for the point where that data is given a type:
`JSON.parse(text) as T`, `(await res.json()) as T`, `req.body as CreateUser`, a generic
`get<T>()` helper, a typed ORM or SDK result, `process.env.X!`, and declaration files written
by hand for an untyped module.

## Checks

### Types that claim more than was checked

- **Type assertions on external data:** `as T`, `<T>value`, and `as unknown as T` applied to
  request bodies, parsed JSON, query strings, `postMessage` data, storage, environment
  variables or database rows. The assertion checks nothing. Parse with a schema, or narrow
  with a guard that inspects the value.
- **`any` from a boundary** (`JSON.parse`, `res.json()`, an untyped dependency,
  `catch (e)`) flowing into a sink. `any` switches off checking for everything it touches.
- **User-defined type guards that don't check what they claim:** `(x): x is Admin` returning
  `true` after testing one field, or testing nothing. The compiler trusts the signature.
- **Non-null assertions (`!`) on security-relevant lookups:** `session!.user`,
  `process.env.JWT_SECRET!`, `map.get(tenantId)!`. An absent value becomes `undefined` in a
  comparison or a signing key.
- **Generic fetch helpers** (`api.get<User>(url)`) that return the response cast to the type
  parameter.
- **Declaration files and `declare`** that describe a runtime value optimistically.

### Authorisation encoded in types only

- **Roles and permissions as union or branded types** with no run-time check. A
  `role: "admin" | "user"` field in a request type is still attacker-supplied text.
- **Excess properties.** Object types are open at run time: a body typed
  `{ name: string }` can carry `isAdmin: true`, and spreading it into a model or an update
  writes the extra field (mass assignment). Pick the allowed fields explicitly, or use a
  schema that strips or rejects unknown keys.
- **Exhaustiveness gaps in access decisions:** a `switch` over a role or state with a
  permissive `default`, or no `never` check, so a newly added variant is allowed by accident.
- **Enums:** a value of type `number` is assignable to a numeric enum, and nothing checks
  it at run time; a value from input must be checked against the members.

### Suppressed checks

- **`@ts-ignore`, `@ts-expect-error`, `@ts-nocheck` and `eslint-disable`** on or near code
  that handles input, credentials or permissions: find what error was being hidden.
- **Compiler options loosened in the change:** `strict`, `noImplicitAny`,
  `strictNullChecks`, `noUncheckedIndexedAccess`, `useUnknownInCatchVariables` switched off,
  or `skipLibCheck` hiding a bad declaration.

### Build and shipping

- **Source maps and declaration files published** with server-side code, internal paths or
  comments.
- **Secrets typed into client code** through `import.meta.env`, `process.env` replacement or
  public-prefixed variables (`NEXT_PUBLIC_`, `VITE_`): the type hides nothing.
- **Tests and scripts excluded from type-checking** that handle credentials or migrations.

## Tools

| Purpose | Command | Notes |
| --- | --- | --- |
| Everything in the JavaScript table | see `../review_javascript/SECURITY.md` | `npm audit`, secret scanning and the sink search apply as they are. |
| Type-check | `npx tsc --noEmit -p .` | A clean run proves nothing about data that arrives at run time. |
| Unsafe `any` flows | `npx eslint .` with `@typescript-eslint` type-aware rules (`no-unsafe-assignment`, `no-unsafe-member-access`, `no-unsafe-argument`, `no-explicit-any`) | Only if the project's config enables them. |
| Assertions and suppressions | `git grep -nE ' as (unknown as )?[A-Z]\|as any\|@ts-ignore\|@ts-expect-error\|@ts-nocheck' -- '*.ts' '*.tsx'` | Read the ones on boundary data. |
| Non-null assertions | `git grep -nE '[A-Za-z0-9_\)\]]!(\.\|\[\|;\|,\|\))' -- '*.ts' '*.tsx'` | A rough net; expect false matches such as `!==`. |

## What this review does not establish

As for JavaScript: it reads code and does not test a running application. In addition, a
clean type-check is not evidence that input is validated; only reading the boundary code, or
testing it with malformed input, shows that.
