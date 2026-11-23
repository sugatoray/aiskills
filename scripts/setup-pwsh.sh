#!/usr/bin/env bash
# Install PowerShell (pwsh) from conda-forge into its own conda environment,
# installing conda first (setup-conda.sh) if none is found. Used by
# `make setup-pwsh`, e.g. to run the skills' .ps1 test suites on Linux or macOS.
#
# Usage: scripts/setup-pwsh.sh [--dry-run]
#   CONDA_DIR  where conda is or goes (default: ~/miniforge3)
#   PWSH_ENV   the environment to create (default: $CONDA_DIR/envs/pwsh)
#
# Does nothing if pwsh is already on PATH or PWSH_ENV/bin/pwsh exists.
# --dry-run prints the commands without installing anything.
set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DRY=0
case "${1:-}" in
  --dry-run) DRY=1 ;;
  "") ;;
  -h|--help) sed -n '2,11p' "$0"; exit 0 ;;
  *) echo "setup-pwsh.sh: unknown argument: $1 (usage: setup-pwsh.sh [--dry-run])" >&2; exit 2 ;;
esac

export CONDA_DIR="${CONDA_DIR:-$HOME/miniforge3}"
PWSH_ENV="${PWSH_ENV:-$CONDA_DIR/envs/pwsh}"

version() { "$1" -NoProfile -Command '$PSVersionTable.PSVersion.ToString()' 2>/dev/null | tr -d '\r' | head -1; }

if command -v pwsh >/dev/null 2>&1; then
  echo "pwsh is already on PATH: $(command -v pwsh) ($(version pwsh))"
  exit 0
fi
if [ -x "$PWSH_ENV/bin/pwsh" ]; then
  echo "pwsh is already installed: $PWSH_ENV/bin/pwsh ($(version "$PWSH_ENV/bin/pwsh"))"
  echo "To use it in this shell: export PATH=\"$PWSH_ENV/bin:\$PATH\""
  exit 0
fi

if [ -x "$CONDA_DIR/bin/conda" ]; then
  conda="$CONDA_DIR/bin/conda"
elif command -v conda >/dev/null 2>&1; then
  conda="$(command -v conda)"
else
  echo "no conda found: installing it first"
  if [ "$DRY" -eq 1 ]; then
    bash "$HERE/setup-conda.sh" --dry-run
  else
    bash "$HERE/setup-conda.sh"
  fi
  conda="$CONDA_DIR/bin/conda"
fi

if [ "$DRY" -eq 1 ]; then
  echo "would run: $conda create -y -p $PWSH_ENV -c conda-forge powershell"
  exit 0
fi

echo "creating $PWSH_ENV with powershell from conda-forge"
"$conda" create -y -p "$PWSH_ENV" -c conda-forge powershell
if [ ! -x "$PWSH_ENV/bin/pwsh" ]; then
  echo "setup-pwsh.sh: conda finished, but $PWSH_ENV/bin/pwsh is missing" >&2
  exit 1
fi
echo "pwsh installed: $PWSH_ENV/bin/pwsh ($(version "$PWSH_ENV/bin/pwsh"))"
echo "To use it in this shell: export PATH=\"$PWSH_ENV/bin:\$PATH\""
