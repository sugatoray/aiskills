# JavaScript tooling

Commands to run during a review, and how to read them. Follow `SKILL.md` step 4: run what the
project already has, don't install into it, and treat output as leads to confirm.

## Find what the project uses

```bash
node -e 'const p=require("./package.json");console.log(p.type||"commonjs",p.engines||{},p.scripts||{})'
ls package-lock.json yarn.lock pnpm-lock.yaml bun.lock bun.lockb 2>/dev/null   # which package manager
ls eslint.config.* .eslintrc* .prettierrc* biome.json* 2>/dev/null
```

Use the package manager that owns the lock file (`npm`, `yarn`, `pnpm`, `bun`), and prefer the
project's scripts (`npm run lint`, `npm test`) over calling tools directly: they carry the
project's options. If `node_modules` is missing, installing is a change to the working tree;
do it only with the user's agreement, and with the lock-file-respecting command (`npm ci`,
`pnpm install --frozen-lockfile`, `yarn install --immutable`).

## Checks

| Purpose | Command | Notes |
| --- | --- | --- |
| Syntax, no install needed | `node --check path/to/file.js` | Parses one file; reports syntax errors only. `.mjs`/`.cjs` are parsed as their module type. |
| Lint | `npm run lint` or `npx eslint <paths>` | `npx eslint` needs the project's ESLint installed. Look at errors in changed files first. |
| Format | `npx prettier --check <paths>` | Only mention if the project formats and the change doesn't. |
| Tests | `npm test`, or the runner directly: `npx vitest run <file>`, `npx jest <file>`, `node --test <file>` | Run the tests for the changed code first. |
| Coverage | `npx vitest run --coverage`, `npx jest --coverage`, `node --test --experimental-test-coverage` | Read uncovered lines in the changed files, not the total. |
| Known-vulnerable dependencies | `npm audit --omit=dev` (`pnpm audit --prod`, `yarn npm audit`) | Report what the change adds, or what is reachable from production code. |
| What a new dependency brings | `npm view <pkg> dependencies dist.unpackedSize time.modified` and `npm ls <pkg>` | Size, transitive dependencies, last publish. |
| Bundle impact (browser) | the project's build, then its analyser or the output sizes | Compare with the base branch when a dependency was added. |

For changed files only:

```bash
git diff --name-only --diff-filter=ACMR --merge-base origin/main -- '*.js' '*.mjs' '*.cjs' '*.jsx' \
  | xargs -r npx eslint
```

## Reading the output

- **`eslint-disable` comments added in the change** are something to review: which rule, and is
  there a reason?
- **A lint rule the project doesn't enable** can still be the basis of a finding if the code is
  really wrong (`no-floating-promises`, `eqeqeq`, `no-prototype-builtins`,
  `react-hooks/exhaustive-deps`); report it as your finding, not as a lint failure.
- **Lock-file churn:** a diff much larger than the manifest change usually means a different
  package-manager version or a full re-resolve; ask for it to be regenerated minimally.

## Reproducing a finding

`node -e` or a scratch file outside the repository is usually enough:

```bash
node -e 'console.log([10, 9, 1].sort(), 0.1 + 0.2 === 0.3, parseInt("12px"), 0 || 10, 0 ?? 10)'
```

For unhandled rejections and leaks, run the code with
`node --unhandled-rejections=strict --trace-warnings script.js`. For event-loop blocking,
`node --cpu-prof script.js` writes a profile that Chrome DevTools opens.
