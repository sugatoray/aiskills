# PowerShell fix patterns

Before/after pairs for the findings that come up most. Use them to shape a suggested change;
adapt names and style to the script under review, and check which PowerShell it must run on
(noted where a fix needs PowerShell 7).

## Script header for unattended runs

```powershell
# Before: errors are written and the script carries on; typos become $null
param($Environment)
Copy-Item .\build\* \\server\share\app
```

```powershell
# After
#Requires -Version 5.1
[CmdletBinding()]
param(
    [Parameter(Mandatory)]
    [ValidateSet('dev', 'staging', 'prod')]
    [string]$Environment
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

Copy-Item -Path (Join-Path $PSScriptRoot 'build\*') -Destination "\\server\share\app-$Environment" -Recurse
```

## Make cmdlet failures catchable

```powershell
# Before: Get-Content's error is non-terminating, so the catch never runs
try {
    $config = Get-Content $path | ConvertFrom-Json
} catch {
    Write-Host "Could not load config"
}
```

```powershell
# After
try {
    $config = Get-Content -LiteralPath $path -Raw -ErrorAction Stop | ConvertFrom-Json
} catch [System.Management.Automation.ItemNotFoundException] {
    throw "Config file not found: $path"
} catch {
    throw "Config file $path is not valid JSON: $($_.Exception.Message)"
}
```

## Check native command exit codes

```powershell
# Before: a failed build is followed by the deploy
dotnet build -c Release
dotnet publish -c Release -o $out
```

```powershell
# After
dotnet build -c Release
if ($LASTEXITCODE -ne 0) { throw "dotnet build failed with exit code $LASTEXITCODE" }

dotnet publish -c Release -o $out
if ($LASTEXITCODE -ne 0) { throw "dotnet publish failed with exit code $LASTEXITCODE" }
```

With several native calls, a helper keeps it readable:

```powershell
function Invoke-Native {
    param(
        [Parameter(Mandatory)][string]$Command,
        [string[]]$Arguments = @()
    )
    & $Command @Arguments
    if ($LASTEXITCODE -ne 0) {
        throw "$Command $($Arguments -join ' ') failed with exit code $LASTEXITCODE"
    }
}

Invoke-Native dotnet @('build', '-c', 'Release')
```

PowerShell 7.4+ can do this globally: `$PSNativeCommandUseErrorActionPreference = $true` with
`$ErrorActionPreference = 'Stop'`.

## Keep stray output out of the return value

```powershell
# Before: returns the indexes from Add() as well as the list
function Get-ActiveUser {
    $result = New-Object System.Collections.ArrayList
    foreach ($u in $users) {
        if ($u.Enabled) { $result.Add($u) }
    }
    return $result
}
```

```powershell
# After: emit the objects; the caller collects them
function Get-ActiveUser {
    [CmdletBinding()]
    [OutputType([pscustomobject])]
    param(
        [Parameter(Mandatory)]
        [AllowEmptyCollection()]
        [object[]]$User
    )
    foreach ($u in $User) {
        if ($u.Enabled) { $u }
    }
}

$active = @(Get-ActiveUser -User $users)   # @() keeps it an array for 0 or 1 results
```

When a call's output isn't wanted, discard it: `$null = $set.Add($item)`.

## Collect without `+=`

```powershell
# Before: copies the array on every iteration
$rows = @()
foreach ($file in $files) {
    $rows += [pscustomobject]@{ Name = $file.Name; SizeKB = [math]::Round($file.Length / 1KB, 1) }
}
```

```powershell
# After: assign the loop's output
$rows = foreach ($file in $files) {
    [pscustomobject]@{ Name = $file.Name; SizeKB = [math]::Round($file.Length / 1KB, 1) }
}
```

When items are added from several places, use a generic list:

```powershell
$rows = [System.Collections.Generic.List[object]]::new()
$rows.Add([pscustomobject]@{ Name = 'a'; SizeKB = 1.5 })
```

## `$null` on the left

