# Rust review

What to look for in Rust code, beyond `../CROSS_LANGUAGE.md`. The compiler already rules out
data races in safe code, use-after-free and null dereferences, so the review goes to what it
can't see: panics, logic, `unsafe`, async behaviour, API shape and cost. `PATTERNS.md` has the
fix for the common items, `TOOLING.md` the commands.

## Before you start

- **Edition and minimum supported Rust version.** `edition` and `rust-version` in `Cargo.toml`,
  `rust-toolchain.toml`, the CI matrix. Don't suggest features newer than the MSRV: let-else
  needs 1.65, `std::sync::OnceLock` 1.70, `LazyLock` 1.80, async functions in traits 1.75.
- **Library or binary.** A library must not panic on bad input, must keep its public API and
  error types stable, and shouldn't force an async runtime, allocator or logger on its users.
  A binary may use `anyhow` and exit on error.
- **Lint and safety policy.** `[lints]` in `Cargo.toml`, `clippy.toml`, `#![deny(...)]`,
  `#![forbid(unsafe_code)]`, `deny.toml`. A change that adds `#[allow(...)]` needs a reason.
- **Features and targets.** Which `cfg` combinations exist (`no_std`, optional features,
  platforms)? Code behind a feature that CI doesn't build is unreviewed by the compiler.

## Panics and correctness

- **`unwrap()` and `expect()` on values that can fail at run time:** I/O, parsing, user input,
  network, lock acquisition, `env::var`, channel sends. In a library or a request handler this
  is a crash a caller can trigger. Propagate with `?`. Acceptable where failure is a programming
  error and the `expect` message states the invariant ("regex is a valid literal").
- **Indexing and slicing that can panic:** `v[i]`, `&s[a..b]`, `slice[..n]`, `split_at`,
  `HashMap[&key]`. Use `get`, `first`, `split_first`, pattern matching. Byte-range slicing of a
  `str` panics when the index is not on a `char` boundary: any non-ASCII input.
- **Integer arithmetic.** Overflow panics in debug builds and wraps silently in release
  (unless `overflow-checks` is set). For sizes, offsets, money, anything from input, use
  `checked_*`, `saturating_*` or `wrapping_*` explicitly. Division and remainder by zero always
  panic.
- **`as` casts** truncate, wrap or change sign without warning (`u64 as u32`, `i32 as usize`,
  `f64 as u8` saturates). Use `From`/`TryFrom` and handle the error.
- **`unreachable!()`, `todo!()`, `unimplemented!()`, `panic!()`** on paths input can reach.
- **`RefCell` double borrow:** `borrow_mut()` while another borrow is live panics at run
  time. Look for a borrow held across a call that re-enters.
- **Lock poisoning and `lock().unwrap()`:** one panic while holding the mutex makes every
  later `unwrap` panic too. Decide deliberately: recover the guard, or propagate.
- **Equality, ordering and hashing that disagree.** Hand-written `PartialEq`, `Hash`, `Ord`
  or `Borrow` must be consistent (`a == b` implies equal hashes; `Ord` total and consistent with
  `Eq`), or maps and sorts misbehave. Floats are not `Ord`; `partial_cmp().unwrap()` panics on
  NaN. Use `f64::total_cmp`.
- **Iteration order of `HashMap`/`HashSet`** is unspecified and varies per run: don't let it
  reach output, tests, hashes or anything that must be reproducible. Use `BTreeMap` or sort.
- **Drop order and temporaries.** A guard dropped too early (`let _ = lock.lock()` drops at
  once; `let _guard = …` holds), or held too long; a temporary's lifetime extending a lock
  through a whole `match` or `if let`.
- **`std::mem::forget`, leaked `Box`/`Rc` cycles,** `Rc<RefCell<…>>` graphs that never free.
- **Time:** `SystemTime` can go backwards; use `Instant` for durations and timeouts.
- **Environment mutation.** `std::env::set_var`/`remove_var` in a multi-threaded program is
  unsound on most platforms (and `unsafe` from the 2024 edition).

## Error handling

- **Errors discarded:** `let _ = fallible();`, `.ok();`, `if let Ok(x) = …` with no `else`,
  `.unwrap_or_default()` that turns a failure into an empty value. Each needs a reason.
- **Error types.** Libraries: a concrete error enum (often via `thiserror`), `#[non_exhaustive]`,
  implementing `std::error::Error` with `source()` set, so callers can match on it.
  Applications: `anyhow`/`eyre` with context. `Box<dyn Error>` or `String` as a library's public
  error type takes that choice away from callers.
- **Lost context.** `?` on an I/O error with no path, no operation, no input:
  "No such file or directory" with nothing else. Add `.context(...)`/`.map_err(...)`.
- **Panics as error handling** across a boundary that should return `Result`; `Result`
  returned where the only failure is a bug (then a panic with a clear message is right).
