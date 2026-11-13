# TypeScript tooling

Commands to run during a review, and how to read them. Everything in
`../review_javascript/TOOLING.md` (package manager, tests, ESLint, `npm audit`) applies; this
file adds the type checker. Follow `SKILL.md` step 4: run what the project already has, don't
install into it, and treat output as leads to confirm.

## Find what the project uses

```bash
ls tsconfig*.json 2>/dev/null
npx tsc --version                 # the project's TypeScript, if node_modules is installed
npx tsc --showConfig              # the effective options after "extends" is resolved
node -e 'const p=require("./package.json");console.log(p.scripts||{})'   # typecheck / build scripts
```

A monorepo has one `tsconfig.json` per package, often with project references; run the checker
from the package that owns the changed files, or `npx tsc -b` at the root.

## Checks

| Purpose | Command | Notes |
| --- | --- | --- |
| Type check | `npm run typecheck` if it exists, else `npx tsc --noEmit -p tsconfig.json` | Checks the whole project: `tsc` ignores `tsconfig.json` when given file names, so don't pass changed files to it. With project references use the project's build script, or `npx tsc -b`. |
| Lint with type information | `npm run lint` or `npx eslint <paths>` | The rules that matter most need typed linting: `@typescript-eslint/no-floating-promises`, `no-misused-promises`, `no-unsafe-assignment`, `no-explicit-any`, `switch-exhaustiveness-check`. |
| Tests | the project's runner (`npx vitest run`, `npx jest`, `node --test`) | Check whether tests are type-checked: `vitest` and `ts-jest` with `isolatedModules`, `tsx`, `swc` and `esbuild` strip types without checking them. |
| Type-level tests | `npx vitest --typecheck`, `npx tsd` | Only if the project has them. |
| What a stricter setting would find | `npx tsc --noEmit -p tsconfig.json --noUncheckedIndexedAccess` (or `--strict`) | Diagnostic only. Use it to locate real bugs in the changed files; don't report the project-wide count as a finding. |
| Unused exports and dependencies | `npx knip` | Only if configured. |

## Finding the escape hatches in a change

```bash
git diff --merge-base origin/main -- '*.ts' '*.tsx' '*.mts' '*.cts' \
  | grep -nE '^\+.*(\bas any\b|as unknown as|: any\b|<any>|@ts-ignore|@ts-nocheck|@ts-expect-error|[A-Za-z0-9_)\]]!\.|eslint-disable)'
```

Each hit is a place to ask: what makes this safe, and is there a way to let the compiler check
it instead?

## Reading the output

- **An error far from the change** after a type was edited usually is caused by the change:
  that is the type system finding the affected callers for you.
- **No errors with `strict` off** says little. Read the changed code for `null` handling and
  implicit `any` yourself.
- **`skipLibCheck: true`** means errors inside `.d.ts` files, including the project's own
  hand-written ones, are not reported.
- **A passing type check proves nothing about external data.** Trace each value that comes
  from outside the program to the place it is validated.

## Reproducing a finding

Show what the compiler infers with a scratch file outside the repository, or the TypeScript
Playground for a snippet with no project dependencies:

```bash
cat > /tmp/probe.ts <<'EOF_TS'
const byId: Record<string, { name: string }> = {};
const name = byId["missing"].name;   // compiles; throws at run time
EOF_TS
npx tsc --noEmit --strict /tmp/probe.ts && echo "no error reported"
npx tsc --noEmit --strict --noUncheckedIndexedAccess /tmp/probe.ts
```
