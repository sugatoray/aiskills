#!/usr/bin/env pwsh
# Thin PowerShell launcher for restore.py — all logic lives there, so this
# and restore.sh can never drift apart. Every argument is passed through
# unchanged (same flag spellings as restore.sh: -p/--path, -t/--reporoot,
# -l/--local, -r/--recurse, --onto, -b/--branch, --full, -f/--force, --list, --all, -y/--yes, -n/--dry-run,
# --no-commit); see restore.py's header for the full option reference.
#
# Deliberately no param() block: PowerShell's own parameter binder would
# otherwise try to interpret the GNU-style flags (e.g. --onto=main)
# itself. $args carries them through verbatim instead.
#
# Usage:
#   restore.ps1 [COMMIT] [-p BASE ...] [-t | -l] [-r] [--onto REF [-b BRANCH]] [--full] [-f] [-y] [-n] [--no-commit]
#   restore.ps1 --list [--all]

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
    [Console]::Error.WriteLine('restore.ps1 needs Python 3.9+ (python3 or python) on PATH.')
    exit 2
}

& $py (Join-Path $PSScriptRoot 'restore.py') @args
exit $LASTEXITCODE
