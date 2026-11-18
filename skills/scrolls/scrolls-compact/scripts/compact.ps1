#!/usr/bin/env pwsh
# Thin PowerShell launcher for compact.py — all logic lives there, so this
# and compact.sh can never drift apart. Every argument is passed through
# unchanged (same flag spellings as compact.sh, e.g. --before=20261108,
# --base=COMMIT, -p/-t/-l/-r, --finalize, --list, --show, --extract,
# --no-commit, --no-tag); see compact.py's header for the full option reference.
#
# Deliberately no param() block: PowerShell's own parameter binder would
# otherwise try to interpret the GNU-style flags (e.g. --before=20261108)
# itself. $args carries them through verbatim instead.
#
# Usage:
#   compact.ps1 [flags...]

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
    [Console]::Error.WriteLine('compact.ps1 needs Python 3.9+ (python3 or python) on PATH.')
    exit 2
}

& $py (Join-Path $PSScriptRoot 'compact.py') @args
exit $LASTEXITCODE
