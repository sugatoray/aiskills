# PowerShell review

What to look for in PowerShell scripts and modules (`.ps1`, `.psm1`, `.psd1`), beyond
`../CROSS_LANGUAGE.md`, including PowerShell embedded in pipeline YAML. PowerShell looks like a
shell and behaves like a .NET language with its own rules for errors, output and collections:
most serious findings come from one of those three. `PATTERNS.md` has the fix for the common
items, `TOOLING.md` the commands.

## Before you start

- **Which PowerShell.** Windows PowerShell 5.1 (`powershell.exe`, .NET Framework, Windows
  only) and PowerShell 7+ (`pwsh`, .NET, cross-platform) differ. Look for `#Requires -Version`,
  `PowerShellVersion`/`CompatiblePSEditions` in the module manifest, and the CI image. 7-only
  features: `&&`/`||`, `??`/`?.`, the ternary `? :`, `ForEach-Object -Parallel`,
  `$PSNativeCommandUseErrorActionPreference`, `$IsWindows`/`$IsLinux`/`$IsMacOS` (these exist
  from 6.0; undefined in 5.1), and UTF-8 without BOM as the default encoding. Don't suggest them
  to a 5.1 script.
- **Which platforms.** On Linux and macOS: case-sensitive paths, `/` separators, no registry,
  no WMI/CIM on most systems, no COM, and aliases such as `ls`, `cat`, `curl` and `sort` are
  the native programs instead of cmdlets.
- **What kind of code.** An interactive helper, an automation script run unattended (CI,
  scheduled task, runbook), or a module with a public surface. Unattended scripts must fail
  loudly and never prompt.
- **What the project enforces.** `PSScriptAnalyzerSettings.psd1`, Pester tests, a build script
  (`build.ps1`, `psake`, `Invoke-Build`), signing requirements.

## Errors

- **Non-terminating errors pass through `try`/`catch`.** Most cmdlet failures
  (`Get-Item` on a missing path, `Remove-Item` denied) write an error and continue; `catch`
  only sees terminating errors. Expect `$ErrorActionPreference = 'Stop'` at the top of a
  script, or `-ErrorAction Stop` on each call whose failure matters. Inside an advanced
  function, prefer the per-call form so the caller's preference is respected.
- **Native commands don't throw.** `git`, `dotnet`, `az`, `robocopy`, `msbuild` report failure
  through `$LASTEXITCODE` only (PowerShell 7.4+ can turn that into an error with
  `$PSNativeCommandUseErrorActionPreference = $true`). Unchecked, a failed build or deploy step
  is followed by the next step. Know the tool's codes: `robocopy` returns 1–7 for success.
- **`$?` and `$LASTEXITCODE` read too late,** after another command has reset them.
- **Empty `catch {}`,** or a `catch` that writes a message and falls through. In unattended
  code, a swallowed error is a green run that did nothing. Re-throw with `throw` (keeps the
  original record) unless the error is expected and handled.
- **`-ErrorAction SilentlyContinue` / `Ignore`, `2>$null`, `$ErrorActionPreference =
  'SilentlyContinue'`** used to quieten output: they also hide the failure. If a missing item
  is expected, test for it (`Test-Path`) or catch the specific exception type.
- **Catching everything.** `catch { … }` with no type also catches bugs. Catch
  `[System.IO.FileNotFoundException]`, `[Microsoft.PowerShell.Commands.HttpResponseException]`
  and the like where the handling is specific.
- **`throw` with a bare string in a reusable function** gives callers nothing to match on;
  `Write-Error` in a function is non-terminating unless the caller says otherwise. For advanced
  functions use `$PSCmdlet.ThrowTerminatingError(...)` or `throw` a typed exception.
- **No `finally`** to release what was acquired: connections, `PSSession`s, temp files,
  mounted drives, changed location (`Push-Location`/`Pop-Location`), changed preferences.
- **Exit codes.** A script run by a scheduler or CI must end with a meaningful code:
  an uncaught terminating error exits with 1, but a non-terminating error or a failed native
  command leaves the exit code at 0 unless the script checks and calls `exit`.
- **`Set-StrictMode -Version Latest` absent:** a mistyped variable is `$null`, a missing
  property is `$null`, and the script continues with it.

## Output and the pipeline

