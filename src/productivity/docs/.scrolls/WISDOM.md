# WISDOM.md — Constraints, Traps, Ditches, and Wisdom

Hard-won lessons for this project. Read this LAST, right before editing code, so it's freshest in mind.

## Constraints — respect and conform to them
Things you must respect or conform to (external requirements, API contracts, platform limits).

- **The deck is one self-contained HTML file:** no CDNs, fonts, images or network calls. `test_file_has_no_external_dependencies` and `test_no_network_requests_on_load` enforce it.
- **Agenda text is only ever set with `textContent`**, never `innerHTML`. Saved agendas escape every `<` as `\u003c` (Save HTML and `build_deck.py` alike).
- **Two copies of the theme list:** `THEMES` exists in the page script and in `scripts/build_deck.py`, and a test checks that they match. Add a theme in both places, plus `tests/test_settings.py`.
- **Explicit invocation only:** `disable-model-invocation: true` in `SKILL.md`, and `allow_implicit_invocation: false` in `agents/openai.yaml`. The user asked for this.
- **Keep the user's names:** the button is "Save HTML" (from their spec), even though a mockup said "Download HTML".

## Traps — avoid them always
Specific bugs that have bitten this project before — avoid repeating them.

- **A literal closing script tag anywhere in the inline `<script>`, even in a comment, ends the script.** It blanked the whole page once. Write "closing script tag" in prose.
- **CSS transitions run on real time, not Playwright's fake clock.** A test that reads a colour straight after a state change sees a value halfway through the transition. Don't put transitions on properties the tests read, or settle the animations first.
- **Screenshots taken mid-animation lie:** a faded slide, a half-filled bar. Call the `SETTLE` helper in `test_screenshots.py` before capturing (finish finite animations, pause infinite ones).
- **`data-theme` on the theme cards makes each card pick up its own theme's colours.** Card text became unreadable until each card also got its own theme's background. That's intended now, so keep it.
- **A slide in a flex column with `justify-content: center` clips its top when the content overflows.** The shared grid cell with `align-content: safe center` avoids this; see MAINTAINERS → Slide alignment.
- **Check the demo data before writing a fixture assumption.** A test assumed demo item 4 had no sub-points; it has two.

## Ditches — bad patterns or decisions to avoid
Bad patterns or decisions to never take, and why they were rejected.

- **Don't ship TDD logs inside the skill.** The user removed `meta/tdd-logs/`: they get copied into every install, nobody using the skill reads them, and they go stale. The red/green story goes in commit messages and the PR.
- **Don't let the two Contents views read each other's DOM.** Both read and write the shared `draft`. That's what lets edits survive a view switch.
- **Don't map Reset to a gesture or a single key on touch.** It throws away the timer, so it stays an on-screen button.

## Wisdom — best practices and Red/Green TDD
Best practices worth reusing.

- Always use Red/Green TDD while developing or fixing code. Write the failing tests first, run them, and say how many failed, before implementing.
- **Use Playwright's fake clock for timers:** `page.clock.install()` before `goto`, then `page.clock.run_for(ms)`. A 10-minute countdown is tested in milliseconds.
- **Look at the screenshots after the tests go green.** That's how the off-screen editor buttons, the reversed ring gradient, unreadable theme cards and a clipped phone layout were caught. Then turn each finding into a failing test.
- **Mock up before redesigning.** For visual changes, render static mockups to PNG (scratchpad HTML plus Playwright) and get the user's pick before writing code.
- **In cloud sessions:** `pip install pytest playwright`, then launch Chromium with `executable_path="/opt/pw-browsers/chromium"`. `conftest.py` does this.
- **After changing the skill, run the npm package tests too:** `cd src/packages/aiskills && npm run docs && npm run banner:png && npm test`. They regenerate the skill's docs page and check the file list. `git add` new skill files first.
