#!/usr/bin/env bash
# Launches serve_help.py in the background on an OS-assigned localhost
# port and prints the URL once the server confirms it's ready — rather
# than guessing a fixed startup delay. The server keeps running after
# this script exits; prints its PID so the caller can stop it later.
set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

if [ "${1:-}" = "--stop" ]; then
  exec python3 "$HERE/serve_help.py" --stop "${@:2}"
fi

LOGFILE="$(mktemp -t scrolls-help-server.XXXXXX)"

nohup python3 "$HERE/serve_help.py" >"$LOGFILE" 2>&1 &
PID=$!
disown "$PID" 2>/dev/null || true

for _ in $(seq 1 40); do
  if grep -q '^http://' "$LOGFILE" 2>/dev/null; then
    head -n1 "$LOGFILE"
    PORT="$(head -n1 "$LOGFILE" | sed -E 's#.*:([0-9]+)/#\1#')"
    echo "(pid $PID — stop it with: $0 --stop $PORT; it also shuts itself down after being idle; log at $LOGFILE)"
    exit 0
  fi
  if ! kill -0 "$PID" 2>/dev/null; then
    echo "Server process exited unexpectedly:" >&2
    cat "$LOGFILE" >&2
    exit 1
  fi
  sleep 0.25
done

echo "Timed out waiting for the server to start:" >&2
cat "$LOGFILE" >&2
exit 1
