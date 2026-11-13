# TypeScript review wisdom

Read this before forming findings on TypeScript, in a full review and in a security-only
one, together with `../review_javascript/WISDOM.md`: the JavaScript constraints and traps all
still apply. **Constraints** are limits the review must stay within. **Traps** are things in
the language that mislead a reader. **Ditches** are the ways a review of this language goes
off the road. **Wisdom** is the judgement that keeps it on.

## Constraints

- **Types are erased at run time.** No annotation, interface or generic validates anything.
  Where data crosses a trust boundary, only code that inspects the value counts.
- **The project's `tsconfig.json` and TypeScript version bound every suggestion.** Don't
  propose `satisfies`, `using`, `const` type parameters or a stricter flag without checking
  the version, and don't propose turning on `strict` as a finding against a small change.
- **Don't change compiler options, the lock file or installed packages** to make a check run.
- **A clean `tsc` means the types are consistent with each other,** not that the program is
  correct or that the types describe the data.
- **Exported types are public API.** Widening a parameter is safe; narrowing one, or widening
  a return type, breaks consumers the diff does not show.

## Traps

- **`as` is an instruction to the compiler, not a conversion.** `JSON.parse(s) as User`
  compiles for any `s`.
- **Indexing is optimistic.** `arr[i]` and `record[key]` are typed as present unless
  `noUncheckedIndexedAccess` is on.
- **Structural typing ignores names.** Two types with the same shape are interchangeable: a
  `UserId` and an `OrderId` that are both `string` mix freely unless branded.
- **Excess property checks apply only to object literals.** The same object passed through a
  variable is accepted with its extra fields.
- **Optional (`x?: T`) and `x: T | undefined` differ** in whether the key may be absent, and
  under `exactOptionalPropertyTypes` in whether `undefined` may be assigned.
- **Method parameters are checked bivariantly,** so a handler taking a narrower type than the
  interface declares is accepted and fails at run time.
- **Narrowing does not survive a callback or an `await`** for mutable variables and
  properties, and the compiler's view can be stale after a function call that mutates.
- **Any `number` is assignable to a numeric enum,** so a number from input passes with no
  membership check. Enums exist at run time; `const enum` and type-only imports do not.
- **`catch (e)` gives `any`** unless `useUnknownInCatchVariables` (part of `strict`) is on.
- **`Object.keys(obj)` returns `string[]`,** not `keyof T`, on purpose: the object may have
  more keys than its type says.
- **`!` and `as` silence the error at this line and move the failure** to wherever the value
  is next used.
- **Declaration files can be wrong.** `@types/*` and hand-written `.d.ts` files are claims
  about a library, not checked against it.

## Ditches

- **Type gymnastics in review.** Proposing conditional and mapped types that few on the team
  can maintain, to remove a cast that is harmless.
- **Treating every `any` as a defect.** One `any` inside a small, commented adapter around an
  untyped dependency is fine; `any` on a public signature or a boundary is not.
- **Believing the types.** Reviewing only whether the code type-checks, and not whether the
  data really has that shape at run time.
- **Forgetting the JavaScript underneath:** async ordering, coercion, `this`, and every
  injection sink are untouched by types.
- **Demanding stricter compiler flags** in a review of an unrelated change.
- **Missing the suppression:** a `@ts-expect-error` or cast added to make the change compile
  is often the finding.
- **Reviewing application types and skipping tests and scripts** that are not type-checked
  at all.

## Wisdom

- **Parse, don't assert.** Turn `unknown` into a typed value through a schema or a guard at
  the boundary, once, and let the types carry that proof inward.
- **Make illegal states unrepresentable:** discriminated unions over optional fields and
  boolean flags, with a `never` check so a new variant fails to compile where it is unhandled.
- **Let inference work,** but annotate exported functions so an accidental change in a return
  type is caught at the definition.
- **Prefer `unknown` to `any`,** `satisfies` to `as` where the version allows, and a guard to
  `!`.
- **Every cast should have a reason next to it** that says why the compiler cannot see what
  the author knows.
- **Check the emitted JavaScript when in doubt** about enums, decorators, class fields or
  module interop: that is what runs.
- **Say what you did not check:** whether type-aware lint ran, and which boundaries were read.