- **`# Errors` and `# Panics`** sections in the docs of public functions that can do either.
- **`main` and process exit:** `std::process::exit` skips destructors (buffered writers aren't
  flushed, temp files stay). Return `Result`/`ExitCode` from `main`.
- **`#[must_use]`** missing on functions whose result must not be ignored (builders, guards,
  `Result`-like types).

## Ownership and API design

- **Needless `clone()`** to satisfy the borrow checker: often a sign the function should
  borrow, or the data should be restructured. In hot paths it is a cost; anywhere it can hide a
  logic bug (mutating the copy).
- **Parameter types.** `&String`, `&Vec<T>`, `&Box<T>` force a specific owner on callers; take
  `&str`, `&[T]`, `&T`. Take `impl AsRef<Path>` for paths, `impl Into<String>` when the function
  stores the value, `impl IntoIterator` instead of `&Vec`.
- **Return types.** Returning `Vec` where an iterator would do, or a reference where the caller
  needs ownership; `Option<&T>` rather than `&Option<T>`; `impl Trait` hiding a type the caller
  must name.
- **Visibility.** `pub` on items that are internal; `pub` struct fields that freeze the
  layout. Prefer `pub(crate)` and constructor functions. Public enums and structs that will grow
  should be `#[non_exhaustive]`.
- **Semver hazards** in a published crate: adding a variant or field to an exhaustive public
  type, changing a trait's required methods, tightening bounds, leaking a dependency's types in
  the public API, removing an auto trait (`Send`/`Sync`) by adding a field.
- **Invalid states representable:** booleans and `Option`s that only make sense in some
  combinations (use an enum); raw `String`/`u64` for values with rules (use a newtype that
  validates on construction).
- **Trait implementations expected of public types:** `Debug` always; `Clone`, `PartialEq`,
  `Eq`, `Hash`, `Default`, `Display`, `From`/`TryFrom` where meaningful. `Debug` on a type
  holding secrets should redact them.
- **`Arc<Mutex<T>>` by reflex** where ownership, a channel, an atomic or `RwLock` would be
  simpler; `Rc<RefCell<T>>` moving borrow errors to run time.
- **Lifetimes and generics** more complicated than the problem: named lifetimes that elision
  covers, generic parameters with one instantiation, trait objects where an enum is closed.
- **Macros** where a function or generic would do.

## Unsafe code

Review every line of `unsafe` as if a memory-safety bug is present until shown otherwise.

- **Every `unsafe` block has a `// SAFETY:` comment** that states why each requirement of the
  operation holds here, and every `unsafe fn` and `unsafe trait` has a `# Safety` section
  stating what the caller must guarantee. Check the comment against the code and the callee's
  documented contract.
- **The block is as small as possible,** and a safe wrapper can't be misused to cause
  undefined behaviour from safe code (soundness): bounds, alignment, lifetimes, thread-safety
  are all enforced by the wrapper's types and checks.
- **Common undefined behaviour:** creating a reference from a null, dangling or misaligned
  pointer; two live `&mut` to the same data, or `&mut` aliasing `&`; reading uninitialised
  memory (`MaybeUninit::assume_init` too early, `mem::uninitialized`, `Vec::set_len` past
  initialised elements); `slice::from_raw_parts` with a wrong length or lifetime; invalid values
  (`bool` other than 0/1, an invalid `char` or enum discriminant, e.g. via `transmute`);
  `str::from_utf8_unchecked` on unvalidated bytes; data races through raw pointers.
- **`unsafe impl Send`/`Sync`:** what makes it true? Is every field safe to share or move
  across threads, including through interior pointers?
- **`transmute`:** almost always replaceable (`to_ne_bytes`, `from_bits`, `as` pointer casts,
  `bytemuck`/`zerocopy`). Layout assumptions need `#[repr(C)]` or `#[repr(transparent)]`.
- **FFI:** `extern` signatures that match the C declaration; `#[repr(C)]` on shared types;
  who frees what, with which allocator; null checks on incoming pointers;
  `CString::new(...).unwrap().as_ptr()` leaving a dangling pointer when the temporary drops;
  panics must not unwind out of an `extern "C"` function (wrap in `catch_unwind` where it must
  be reported instead of aborting).
- **Was it run under Miri** (`cargo miri test`) and with sanitizers where FFI is involved?

## Concurrency and async

- **A `std::sync` lock guard held across `.await`.** The future becomes non-`Send`, or the
  task parks while holding the lock and deadlocks other tasks. Scope the guard so it drops
  before awaiting, or use an async mutex when the lock must span the await.
- **Blocking in async code:** `std::thread::sleep`, `std::fs`, blocking network or database
  clients, heavy CPU work, `std::sync::mpsc::recv`. It stalls an executor thread. Use the async
  equivalent or `spawn_blocking`.
- **Detached tasks.** `tokio::spawn` whose `JoinHandle` is dropped: panics and errors go
  nowhere, and the task outlives shutdown. Keep the handle, use a `JoinSet`, and handle
  `JoinError`.
