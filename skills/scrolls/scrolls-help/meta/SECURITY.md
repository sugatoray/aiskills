# Security posture: scrolls-help

What this skill can touch, what it exposes, and why, for anyone auditing
it (human or automated). See `../SKILL.md` for behavior and
`MAINTAINERS.md` for upkeep — this file is neither; it documents design
decisions.

## Threat model

`scrolls-help` is a read-only reference viewer: it presents
`references/HELP.md` in chat, or renders it to a local HTML page. It never
takes arbitrary input and turns it into a file path, shell command, or
network request — the only "input" that changes its behavior at all is the
presence or absence of `-e`/`--online` on the invocation text. There's no
user-supplied data reflected into HTML, no shell interpolation of anything
outside the skill's own fixed argument list, and nothing here handles
credentials, tokens, or secrets. Anything below this line is either "what
stops it from touching things it shouldn't" or "what stops the one piece of
runtime surface (the local server) from lingering unbounded."

## File-system scope

- **Reads:** its own `references/HELP.md` — nothing from the user's
  project, and nothing outside its own skill directory.
- **Writes:** nothing, ever, while carrying out a `/scrolls-help` request.
  The one file this skill's source ever writes — `references/HELP.md` — is
  updated only as a maintainer task (see `MAINTAINERS.md` for that
  workflow), never as part of answering a user.
- **Never touches:** user code, user files, git state, or anything outside
  this skill's own directory.

## Network exposure (`-e`/`--online`)

The optional local viewer (`scripts/serve_help.py`, launched by
`open_help.sh`/`open_help.ps1`) is the only network-facing part of this
skill:

- Binds `127.0.0.1` only, on a port the OS assigns — never `0.0.0.0` or any
  other interface, so it's unreachable from the network, only from
  processes on the same machine.
- Serves exactly one precomputed response (the rendered `HELP.md`) to every
  `GET`, generated once at startup from a local file — there's no request
  parsing, no query-string or path handling, no user input reaches the
  renderer, so there's no injection surface in the served content itself.
  All markdown-to-HTML conversion escapes text via `html.escape` before any
  markup is added back in (see `highlight_shell`/`inline` in
  `serve_help.py`), rather than trusting the source not to contain `<`/`>`/
  `&`.
- Plain HTTP, no authentication. Both are acceptable *because* the bind is
  loopback-only and the content is non-sensitive static documentation —
  anyone who can reach `127.0.0.1` on this machine could already read
  `references/HELP.md` directly from disk. This would need revisiting if
  the skill ever served anything sensitive or bound beyond loopback; it
  should not be treated as a safe pattern to copy for either of those.
- Uses `http.server.ThreadingHTTPServer` (not a single-threaded
  `TCPServer`) so one slow or held-open connection can't block every other
  client from being served.

## Process lifecycle

The launcher scripts start the server detached (`nohup`+`disown` on bash,
`Start-Process` on PowerShell) so it outlives the invoking shell — that's
what makes the reported link stay open after the skill finishes. Left
unbounded, a detached, always-listening background process with no
supervision or stop path is exactly the shape a security scanner (or a
careful human reviewer) should flag, so it's bounded on three sides:

- **Idle timeout:** shuts itself down after `SCROLLS_HELP_IDLE_TIMEOUT`
  seconds with no requests (default 1800s / 30 min).
- **Max lifetime:** shuts itself down after `SCROLLS_HELP_MAX_LIFETIME`
  seconds regardless of activity (default 7200s / 2 hours).
- **Explicit stop:** `open_help.sh --stop <port>` / `open_help.ps1 --stop
  <port>` (or `--stop --all`) terminates a specific instance, or every
  tracked instance, without the caller needing to remember a PID.

Each running instance is tracked by a small state file (pid + port) under
`$TMPDIR/scrolls-help-servers/`, pruned automatically (on both `--stop` and
normal startup) whenever the recorded pid is no longer alive — so a
forcibly-killed server (e.g. `Stop-Process -Force` on Windows, where a
SIGTERM-equivalent doesn't run Python's signal handler) never leaves stale
state behind for more than one subsequent `--stop`/startup.

## Dependencies

Everything here is Python 3.9+ standard library — `http.server`,
`socketserver`-adjacent (`ThreadingHTTPServer`), `re`, `html`, `json`,
`threading`, `signal`, `webbrowser` — plus bash/PowerShell for the
launchers. No third-party packages, no install step, and nothing is
fetched over the network at runtime; the only bytes served come from
`references/HELP.md` on disk.

## Design notes: instruction hygiene

`../SKILL.md` is read by the agent as live instructions on every
invocation. Mixing maintainer-only procedural text ("update this file")
into the same document as a runtime scope restriction ("don't modify
anything") reads, out of context, as a later instruction overriding an
earlier constraint — a shape automated prompt-injection detectors are
built to catch, and a real finding was raised against an earlier version
of `SKILL.md` for exactly this. The fix wasn't to argue the instructions were compatible (a
human reading both paragraphs already sees the file was always the one
documented exception); it was to stop putting mixed-audience instructions
in the document the agent reads at invocation time — maintainer procedure
now lives entirely in `MAINTAINERS.md`, which `SKILL.md` only names, never
quotes.

## Known, accepted limitations

- No auth on the local port: any local user/process on the same machine
  can read the served page for as long as it's up. Acceptable for static,
  non-sensitive documentation; would not be acceptable if this skill ever
  served anything else.
- Plain HTTP, not HTTPS: acceptable only because traffic never leaves
  loopback.
- Graceful shutdown (which also removes the state file immediately) relies
  on the OS delivering a signal Python can catch; a forceful kill on some
  platforms skips that, leaving a stale state file until the next
  `--stop`/startup prunes it. Never leaves a process running past that —
  only bookkeeping is delayed.

## Reporting a concern

Open an issue against the repository this skill ships in
(`sugatoray/aiskills`), describing the concern and, if possible, which
file/line it applies to.
