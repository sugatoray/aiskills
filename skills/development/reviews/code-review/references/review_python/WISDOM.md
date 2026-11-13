# Python review wisdom

Read this before forming findings on Python code, in a full review and in a security-only
one. **Constraints** are limits the review must stay within. **Traps** are things in the
language that mislead a reader. **Ditches** are the ways a review of this language goes off
the road. **Wisdom** is the judgement that keeps it on.

## Constraints

- **The project's minimum Python version bounds every suggestion.** Read `requires-python`
  before proposing `match`, `X | Y` types, `tomllib`, `TaskGroup` or `itertools.batched`.
- **Don't import or execute code under review to see what it does** unless it is known to be
  safe: importing a module runs it. Read it, or run the project's own tests.
- **Don't install into the project's environment** or change its lock file to make a tool run.
- **A linter's verdict is a lead.** Each `ruff`, `mypy` or `bandit` hit is confirmed against
  the code before it becomes a finding, and a rule the project disabled is a decision.
- **Public API is a contract.** For a library, renaming a parameter, changing a default or a
  raised exception type breaks callers the diff does not show.
- **Type hints are not enforced at run time.** A function annotated `int` receives whatever
  the caller sends; validation at a trust boundary must be code.

## Traps

- **Default arguments are evaluated once.** `def f(x=[])` and `def f(t=time.time())` share one
  value across calls.
- **Closures bind names, not values.** Lambdas made in a loop all see the last value.
- **`except Exception` does not catch `KeyboardInterrupt`, `SystemExit` or, since 3.8,
  `asyncio.CancelledError`;** a bare `except:` catches all of them. Either can be the bug.
- **`a or b` is not "b if a is None".** It also replaces `0`, `""` and empty collections.
- **`is` on numbers and strings appears to work** for small integers and interned strings, in
  tests, and fails on real data.
- **`os.path.join("/base", "/etc/passwd")` returns `/etc/passwd`.** An absolute second part
  discards the first.
- **`bool` is a subclass of `int`,** so `isinstance(True, int)` is true and `True == 1`.
- **`datetime.now()` and `utcnow()` are naive.** Comparing naive with aware raises; mixing them
  silently is off by the UTC offset.
- **A generator runs when iterated, not when created,** so an exception surfaces far from the
  line that looks responsible, and a second pass yields nothing.
- **`round()` rounds half to even,** and floats are binary: `round(2.675, 2)` is `2.67`.
- **`subprocess.run` does not raise on a non-zero exit** unless `check=True`.
- **Mocks accept anything.** A `MagicMock` passes a call with the wrong arguments unless it
  was made with `autospec` or `spec`.

## Ditches

- **Reviewing style the formatter owns** while a logic error sits two lines below.
- **Reporting every `bandit` or `ruff` hit** without tracing whether input reaches it.
- **Demanding type hints or docstrings everywhere** in a codebase that does not use them.
- **Proposing a rewrite to a newer idiom** (dataclasses, `pathlib`, `match`, async) when the
  existing code is correct and consistent with the project.
- **Assuming a web framework's protection is on.** Check that autoescape, CSRF and the ORM's
  parameter binding are in use on this path, not that the framework offers them.
- **Flagging performance without a measurement** in code that runs once.
- **Treating a passing test suite as proof.** Look at what the tests assert, and whether the
  changed lines are executed at all.
- **Missing the caller.** A changed return type, a new exception or a now-`None` value breaks
  code outside the diff; search for uses before concluding.

## Wisdom

- **Follow the data.** Most serious Python findings are a value crossing a boundary unchecked:
  into a shell, a query, a path, a deserialiser, a template.
- **Explicit beats clever.** Prefer the suggestion a new team member can read over the one
  that saves two lines.
- **Errors should be loud and specific.** Catch the exception you can handle, where you can
  handle it; let the rest propagate with its traceback.
- **Mutability and sharing cause the subtle bugs:** module-level state, class attributes,
  default arguments, cached objects handed to callers.
- **Reproduce before you rate.** A three-line script that shows the failure turns "likely"
  into "confirmed" and ends the argument.
- **The standard library usually has it:** `secrets`, `hmac.compare_digest`, `shlex`,
  `pathlib`, `contextlib`, `functools`, `decimal`. Suggest it before a new dependency.
- **Say what you did not check:** the paths not executed, the versions not run, the
  environment you could not reproduce.
