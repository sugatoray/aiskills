#!/usr/bin/env pwsh
# Parity harness for route.ps1. All logic lives in route.py (exercised in
# depth by test_route.sh); this checks that the PowerShell launcher finds
# Python, passes the scroll set path and GNU-style flags through untouched,
# routes a nested change the same way, and propagates exit codes.
# Run with: pwsh tests/test_route.ps1

$ErrorActionPreference = 'Stop'
$SkillDir = Split-Path -Parent $PSScriptRoot
$Script   = Join-Path $SkillDir 'scripts/route.ps1'

$script:Total = 0
$script:Failures = 0
function Pass($label) { $script:Total++; Write-Host "PASS: $label" }
function Fail($label) { $script:Total++; $script:Failures++; Write-Host "FAIL: $label" }
function Check($cond, $label) { if ($cond) { Pass $label } else { Fail $label } }

function New-Repo {
    $d = Join-Path ([System.IO.Path]::GetTempPath()) ("scrolls-route-test." + [guid]::NewGuid().ToString('N').Substring(0, 8))
    New-Item -ItemType Directory -Path $d | Out-Null
    git -C $d init -q
    git -C $d config user.email test@test.com
    git -C $d config user.name test
    git -C $d config commit.gpgsign false
    return $d
}

function New-Set($dir) {
    $s = Join-Path $dir 'docs/.scrolls'
    New-Item -ItemType Directory -Path $s -Force | Out-Null
    foreach ($f in 'STARTER', 'SPEC', 'HANDOFF', 'GAP_ANALYSIS', 'GAP_CONTEXT', 'PLAN', 'WISDOM') {
        Set-Content -NoNewline -Path (Join-Path $s "$f.md") -Value "# $f`n"
    }
}

function Invoke-Route($cwd, [string[]]$argList) {
    Push-Location $cwd
    try {
        $out = & pwsh -NoProfile -File $Script @argList 2>&1 | Out-String
        return @{ Out = $out; Code = $LASTEXITCODE }
    } finally { Pop-Location }
}

Write-Host "`n=== No scroll set: exit 1 ==="
$d = New-Repo
$r = Invoke-Route $d @()
Check ($r.Code -eq 1) "exits 1 when there is no scroll set"
Check ($r.Out -match 'scrolls-setup') "points at /scrolls-setup"
Remove-Item -Recurse -Force $d

Write-Host "`n=== Bad argument: exit 2 ==="
$d = New-Repo; New-Set $d
$r = Invoke-Route $d @('--bogus')
Check ($r.Code -eq 2) "exits 2 on an unknown flag"
Remove-Item -Recurse -Force $d

Write-Host "`n=== Nested set and --since=REV pass through ==="
$d = New-Repo; New-Set $d; New-Set (Join-Path $d 'packages/api')
git -C $d add -A; git -C $d commit -q -m init
$first = (git -C $d rev-parse HEAD).Trim()
New-Item -ItemType Directory -Path (Join-Path $d 'packages/api/src') -Force | Out-Null
Set-Content -Path (Join-Path $d 'packages/api/src/server.py') -Value 'x'
git -C $d add -A; git -C $d commit -q -m work
$r = Invoke-Route $d @('docs/.scrolls', "--since=$first")
Check ($r.Code -eq 0) "exits 0"
Check ($r.Out -match '(?m)^-> packages/api/docs/\.scrolls\s*$') "routes to the nested set"
Check ($r.Out -match '(?m)^   packages/api/src/server\.py\s*$') "lists the nested change"
Check ($r.Out -match 'Not in the router table') "flags the unlisted nested set"
Remove-Item -Recurse -Force $d

Write-Host "`n$($script:Total) checks, $($script:Failures) failed"
if ($script:Failures -gt 0) { exit 1 }
