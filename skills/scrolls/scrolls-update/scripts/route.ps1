#!/usr/bin/env pwsh
# Thin PowerShell launcher for route.py - all logic lives there, so this
# and route.sh can never drift apart. Every argument is passed through
# unchanged (same spellings as route.sh: SCROLLS_PATH, --since REV); see
# route.py's header for the full option reference.
#
# Works in Windows PowerShell 5.1 and PowerShell 7+. Kept to ASCII, with
# no syntax newer than 5.1, and native commands run with
# $ErrorActionPreference = 'Continue' so their stderr is never turned into
# a terminating error (which 5.1 does under 'Stop').
#
# Deliberately no param() block: PowerShell's own parameter binder would
# otherwise try to interpret the GNU-style flags (e.g. --since=REV)
# itself. $args carries them through verbatim instead.
#
# Usage:
#   route.ps1 [SCROLLS_PATH] [--since REV]

$ErrorActionPreference = 'Stop'

$py = $null
foreach ($cand in @('python3', 'python')) {
    $cmd = Get-Command $cand -CommandType Application -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($null -ne $cmd) {
        $ErrorActionPreference = 'Continue'
        & $cmd.Source -c 'import sys; sys.exit(0 if sys.version_info >= (3, 9) else 1)' 2>$null | Out-Null
        $ok = ($LASTEXITCODE -eq 0)
        $ErrorActionPreference = 'Stop'
        if ($ok) { $py = $cmd.Source; break }
    }
}
if ($null -eq $py) {
    [Console]::Error.WriteLine('route.ps1 needs Python 3.9+ (python3 or python) on PATH.')
    exit 2
}

$ErrorActionPreference = 'Continue'
& $py (Join-Path $PSScriptRoot 'route.py') @args
exit $LASTEXITCODE
