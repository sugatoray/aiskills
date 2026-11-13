# Cross-language review

The questions for each review pass in `SKILL.md` step 5. They apply to every language, including
ones with no checklist of their own. Each language's `REVIEW.md` adds what is specific to it.

Work through the passes in order. Not every question applies to every change; the ones marked
**always** do.

## 1. Correctness

- **Always:** does the code do what the change says it does, for every case the description,
  issue or tests name? Trace at least one path end to end by hand.
- Boundaries: empty input, one element, the maximum, zero, negative, `null`/absent, duplicate,
  unsorted, very long, non-ASCII, mixed case, leading/trailing whitespace.
- Off-by-one: inclusive or exclusive range ends, `<` against `<=`, first and last iteration.
- Every branch: what happens in the `else`, the default case, the early return? Are all enum or
  union members handled, and what happens when a new one is added?
- Numbers: integer overflow and truncation, division by zero, rounding, floating point used for
  money or compared for equality, units (ms against s, bytes against MB) and time zones.
- Time: clock changes, daylight saving, leap days, "now" read more than once in one operation,
  durations measured with a wall clock instead of a monotonic one.
- State: is anything mutated that the caller still holds? Is shared or global state left
  consistent on every exit path, including the error path?
- Does the change break an existing caller? Check each call site of anything whose behaviour,
  signature, default or return shape changed.
- Dead or unreachable code, conditions that are always true or false, a variable assigned and
  never read: often the visible sign of a logic mistake.

## 2. Security

- **Always:** where does untrusted data enter (request, file, environment, queue message,
  database row written by someone else, third-party API), and is it validated before it is used?
- Injection: is input ever concatenated into SQL, a shell command, a file path, HTML, a regular
  expression, a template, a log line, an LDAP/XPath/NoSQL query, or a URL? Use the parameterised
  or escaping form.
- Authentication and authorisation: is the caller checked on **every** new endpoint, job and
  code path, on the server, per object (not only "is logged in" but "may act on this record")?
- Secrets: none in code, tests, fixtures, logs, error messages, URLs or command lines. Are they
  compared in constant time, and rotated without a deploy?
- Cryptography: standard library primitives only; no home-made schemes; a CSPRNG for tokens; no
  MD5/SHA-1 for security; passwords hashed with a password hash (argon2, scrypt, bcrypt).
- Files and paths: can input escape the intended folder (`..`, absolute paths, symlinks)? Are
  archives extracted safely? Are temp files created securely, with tight permissions?
- Network: TLS verification left on; outbound requests to user-supplied URLs restricted (SSRF);
  timeouts set; response sizes bounded.
- Deserialisation: no format that can execute code (pickle, unsafe YAML, Java serialisation) on
  untrusted input; size and depth limits on what is parsed.
- Dependencies: is a new dependency necessary, maintained, pinned, and from the expected source?
- Least privilege: does the code, token, role or query ask for more access than it needs?
- Resource exhaustion: can one request make the server allocate, loop, recurse or fan out
  without bound?
- Privacy: is personal data collected, logged or returned beyond what the feature needs?

## 3. Data integrity and concurrency

- Is a multi-step write atomic? If step two fails, what state is left, and who repairs it?
- Check-then-act: is anything read, decided on, then written, with a gap in which another
  request or process can change it (balance checks, "does it exist", file-exists-then-open)?
- Shared mutable state: which threads, tasks, processes or requests touch it, and what guards
  it? Is the lock held across I/O or an await? Is lock order consistent?
- Idempotency: what happens when this runs twice — on a retry, a redelivered message, a double
  click, a re-run job?
- Ordering: does the code assume messages, events or callbacks arrive in order, exactly once?
- Caches: when is an entry invalidated, and can a stale or another user's entry be served?
- Schema and data changes: are they backward compatible with the code that is running during
  the deploy, and reversible?

## 4. Failure handling and operability

- **Always:** for each call that can fail (I/O, network, parse, allocation, subprocess), what
  happens when it does? Swallowed, logged and continued, or propagated with context?
- Is a broad catch hiding programming errors along with the expected failure?
- Timeouts on every network and subprocess call; retries bounded, with backoff, only for
  operations that are safe to repeat.
