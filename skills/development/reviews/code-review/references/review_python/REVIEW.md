# Python review

What to look for in Python code, beyond `../CROSS_LANGUAGE.md`. Each item says why it matters;
`PATTERNS.md` has the fix for the common ones, `TOOLING.md` the commands.

## Before you start

- **Minimum Python version.** Read `requires-python` in `pyproject.toml` (or `python_requires`
  in `setup.cfg`/`setup.py`, the CI matrix, the `Dockerfile`). Every suggestion must run on it.
  Version gates that come up: `match` and `X | Y` at run time and `zip(strict=True)` need 3.10;
  `tomllib`, `asyncio.TaskGroup`, `asyncio.timeout` and `except*` need 3.11; `itertools.batched`
  and `typing.override` need 3.12.
- **What the project enforces.** `[tool.ruff]`, `[tool.mypy]`/`pyrightconfig.json`,
  `[tool.pytest.ini_options]`, `.pre-commit-config.yaml`. Don't hand-flag what these already
  check; do flag a rule switched off to get the change through.
- **What kind of code.** A library (public API, many callers, wide version support), a service
  (latency, concurrency, failure handling), a script or notebook (correctness and reproducibility
  over structure), or a data pipeline (silent wrong results are the main risk).

## Correctness

- **Mutable default arguments** (`def f(items=[])`, `={}`, `=set()`): created once at function
  definition and shared by every call. Same for a dataclass field or class attribute holding a
  list or dict. Use `None` and create inside, or `field(default_factory=list)`.
- **Truthiness where `None` is meant.** `if not x:` also catches `0`, `""`, `[]` and `0.0`.
  When "absent" and "empty/zero" differ, test `x is None`.
- **`is` used for value comparison.** `is` compares identity; use it only for `None`, `True`,
  `False` and sentinels. `x is 1000` or `s is "abc"` works by accident on small values.
- **Late-binding closures.** A lambda or nested function created in a loop sees the loop
  variable's final value, not the value at creation. Bind it: `lambda x=x: …` or
  `functools.partial`.
- **Mutating a list, dict or set while iterating over it.** Skips items or raises
  `RuntimeError`. Iterate over a copy, or build a new collection.
- **Iterators consumed twice.** A generator, `map`, `filter`, `zip` or open file yields nothing
  on the second pass. Suspect any iterator that is stored, passed to two consumers, or
  checked for emptiness and then used.
- **`zip` truncating silently** when its inputs differ in length. Use `strict=True` (3.10+)
  where equal length is an invariant.
- **Floats for money or exact comparison.** Use `decimal.Decimal` (constructed from `str`, not
  `float`) or integer minor units; compare floats with `math.isclose`.
- **Naive datetimes.** `datetime.now()` and `datetime.utcnow()` return values with no time zone;
  mixing them with aware ones raises, and treating a naive UTC value as local is silently
  wrong. `utcnow()` is deprecated from 3.12. Use `datetime.now(timezone.utc)`.
- **`open()` without `encoding=`** for text. The default depends on the platform's locale, so
  the same file reads differently on Windows. Pass `encoding="utf-8"`.
- **Shadowed names.** A variable called `list`, `id`, `type`, `input`, `file`, or a module file
  named like a standard-library or dependency module (`random.py`, `email.py`).
- **Class attribute used as instance state.** Assigned on the class, mutated through `self`:
  shared by all instances.
- **`__eq__` without `__hash__`,** or a hash computed from mutable fields: the object breaks as
  a dict key or set member. For value objects prefer `@dataclass(frozen=True)`.
- **Mixed return types.** A function that returns a value on one path and falls off the end
  (`None`) on another, or returns `False` for "not found" and a result otherwise.
- **String/bytes confusion,** and `str.strip("abc")` used as if it removed a prefix or suffix
  (it strips any of those characters). Use `removeprefix`/`removesuffix` (3.9+).
- **Integer semantics.** `/` is always float division; `//` floors toward negative infinity;
  `round()` rounds half to even.
- **Sorting and grouping.** `itertools.groupby` only groups adjacent items: the input must be
  sorted by the same key. `sorted` with mixed types raises.
- **Import-time side effects.** Network calls, file writes, argument parsing or heavy work at
  module level run on every import, including in tests. Guard entry points with
  `if __name__ == "__main__":`.

## Error handling

- **Bare `except:` or `except BaseException:`** also catches `KeyboardInterrupt`, `SystemExit`
  and, in async code, cancellation. Catch the specific exception.
- **`except Exception: pass`** or log-and-continue around a block that should not continue.
  Ask what state the program is in afterwards.
- **A `try` block that is too wide,** so the handler meant for one call also hides a bug
  (`KeyError`, `AttributeError`, `TypeError`) from another line.
