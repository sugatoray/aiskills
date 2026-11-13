# TOML fix patterns

Before/after pairs for the findings that come up most. Use them to shape a suggested change,
adapted to what reads the file.

## Top-level keys before the first table

```toml
# Before: name is server.name, not a top-level key
[server]
port = 8080

name = "app"
```

```toml
# After
name = "app"

[server]
port = 8080
```

## Versions are strings

```toml
# Before: the float 3.1
python = 3.10
```

```toml
# After
python = "3.10"
```

## Quote keys that contain dots

```toml
# Before: four nested tables, 127 -> 0 -> 0 -> 1
[hosts]
127.0.0.1 = "localhost"
```

```toml
# After
[hosts]
"127.0.0.1" = "localhost"
```

## Literal strings for backslashes

```toml
# Before: \U starts a Unicode escape, so this is a syntax error
path = "C:\Users\app"
regex = "\d+"
```

```toml
# After: single quotes take the text as written
path = 'C:\Users\app'
regex = '\d+'
```

## One definition per table

```toml
# Before: [tool.ruff] twice is an error, and the second block is easy to miss in a long file
[tool.ruff]
line-length = 100

[tool.pytest.ini_options]
addopts = "-q"

[tool.ruff]
target-version = "py311"
```

```toml
# After
[tool.ruff]
line-length = 100
target-version = "py311"

[tool.pytest.ini_options]
addopts = "-q"
```

## Bounded, traceable dependencies (Cargo)

```toml
# Before
[dependencies]
serde = "*"
tool = { git = "https://example.com/tool.git" }
```

```toml
# After
[dependencies]
serde = "1.0"
tool = { git = "https://example.com/tool.git", rev = "4f2a9c1" }
```

In Cargo `"1.0"` means `>=1.0.0, <2.0.0`. Commit `Cargo.lock` for applications so the
reviewed versions are the built ones.

## Bounded dependencies and a pinned build backend (Python)

```toml
# Before
[build-system]
requires = ["setuptools"]

[project]
dependencies = ["requests", "internal-lib @ git+https://example.com/internal-lib.git"]
```

```toml
# After
[build-system]
requires = ["setuptools>=77,<81"]
build-backend = "setuptools.build_meta"

[project]
dependencies = [
  "requests>=2.32,<3",
  "internal-lib @ git+https://example.com/internal-lib.git@4f2a9c1",
]
```

Use the bounds the project's policy calls for; the point is that both ends are stated and
the git source names a commit.

## Keep safety checks on in release builds

```toml
# Before
[profile.release]
overflow-checks = false
panic = "abort"
debug = false
```

```toml
# After: state only what is intended, with the reason
[profile.release]
overflow-checks = true   # arithmetic on sizes from untrusted input
```

`overflow-checks` is already off by default in release builds; turning it on is the change
worth suggesting where arithmetic handles untrusted sizes. `panic = "abort"` skips unwinding
and destructors: confirm nothing relies on them before accepting it.

## Secrets by reference

```toml
# Before
[database]
password = "hunter2"
```

```toml
# After
[database]
password_env = "DATABASE_PASSWORD"
```

A secret that reached a commit is compromised: rotate it, then remove it.
