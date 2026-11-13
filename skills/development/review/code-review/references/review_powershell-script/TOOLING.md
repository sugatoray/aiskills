# PowerShell tooling

Commands to run during a review, and how to read them. Follow `SKILL.md` step 4: run what the
project already has, don't install into it, and treat output as leads to confirm.

**Don't run a script under review to see what it does** unless you have read all of it and it
is safe in your environment. Parse and lint first; then `-WhatIf` (only if the script really
implements it), a container or a throwaway machine.

The commands below are PowerShell. From another shell, wrap them:
`pwsh -NoProfile -Command '<command>'` (PowerShell 7) or
`powershell -NoProfile -Command "<command>"` (Windows PowerShell 5.1). If no PowerShell is
installed, say so in the report and review by reading; the official container image
(`mcr.microsoft.com/powershell`) is an option when Docker is available and the user agrees.

## Find what the project uses

```powershell
$PSVersionTable.PSVersion                                   # what you are running
Get-ChildItem -Recurse -File -Include *.ps1, *.psm1, *.psd1 | Select-String -Pattern '^\s*#Requires' | Select-Object Path, Line
Get-ChildItem -Recurse -File -Include PSScriptAnalyzerSettings.psd1, *.build.ps1, build.ps1, psakefile.ps1, *.Tests.ps1 | Select-Object FullName
Get-Module -ListAvailable PSScriptAnalyzer, Pester | Select-Object Name, Version
```

## Checks

| Purpose | Command | Notes |
| --- | --- | --- |
| Syntax, without running | see "Parse without running" below | Reports parse errors only. Parse with the edition the script targets: 7-only syntax fails in 5.1. |
| Lint | `Invoke-ScriptAnalyzer -Path . -Recurse` | Needs the `PSScriptAnalyzer` module. Add `-Settings ./PSScriptAnalyzerSettings.psd1` if the project has one, `-Severity Warning, Error` to drop informational rules. |
| Compatibility with another edition | `Invoke-ScriptAnalyzer -Path . -Recurse -Settings <settings with PSUseCompatibleSyntax / PSUseCompatibleCommands>` | Configure the target versions (for example `5.1`, `7.4`) in the settings file. |
| Tests | `Invoke-Pester -Path ./tests -Output Detailed` | Pester v5 syntax. `-CI` sets an exit code and writes result files. Windows ships Pester 3.4, which doesn't run v5 tests. |
| Coverage | `Invoke-Pester -Path ./tests -CodeCoverage ./src/*.ps1` | Read the missed commands for the changed files. |
| Module manifest | `Test-ModuleManifest -Path ./MyModule/MyModule.psd1` | Checks that referenced files exist and fields parse. |
| What a module exports | `Import-Module ./MyModule -Force -PassThru \| Select-Object -ExpandProperty ExportedCommands` | Importing runs the module's top-level code: read it first. |
| Signature (where signing is required) | `Get-AuthenticodeSignature -FilePath ./script.ps1` | Windows only. |
| Dry run | `./script.ps1 -WhatIf` | Only meaningful if every state change is inside `ShouldProcess`. Check that before trusting it. |

## Parse without running

```powershell
$tokens = $null
$errors = $null
foreach ($file in Get-ChildItem -Recurse -File -Include *.ps1, *.psm1, *.psd1) {
    $null = [System.Management.Automation.Language.Parser]::ParseFile($file.FullName, [ref]$tokens, [ref]$errors)
    foreach ($e in $errors) {
        '{0}:{1}: {2}' -f $file.FullName, $e.Extent.StartLineNumber, $e.Message
    }
}
```

The same parser gives the syntax tree, which finds constructs more reliably than `grep`:

```powershell
$ast = [System.Management.Automation.Language.Parser]::ParseFile((Resolve-Path ./script.ps1), [ref]$null, [ref]$null)
$ast.FindAll({ param($node) $node -is [System.Management.Automation.Language.CommandAst] }, $true) |
    Where-Object { $_.GetCommandName() -in 'Invoke-Expression', 'iex' } |
    ForEach-Object { '{0}: {1}' -f $_.Extent.StartLineNumber, $_.Extent.Text }
```

## Reading PSScriptAnalyzer output

Rules that usually point at a real defect:

| Rule | Meaning |
| --- | --- |
| `PSAvoidUsingInvokeExpression` | Code built from strings: injection risk |
| `PSAvoidUsingPlainTextForPassword`, `PSAvoidUsingConvertToSecureStringWithPlainText`, `PSAvoidUsingUsernameAndPasswordParams` | Credential handling |
| `PSUsePSCredentialType` | A credential parameter not typed as `PSCredential` |
| `PSAvoidUsingEmptyCatchBlock` | Swallowed errors |
| `PSPossibleIncorrectComparisonWithNull` | `$null` on the right of `-eq` |
| `PSPossibleIncorrectUsageOfAssignmentOperator`, `PSPossibleIncorrectUsageOfRedirectionOperator` | `=` or `>` where a comparison was meant |
| `PSUseShouldProcessForStateChangingFunctions`, `PSShouldProcess` | Missing or half-implemented `-WhatIf` support |
| `PSAvoidAssignmentToAutomaticVariable` | Overwriting `$input`, `$args`, `$_` and others |
| `PSUseDeclaredVarsMoreThanAssignments` | Assigned and never read: often a typo |
| `PSAvoidGlobalVars` | Global state |
| `PSUseUsingScopeModifierInNewRunspaces` | A local variable used in a remote or parallel script block without `$using:` |
| `PSAvoidUsingCmdletAliases`, `PSAvoidUsingPositionalParameters` | Readability and portability; `minor` at most |
| `PSUseApprovedVerbs`, `PSUseSingularNouns` | Naming; matters for a module's public commands |
| `PSAvoidUsingWriteHost` | A finding only when the output is data |

The analyser does not check: unhandled non-terminating errors, unchecked `$LASTEXITCODE`,
stray pipeline output, array unrolling, encoding differences between editions, or path
handling. Read for those.

## Reproducing a finding

One-liners settle most questions about semantics:

```powershell
$items = 1, 2, 3
if ($items -eq $null) { 'null' } else { 'not null' }; $null -eq $items     # filtering versus testing
function Get-Bad { $l = [System.Collections.ArrayList]::new(); $l.Add('x'); 'result' }; (Get-Bad) -join '|'   # 0|result
try { Get-Item ./nope; 'continued' } catch { 'caught' }                    # continued
@{ a = @{ b = @{ c = @{ d = 1 } } } } | ConvertTo-Json -Compress           # truncated at depth 2
```

To see what a script would do without letting it act, run it in a container with no
credentials and no network, or stub the dangerous commands in Pester with `Mock`.
