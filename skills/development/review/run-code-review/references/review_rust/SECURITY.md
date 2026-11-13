# Rust security review

The security scope for Rust code. It is read for the security pass of a full review, and on
its own, with `WISDOM.md`, when the review runs with `-s`/`--security`. Rate findings with
`../SEVERITY.md` and report them with `../REPORT_TEMPLATE.md`.

## Scope

In scope: memory safety in `unsafe` code and FFI, panics and resource exhaustion reachable
from input, injection, file and path handling, cryptography and randomness, secrets,
transport security, authorisation logic visible in the code, and the crates and build
scripts the change adds.

Establish first:

- **What the code is.** A network service, a parser for untrusted bytes, a CLI, a library, a
  kernel or embedded component. A panic is a nuisance in a CLI and a denial of service in a
  server.
- **Where `unsafe` is,** in this crate and in what the change calls. Safe Rust rules out
  memory corruption; it does not rule out logic errors, panics, leaks or injection.
- **Who controls each input,** and what it reaches. Name the attacker and the path.

## Where untrusted data enters

- Network bytes, HTTP requests (extractors in axum, actix-web, rocket, warp), WebSocket and
  gRPC messages, queue messages.
- Files, archives and their member names; data handed to a parser or decoder.
- `std::env::args`, `std::env::var`, standard input, configuration a lower-privileged user
  can write.
- Pointers, lengths and strings received across FFI.
- Rows read from a database that an earlier request wrote.

## Checks

### Memory safety: `unsafe` and FFI

Review every `unsafe` block as if a memory-safety bug is present until shown otherwise.

- **Every `unsafe` block states why it is sound** (a `// SAFETY:` comment), and the comment
  matches the code and the callee's documented contract. An `unsafe fn` documents what the
  caller must guarantee.
- **Safe wrappers are sound:** no sequence of safe calls can cause undefined behaviour.
  Bounds, alignment, lifetimes and thread-safety are enforced by the wrapper's types and
  checks, not by the caller's good behaviour.
- **Lengths and offsets from input** reaching `slice::from_raw_parts`, `get_unchecked`,
  `Vec::set_len`, `ptr::copy`, pointer arithmetic or `transmute`.
- **Uninitialised or invalid values:** `MaybeUninit::assume_init` too early,
  `mem::uninitialized`, `mem::zeroed` for a type with invalid zero, `str::from_utf8_unchecked`
  on unvalidated bytes, an invalid `bool`, `char` or enum discriminant.
- **Aliasing:** two live `&mut` to the same data, or `&mut` alongside `&`, made through raw
  pointers.
- **`unsafe impl Send`/`Sync`** on a type with interior pointers or non-thread-safe state.
- **FFI:** signatures that match the C declaration, `#[repr(C)]` on shared types, null and
  length checks on incoming pointers, ownership and the allocator that frees, strings with
  interior NULs, and panics not unwinding out of `extern "C"` functions.
- **Evidence it was exercised:** `cargo miri test`, sanitizers for FFI, a fuzz target for
  parsers.

### Panics and resource exhaustion from input

- **Panics reachable by a remote caller:** `unwrap`, `expect`, indexing, slicing a `str` off
  a character boundary, integer division by zero, `RefCell` double borrow, on values derived
  from input.
- **Integer overflow:** wraps silently in release builds unless `overflow-checks` is on; a
  wrapped length or offset then passes a bounds check it should fail. Use `checked_*`,
  `saturating_*` or `try_from`; `as` truncates silently.
- **Untrusted sizes:** a length read from input used to allocate (`Vec::with_capacity(n)`,
  `vec![0; n]`) or to index, with no upper bound; arithmetic on it that can overflow.
- **Deserialisation of untrusted data:** no limit on size, depth or collection length;
  `#[serde(deny_unknown_fields)]` where strictness matters; untagged enums accepting more than
  intended.
