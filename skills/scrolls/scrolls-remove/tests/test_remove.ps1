#!/usr/bin/env pwsh
# Parity harness for remove.ps1. All logic lives in remove.py (exercised
# in depth by test_remove.sh); this checks that the PowerShell launcher
# finds Python, passes GNU-style flags through untouched, and propagates
# exit codes.
# Run with: pwsh tests/test_remove.ps1

$ErrorActionPreference = 'Stop'
$SkillDir  = Split-Path -Parent $PSScriptRoot
$Script    = Join-Path $SkillDir 'scripts/remove.ps1'
$Templates = Join-Path (Split-Path -Parent $SkillDir) 'scrolls-setup/assets/templates'

$script:Total = 0
$script:Failures = 0
function Pass($label) { $script:Total++; Write-Host "PASS: $label" }
function Fail($label) { $script:Total++; $script:Failures++; Write-Host "FAIL: $label" }
function Check($cond, $label) { if ($cond) { Pass $label } else { Fail $label } }

function New-Repo {
    $d = Join-Path ([System.IO.Path]::GetTempPath()) ("scrolls-remove-test." + [guid]::NewGuid().ToString('N').Substring(0, 8))
    New-Item -ItemType Directory -Path $d | Out-Null
    git -C $d init -q
    git -C $d config user.email test@test.com
    git -C $d config user.name test
    git -C $d config commit.gpgsign false
    return $d
}

function New-Scaffold($base) {
    $s = Join-Path $base 'docs/.scrolls'
    New-Item -ItemType Directory -Path $s -Force | Out-Null
    foreach ($f in 'STARTER', 'SPEC', 'HANDOFF', 'GAP_ANALYSIS', 'GAP_CONTEXT', 'PLAN', 'WISDOM') {
        Set-Content -NoNewline -Path (Join-Path $s "$f.md") -Value "# $f`n"
    }
    $block = (Get-Content -Raw (Join-Path $Templates 'SCROLLS_MD_BLOCK.md')).Replace('{{SCROLLS_PATH}}', 'docs/.scrolls')
    Set-Content -NoNewline -Path (Join-Path $base 'SCROLLS.md') -Value $block
    Copy-Item (Join-Path $Templates 'CLAUDE_MD_BLOCK.md') (Join-Path $base 'CLAUDE.md')
    Copy-Item (Join-Path $Templates 'AGENTS_MD_BLOCK.md') (Join-Path $base 'AGENTS.md')
    git -C $base add -A
    git -C $base commit -q -m init
}

function Invoke-Remove($dir, [string[]]$argv) {
    Push-Location $dir
    try { $out = & pwsh -NoProfile -File $Script @argv 2>&1 | Out-String; return @{ Code = $LASTEXITCODE; Out = $out } }
    finally { Pop-Location }
}

Write-Host "`n=== 1: no -y prints the plan only ==="
$d = New-Repo; New-Scaffold $d
$r = Invoke-Remove $d @()
Check ($r.Code -eq 0) 'plan-only exits 0'
Check ($r.Out -match 'Dry run') 'says dry run'
Check (Test-Path (Join-Path $d 'docs/.scrolls')) 'nothing removed'

Write-Host "`n=== 2: -y removes and commits ==="
$prev = (git -C $d rev-parse HEAD).Trim()
$r = Invoke-Remove $d @('-y')
Check ($r.Code -eq 0) 'apply exits 0'
Check (-not (Test-Path (Join-Path $d 'docs/.scrolls'))) 'scrolls folder gone'
Check (-not (Test-Path (Join-Path $d 'CLAUDE.md'))) 'stub-only CLAUDE.md gone'
$lines = git -C $d log -1 --format=%B
Check ($lines[0] -eq 'maint(memory): scrolls-removed') 'subject exact'
Check ($lines[2] -eq "- previous commit: #$prev") 'previous-commit line exact'

Write-Host "`n=== 3: --purge=CLAUDE.md passes through ==="
$d = New-Repo; New-Scaffold $d
Add-Content -Path (Join-Path $d 'CLAUDE.md') -Value "`nUse tabs."
git -C $d commit -q -am more
$r = Invoke-Remove $d @('-y', '--purge=CLAUDE.md')
Check ($r.Code -eq 0) 'apply exits 0'
Check (-not (Test-Path (Join-Path $d 'CLAUDE.md'))) 'CLAUDE.md purged'

Write-Host "`n=== 4: exit codes propagate ==="
$d = New-Repo; New-Scaffold $d
$r = Invoke-Remove $d @('-t', '-p', '.')
Check ($r.Code -eq 2) 'usage error -> 2'
Add-Content -Path (Join-Path $d 'docs/.scrolls/PLAN.md') -Value 'dirty'
$r = Invoke-Remove $d @('-y')
Check ($r.Code -eq 3) 'dirty tree -> 3'
$e = New-Repo
$r = Invoke-Remove $e @('-y')
Check ($r.Code -eq 1) 'nothing found -> 1'

Write-Host "`n=== $($script:Total - $script:Failures)/$($script:Total) passed ==="
if ($script:Failures -gt 0) { exit 1 }