- **Unintended output becomes part of the return value.** Anything not assigned or
  redirected goes to the pipeline: `$list.Add($x)` (returns an index for `ArrayList`,
  a bool for `HashSet`), `New-Item`, `$sb.Append(...)`, `[regex]::Match`, a bare expression.
  The function then returns an array of junk plus the intended value. Discard with
  `$null = …` or `[void]`. Check every function that callers assign from.
- **`return` is not the only output.** `return $x` emits `$x` *in addition to* everything
  already emitted.
- **`Write-Host` for data.** It writes to the host (information stream from 5.0), not the
  pipeline, so it can't be captured or piped as data. Fine for user-facing progress; wrong for
  results. Diagnostics belong in `Write-Verbose`, `Write-Warning`, `Write-Information`,
  `Write-Debug`; results in the pipeline.
- **`Format-*` inside a function** (`Format-Table`, `Format-List`) or `Out-String` returns
  formatting objects or text, not data. Emit objects; let the caller format.
- **Collection unrolling.** A function that outputs a one-element array returns a scalar;
  an empty array returns nothing (`$null`). Callers that use `.Count`, index, or `foreach`
  must wrap in `@(...)`, or the function documents its shape. `.Count` on a scalar throws
  under `Set-StrictMode`.
- **Objects, not strings.** Parsing the text output of one cmdlet with regex where its
  properties were available; building tables with string padding. Emit `[pscustomobject]` with
  named properties.
- **Function shape for pipeline input:** `ValueFromPipeline` without a `process {}` block
  handles only the last item.

## Correctness

- **Comparison operators:** `-eq`, `-ne`, `-gt`, `-lt`, `-like`, `-match`. `=` assigns (inside
  `if` too), `>` redirects to a file named after the right-hand side, `==` is a syntax error.
- **`$null` on the right:** `$x -eq $null` filters when `$x` is a collection (returns
  matching elements, so `if` is false for an array containing no nulls and true/false by
  accident otherwise). Write `$null -eq $x`.
- **Case-insensitive by default:** `-eq`, `-like`, `-match`, `-contains`, `-replace`,
  `switch`, and hashtable keys. Use `-ceq`, `-cmatch`, `-creplace`, or a case-sensitive
  dictionary where case matters (tokens, hashes, Linux paths).
