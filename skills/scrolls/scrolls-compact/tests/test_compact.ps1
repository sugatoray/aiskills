#!/usr/bin/env pwsh
# Parity harness for compact.ps1. All logic lives in compact.py (exercised
# in depth by test_compact.sh); this checks that the PowerShell launcher
# finds Python, passes GNU-style flags through untouched, and propagates
# exit codes.
# Run with: pwsh tests/test_compact.ps1

$ErrorActionPreference = 'Stop'
$SkillDir = Split-Path -Parent $PSScriptRoot
$Script   = Join-Path $SkillDir 'scripts/compact.ps1'

$env:TZ = 'UTC'
$Now = 1800000000
$env:SCROLLS_COMPACT_NOW = "$Now"

$script:Total = 0
$script:Failures = 0
function Pass($label) { $script:Total++; Write-Host "PASS: $label" }
function Fail($label) { $script:Total++; $script:Failures++; Write-Host "FAIL: $label" }
function Check($cond, $label) { if ($cond) { Pass $label } else { Fail $label } }

function New-Repo {
    $d = Join-Path ([System.IO.Path]::GetTempPath()) ("scrolls-compact-test." + [guid]::NewGuid().ToString('N').Substring(0, 8))
    New-Item -ItemType Directory -Path $d | Out-Null
    git -C $d init -q -b main
    git -C $d config user.email test@test.com
    git -C $d config user.name test
    git -C $d config commit.gpgsign false
    git -C $d config tag.gpgsign false
    return $d
}

function Commit-At($dir, $daysAgo, $msg) {
    $ts = $Now - $daysAgo * 86400
    $env:GIT_AUTHOR_DATE = "@$ts +0000"; $env:GIT_COMMITTER_DATE = "@$ts +0000"
    git -C $dir add -A
    git -C $dir commit -q --allow-empty -m $msg
    Remove-Item Env:GIT_AUTHOR_DATE, Env:GIT_COMMITTER_DATE
}

function New-Fixture($d) {
    $s = Join-Path $d 'docs/.scrolls'
    New-Item -ItemType Directory -Path $s -Force | Out-Null
    Set-Content -NoNewline -Path (Join-Path $s 'STARTER.md') -Value "# STARTER.md`n`n1. **``docs/.scrolls/SPEC.md``** — features.`n"
    Set-Content -NoNewline -Path (Join-Path $s 'PLAN.md') -Value "# PLAN.md`n`n- [x] T-1: old done`n- [ ] T-2: old open`n"
    Commit-At $d 30 'day 30'
    Add-Content -Path (Join-Path $s 'PLAN.md') -Value '- [ ] T-3: new open'
    Commit-At $d 1 'day 1'
}

function Invoke-Compact($dir, [string[]]$argv) {
    Push-Location $dir
    try { $out = & pwsh -NoProfile -File $Script @argv 2>&1 | Out-String; return @{ Code = $LASTEXITCODE; Out = $out } }
    finally { Pop-Location }
}

Write-Host "`n=== 1: the plan runs and changes nothing ==="
$d = New-Repo; New-Fixture $d
$before = (git -C $d rev-parse HEAD).Trim()
$r = Invoke-Compact $d @('--keep-days=7')
Check ($r.Code -eq 0) 'plan exits 0'
Check ($r.Out -match 'Dry run') 'says dry run'
Check ($r.Out -match 'old\s+L\d+\s+- \[x\] T-1') 'old done ticket found'
Check ((git -C $d rev-parse HEAD).Trim() -eq $before) 'HEAD unchanged'

Write-Host "`n=== 2: --finalize passes through and commits ==="
$marker = ([regex]::Match($r.Out, '(?m)^\s*marker:\s*(.+)$')).Groups[1].Value.Trim()
$plan = Join-Path $d 'docs/.scrolls/PLAN.md'
$text = (Get-Content -Raw $plan).Replace("- [x] T-1: old done`n", "$marker`n")
Set-Content -NoNewline -Path $plan -Value $text
$r = Invoke-Compact $d @('--finalize')
Check ($r.Code -eq 0) 'finalize exits 0'
$lines = git -C $d log -1 --format=%B
Check ($lines[0] -eq 'maint(memory): scrolls-compacted') 'subject exact'
Check ($lines[2] -eq "- checkpoint: #$before") 'checkpoint line exact'
Check (Test-Path (Join-Path $d 'docs/.scrolls/COMPACT.md')) 'COMPACT.md written'

Write-Host "`n=== 3: exit codes propagate ==="
$r = Invoke-Compact $d @('-t', '-p', '.')
Check ($r.Code -eq 2) 'usage error -> 2'
$r = Invoke-Compact $d @('--extract', '9', 'PLAN.md')
Check ($r.Code -eq 1) 'unknown id -> 1'
Add-Content -Path $plan -Value 'dirty'
$r = Invoke-Compact $d @()
Check ($r.Code -eq 3) 'dirty folder -> 3'

Write-Host "`n=== $($script:Total - $script:Failures)/$($script:Total) passed ==="
if ($script:Failures -gt 0) { exit 1 }