- Cleanup on every path: files, connections, locks, temp files, child processes, transactions.
- Error messages: do they tell the operator what failed, with which input, and what to do —
  without leaking secrets or internals to an end user?
- Logging and metrics: can someone debug a failure of this code from what it emits? Is it
  logging too much (hot loop, payloads, personal data)?
- Rollout: can it be deployed and rolled back independently? Does it need a flag, a migration
  order, a config change? What happens to in-flight work?
- Degradation: when a dependency is down or slow, does this fail fast and clearly, or hang and
  take callers with it?

## 5. Design and interfaces

- Is this the right place for the change? Does it follow how the codebase already solves the
  same problem, or introduce a second way?
- Is each function, class and module doing one thing, at one level of abstraction?
- Is the complexity needed now? Flag speculative generality (options nobody uses, layers with one
  implementation) as readily as missing structure.
- Public surface: are new names, parameters, flags, endpoints, columns and config keys ones the
  project can live with for years? Is anything exposed that should be private?
- Compatibility: does it break existing callers, stored data, wire formats, CLI flags or config?
  If so, is there a version bump, a deprecation path and documentation?
- Coupling: does it reach into another module's internals, or add a dependency in the wrong
  direction? Are side effects (I/O, time, randomness, globals) separable from logic so the logic
  can be tested?
- Duplication: is the same knowledge now in two places that must change together?
- Configuration: are magic numbers and environment-specific values named and placed where they
  can be changed?

## 6. Performance and cost

Only flag what matters at the sizes this code will really see; say what size you assumed.

- Complexity: nested loops, or a linear search inside a loop, over data that grows.
- I/O in a loop: a query, request, file open or subprocess per item (N+1) that could be batched.
- Unbounded work: reading a whole file, table or response into memory; no pagination or limit;
  queues and caches with no maximum.
- Repeated work: the same value recomputed, the same data fetched or parsed more than once.
- Blocking: slow or synchronous work on a request path, UI thread or event loop.
- Concurrency limits: fan-out with no cap; a pool that can be exhausted.
- Cost: calls to paid or rate-limited services multiplied by a loop or a retry.
- Is a performance claim in the change backed by a measurement?

## 7. Tests

- **Always:** is there a test that fails without this change and passes with it? For a bug fix,
  is the bug itself reproduced by a test?
- Do tests cover the risky paths: errors, boundaries, concurrency, permissions — not only the
  happy path?
- Can each test fail? Look for assertions that are always true, tests that mock the thing under
  test, and tests with no assertion.
- Are they deterministic: no dependence on wall-clock time, random values, test order, network
  or a shared database without isolation?
- Do they test behaviour through the public interface, so a refactor doesn't break them?
- Are test names and failure messages enough to tell what broke?
- Was a test deleted, skipped or loosened to make the change pass?

## 8. Readability and maintainability

- Would an engineer new to this file understand it in one read? Where did you have to stop and
  work something out? That spot needs a better name, a smaller function or a comment.
- Names: do they say what the thing is or does, in the codebase's vocabulary, without misleading?
- Comments explain why, not what; none are stale, and no commented-out code is left behind.
- Functions short enough to see whole, with few parameters and no boolean flag that switches
  behaviour; nesting shallow (early returns over deep `if` pyramids).
- Consistency with the surrounding code and the project's style guide.
- Documentation: are README, API docs, changelog, examples and help text updated with behaviour?
- Leftovers: debug output, TODOs with no owner or issue, unused imports, variables and files.

## 9. Changes that are not code

Review these with the same care; they fail in production just as code does.

- **Configuration and infrastructure** (YAML, Terraform, Dockerfiles, CI workflows): secrets,
  permissions wider than needed, unpinned images and actions, missing resource limits, a change
  that applies to more environments than intended.
- **Dependency files and lock files:** does the lock file match the manifest? Was a version
  range loosened? Did an unrelated upgrade ride along?
- **Generated files:** regenerated by the tool, not edited by hand; the generator's input
  changed with them.
- **Documentation:** accurate against the code as changed; commands and examples still run.