```powershell
# Before: filters instead of testing when $items is a collection
if ($items -eq $null) { return }
```

```powershell
# After
if ($null -eq $items) { return }
```

## Expand properties inside strings

```powershell
# Before: prints the whole object followed by ".Name"; "$name:" is a parse error
Write-Verbose "Processing $user.Name"
```

```powershell
# After
Write-Verbose "Processing $($user.Name)"
Write-Verbose "User ${name}: done"
```

## Dry runs with `ShouldProcess`

```powershell
# Before: no -WhatIf, no confirmation, deletes at once
function Remove-OldLog {
    param($Path, $Days)
    Get-ChildItem $Path -Recurse | Where-Object { $_.LastWriteTime -lt (Get-Date).AddDays(-$Days) } | Remove-Item -Force
}
```

```powershell
# After
function Remove-OldLog {
    [CmdletBinding(SupportsShouldProcess, ConfirmImpact = 'High')]
    param(
        [Parameter(Mandatory)]
        [ValidateScript({ Test-Path -LiteralPath $_ -PathType Container })]
        [string]$Path,

        [ValidateRange(1, 3650)]
        [int]$Days = 30
    )

    $cutoff = (Get-Date).AddDays(-$Days)
    Get-ChildItem -LiteralPath $Path -File -Recurse -Filter '*.log' |
        Where-Object { $_.LastWriteTime -lt $cutoff } |
        ForEach-Object {
            if ($PSCmdlet.ShouldProcess($_.FullName, 'Remove log file')) {
                Remove-Item -LiteralPath $_.FullName -Force
            }
        }
}
```

## Pipeline input needs a `process` block

```powershell
# Before: only the last piped name is handled
function Test-Server {
    param([Parameter(ValueFromPipeline)][string]$ComputerName)
    Test-Connection -ComputerName $ComputerName -Count 1 -Quiet
}
```

```powershell
# After
function Test-Server {
    [CmdletBinding()]
    [OutputType([pscustomobject])]
    param(
        [Parameter(Mandatory, ValueFromPipeline)]
        [string[]]$ComputerName
    )
    process {
        foreach ($name in $ComputerName) {
            [pscustomobject]@{
                ComputerName = $name
                Online       = Test-Connection -ComputerName $name -Count 1 -Quiet
            }
        }
    }
}
```

## Call commands directly, not through `Invoke-Expression`

```powershell
# Before: $branch can inject commands
Invoke-Expression "git checkout $branch"
```

```powershell
# After: arguments are passed as data
git checkout -- $branch
if ($LASTEXITCODE -ne 0) { throw "git checkout failed for '$branch'" }
```

For a command with many or optional parameters, splat:

```powershell
$params = @{
    Uri         = $uri
    Method      = 'Post'
    Body        = $body | ConvertTo-Json -Depth 10
    ContentType = 'application/json'
    TimeoutSec  = 30
}
if ($Credential) { $params.Credential = $Credential }
$response = Invoke-RestMethod @params
```

## Credentials

```powershell
# Before: password in source, and in memory as plain text
$password = ConvertTo-SecureString 'P@ssw0rd!' -AsPlainText -Force
$cred = New-Object System.Management.Automation.PSCredential('svc-deploy', $password)
```

```powershell
# After: the caller supplies it; nothing secret is in the script
param(
    [Parameter(Mandatory)]
    [System.Management.Automation.PSCredential]
    [System.Management.Automation.Credential()]
    $Credential
)
```

Unattended, read it from the platform's secret store at run time, for example
`Get-Secret -Name 'svc-deploy'` (Microsoft.PowerShell.SecretManagement), which returns a
`PSCredential` when one was stored.

## Verify a download before running it

```powershell
# Before: runs whatever the server returns
Invoke-Expression (Invoke-WebRequest https://example.com/install.ps1).Content
```