- **Unbounded work:** recursion depth controlled by input (stack overflow aborts the
  process), regular expressions built from input with no size limit, unbounded channels and
  queues, no timeouts on network reads, decompression without an output cap.

### Injection and file handling

- **Path traversal:** `base.join(user_path)` replaces `base` entirely when `user_path` is
  absolute, and `..` escapes. Canonicalise and check `starts_with(base)`.
- **Command execution:** `Command::new("sh").arg("-c").arg(format!(…))` reintroduces shell
  injection; even without a shell, user input starting with `-` is an option to the program.
- **SQL built with `format!`.** Use bound parameters (`sqlx::query!`, `.bind`, diesel's DSL).
- **Archive extraction** that joins member names onto a target directory unchecked, and
  symlinks inside archives.
- **Time-of-check to time-of-use** on files: checking a path, then opening it by name.
- **Temporary files** created with predictable names; use the `tempfile` crate.

### Cryptography, randomness and secrets

- **Secrets:** printed through `Debug`/`Display`, kept in `String` after use (consider
  `zeroize`/`secrecy`), compared with `==` (use `subtle::ConstantTimeEq` or the crypto
  library's verify).
- **TLS verification disabled** (`danger_accept_invalid_certs(true)` and similar).
- **Randomness:** a non-cryptographic generator or a fixed seed for tokens and keys.
- **Hand-rolled cryptography,** nonce reuse with an AEAD, unauthenticated encryption, a fast
  hash for passwords (use `argon2`, `scrypt` or `bcrypt`).

### Web and service logic

- **Authorisation:** a handler missing the extractor, guard or middleware its neighbours
  use; an object fetched by an id from the request with no ownership check.
- **Missing limits:** no body size limit, no request timeout, no concurrency limit.
- **Server-side request forgery:** requests to a URL from input with no allow-list.
- **Error responses and logs** that include internal detail or secrets (`{:?}` on a
  request or configuration struct).

### Dependencies and build

- **Dependencies:** new crates checked (`cargo audit`, `cargo deny`), `build.rs` and proc-macro
  crates run code at build time, `git` dependencies pinned to a revision, `Cargo.lock`
  committed for binaries.
- **Feature flags** that switch on less-safe behaviour, and `[patch]` or `[replace]`
  sections pointing a dependency at an unreviewed source.

## Tools

| Purpose | Command | Notes |
| --- | --- | --- |
| Known-vulnerable crates | `cargo audit` | Needs `cargo-audit`. Report what the change adds or what is reachable. |
| Sources, bans, licences, advisories | `cargo deny check` | Needs `cargo-deny` and a `deny.toml`. |
| Where `unsafe` is | `git grep -nE '\bunsafe\b' -- '*.rs'` | `cargo geiger` counts it across dependencies where installed. |
| Undefined behaviour in tests | `cargo +nightly miri test` | Needs the nightly `miri` component. Slow; cannot run most FFI. |
| Lints | `cargo clippy --all-targets -- -W clippy::unwrap_used -W clippy::indexing_slicing -W clippy::arithmetic_side_effects -W clippy::undocumented_unsafe_blocks` | Noisy by design: use it to list candidates, then check which are reachable from input. |
| Fuzzing | `cargo fuzz list`, `cargo fuzz run <target>` | Needs `cargo-fuzz` and nightly. Check whether a parser the change touches has a target. |
| Secrets | `gitleaks detect --no-git --source .` | |
| Rough net for sinks | `git grep -nE 'Command::new\|format!\(.*(SELECT\|INSERT\|UPDATE\|DELETE)\|danger_accept_invalid\|from_utf8_unchecked\|transmute\|set_len\|from_raw_parts' -- '*.rs'` | Read each hit. |

## What this review does not establish

It reads code. It does not prove `unsafe` code sound, exercise it under Miri or a fuzzer
unless those were run, or test a running service. It does not replace an audit of
cryptographic code or a formal review of an `unsafe` abstraction: recommend those where the
change warrants them.
