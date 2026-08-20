# scrolls-update

Updates an existing `docs/.scrolls/` to reflect what happened in the
current session, following each file's own update rule instead of
appending blindly. Also idempotently backfills `SCROLLS.md`/`CLAUDE.md`/
`AGENTS.md` for a project set up before those existed.

The counterpart to `/scrolls-setup` — run this one every session
afterward. For the full flag reference and usage examples, run
`/scrolls-help`.

- **Runtime instructions**: [`SKILL.md`](SKILL.md)
- **Development notes**: [`meta/MAINTAINERS.md`](meta/MAINTAINERS.md)
- **Version history**: [`CHANGELOG.md`](CHANGELOG.md)
- **Skill family**: [`../README.md`](../README.md)

License: MIT
