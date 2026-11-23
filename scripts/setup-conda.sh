#!/usr/bin/env bash
# Install conda (Miniforge: a minimal conda whose default channel is conda-forge).
# Used by `make setup-conda`, and by setup-pwsh.sh when no conda is found.
#
# Usage: scripts/setup-conda.sh [--dry-run]
#   CONDA_DIR  where to install (default: ~/miniforge3)
#   SETUP_OS / SETUP_ARCH  override `uname -s` / `uname -m` (for tests)
#
# Does nothing if CONDA_DIR/bin/conda exists or a conda is already on PATH.
# Supports Linux (x86_64, aarch64, ppc64le) and macOS (x86_64, arm64); on
# Windows, run the Miniforge .exe installer by hand. --dry-run prints the
# commands without downloading or installing anything.
set -euo pipefail

DRY=0
case "${1:-}" in
  --dry-run) DRY=1 ;;
  "") ;;
  -h|--help) sed -n '2,13p' "$0"; exit 0 ;;
  *) echo "setup-conda.sh: unknown argument: $1 (usage: setup-conda.sh [--dry-run])" >&2; exit 2 ;;
esac

CONDA_DIR="${CONDA_DIR:-$HOME/miniforge3}"
RELEASES="https://github.com/conda-forge/miniforge/releases/latest/download"

if [ -x "$CONDA_DIR/bin/conda" ]; then
  echo "conda is already installed: $CONDA_DIR/bin/conda"
  exit 0
fi
if command -v conda >/dev/null 2>&1; then
  echo "conda is already on PATH: $(command -v conda)"
  exit 0
fi

os="${SETUP_OS:-$(uname -s)}"
arch="${SETUP_ARCH:-$(uname -m)}"
case "$os" in
  Linux) mos="Linux" ;;
  Darwin) mos="MacOSX" ;;
  MINGW*|MSYS*|CYGWIN*|Windows*)
    echo "setup-conda.sh: on Windows, download and run Miniforge3-Windows-x86_64.exe from" >&2
    echo "  https://github.com/conda-forge/miniforge/releases/latest" >&2
    exit 2 ;;
  *) echo "setup-conda.sh: unsupported system: $os" >&2; exit 2 ;;
esac
case "$arch" in
  x86_64|amd64) march="x86_64" ;;
  aarch64|arm64) if [ "$mos" = "MacOSX" ]; then march="arm64"; else march="aarch64"; fi ;;
  ppc64le) march="ppc64le" ;;
  *) echo "setup-conda.sh: unsupported CPU for $os: $arch" >&2; exit 2 ;;
esac

url="$RELEASES/Miniforge3-$mos-$march.sh"
if [ "$DRY" -eq 1 ]; then
  echo "would download: $url"
  echo "would run: bash Miniforge3-$mos-$march.sh -b -p $CONDA_DIR"
  exit 0
fi

tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT
echo "downloading $url"
curl -fsSL -o "$tmp/miniforge.sh" "$url"
echo "installing conda in $CONDA_DIR"
bash "$tmp/miniforge.sh" -b -p "$CONDA_DIR"
echo "conda installed: $CONDA_DIR/bin/conda"
echo "To use it in this shell: export PATH=\"$CONDA_DIR/bin:\$PATH\""
