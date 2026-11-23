#!/usr/bin/env bash
# Red/Green regression test for scripts/setup-conda.sh and scripts/setup-pwsh.sh
# (make conda, make setup-pwsh). Nothing is downloaded or installed for real:
# fake curl, conda and pwsh commands on PATH stand in, and SETUP_OS/SETUP_ARCH
# override uname so every platform's installer name can be checked here.
# Run with: bash scripts/tests/test_setup_tools.sh   (or: make test-scripts)
set -uo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SCRIPTS="$(dirname "$HERE")"
REPO="$(dirname "$SCRIPTS")"
CONDA_SH="$SCRIPTS/setup-conda.sh"
PWSH_SH="$SCRIPTS/setup-pwsh.sh"

TOTAL=0
FAILURES=0
pass() { TOTAL=$((TOTAL + 1)); echo "PASS: $1"; }
fail() { TOTAL=$((TOTAL + 1)); FAILURES=$((FAILURES + 1)); echo "FAIL: $1"; }
assert_match() {
  local text="$1" pattern="$2" label="$3"
  if printf '%s' "$text" | grep -qE -- "$pattern"; then pass "$label"
  else fail "$label -- expected to match: $pattern"; echo "--- actual output ---"; printf '%s\n' "$text"; echo "---"; fi
}
assert_no_match() {
  local text="$1" pattern="$2" label="$3"
  if printf '%s' "$text" | grep -qE -- "$pattern"; then
    fail "$label -- did not expect: $pattern"; echo "--- actual output ---"; printf '%s\n' "$text"; echo "---"
  else pass "$label"; fi
}
assert_exit() {
  local actual="$1" expected="$2" label="$3"
  if [ "$actual" -eq "$expected" ]; then pass "$label"; else fail "$label -- expected exit $expected, got $actual"; fi
}
assert_true() { if eval "$1"; then pass "$2"; else fail "$2 -- condition false: $1"; fi; }