- **Cancellation safety.** Any `.await` is a point where the future may be dropped
  (`select!`, timeouts, client disconnects). State half-updated before an await, or data read
  from a stream and held only in a local, is lost. Check each `select!` branch.
- **Unbounded queues and fan-out:** `unbounded_channel`, spawning a task per item with no
  limit, `FuturesUnordered` fed without backpressure. Use bounded channels and a semaphore.
- **No timeouts** on network operations (`tokio::time::timeout`, client-level timeouts).
- **Lock ordering** across code paths; locks held while calling out to user code or doing I/O.
- **Atomics:** `Ordering::Relaxed` used for anything other than a counter nobody synchronises
  on; separate `load` then `store` where `fetch_add`/`compare_exchange` is needed.
- **Async runtime leakage in a library:** a hard dependency on one runtime, or a call to
  `block_on` inside async code (panics or deadlocks).
- **Shared state initialisation:** hand-rolled `static mut` or double-checked locking in place
  of `OnceLock`/`LazyLock`.

## Security

- **`unsafe`** (above) is the main source of memory-safety vulnerabilities.
- **Untrusted sizes:** a length read from input used to allocate (`Vec::with_capacity(n)`,
  `vec![0; n]`) or to index, with no upper bound; arithmetic on it that can overflow.
- **Deserialisation of untrusted data:** no limit on size, depth or collection length;
  `#[serde(deny_unknown_fields)]` where strictness matters; untagged enums accepting more than
  intended.
- **Path traversal:** `base.join(user_path)` replaces `base` entirely when `user_path` is
  absolute, and `..` escapes. Canonicalise and check `starts_with(base)`.
- **Command execution:** `Command::new("sh").arg("-c").arg(format!(…))` reintroduces shell
  injection; even without a shell, user input starting with `-` is an option to the program.
- **SQL built with `format!`.** Use bound parameters (`sqlx::query!`, `.bind`, diesel's DSL).
- **Secrets:** printed through `Debug`/`Display`, kept in `String` after use (consider
  `zeroize`/`secrecy`), compared with `==` (use `subtle::ConstantTimeEq` or the crypto
  library's verify).
- **TLS verification disabled** (`danger_accept_invalid_certs(true)` and similar).
- **Randomness:** a non-cryptographic generator or a fixed seed for tokens and keys.
- **Dependencies:** new crates checked (`cargo audit`, `cargo deny`), `build.rs` and proc-macro
  crates run code at build time, `git` dependencies pinned to a revision, `Cargo.lock`
  committed for binaries.

## Performance

Only where it matters; ask for a benchmark before accepting a complicated optimisation.

- **Allocation in hot loops:** `to_string()`/`to_owned()`/`format!`/`clone()`/`collect()` per
  iteration; a `Vec` or `String` grown without `with_capacity` when the size is known;
  `collect::<Vec<_>>()` only to iterate again.
- **Unbuffered I/O:** `File` read or written in small pieces without `BufReader`/`BufWriter`;
  `println!` in a loop (locks and flushes per line: lock `stdout` once). A `BufWriter` must be
  flushed explicitly to see errors (drop ignores them).
- **Passing large values by value,** or returning them through many layers, where a
  reference or `Box` would do; `Box<dyn Trait>` in an inner loop where a generic fits.
- **Wrong collection:** `Vec::contains`/`remove(0)`/`insert(0, …)` in a loop; `Vec` as a
  queue (use `VecDeque`); linear search where a map or set is needed.
- **Strings:** repeated `chars().nth(i)` (linear each time), `+` concatenation in loops,
  compiling a `Regex` inside a loop or function called often (build once in a `LazyLock`).
- **Async:** awaiting independent futures one by one instead of `join!`/`try_join!`; a lock
  held over slow work.
- **Build profile assumptions:** benchmarks or production run without `--release`.

## Tests and documentation

- Unit tests in `#[cfg(test)] mod tests`, integration tests in `tests/` using only the public
  API; doc examples that compile and run (`cargo test --doc`).
- Error paths tested, not only `Ok`; `#[should_panic(expected = "…")]` rather than bare
  `#[should_panic]`.
- Property tests or fuzzing (`proptest`, `cargo fuzz`) for parsers, codecs and anything taking
  untrusted bytes; Miri for `unsafe`.
- Tests that depend on `HashMap` order, wall-clock time, a fixed port, or shared global state
  across tests (tests run in parallel by default).
- Every feature combination that is supported is built and tested in CI.
- Public items documented; `#![warn(missing_docs)]` for libraries.

## Usually not worth a finding

- Formatting and anything `cargo fmt` or the project's clippy configuration settles.
- A `clone()` of something small on a cold path.
- `match` against `if let`, explicit loops against iterator chains, when both are clear.
- `unwrap()` in tests, examples and build scripts.
