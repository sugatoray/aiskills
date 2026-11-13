# PowerShell review wisdom

Read this before forming findings on PowerShell, in a full review and in a security-only
one. **Constraints** are limits the review must stay within. **Traps** are things in the
language that mislead a reader. **Ditches** are the ways a review of this language goes off
the road. **Wisdom** is the judgement that keeps it on.

## Constraints

- **The edition and version bound every suggestion.** Windows PowerShell 5.1 and PowerShell
  7 differ: `??`, `?.`, the ternary operator, `&&`/`||`, `ForEach-Object -Parallel` and
  `-SkipCertificateCheck` exist only in 7. Read `#Requires -Version`, the manifest's
  `PowerShellVersion` and `CompatiblePSEditions`, and the CI images.
- **The platform matters.** Many cmdlets and all of WMI, the registry and COM are
  Windows-only; paths, case sensitivity and line endings differ elsewhere.
- **Never run a script under review to see what it does** unless it is known to be safe and
  you were told to. Parse it, read it, and run the project's Pester tests.
- **Don't install modules or change execution policy** on the machine to make a check run.
- **Exported functions and their parameters are a contract.** Renaming a parameter, changing
  its type or what a function writes to the pipeline breaks callers the diff does not show.
- **`PSScriptAnalyzer` output is a lead,** confirmed against the code before it becomes a
  finding; a suppressed rule is a decision that needs its justification.

## Traps

- **Most cmdlet errors are non-terminating.** `try { Get-Item $p } catch { }` does not catch
  a missing file unless `-ErrorAction Stop` or `$ErrorActionPreference = 'Stop'` is set.
- **Native commands don't throw.** A failed `git` or `robocopy` sets `$LASTEXITCODE` and the
  script carries on; `$?` is reset by the next statement.
- **Everything a function emits is its output.** An unassigned expression, a method call
  that returns a value (`$list.Add($x)` on an `ArrayList`), or a stray string all join the
  return value. `return $x` does not limit it.
- **The pipeline unwraps collections.** A function that returns one item gives a scalar,
  none gives `$null`, several give an array: `.Count` and indexing behave differently in each.
- **Comparison operators filter arrays.** `$array -eq $null` returns the matching elements,
  not a Boolean; put `$null` on the left.
- **`-eq`, `-like`, `-match` and `-contains` are case-insensitive** by default; use the `-c`
  forms where case matters, including when comparing secrets or identifiers.
- **`$null` in a `foreach` statement runs zero times, but `$null | ForEach-Object` runs
  once.**
- **Double quotes expand, single quotes don't;** `"$obj.Name"` expands only `$obj`, and needs
  `"$($obj.Name)"`.
- **An undefined or misspelled variable is `$null`,** silently, without
  `Set-StrictMode -Version Latest`.
- **`-Path` treats `[`, `]`, `*` and `?` as wildcards;** `-LiteralPath` does not.
- **Default output encoding differs:** `Out-File` and `>` write UTF-16 in 5.1 and UTF-8
  without a byte-order mark in 7.
- **`+=` on an array copies the whole array** each time; in a loop that is quadratic.
- **Operators convert the right operand to the type of the left:** `"10" + 1` is `"101"` and
  `1 + "10"` is `11`.
- **`Write-Host` output is not pipeline output,** and `Write-Output` inside a function
  changes what it returns.

## Ditches

- **Reviewing it as if it were bash or C#.** Error handling, output and collections follow
  PowerShell's rules; suggestions imported from another language are often wrong here.
- **Reporting every alias and positional parameter** while a non-terminating error is
  swallowed three lines below.
- **Flagging every `Write-Host`.** In an interactive script it is fine; in a function whose
  output is consumed it is a defect.
- **Assuming a `try`/`catch` works.** Check that the error inside it is terminating.
- **Ignoring the edition.** A fix that needs PowerShell 7 is no fix for a 5.1 script.
- **Missing destructive scope.** A script that loops over every mailbox, subscription or
  computer deserves a look at filters, `-WhatIf` support and what happens on partial failure.
- **Trusting tests that mock everything.** Pester mocks make it easy to assert on calls that
  would fail against the real system.
- **Skipping the pipeline YAML,** where the PowerShell that deploys to production often
  lives.

## Wisdom

- **Make errors terminating at the top, then handle the few you mean to.**
- **Check `$LASTEXITCODE` after every native command that matters.**
- **Emit objects, not formatted text,** and emit exactly one kind from each function.
- **Use `[CmdletBinding()]`, typed and validated parameters, and `SupportsShouldProcess`**
  for anything that changes state.
- **Pass arguments as arrays or splats,** never as a constructed command line.
- **Take `[pscredential]`, never a password string.**
- **Prefer `-LiteralPath` for paths that come from data.**
- **Reproduce in a scratch session before rating.** A three-line demonstration of a swallowed
  error or an unwrapped collection is the strongest evidence.
- **Say what you did not check:** editions and platforms not run, modules not available.
