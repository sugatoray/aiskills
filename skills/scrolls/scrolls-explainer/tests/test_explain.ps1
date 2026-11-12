#!/usr/bin/env pwsh
# Parity harness for explain.ps1. All logic lives in explain.py (exercised
# in depth by test_explain.sh); this checks that the PowerShell launcher
# finds Python, passes GNU-style flags through untouched, and propagates
# exit codes.
# Run with: pwsh tests/test_explain.ps1

$ErrorActionPreference = 'Stop'
$SkillDir = Split-Path -Parent $PSScriptRoot
$Script   = Join-Path $SkillDir 'scripts/explain.ps1'
$Page     = Join-Path $SkillDir 'assets/scrolls-explainer.html'
$Name     = 'scrolls-explainer.html'
$Version  = (Select-String -Path (Join-Path $SkillDir 'SKILL.md') -Pattern '^  version: "(.*)"$' |
             Select-Object -First 1).Matches[0].Groups[1].Value

$script:Total = 0
$script:Failures = 0
function Pass($label) { $script:Total++; Write-Host "PASS: $label" }
function Fail($label) { $script:Total++; $script:Failures++; Write-Host "FAIL: $label" }
function Check($cond, $label) { if ($cond) { Pass $label } else { Fail $label } }
function Same($a, $b) { (Test-Path $a) -and ((Get-FileHash $a).Hash -eq (Get-FileHash $b).Hash) }

function New-TempDir {
    $d = Join-Path ([System.IO.Path]::GetTempPath()) ("scrolls-explainer-test." + [guid]::NewGuid().ToString('N').Substring(0, 8))
    New-Item -ItemType Directory -Path $d | Out-Null
    return $d
}

function Invoke-Explain($dir, [string[]]$argv) {
    Push-Location $dir
    try { $out = & pwsh -NoProfile -File $Script @argv 2>&1 | Out-String; return @{ Code = $LASTEXITCODE; Out = $out } }
    finally { Pop-Location }
}

Write-Host "`n=== 1: no arguments writes ./$Name ==="
$d = New-TempDir
$r = Invoke-Explain $d @()
Check ($r.Code -eq 0) 'exit 0'
Check (Same (Join-Path $d $Name) $Page) 'file is the bundled page'
Check ($r.Out -match "scrolls-explainer $([regex]::Escape($Version))") 'names the version'
Check ($r.Out -match 'file://') 'prints a file:// URL'

Write-Host "`n=== 2: an existing, different file needs -f ==="
Set-Content -NoNewline -Path (Join-Path $d $Name) -Value "keep me`n"
$r = Invoke-Explain $d @()
Check ($r.Code -eq 3) 'refused with exit 3'
Check ((Get-Content -Raw (Join-Path $d $Name)) -eq "keep me`n") 'file left untouched'
$r = Invoke-Explain $d @('--force')
Check ($r.Code -eq 0) '--force exit 0'
Check (Same (Join-Path $d $Name) $Page) '--force replaced the file'

Write-Host "`n=== 3: -o FILE and -o DIR ==="
$d = New-TempDir
$r = Invoke-Explain $d @('-o', 'out/nested/explainer.html')
Check ($r.Code -eq 0) '-o FILE exit 0'
Check (Same (Join-Path $d 'out/nested/explainer.html') $Page) 'written to the given file'
New-Item -ItemType Directory -Path (Join-Path $d 'site') | Out-Null
$r = Invoke-Explain $d @('--output', 'site')
Check (Same (Join-Path $d "site/$Name") $Page) '--output DIR gets the default name'

Write-Host "`n=== 4: --version, -h, usage errors ==="
$r = Invoke-Explain $d @('--version')
Check ($r.Code -eq 0 -and $r.Out.Trim() -eq "scrolls-explainer $Version") '--version prints the SKILL.md version'
$r = Invoke-Explain $d @('-h')
Check ($r.Code -eq 0 -and $r.Out -match '--output') '-h prints usage'
$r = Invoke-Explain $d @('--bogus')
Check ($r.Code -eq 2) 'unknown flag exits 2'

Write-Host ""
Write-Host "$($script:Total - $script:Failures)/$($script:Total) passed"
if ($script:Failures -gt 0) { exit 1 }