- **`-contains`/`-in` against `-like`/`-match`:** `-contains` tests collection membership, not
  substring; `-match` is a regex (unescaped `.` and `\`), `-like` a wildcard.
- **`$Matches`** is only set by a successful scalar `-match`; after a failed one it holds the
  previous result.
- **Truthiness:** `0`, `''`, `$null`, and empty arrays are false; a one-element array takes
  its element's truth (`@(0)` is false, `@($false)` is false, but `@(0, 0)` is true).
  `if ($result)` on command output conflates "none", "zero" and "empty string".
- **Type coercion by the left operand:** `'5' + 5` is `'55'`, `5 + '5'` is `10`;
  `'10' -gt 9` compares as strings (false). Cast explicitly.
- **Strings.** Variables expand in double quotes only; a property or expression needs
  `$()`: `"$user.Name"` expands `$user` then appends `.Name`. `"$var:"` is parsed as a
  drive/scope-qualified name: write `"${var}:"`. The backtick is the escape character, and a
  trailing backtick for line continuation breaks on an invisible trailing space: use
  splatting.
- **`switch` runs every matching clause** unless each ends with `break`; on an array it
  iterates over the elements.
- **Scope.** A function reads variables from its caller's scope (dynamic scoping), so a typo
  silently picks up some outer value. Assignments are local unless `$script:`/`$global:` is
  used; `$global:` state is a finding. Script blocks run remotely or in parallel
  (`Invoke-Command`, `Start-Job`, `ForEach-Object -Parallel`) see no local variables without
  `$using:`.
- **Automatic variables overwritten:** `$input`, `$args`, `$_`/`$PSItem`, `$Matches`,
  `$Error`, `$Host`, `$PID`, `$Home`, `$PWD`, `$Event`, `$Sender`, `$this`, `$foreach`,
  `$switch` used as ordinary variable or parameter names.
- **Paths.** `-Path` interprets wildcards, so a file named `report[1].txt` isn't found: use
  `-LiteralPath` for paths that come from data. Build paths with `Join-Path`, not string
  concatenation. Locate sibling files with `$PSScriptRoot`, not the current location.
  .NET methods (`[IO.File]::ReadAllText('x.txt')`) resolve relative paths against the
  process's working directory, which `Set-Location` does not change: pass a full path.
- **Encoding.** In Windows PowerShell 5.1, `>` and `Out-File` write UTF-16LE,
  `Set-Content` writes the ANSI code page, and `Get-Content` reads a BOM-less UTF-8 file as
  ANSI. PowerShell 7 defaults to UTF-8 without BOM. A script that must behave the same on both
  passes `-Encoding` explicitly (and note `-Encoding utf8` in 5.1 adds a BOM).
- **`Get-Content` returns an array of lines** (one string for a one-line file, `$null` for an
  empty one); use `-Raw` for the whole text.
- **JSON.** `ConvertTo-Json` truncates below `-Depth` 2 by default (silently in 5.1, with a
  warning in 7): pass `-Depth`. A single-element array piped to `ConvertTo-Json` is serialised
  as a scalar: use `-InputObject` or `-AsArray` (7+). `ConvertFrom-Json` turns ISO date strings
  into `DateTime` in 7.
- **Culture.** Casts use the invariant culture (`[double]'1,5'` is `15`), while `-f`,
  `ToString()`, `Get-Date` and string-to-date parameter binding use the current one. Use the
  invariant culture and ISO 8601 for anything stored or exchanged.
- **`[datetime]` arithmetic in local time** across a daylight-saving change; use
  `[datetimeoffset]` or UTC (`(Get-Date).ToUniversalTime()`, `[datetime]::UtcNow`).
- **Remoting and serialisation.** Objects returned from `Invoke-Command`, jobs and
  `-Parallel` are deserialised copies: methods are gone and types are `Deserialized.*`.

## Functions and parameters

- **Advanced functions.** `[CmdletBinding()]` and a `param()` block with types, so common
  parameters (`-Verbose`, `-ErrorAction`) work and input is checked on entry.
- **Parameter validation in attributes,** not hand-written `if` blocks:
  `[Parameter(Mandatory)]`, `[ValidateNotNullOrEmpty()]`, `[ValidateSet(...)]`,
  `[ValidateRange(...)]`, `[ValidatePattern(...)]`, `[ValidateScript({...})]`. A mandatory
  parameter in an unattended script prompts and hangs when it is missing: fail instead (give
  it no interactive path, run with `-NonInteractive`).
- **State-changing functions support `-WhatIf`/`-Confirm`:**
  `[CmdletBinding(SupportsShouldProcess)]` and `if ($PSCmdlet.ShouldProcess($target, $action))`
  around each change, with `ConfirmImpact = 'High'` for destructive ones. Passing `-WhatIf` to a
  function that ignores it is how dry runs delete things.
- **Switches, not booleans:** `[switch]$Force`, not `[bool]$Force = $false`. Don't give a
  switch a default of `$true`.
- **Naming.** `Verb-Noun` with an approved verb (`Get-Verb`), singular noun, PascalCase
  parameters matching common names (`-Path`, `-Name`, `-Credential`, `-Force`).
- **`[OutputType()]`** declared, and one kind of object returned on every path.
- **Aliases and positional arguments in scripts** (`%`, `?`, `gci`, `select`, `ls`, `curl`,
  `wget`): harder to read, and several resolve to different commands on Linux or in 5.1
  (`curl` is `Invoke-WebRequest` in Windows PowerShell). Use full cmdlet and parameter names.
- **Long argument lists with backticks.** Use splatting (`@params`).
- **Comment-based help** (`.SYNOPSIS`, `.PARAMETER`, `.EXAMPLE`) on public functions.

## Security

- **`Invoke-Expression` (`iex`)** on anything containing a variable: command injection. Also
  `[scriptblock]::Create($string)`, `Add-Type` with interpolated source,
  `powershell -Command "… $var …"`, `Start-Process` with a constructed argument string, and
  `& $userSuppliedPath`. Call commands directly with arguments as an array or splat.
- **Download and run:** `iex (iwr …)`, `Invoke-RestMethod … | Invoke-Expression`, or
  installing from an unpinned URL. Download to a file, verify the hash (`Get-FileHash`) or
  signature (`Get-AuthenticodeSignature`), then run.
- **Credentials in the script:** passwords or tokens as literals, as plain `[string]`
  parameters, in `ConvertTo-SecureString -AsPlainText -Force` with a literal, or in command-line
  arguments (visible in process listings and logs). Take `[pscredential]`, read from a vault
  (SecretManagement, the CI system's secret store) or environment at run time.
- **Secrets leaking** into transcripts, `Write-Verbose`/`Write-Host`, error messages,
  `$PSBoundParameters` dumps, or `Export-Clixml` on non-Windows (where `SecureString` is not
  encrypted at rest).
- **TLS weakened:** `-SkipCertificateCheck`,
  `[Net.ServicePointManager]::ServerCertificateValidationCallback = { $true }`, forcing old
  protocol versions. (5.1 may need TLS 1.2 enabled explicitly; that is fine.)
- **Execution policy and signing bypassed:** `Set-ExecutionPolicy Bypass`/`Unrestricted` in
  a script, `-ExecutionPolicy Bypass` baked into scheduled tasks, `Unblock-File` on downloads.
- **Injection into query strings:** `-Filter` for Active Directory/LDAP, WQL in
  `Get-CimInstance -Query`, SQL in `Invoke-Sqlcmd -Query` built by string interpolation. Escape
  or parameterise (`-Variable`/`SqlParameter`).
- **Paths from input** used with `Remove-Item -Recurse -Force`, `Copy-Item`, `Expand-Archive`:
  validate, resolve and check containment; guard against an empty variable making the path a
  drive root.
- **Privilege.** `#Requires -RunAsAdministrator` where needed and nowhere else; no
  self-elevation with a constructed command line; scheduled tasks and services not run as
  SYSTEM by default.
- **Remoting:** `-Authentication Basic` over HTTP, `CredSSP`, `TrustedHosts = '*'`,
  unconstrained endpoints.

## Performance

- **`+=` on an array in a loop** copies the whole array each time (quadratic; improved in
  7.5 but still slower than the alternatives). Assign the loop's output
  (`$items = foreach (…) { … }`) or use `[System.Collections.Generic.List[T]]`. Same for
  string `+=`: use `-join` or `StringBuilder`.
- **Filter at the source.** `Get-ChildItem -Filter`, `Get-ADUser -Filter`,
  `Get-CimInstance -Filter`, `Get-WinEvent -FilterHashtable` instead of fetching everything
  and piping to `Where-Object`.
- **Pipeline overhead in hot loops:** `ForEach-Object`/`Where-Object` per element is much
  slower than the `foreach` statement or `.Where()`/`.ForEach()` for in-memory collections.
  For large streams the pipeline's low memory use is the point.
- **Repeated lookups by scanning:** `Where-Object` inside a loop over another collection.
  Build a hashtable keyed by the lookup value first.
- **Remote calls one at a time:** `Invoke-Command -ComputerName` accepts a list and fans
  out; a `foreach` over computers doesn't. `ForEach-Object -Parallel` (7+) needs
  `-ThrottleLimit` and `$using:`.
- **`Get-Content` on large files** without `-ReadCount`/`-Raw`, or `[IO.File]::ReadLines`.
- **`Write-Progress`, `Write-Host` or `Start-Sleep` in tight loops.**

## Modules

- Manifest (`.psd1`) lists `FunctionsToExport`, `CmdletsToExport` and `AliasesToExport`
  explicitly, not `'*'` (slower discovery, and leaks helpers); `RootModule`,
  `ModuleVersion`, `PowerShellVersion`, `CompatiblePSEditions`, `RequiredModules` are set and
  true.
- Public and private functions separated; nothing internal exported.
- No work at import time beyond defining functions; no changes to global state
  (`$ErrorActionPreference`, `$PSDefaultParameterValues`, location) that outlive the call.
- Dependencies pinned (`RequiredVersion`/`MaximumVersion` where reproducibility matters) and
  installed from a trusted repository.

## Tests

- Pester tests exist for logic and are in v5 form (`BeforeAll`, `Should -Be`); `Mock` is
  scoped, and asserted with `Should -Invoke`.
- File-system tests use `TestDrive:`; nothing touches real services or the real registry.
- Error paths are tested with `Should -Throw -ExpectedMessage`/`-ErrorId`.
- The script is exercised on each PowerShell edition and OS it claims to support.
- `PSScriptAnalyzer` runs in CI, with suppressions justified
  (`[Diagnostics.CodeAnalysis.SuppressMessageAttribute()]` with a `Justification`).

## Usually not worth a finding

- Brace and indentation style (`Invoke-Formatter`/the editor settles it).
- `foreach` against `ForEach-Object` on small collections.
- `Write-Host` in a script whose only purpose is interactive output.
- Aliases in a one-line interactive helper nobody else runs.
