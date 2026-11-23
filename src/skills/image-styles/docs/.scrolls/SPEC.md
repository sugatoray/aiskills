# SPEC.md — Feature Spec

What image-styles skills does, feature by feature. Add a section per feature when it ships — describe *what* it does and *why* it matters to a user, not the implementation detail (that belongs in code comments or `WISDOM.md`).

Filled in from the two skills' `CHANGELOG.md` files (both 1.0.0 on 2026-11-11 and 1.0.1 on 2026-11-16) and their `SKILL.md` contracts. The CHANGELOGs stay the authoritative record. Both skills run only when invoked by name, and both produce a real image with the agent's image tool, never just a prompt or a description.

## `/artwallbg`: a subject in front of a monumental spray-painted wall (1.0.0, PR #141)
`/artwallbg <context>` makes a vivid illustrated scene of the subject (a girl, if no context is given) in front of a huge wall covered in spray-paint art, with the wall's scale as the focal point. The user's own style, aspect ratio, composition and content details are honored. No text is added unless asked for. `assets/EXAMPLES.md` shows example prompts and their outputs.

## `/commentdrop`: floating social comment cards on a still image (1.0.0, PR #141)
`/commentdrop` edits an image so it looks like a video edit with comments floating over it.

- **Which image:** the one supplied, or the most recent relevant image in the conversation when it's clearly meant; otherwise the skill asks. A separate reference image can guide the card style and is never mistaken for the target.
- **Which comments:** supplied comments are used faithfully, usernames included. Without them, the skill invents a few short, fitting reactions with fictional handles. Comments are simulated, not evidence of real engagement.
- **The look:** by default a small set of staggered cards (rounded light rectangles, soft shadows, round avatars, bold usernames, subtle timestamps, small hearts) that read as overlay graphics, placed so the main subject stays visible. The source image, aspect ratio and composition are kept, and the user's count, wording, platform, placement or style wins.
- **Honest output:** exact text is kept as accurately as the tool allows, without claiming verbatim accuracy it hasn't checked.

`assets/EXAMPLES.md` shows example prompts and their outputs.

## `EXAMPLES.md` naming (1.0.1, PR #265)
Both skills' example files are `assets/EXAMPLES.md`, the name every skill in the repository uses (renamed from `EXAMPLE.md`; content unchanged).

<!--
## <Feature name>
What it does, from a user's perspective. A pointer to where it lives in the code
(`path/to/file.ext:line`) if that saves the next reader time.
-->