- **Lost cause.** Raising a new exception inside `except` without `from err` (or `from None`
  when the cause is deliberately hidden) makes the traceback read "during handling, another
  exception occurred". Re-raise with a bare `raise`, not `raise err`, to keep the traceback.
- **`return`, `break` or `continue` inside `finally`:** discards any exception in flight.
- **`assert` for validation or authorisation.** Assertions are removed under `python -O`. Use
  them for internal invariants only; raise `ValueError`/`TypeError`/`PermissionError` for input.
- **Errors as return values** (`None`, `-1`, `False`) that the caller then forgets to check.
- **Logging errors:** use `logger.exception(...)` inside the handler to keep the traceback;
  don't both log and re-raise at every level (the same error appears five times).
- **Exception types:** a library should raise its own hierarchy rooted in one base class, not
  bare `Exception` or `RuntimeError`, so callers can catch it precisely.

## Resources

- **No context manager** on files, sockets, locks, database connections and cursors,
  `tempfile` objects, `ThreadPoolExecutor`, HTTP sessions and responses used for streaming.
  Without `with`, an exception leaks the resource.
- **No timeout.** `requests` and `urllib` wait forever by default; so do `subprocess.run`,
  `socket` operations, `queue.get`, `Lock.acquire` and `Thread.join`. Every one on a production
  path needs an explicit `timeout`.
- **`subprocess` without `check=True`** (or without inspecting `returncode`): a failed command
  goes unnoticed.
