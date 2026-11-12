# Rust fix patterns

Before/after pairs for the findings that come up most. Use them to shape a suggested change;
adapt names and error types to the crate under review, and check its minimum supported Rust
version (noted where a fix needs a recent one). Crates named here (`thiserror`, `anyhow`,
`tokio`) are examples: use what the project already depends on.

## Propagate instead of `unwrap`

```rust
// Before: a missing or malformed file crashes the process
fn load_config(path: &Path) -> Config {
    let text = fs::read_to_string(path).unwrap();
    toml::from_str(&text).unwrap()
}
```

```rust
// After
fn load_config(path: &Path) -> Result<Config, ConfigError> {
    let text = fs::read_to_string(path).map_err(|source| ConfigError::Read {
        path: path.to_owned(),
        source,
    })?;
    toml::from_str(&text).map_err(|source| ConfigError::Parse {
        path: path.to_owned(),
        source,
    })
}
```

## A library error type

```rust
// Before: callers can't match on the failure
pub fn parse(input: &str) -> Result<Document, Box<dyn std::error::Error>> {
    todo!()
}
```

```rust
// After (thiserror shown; a hand-written impl of std::error::Error works the same)
#[derive(Debug, thiserror::Error)]
#[non_exhaustive]
pub enum ParseError {
    #[error("unexpected end of input at byte {offset}")]
    UnexpectedEof { offset: usize },
    #[error("invalid number {text:?} at byte {offset}")]
    InvalidNumber {
        text: String,
        offset: usize,
        #[source]
        source: std::num::ParseIntError,
    },
}

pub fn parse(input: &str) -> Result<Document, ParseError> {
    todo!()
}
```

## Context on application errors

```rust
// Before: the user sees only "No such file or directory (os error 2)"
let manifest = fs::read_to_string(&path)?;
```

```rust
// After (anyhow)
use anyhow::Context as _;

let manifest = fs::read_to_string(&path)
    .with_context(|| format!("reading manifest {}", path.display()))?;
```

## Indexing and slicing that can't panic

```rust
// Before: panics on an empty slice, a short line, or a multi-byte character
let first = items[0];
let code = &line[0..3];
```

```rust
// After
let Some(first) = items.first().copied() else {
    return Err(Error::Empty);
};
let code = line.get(0..3).ok_or(Error::LineTooShort)?;
```

`let … else` needs Rust 1.65; before that, use `match`, or `ok_or(...)` with `?`.

## Checked arithmetic and conversions

```rust
// Before: wraps in release builds; `as` truncates silently
let total = count * item_size + header_len;
let len = total as u32;
```

```rust
// After
let total = count
    .checked_mul(item_size)
    .and_then(|n| n.checked_add(header_len))
    .ok_or(Error::SizeOverflow)?;
let len = u32::try_from(total).map_err(|_| Error::SizeOverflow)?;
```

## Borrowed parameters

```rust
// Before: forces callers to own a String and a Vec
fn contains_tag(tags: &Vec<String>, wanted: &String) -> bool {
    tags.iter().any(|t| t == wanted)
}
```

```rust
// After: accepts &Vec<String>, arrays, slices, &String and string literals
fn contains_tag(tags: &[String], wanted: &str) -> bool {
    tags.iter().any(|t| t == wanted)
}
```

## Borrow instead of cloning

```rust
// Before: clones every record to read one field
fn total_bytes(records: &[Record]) -> u64 {
    records.to_vec().into_iter().map(|r| r.size).sum()
}
```

```rust
// After
fn total_bytes(records: &[Record]) -> u64 {
    records.iter().map(|r| r.size).sum()
}
```

## Make invalid states unrepresentable

```rust
// Before: `connected: true` with `session: None` is constructible
struct Client {
    connected: bool,
    session: Option<Session>,
    last_error: Option<String>,
}
```

```rust
// After
enum Client {
    Disconnected,
    Connected { session: Session },
    Failed { error: String },
}
```

## Validating newtype

```rust
// Before: any string is accepted wherever an email is expected
fn send_invite(email: String) -> Result<(), SendError> {
    todo!()
}
```

```rust
// After
#[derive(Debug, Clone, PartialEq, Eq, Hash)]
pub struct Email(String);

impl TryFrom<String> for Email {
    type Error = InvalidEmail;

    fn try_from(raw: String) -> Result<Self, Self::Error> {
        match raw.split_once('@') {
            Some((local, domain)) if !local.is_empty() && domain.contains('.') => Ok(Self(raw)),
            _ => Err(InvalidEmail(raw)),
        }
    }
}

fn send_invite(email: &Email) -> Result<(), SendError> {
    todo!()
}
```

## A documented `unsafe` block

```rust
// Before: no stated reason the index is in bounds
let value = unsafe { *self.buf.get_unchecked(self.pos) };
```

```rust
// After: prefer the safe form unless a benchmark shows the check matters
let value = *self.buf.get(self.pos).ok_or(Error::OutOfBounds)?;
```

