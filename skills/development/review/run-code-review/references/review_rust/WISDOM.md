# Rust review wisdom

Read this before forming findings on Rust code, in a full review and in a security-only
one. **Constraints** are limits the review must stay within. **Traps** are things in the
language that mislead a reader. **Ditches** are the ways a review of this language goes off
the road. **Wisdom** is the judgement that keeps it on.

## Constraints

- **The minimum supported Rust version and the edition bound every suggestion.** Read
  `rust-version` and `edition` in `Cargo.toml` and the toolchain file before proposing
  let-else, `async fn` in traits, `LazyLock` or a newly stabilised API.
- **`no_std`, embedded and WebAssembly targets** rule out allocation, threads or parts of
  `std`. Check the target before suggesting `Vec`, `String` or `std::sync`.
- **Building runs code.** `build.rs` and procedural macros execute at compile time: don't
  build an untrusted crate outside a sandbox, and don't add dependencies to make a tool run.
- **Public API is a semver contract.** Changing a signature, adding a variant to an enum
  that is not `#[non_exhaustive]`, adding a required trait method, or tightening a bound is a
  breaking change for callers the diff does not show.
- **The compiler's guarantees stop at `unsafe` and at FFI.** Inside them, soundness is the
  author's and the reviewer's job.
- **A clean `clippy` is a lead about style and common mistakes,** not evidence of
  correctness.

## Traps

- **Integer overflow panics in debug builds and wraps in release** unless
  `overflow-checks` is set. Tests pass; production wraps.
- **`as` casts truncate, wrap or saturate silently.** `u64 as u32` drops bits; `-1i32 as
  u32` is `4294967295`; a float to integer cast saturates.
- **String slicing is by byte.** `&s[..n]` panics when `n` is inside a multi-byte character.
- **`Path::join` with an absolute argument replaces the base.**
- **Holding a `std::sync::Mutex` guard, or a `RefCell` borrow, across an `.await`** can
  deadlock or panic; the guard also makes the future not `Send`.
- **Dropping a future cancels it at its last `.await`.** In `select!` and with timeouts, work
  half-done at that point is abandoned: check that this leaves state consistent.
- **Blocking calls in async code** (`std::fs`, `std::thread::sleep`, a long computation)
  stall every task on that executor thread.
- **`mem::forget` and `Rc` cycles are safe,** so destructors are not guaranteed to run.
  Soundness must not depend on `Drop`.
- **`let _ = expr;` drops immediately; `let _guard = expr;` holds until the end of scope.**
- **Iterators are lazy.** `iter.map(side_effect);` without a consumer does nothing.
- **`HashMap` iteration order is unspecified** and differs between runs.
- **`#[derive(Debug)]` prints every field,** including the password.
- **`unwrap_or(expensive())` evaluates its argument always;** `unwrap_or_else` does not.
- **`PartialEq` on floats and `PartialOrd` are partial:** `NaN != NaN`, and sorting floats
  needs `total_cmp`.

## Ditches

- **Fighting over `clone()`.** A clone on a cold path is a fine price for simple ownership;
  ask for a measurement before asking for lifetimes.
- **Treating every `unwrap` as a defect.** In tests, in `main` set-up, and where an
  invariant is established just above, it is acceptable; on input-derived values it is not.
- **Skimming `unsafe` because it has a `SAFETY` comment.** Check the comment against the
  code.
- **Assuming "it compiles" means it is right.** The compiler checks memory and thread
  safety, not logic, arithmetic, panics, deadlocks or cancellation.
- **Proposing a redesign around traits and generics** in a review of a small change.
- **Ignoring the release profile:** overflow checks, `panic = "abort"`, and debug
  assertions change behaviour between the build that was tested and the one that ships.
- **Reviewing the crate and not its features.** Code behind a non-default feature may not
  have been compiled or tested at all.
- **Missing the semver break** in a library because the diff looks additive.

## Wisdom

- **Make invalid states unrepresentable.** An enum with data beats a struct of `Option`s and
  flags; a newtype beats a bare `String` or `u64` for an identifier.
- **Errors are values: propagate with `?`, add context, and reserve panics for bugs.** A
  library should not decide to abort its caller.
- **Parse at the boundary into a type that carries the proof,** then pass the type.
- **Keep `unsafe` small, wrapped in a safe API, and tested under Miri.**
- **Accept the general form** (`&str`, `&[T]`, `impl AsRef<Path>`) **and return the specific
  one.**
- **Prefer checked arithmetic and `try_from` wherever a number comes from outside.**
- **Measure before optimising,** and benchmark the release build.
- **Reproduce before you rate.** A failing test or a few lines on the playground settle most
  disagreements about panics and overflow.
- **Say what you did not check:** features not built, targets not compiled, Miri not run.
