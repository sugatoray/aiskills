#!/usr/bin/env pwsh
# Parity harness for restore.ps1. All logic lives in restore.py (exercised
# in depth by test_restore.sh); this checks that the PowerShell launcher
# finds Python, passes GNU-style flags through untouched, and propagates
# exit codes.
# Run with: pwsh tests/test_restore.ps1

$ErrorActionPreference = 'Stop'
$SkillDir  = Split-Path -Parent $PSScriptRoot
$Script    = Join-Path $SkillDir 'scripts/restore.ps1'
$Remove    = Join-Path (Split-Path -Parent $SkillDir) 'scrolls-remove/scripts/remove.ps1'
$Templates = Join-Path (Split-Path -Parent $SkillDir) 'scrolls-setup/assets/templates'

$script:Total = 0
$script:Failures = 0
function Pass($label) { $script:Total++; Write-Host "PASS: $label" }
function Fail($label) { $script:Total++; $script:Failures++; Write-Host "FAIL: $label" }
function Check($cond, $label) { if ($cond) { Pass $label } else { Fail $label } }

function New-Repo {
    $d = Join-Path ([System.IO.Path]::GetTempPath()) ("scrolls-restore-test." + [guid]::NewGuid().ToString('N').Substring(0, 8))
    New-Item -ItemType Directory -Path $d | Out-Null
    git -C $d init -q -b main
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

function Invoke-Tool($dir, $tool, [string[]]$argv) {
    Push-Location $dir
    try { $out = & pwsh -NoProfile -File $tool @argv 2>&1 | Out-String; return @{ Code = $LASTEXITCODE; Out = $out } }
    finally { Pop-Location }
}

Write-Host "`n=== 1: round trip ==="
$d = New-Repo; New-Scaffold $d
$src = (git -C $d rev-parse HEAD).Trim()
$null = Invoke-Tool $d $Remove @('-y')
$r = Invoke-Tool $d $Script @()
Check ($r.Code -eq 0) 'plan-only exits 0'
Check (-not (Test-Path (Join-Path $d 'docs/.scrolls'))) 'nothing restored without -y'
$r = Invoke-Tool $d $Script @('-y')
Check ($r.Code -eq 0) 'apply exits 0'
Check (Test-Path (Join-Path $d 'docs/.scrolls/STARTER.md')) 'folder restored'
$lines = git -C $d log -1 --format=%B
Check ($lines[0] -eq 'maint(memory): scrolls-restored') 'subject exact'
Check ($lines[2] -eq "- restored from: #$src") 'restored-from line exact'

Write-Host "`n=== 2: exit codes propagate ==="
$r = Invoke-Tool $d $Script @('-y')
Check ($r.Code -eq 1) 'already restored -> 1'
$r = Invoke-Tool $d $Script @('--all')
Check ($r.Code -eq 2) '--all without --list -> 2'

Write-Host "`n=== 3: --onto=<branch> passes through ==="
$d = New-Repo; New-Scaffold $d
$null = Invoke-Tool $d $Remove @('-y')
git -C $d branch other
$r = Invoke-Tool $d $Script @('-y', '--onto=other')
Check ($r.Code -eq 0) '--onto=other exits 0'
git -C $d cat-file -e other:docs/.scrolls/STARTER.md 2>$null
Check ($LASTEXITCODE -eq 0) 'other got the scrolls'
Check (-not (Test-Path (Join-Path $d 'docs/.scrolls'))) 'current checkout untouched'

Write-Host "`n=== $($script:Total - $script:Failures)/$($script:Total) passed ==="
if ($script:Failures -gt 0) { exit 1 }