If the unchecked access stays, state the invariant and check it in debug builds:

```rust
debug_assert!(self.pos < self.buf.len());
// SAFETY: `pos` is only advanced by `advance()`, which returns an error instead of
// moving past `buf.len()`, and `buf` is never shortened. So `pos < buf.len()` here.
let value = unsafe { *self.buf.get_unchecked(self.pos) };
```

## A pointer that outlives its `CString`

```rust
// Before: the CString is dropped at the end of the statement; `ptr` dangles
let ptr = CString::new(name).unwrap().as_ptr();
unsafe { ffi::set_name(handle, ptr) };
```

```rust
// After: the owner lives until the call returns
let c_name = CString::new(name).map_err(|_| Error::NameContainsNul)?;
// SAFETY: `handle` is a live handle from `ffi::open`, and `c_name` is a valid
// NUL-terminated string that outlives this call; `set_name` copies it.
unsafe { ffi::set_name(handle, c_name.as_ptr()) };
```

## Lock guard dropped before `.await`

```rust
// Before: the std MutexGuard is held across the await
async fn refresh(cache: &Mutex<Cache>, client: &Client) -> Result<(), Error> {
    let mut guard = cache.lock().unwrap();
    let fresh = client.fetch(guard.key()).await?;
    guard.store(fresh);
    Ok(())
}
```

```rust
// After: read under the lock, await without it, then write under the lock
async fn refresh(cache: &Mutex<Cache>, client: &Client) -> Result<(), Error> {
    let key = {
        let guard = cache.lock().unwrap_or_else(PoisonError::into_inner);
        guard.key().to_owned()
    };
    let fresh = client.fetch(&key).await?;
    cache
        .lock()
        .unwrap_or_else(PoisonError::into_inner)
        .store(fresh);
    Ok(())
}
```

Another task may update the cache between the two critical sections; if that matters, use an
async mutex held across the await, or re-check before storing.

## Blocking work off the async executor

```rust
// Before: stalls an executor thread while hashing
async fn verify(password: String, hash: String) -> Result<bool, Error> {
    Ok(argon2_verify(&password, &hash)?)
}
```

```rust
// After (tokio)
async fn verify(password: String, hash: String) -> Result<bool, Error> {
    let ok = tokio::task::spawn_blocking(move || argon2_verify(&password, &hash)).await??;
    Ok(ok)
}
```

The first `?` is the `JoinError` (the closure panicked or was cancelled), the second the
closure's own error; `Error` needs a `From` for both.

## Spawned tasks that are awaited

```rust
// Before: errors and panics in the tasks are never seen
for job in jobs {
    tokio::spawn(process(job));
}
```

```rust
// After (tokio)
let mut set = tokio::task::JoinSet::new();
for job in jobs {
    set.spawn(process(job));
}
while let Some(joined) = set.join_next().await {
    joined??;
}
```

## Timeout on a network call

```rust
// Before: waits as long as the peer likes
let response = client.get(url).send().await?;
```

```rust
// After (tokio)
let response = tokio::time::timeout(Duration::from_secs(10), client.get(url).send())
    .await
    .map_err(|_| Error::Timeout)??;
```

## Build once, reuse

```rust
// Before: compiles the regex on every call
fn is_ticket(s: &str) -> bool {
    Regex::new(r"^[A-Z]+-\d+$").unwrap().is_match(s)
}
```

```rust
// After (LazyLock: Rust 1.80+; `once_cell::sync::Lazy` before that)
static TICKET: LazyLock<Regex> =
    LazyLock::new(|| Regex::new(r"^[A-Z]+-\d+$").expect("TICKET is a valid regex literal"));

fn is_ticket(s: &str) -> bool {
    TICKET.is_match(s)
}
```

## Buffered output

```rust
// Before: one write system call per line
let mut file = File::create(path)?;
for row in rows {
    writeln!(file, "{row}")?;
}
```

```rust
// After
let mut out = BufWriter::new(File::create(path)?);
for row in rows {
    writeln!(out, "{row}")?;
}
out.flush()?; // drop would ignore a failed final write
```

## Deterministic output from a map

```rust
// Before: order differs from run to run
for (name, count) in &counts {
    println!("{name}: {count}");
}
```

```rust
// After
let mut entries: Vec<_> = counts.iter().collect();
entries.sort_unstable_by_key(|(name, _)| name.as_str());
for (name, count) in entries {
    println!("{name}: {count}");
}
```

Or keep the data in a `BTreeMap` if it is always wanted in order.

## Tests for the error path

```rust
// Before: only the happy path, and a panic test that passes on any panic
#[test]
#[should_panic]
fn rejects_bad_input() {
    parse("12x").unwrap();
}
```

```rust
// After
#[test]
fn rejects_trailing_garbage() {
    let err = parse("12x").unwrap_err();
    assert!(matches!(err, ParseError::InvalidNumber { offset: 0, .. }), "got {err:?}");
}
```
