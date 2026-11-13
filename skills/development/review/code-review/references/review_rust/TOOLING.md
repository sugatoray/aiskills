# Rust tooling

Commands to run during a review, and how to read them. Follow `SKILL.md` step 4: run what the
project already has, don't install into it, and treat output as leads to confirm.

## Find what the project uses

```bash
grep -nE '^(edition|rust-version|\[lints|\[workspace|\[features)' Cargo.toml
ls rust-toolchain* clippy.toml .clippy.toml rustfmt.toml deny.toml .cargo/config.toml 2>/dev/null
grep -rnE 'cargo (clippy|test|fmt|deny|audit|miri|nextest|hack)' .github/workflows 2>/dev/null
grep -rn --include='*.rs' -cE '\bunsafe\b' . | grep -v ':0$'      # where the unsafe code is
```

Building compiles the dependencies and runs their build scripts and procedural macros: that is
code execution. For a change from an untrusted source, read `Cargo.toml`/`Cargo.lock` changes
and any `build.rs` before running `cargo`.

## Checks

| Purpose | Command | Notes |
| --- | --- | --- |
| Compiles, quickly | `cargo check --workspace --all-targets` | Add `--all-features`, or the feature sets CI uses. |
| Format | `cargo fmt --all -- --check` | Only mention if the project formats and the change doesn't. |
| Lint | `cargo clippy --workspace --all-targets --all-features -- -D warnings` | Use the project's flags if CI sets them. To look deeper on changed code, add `-W clippy::pedantic -W clippy::unwrap_used -W clippy::indexing_slicing -W clippy::string_slice -W clippy::arithmetic_side_effects` and report what is real as your own findings, not as lint failures. |
| Tests | `cargo test --workspace` (or `cargo nextest run`) | `--all-features` and `--no-default-features` when features gate code. `cargo test --doc` for doc examples (`nextest` doesn't run them). |
| One test, with output | `cargo test <name> -- --nocapture` | |
| Undefined behaviour in `unsafe` | `cargo +nightly miri test` | Needs the nightly `miri` component. Slow; run the tests that exercise the unsafe code. Doesn't cover FFI calls. |
| Vulnerable dependencies | `cargo audit` | Needs `cargo-audit`. Report what the change adds or what is reachable. |
| Licences, bans, duplicate versions, sources | `cargo deny check` | Needs `cargo-deny` and a `deny.toml`. |
| What a new dependency pulls in | `cargo tree -i <crate>` and `cargo tree -e features -p <crate>` | Who needs it, and with which features. |
| Feature combinations | `cargo hack check --feature-powerset --no-dev-deps` | Needs `cargo-hack`. |
| Public API changes (libraries) | `cargo semver-checks` | Needs `cargo-semver-checks`. |
| Docs build | `RUSTDOCFLAGS="-D warnings" cargo doc --no-deps` | Catches broken intra-doc links. |
| Minimum supported version | `cargo +<msrv> check --workspace` | If that toolchain is installed. |

## Reading the output

- **`#[allow(...)]` added in the change:** which lint, and why is it wrong here? Prefer
  `#[expect(...)]` (1.81+), which warns when the lint no longer fires.
- **Clippy `pedantic`/`restriction` hits** are leads. `unwrap_used` in a test is nothing; in a
  request handler it is a finding.
- **A test that passes only with `--test-threads=1`** shares state with another test.
- **Warnings turned off globally** (`#![allow(warnings)]`, `RUSTFLAGS=-Awarnings`) hide what
  the compiler already found.

## Reproducing a finding

A unit test that panics or fails is the strongest evidence; a scratch project outside the
repository works when you can't add one:

```bash
cargo new --quiet /tmp/probe && cd /tmp/probe
cat > src/main.rs <<'EOF_RS'
fn main() {
    let s = "héllo";
    println!("{:?}", s.get(0..2));   // None: byte 2 is inside 'é'
    println!("{}", &s[0..2]);        // panics
}
EOF_RS
cargo run --quiet
```

Run arithmetic and cast findings in both profiles: `cargo run` panics on overflow where
`cargo run --release` wraps.