# A sandbox: HOME, a fake bin dir first on PATH (only the system dirs after it,
# so a real conda or pwsh on this machine can't leak in), and a log of what the
# fakes were asked to do.
new_box() {
  BOX="$(mktemp -d -t setup-tools-test.XXXXXX)"
  mkdir -p "$BOX/home" "$BOX/fakebin"
  : > "$BOX/calls.log"
  export HOME="$BOX/home"
  export PATH="$BOX/fakebin:/usr/bin:/bin"
  unset CONDA_DIR PWSH_ENV SETUP_OS SETUP_ARCH
}
# fake curl: records the URL and writes a fake Miniforge installer that, when
# run with -b -p DIR, creates DIR/bin/conda (itself a fake, see fake_conda_body).
fake_curl() {
  cat > "$BOX/fakebin/curl" <<EOF
#!/usr/bin/env bash
out=""; url=""
while [ \$# -gt 0 ]; do case "\$1" in -o) out="\$2"; shift 2;; -*) shift;; *) url="\$1"; shift;; esac; done
echo "curl \$url" >> "$BOX/calls.log"
cat > "\$out" <<'INSTALLER'
#!/usr/bin/env bash
prefix=""
while [ \$# -gt 0 ]; do case "\$1" in -p) prefix="\$2"; shift 2;; *) shift;; esac; done
mkdir -p "\$prefix/bin"
cp "$BOX/fake_conda" "\$prefix/bin/conda"; chmod +x "\$prefix/bin/conda"
INSTALLER
EOF
  chmod +x "$BOX/fakebin/curl"
  # fake conda: "create -y -p ENV -c conda-forge powershell" makes ENV/bin/pwsh
  cat > "$BOX/fake_conda" <<EOF
#!/usr/bin/env bash
echo "conda \$*" >> "$BOX/calls.log"
if [ "\$1" = "create" ]; then
  env=""; prev=""
  for a in "\$@"; do [ "\$prev" = "-p" ] && env="\$a"; prev="\$a"; done
  mkdir -p "\$env/bin"
  printf '#!/usr/bin/env bash\necho 7.9.9\n' > "\$env/bin/pwsh"; chmod +x "\$env/bin/pwsh"
fi
EOF
  chmod +x "$BOX/fake_conda"
}
done_box() { rm -rf "$BOX"; }

# ============================================================
echo; echo "=== Scenario A: installer name per platform (dry run) ==="
new_box; fake_curl
out="$(SETUP_OS=Linux SETUP_ARCH=x86_64 bash "$CONDA_SH" --dry-run 2>&1)"; code=$?
assert_exit "$code" 0 "dry run exits 0"
assert_match "$out" "Miniforge3-Linux-x86_64\.sh" "Linux x86_64 installer"
assert_match "$out" "-b -p $BOX/home/miniforge3" "installs to ~/miniforge3 by default"
assert_true "[ ! -s '$BOX/calls.log' ]" "a dry run downloads nothing"
out="$(SETUP_OS=Linux SETUP_ARCH=aarch64 bash "$CONDA_SH" --dry-run 2>&1)"
assert_match "$out" "Miniforge3-Linux-aarch64\.sh" "Linux aarch64 installer"
out="$(SETUP_OS=Darwin SETUP_ARCH=arm64 bash "$CONDA_SH" --dry-run 2>&1)"
assert_match "$out" "Miniforge3-MacOSX-arm64\.sh" "macOS arm64 installer"
out="$(SETUP_OS=Darwin SETUP_ARCH=x86_64 bash "$CONDA_SH" --dry-run 2>&1)"
assert_match "$out" "Miniforge3-MacOSX-x86_64\.sh" "macOS x86_64 installer"
done_box

echo; echo "=== Scenario B: unsupported systems are refused ==="
new_box; fake_curl
out="$(SETUP_OS=MINGW64_NT-10.0 SETUP_ARCH=x86_64 bash "$CONDA_SH" 2>&1)"; code=$?
assert_exit "$code" 2 "Windows shells exit 2"
assert_match "$out" "Miniforge3-Windows-x86_64\.exe" "and name the Windows installer to run by hand"
out="$(SETUP_OS=Linux SETUP_ARCH=riscv64 bash "$CONDA_SH" 2>&1)"; code=$?
assert_exit "$code" 2 "an unknown CPU exits 2"
done_box

echo; echo "=== Scenario C: conda already installed ==="
new_box; fake_curl
mkdir -p "$BOX/home/miniforge3/bin"; cp "$BOX/fake_conda" "$BOX/home/miniforge3/bin/conda"
out="$(SETUP_OS=Linux SETUP_ARCH=x86_64 bash "$CONDA_SH" 2>&1)"; code=$?
assert_exit "$code" 0 "exits 0"
assert_match "$out" "already" "says conda is already there"
assert_no_match "$(cat "$BOX/calls.log")" "curl" "downloads nothing"
done_box
new_box; fake_curl
cp "$BOX/fake_conda" "$BOX/fakebin/conda"
out="$(SETUP_OS=Linux SETUP_ARCH=x86_64 bash "$CONDA_SH" 2>&1)"
assert_match "$out" "already" "a conda already on PATH counts too"
done_box

echo; echo "=== Scenario D: install (fake download and installer) ==="
new_box; fake_curl
out="$(SETUP_OS=Linux SETUP_ARCH=x86_64 CONDA_DIR="$BOX/opt/mf" bash "$CONDA_SH" 2>&1)"; code=$?
assert_exit "$code" 0 "exits 0"
assert_match "$(cat "$BOX/calls.log")" "curl https://github.com/conda-forge/miniforge/releases/latest/download/Miniforge3-Linux-x86_64.sh" "downloads the conda-forge Miniforge installer"
assert_true "[ -x '$BOX/opt/mf/bin/conda' ]" "CONDA_DIR chooses where it goes"
assert_match "$out" "export PATH=\"$BOX/opt/mf/bin:\\\$PATH\"" "prints the PATH line to add"
done_box

echo; echo "=== Scenario E: setup-pwsh when pwsh is already on PATH ==="
new_box; fake_curl
printf '#!/usr/bin/env bash\necho 7.4.0\n' > "$BOX/fakebin/pwsh"; chmod +x "$BOX/fakebin/pwsh"
out="$(bash "$PWSH_SH" 2>&1)"; code=$?
assert_exit "$code" 0 "exits 0"
assert_match "$out" "already" "says pwsh is already there"
assert_no_match "$(cat "$BOX/calls.log")" "conda create" "creates nothing"
done_box

echo; echo "=== Scenario F: setup-pwsh with conda installed ==="
new_box; fake_curl
mkdir -p "$BOX/home/miniforge3/bin"; cp "$BOX/fake_conda" "$BOX/home/miniforge3/bin/conda"
out="$(bash "$PWSH_SH" 2>&1)"; code=$?
assert_exit "$code" 0 "exits 0"
assert_match "$(cat "$BOX/calls.log")" "conda create -y -p $BOX/home/miniforge3/envs/pwsh -c conda-forge powershell" "creates a pwsh env from conda-forge"
assert_true "[ -x '$BOX/home/miniforge3/envs/pwsh/bin/pwsh' ]" "pwsh is installed in it"
assert_match "$out" "7\.9\.9" "reports the installed version"
assert_match "$out" "export PATH=\"$BOX/home/miniforge3/envs/pwsh/bin:\\\$PATH\"" "prints the PATH line to add"
out="$(bash "$PWSH_SH" 2>&1)"
assert_match "$out" "already" "a second run finds the env and changes nothing"
done_box

echo; echo "=== Scenario G: setup-pwsh installs conda first, and dry run ==="
new_box; fake_curl
out="$(SETUP_OS=Linux SETUP_ARCH=x86_64 bash "$PWSH_SH" --dry-run 2>&1)"; code=$?
assert_exit "$code" 0 "dry run exits 0"
assert_match "$out" "Miniforge3-Linux-x86_64\.sh" "would install conda first"
assert_match "$out" "conda create -y -p .*/envs/pwsh -c conda-forge powershell" "then would create the pwsh env"
assert_true "[ ! -s '$BOX/calls.log' ]" "a dry run runs nothing"
out="$(SETUP_OS=Linux SETUP_ARCH=x86_64 PWSH_ENV="$BOX/pw" bash "$PWSH_SH" 2>&1)"; code=$?
assert_exit "$code" 0 "a real run (with fakes) exits 0"
assert_true "[ -x '$BOX/home/miniforge3/bin/conda' ] && [ -x '$BOX/pw/bin/pwsh' ]" "installs conda, then pwsh in PWSH_ENV"
done_box

echo; echo "=== Scenario H: the Makefile has both targets ==="
help="$(make -s -C "$REPO" help 2>&1)"
assert_match "$help" "make conda" "make help lists make conda"
assert_match "$help" "make setup-pwsh" "make help lists make setup-pwsh"
dry="$(SETUP_OS=Linux SETUP_ARCH=x86_64 HOME=/nonexistent-home PATH=/usr/bin:/bin make -s -C "$REPO" setup-pwsh DRY_RUN=1 2>&1)"
assert_match "$dry" "conda-forge powershell" "make setup-pwsh DRY_RUN=1 passes --dry-run through"

echo
echo "$TOTAL checks, $FAILURES failed"
[ "$FAILURES" -eq 0 ]