```powershell
# After
$installer = Join-Path ([IO.Path]::GetTempPath()) 'install-1.4.2.ps1'
Invoke-WebRequest -Uri 'https://example.com/releases/1.4.2/install.ps1' -OutFile $installer -UseBasicParsing
$actual = (Get-FileHash -LiteralPath $installer -Algorithm SHA256).Hash
if ($actual -ne $ExpectedSha256) {
    Remove-Item -LiteralPath $installer -Force
    throw "Checksum mismatch for install.ps1: expected $ExpectedSha256, got $actual"
}
& $installer
```

## Paths from data

```powershell
# Before: wildcard characters in $name are interpreted; relative to wherever the caller is
Get-Content "reports\$name"
```

```powershell
# After
$reportPath = Join-Path (Join-Path $PSScriptRoot 'reports') $name
Get-Content -LiteralPath $reportPath -Raw
```

When `$name` comes from outside, also check containment:

```powershell
$root = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot 'reports'))
$full = [IO.Path]::GetFullPath((Join-Path $root $name))
if (-not $full.StartsWith($root + [IO.Path]::DirectorySeparatorChar, [StringComparison]::OrdinalIgnoreCase)) {
    throw "Path escapes the reports folder: $name"
}
```

On a case-sensitive file system use `[StringComparison]::Ordinal`.

## Explicit encoding and JSON depth

```powershell
# Before: UTF-16 in Windows PowerShell 5.1; nested objects become type names below depth 2
$settings | ConvertTo-Json > settings.json
```

```powershell
# After: same bytes on 5.1 and 7 (UTF-8, no BOM)
$json = $settings | ConvertTo-Json -Depth 10
[IO.File]::WriteAllText((Join-Path $PSScriptRoot 'settings.json'), $json, [Text.UTF8Encoding]::new($false))
```

On PowerShell 7 only, `Set-Content -LiteralPath $path -Value $json -Encoding utf8NoBOM` does the
same.

## Filter at the source

```powershell
# Before: fetches every user, then filters on the client
Get-ADUser -Filter * -Properties Department | Where-Object { $_.Department -eq 'Finance' }
```

```powershell
# After: the directory does the filtering
Get-ADUser -Filter "Department -eq 'Finance'" -Properties Department
```

If the value comes from input, escape single quotes first (`$dept.Replace("'", "''")`) so it
can't alter the filter.

## Lookup table instead of a nested scan

```powershell
# Before: scans all users for every order
foreach ($order in $orders) {
    $user = $users | Where-Object { $_.Id -eq $order.UserId }
    "$($order.Id): $($user.Email)"
}
```

```powershell
# After
$usersById = @{}
foreach ($u in $users) { $usersById[$u.Id] = $u }

foreach ($order in $orders) {
    $user = $usersById[$order.UserId]
    "$($order.Id): $($user.Email)"
}
```

## Cleanup in `finally`

```powershell
# Before: the session leaks, and the location stays changed, if anything throws
$session = New-PSSession -ComputerName $server
Set-Location $workDir
Invoke-Command -Session $session -ScriptBlock { Restart-Service app }
Remove-PSSession $session
```

```powershell
# After
$session = New-PSSession -ComputerName $server
Push-Location -LiteralPath $workDir
try {
    Invoke-Command -Session $session -ScriptBlock { Restart-Service -Name app -ErrorAction Stop }
} finally {
    Pop-Location
    Remove-PSSession -Session $session
}
```

## A Pester test that can fail

```powershell
# Before (Pester v4 syntax, and no assertion on the error path)
Describe 'ConvertTo-Port' {
    It 'works' {
        ConvertTo-Port '8080' | Should Be 8080
    }
}
```

```powershell
# After (Pester v5)
Describe 'ConvertTo-Port' {
    It 'parses a valid port' {
        ConvertTo-Port -Value '8080' | Should -Be 8080
    }

    It 'rejects <Value>' -ForEach @(
        @{ Value = 'abc' }, @{ Value = '' }, @{ Value = '-1' }, @{ Value = '65536' }
    ) {
        { ConvertTo-Port -Value $Value } | Should -Throw -ExpectedMessage '*port*'
    }
}
```
