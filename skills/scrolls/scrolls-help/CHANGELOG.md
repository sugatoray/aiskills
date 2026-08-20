# Changelog

All notable changes to the `scrolls-help` skill are documented here.
Format based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [2.1.0] - 2026-08-20

### Changed

- Synced to `2.1.0` to keep this skill's version locked in step with
  the other four `scrolls-*` skills (see `../meta/MAINTAINERS.md`'s
  Versioning entry). No functional change of its own in this release —
  the minor bump reflects `scrolls-setup`/`scrolls-update`'s new
  idempotent `CLAUDE.md`/`SCROLLS.md`/`AGENTS.md` backfill, not
  anything in `scrolls-help` itself. See `../CHANGELOG.md`.

## [2.0.0] - 2026-08-20

### Changed

- Synced to `2.0.0` to keep this skill's version locked in step with
  the other four `scrolls-*` skills (see `../meta/MAINTAINERS.md`'s
  Versioning entry). No functional change of its own in this release —
  the major bump reflects a breaking change elsewhere in the family
  (`scrolls-hide`/`scrolls-unhide`'s rewrite-target change), not
  anything in `scrolls-help` itself. See `../CHANGELOG.md`.

## [1.3.0] - 2026-08-20

### Added

- `meta/SECURITY.md` documenting the skill's threat model, file-system
  scope, the local `-e`/`--online` server's network exposure, its
  process-lifecycle bounds, dependencies, and known limitations.

### Changed

- Moved `MAINTAINERS.md` and `SECURITY.md` into a `meta/` subfolder, for
  parity with the rest of the `scrolls-*` family and to keep the skill's
  top level uncluttered; updated every cross-reference to match.

### Fixed

- `references/HELP.md` updated to document the `--stop`/idle-timeout
  behavior added in 1.1.0, which it had missed.

## [1.2.0] - 2026-08-20

### Fixed

- Resolved a Snyk (E004) prompt-injection false positive: `SKILL.md`
  stated it "does not modify anything outside its own reference file"
  and then, in a `## Development` section, instructed regenerating that
  same reference file — out of context, that read as a later
  instruction overriding an earlier scope restriction. Moved
  maintainer-only procedure into a new `MAINTAINERS.md`, which
  `SKILL.md` only names and never quotes, and tightened the scope note
  to state the one exception precisely instead of two paragraphs away
  from the restriction it qualifies.

## [1.1.0] - 2026-08-20

### Added

- `--stop <port>` / `--stop --all` on both launchers (`open_help.sh`,
  `open_help.ps1`) to terminate the local `-e`/`--online` server
  without hunting down a PID.
- Automatic idle-timeout (default 30 min) and max-lifetime (default 2
  hours) shutdown for the local server, configurable via
  `SCROLLS_HELP_IDLE_TIMEOUT` / `SCROLLS_HELP_MAX_LIFETIME` /
  `SCROLLS_HELP_CHECK_INTERVAL`.
- Regression test coverage for `--stop` and the idle-timeout
  auto-shutdown, in both `tests/test_open_help.sh` and
  `tests/test_open_help.ps1`.

### Changed

- Switched `serve_help.py` from a single-threaded
  `socketserver.TCPServer` to `http.server.ThreadingHTTPServer`, so one
  slow or held-open connection can't block other requests.

### Security

- The server previously ran as a detached background process with no
  bounded lifetime and no way to stop it besides finding and killing
  its PID — the idle-timeout/max-lifetime/`--stop` additions above
  address that.

## [1.0.0] - 2026-08-18

### Added

- Initial release: presents `references/HELP.md`, the whole
  `scrolls-*` family's example-driven reference, in chat — or, with
  `-e`/`--online`, renders it as a styled local HTML page (light/dark
  and colorize/plain toggles) served on an OS-assigned localhost port.
