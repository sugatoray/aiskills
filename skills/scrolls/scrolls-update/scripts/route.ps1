#!/usr/bin/env pwsh
# Thin PowerShell launcher for route.py — all logic lives there, so this
# and route.sh can never drift apart. Every argument is passed through
# unchanged (same spellings as route.sh: SCROLLS_PATH, --since REV); see
# route.py's header for the full option reference.
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
    $cmd = Get-Command $cand -ErrorAction SilentlyContinue
    if ($null -ne $cmd) {
        & $cmd.Source -c 'import sys; sys.exit(0 if sys.version_info >= (3, 9) else 1)' 2>$null
        if ($LASTEXITCODE -eq 0) { $py = $cmd.Source; break }
    }
}
if ($null -eq $py) {
    [Console]::Error.WriteLine('route.ps1 needs Python 3.9+ (python3 or python) on PATH.')
    exit 2
}

& $py (Join-Path $PSScriptRoot 'route.py') @args
exit $LASTEXITCODE
