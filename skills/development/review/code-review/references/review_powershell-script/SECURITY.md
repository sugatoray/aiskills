# PowerShell security review

The security scope for PowerShell scripts and modules (`.ps1`, `.psm1`, `.psd1`), including
PowerShell embedded in pipeline YAML. It is read for the security pass of a full review, and
on its own, with `WISDOM.md`, when the review runs with `-s`/`--security`. Rate findings with
`../SEVERITY.md` and report them with `../REPORT_TEMPLATE.md`.

## Scope

In scope: command and script injection, downloaded code, credentials and secrets, transport
security, execution policy and signing, query injection (LDAP, WQL, SQL), file and path
handling, privilege and elevation, and remoting configuration.

Establish first:

- **Who runs it, as what.** An administrator by hand, a scheduled task as SYSTEM, a CI agent
  with deployment credentials, an automation account in the cloud. PowerShell scripts often
  run with far more privilege than application code.
- **Which edition and platform.** Windows PowerShell 5.1 or PowerShell 7, Windows or not.
  Protections differ: `SecureString` is encrypted in memory only on Windows.
- **Who controls each input,** and what it reaches. Name the attacker and the path.

## Where untrusted data enters

- Parameters and `$args`, pipeline input, `Read-Host`, environment variables.
- Files the script reads: CSV, JSON, XML, `.psd1` data files, and their names.
- Responses from `Invoke-RestMethod` and `Invoke-WebRequest`, and from remoting sessions.
- Directory, registry and WMI/CIM values that a lower-privileged user can set (display
  names, descriptions, service paths).
- CI context: pull request titles, branch names, pipeline variables and parameters expanded
  into an inline script before PowerShell parses it.

## Checks

### Command and script injection

- **`Invoke-Expression` (`iex`)** on anything containing a variable: command injection. Also
  `[scriptblock]::Create($string)`, `Add-Type` with interpolated source,
  `powershell -Command "… $var …"`, `Start-Process` with a constructed argument string, and
  `& $userSuppliedPath`. Call commands directly with arguments as an array or splat.
- **Injection into query strings:** `-Filter` for Active Directory/LDAP, WQL in
  `Get-CimInstance -Query`, SQL in `Invoke-Sqlcmd -Query` built by string interpolation. Escape
  or parameterise (`-Variable`/`SqlParameter`).
- **Pipeline template expansion:** `$(variable)` in Azure Pipelines or `${{ }}` in GitHub
  Actions inside an inline script is pasted in before PowerShell runs. Pass the value through
  an environment variable and read `$env:NAME`.
- **`Import-Module`, dot-sourcing or `Invoke-Command -FilePath`** on a path a
  lower-privileged user can write, and module auto-loading from a writable directory on
  `$env:PSModulePath`.
- **Deserialisation:** `Import-Clixml` on a file from outside the trust boundary, and
  `ConvertFrom-Json`/`Import-PowerShellDataFile` output used as a command or path.

### Downloaded code and supply chain

- **Download and run:** `iex (iwr …)`, `Invoke-RestMethod … | Invoke-Expression`, or
  installing from an unpinned URL. Download to a file, verify the hash (`Get-FileHash`) or
  signature (`Get-AuthenticodeSignature`), then run.
- **Execution policy and signing bypassed:** `Set-ExecutionPolicy Bypass`/`Unrestricted` in
  a script, `-ExecutionPolicy Bypass` baked into scheduled tasks, `Unblock-File` on downloads.
- **Modules installed without a pinned version** (`Install-Module Name` with no
  `-RequiredVersion`), from an untrusted repository, or with `-SkipPublisherCheck`.

### Credentials and secrets

- **Credentials in the script:** passwords or tokens as literals, as plain `[string]`
  parameters, in `ConvertTo-SecureString -AsPlainText -Force` with a literal, or in command-line
  arguments (visible in process listings and logs). Take `[pscredential]`, read from a vault
  (SecretManagement, the CI system's secret store) or environment at run time.
- **Secrets leaking** into transcripts, `Write-Verbose`/`Write-Host`, error messages,
  `$PSBoundParameters` dumps, or `Export-Clixml` on non-Windows (where `SecureString` is not
  encrypted at rest).

### Transport

- **TLS weakened:** `-SkipCertificateCheck`,
  `[Net.ServicePointManager]::ServerCertificateValidationCallback = { $true }`, forcing old
  protocol versions. (5.1 may need TLS 1.2 enabled explicitly; that is fine.)
- **Remoting:** `-Authentication Basic` over HTTP, `CredSSP`, `TrustedHosts = '*'`,
  unconstrained endpoints.

### Files, paths and privilege

- **Paths from input** used with `Remove-Item -Recurse -Force`, `Copy-Item`, `Expand-Archive`:
  validate, resolve and check containment; guard against an empty variable making the path a
  drive root.
- **Privilege.** `#Requires -RunAsAdministrator` where needed and nowhere else; no
  self-elevation with a constructed command line; scheduled tasks and services not run as
  SYSTEM by default.
- **Unquoted or writable service and task paths:** a scheduled task or service created with
  a path containing spaces and no quotes, or pointing into a directory non-administrators can
  write.
- **Permissions set too wide:** `icacls … /grant Everyone:F`, ACLs copied from a permissive
  parent, files holding secrets created before the ACL is tightened.
- **Missing `-WhatIf`/`-Confirm` support** (`SupportsShouldProcess`) on functions that delete
  or change state at scale: not a vulnerability, but the control that prevents an accident.

## Tools

| Purpose | Command | Notes |
| --- | --- | --- |
| Lint | `Invoke-ScriptAnalyzer -Path . -Recurse -Severity Warning, Error` | Needs `PSScriptAnalyzer`. Security-relevant rules include `PSAvoidUsingInvokeExpression`, `PSAvoidUsingPlainTextForPassword`, `PSAvoidUsingConvertToSecureStringWithPlainText`, `PSAvoidUsingUsernameAndPasswordParams`, `PSUsePSCredentialType`, `PSAvoidUsingComputerNameHardcoded`. |
| Injection analysis | `Invoke-ScriptAnalyzer -Path . -Recurse -CustomRulePath <InjectionHunter module path>` | Only where the `InjectionHunter` module is already installed. |
| Parse without running | `[System.Management.Automation.Language.Parser]::ParseFile($path, [ref]$null, [ref]$errors)` | Never run a script under review to see what it does. |
| Signature | `Get-AuthenticodeSignature -FilePath script.ps1` | Windows. Reports whether a signed script was altered. |
| Secrets | `gitleaks detect --no-git --source .` | |
| Rough net for sinks | `git grep -niE 'Invoke-Expression\|\biex\b\|\[scriptblock\]::Create\|Add-Type\|-AsPlainText\|SkipCertificateCheck\|ServerCertificateValidationCallback\|ExecutionPolicy\|TrustedHosts\|Start-Process\|-EncodedCommand' -- '*.ps1' '*.psm1' '*.yml' '*.yaml'` | Read each hit and trace where its values come from. |

## What this review does not establish

It reads the script. It does not run it, so it says nothing about the machine or tenant it
runs in: who can write to the script's folder, how the account is privileged, whether
script-block logging or constrained language mode is on. It does not review the modules the
script imports.
