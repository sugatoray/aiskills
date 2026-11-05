#!/usr/bin/env pwsh
# Thin PowerShell launcher for remove.py — all logic lives there, so this
# and remove.sh can never drift apart. Every argument is passed through
# unchanged (same flag spellings as remove.sh: -p/--path, -t/--reporoot,
# -l/--local, -r/--recurse, -x/--purge, -y/--yes, -n/--dry-run,
# --no-commit); see remove.py's header for the full option reference.
#
# Deliberately no param() block: PowerShell's own parameter binder would
# otherwise try to interpret the GNU-style flags (e.g. --purge=all)
# itself. $args carries them through verbatim instead.
#
# Usage:
#   remove.ps1 [-p BASE ...] [-t | -l] [-r] [-x [TARGETS]] ... [-y] [-n] [--no-commit]

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
    [Console]::Error.WriteLine('remove.ps1 needs Python 3.9+ (python3 or python) on PATH.')
    exit 2
}

& $py (Join-Path $PSScriptRoot 'remove.py') @args
exit $LASTEXITCODE