- **Temp files and folders** made by hand in `/tmp` instead of `tempfile.TemporaryDirectory()` /
  `NamedTemporaryFile` (or pytest's `tmp_path`).

## Security

- **`eval`, `exec`, `compile`, `__import__` or `importlib.import_module` on input.** For
  literals use `ast.literal_eval`; otherwise parse the input.
- **`pickle`, `marshal`, `shelve`, `joblib.load`, `torch.load` (without `weights_only=True`),
  `numpy.load(allow_pickle=True)` on data from outside the trust boundary:** arbitrary code
  execution. Use JSON or a schema-validated format.
- **`yaml.load` without `Loader=yaml.SafeLoader`** (use `yaml.safe_load`).
- **Shell injection.** `subprocess.*(…, shell=True)`, `os.system`, `os.popen` with any
  interpolated value. Pass an argument list without `shell=True`; if a shell is unavoidable,
  `shlex.quote` every interpolated piece.
- **SQL built with f-strings, `%` or `.format`.** Use the driver's placeholders; identifiers
  that can't be bound come from an allow-list.
- **Path traversal.** `os.path.join(base, user_value)` discards `base` when `user_value` is
  absolute, and `..` walks out. Resolve, then check containment
  (`resolved.is_relative_to(base)`, 3.9+).
- **Archive extraction.** `tarfile.extractall()` on an untrusted archive can write outside the
  target; pass `filter="data"` (3.12, and backported to earlier security releases). Check member
  names for `zipfile` too on old versions, and cap total extracted size.
- **`random` for tokens, passwords, reset links or session IDs.** Use `secrets`.
- **Hashing.** MD5/SHA-1 for security; a fast hash for passwords. Use `hashlib.scrypt`,
  `argon2-cffi` or `bcrypt`; compare secrets with `hmac.compare_digest`.
- **TLS switched off:** `verify=False`, `ssl._create_unverified_context`,
  `check_hostname = False`.
- **XML from untrusted sources** parsed with the standard library; use `defusedxml`.
- **`tempfile.mktemp`** (race between naming and opening). Use `mkstemp` or
  `NamedTemporaryFile`.
- **Template rendering with autoescape off,** or `Markup`/`mark_safe`/`|safe` on user input.
- **Requests to a user-supplied URL** with no allow-list (SSRF), and redirects followed blindly.
- **Secrets** in source, defaults, test fixtures, logs, exception messages or `repr` output.
- **Web frameworks:** `DEBUG = True` or a hard-coded `SECRET_KEY`; raw queries; a missing
  permission check on a view; CSRF exemption; mass assignment from request data into a model.

## Types

- Public functions and methods carry annotations for parameters and return value.
- **`Any` spreading:** an untyped dependency, `dict`/`list` without parameters, or a `cast` that
  silences the checker instead of narrowing. Each is a hole the checker stops looking through.
- **`# type: ignore` with no error code and no reason.** Should be
  `# type: ignore[code]  # why`.
- **`Optional` values used without a `None` check;** `X | None` returned where raising would be
  clearer for the caller.
- **Dicts passed around as records.** Prefer a `dataclass`, `TypedDict`, `NamedTuple` or
  pydantic model: the keys become checked.
- Accept the widest sensible type (`Iterable`, `Sequence`, `Mapping`) and return a concrete one.
- `Protocol` for structural interfaces; avoid `isinstance` ladders where a method would do.
- Data that crosses a boundary (HTTP, files, environment) is validated into a typed object at
  the boundary, not trusted because it was annotated.

## Concurrency and async

- **Blocking calls inside `async def`:** `time.sleep`, `requests`, `open().read()` on large
  files, `subprocess.run`, CPU-heavy loops. They stall the whole event loop. Use the async
  equivalent or `await asyncio.to_thread(...)`.
- **A coroutine called but not awaited** (`fetch()` instead of `await fetch()`): nothing runs.
- **`asyncio.create_task` with the result discarded.** The loop keeps only a weak reference, so
  the task can be garbage-collected mid-flight, and its exception is never seen. Keep a
  reference, or use `asyncio.TaskGroup` (3.11+).
- **`asyncio.gather` on a failure:** the other awaitables keep running; with
  `return_exceptions=True`, results must be checked for exceptions.
- **Swallowed cancellation.** `asyncio.CancelledError` derives from `BaseException` (3.8+);
  catching it without re-raising breaks timeouts and shutdown.
- **No limit on fan-out:** `gather` over thousands of requests. Bound it with a semaphore.
- **Threads and shared state.** The GIL does not make `x += 1`, check-then-set, or "read, modify,
  write" on a dict atomic. Guard shared state with a lock, or hand work over with `queue.Queue`.
- **Lazy initialisation and caches** written to from several threads without a lock.
- **`multiprocessing`:** arguments and results must be picklable; module-level state is not
  shared; `fork` after threads have started can deadlock.
- **Async and sync mixed:** `asyncio.run` or `loop.run_until_complete` called from code already
  running in a loop.

## Performance

- **A query per item** (ORM attribute access in a loop, `Model.objects.get` inside `for`). Use
  `select_related`/`prefetch_related`, `joinedload`, or one query with `IN`.
- **`x in some_list` inside a loop;** make it a `set` or `dict`.
- **String building with `+=` in a loop** over large data; use `"".join(parts)` or `io.StringIO`.
- **Whole file or result set in memory** (`f.read()`, `readlines()`, `list(cursor)`,
  `fetchall()`) when it could be iterated.
- **pandas/NumPy:** `iterrows`, `apply(axis=1)` or Python loops over rows where a vectorised
  operation exists; chained indexing (`df[a][b] = …`) that assigns to a copy; `inplace=True`
  assumed to save memory.
- **`functools.lru_cache`/`cache` on an instance method:** the cache holds `self` forever, and
  an unbounded cache keyed on request data is a memory leak.
- **Repeated work in a loop** that could be hoisted (compiled regex in a hot path, attribute
  lookups, re-reading config).
- **Logging f-strings in a hot path:** `logger.debug(f"…{big}")` formats even when the level is
  off. Use `logger.debug("… %s", big)`.

## Design and API

- A function that does several things, takes a boolean that selects between behaviours, or has
  more than about five parameters. Flags should be keyword-only (`def f(a, *, dry_run=False)`).
- Mutable module-level state, singletons and import-order dependence.
- Returning a bare tuple of more than two or three values instead of a named type.
- Inheritance used to share code where composition or a plain function would do.
- `__init__` that does I/O or real work, making the object hard to construct in tests.
- A public name (no leading underscore, or listed in `__all__`) that is really internal.
- `print` in library code instead of `logging`; logging configured at import in a library.
- Reimplementing the standard library: `pathlib`, `itertools`, `collections`
  (`Counter`, `defaultdict`, `deque`), `functools`, `contextlib`, `dataclasses`, `enum`.

## Tests

- pytest idioms: plain `assert`, `pytest.raises(Exc, match=…)`, `parametrize` for cases,
  `tmp_path` and `monkeypatch` instead of hand-rolled setup.
- **Mocks that replace the thing being tested,** or are patched where the name is defined
  instead of where it is looked up, so the patch has no effect.
- `Mock()` without `spec`/`autospec`: accepts any attribute or call, so a typo passes.
- Tests that depend on order, on the real clock, on the network or on a developer's machine.
- `assert` on a non-empty tuple (`assert (x, "message")`) is always true.
- Fixture scope wider than it should be (`session` scope holding mutable state).

## Packaging and dependencies

- A new dependency: needed? maintained? compatible licence? pinned in the lock file?
- Runtime dependencies declared in `pyproject.toml`, with lower bounds that match what the code
  uses; no upper caps without a reason in a library.
- Application lock file (`uv.lock`, `poetry.lock`, `requirements.txt` with hashes) updated with
  the manifest, and nothing unrelated upgraded alongside.

## Usually not worth a finding

- Formatting, quote style, import order, line length: the formatter's job.
- `%`/`.format` against f-strings in working code; `os.path` against `pathlib` in code that is
  consistent with its file.
- Missing type hints in a codebase that has none (suggest it once, as a `minor`, if at all).
- A comprehension against a loop, when both are clear.
