# Maintaining scrolls-help

This file is for people maintaining the `scrolls-help` skill itself — it is
**not** read as part of carrying out a user's `/scrolls-help` request.
`SKILL.md` never references it, so it plays no part in any invocation; if
you're here to answer a `/scrolls-help` request, you want `SKILL.md`
instead.

## Keeping `references/HELP.md` in sync

`references/HELP.md` is this skill's own canonical reference — the file
`SKILL.md` tells the agent to read and present to users. It needs to stay
accurate as `scrolls-setup`/`scrolls-update`/`scrolls-hide`/`scrolls-unhide`
evolve, since it's the thing users are told to trust, in chat and on the
rendered page alike.

If you notice it has drifted from what those four skills actually do (a
flag behaves differently than documented, a new flag exists that isn't
listed), update it directly — it's this skill's own reference file, not
part of any user's project, so editing it is a normal maintenance change
like editing any other file in this repo.

## Tests

`tests/` holds the Red/Green regression suite (bash + PowerShell) for
`scripts/open_help.sh`/`scripts/open_help.ps1`. Run it after touching
either launcher or `scripts/serve_help.py`.
