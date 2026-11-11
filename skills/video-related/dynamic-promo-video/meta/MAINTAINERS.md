# Maintaining dynamic-promo-video

For people developing this skill — not read as part of a
`/dynamic-promo-video` request (that's `../SKILL.md`).

## Layout

- `../SKILL.md` — the workflow; keep it short and point to references/scripts.
- `../references/` — details loaded only when a step needs them.
- `../assets/template/index.html` — generic starter; never put a real project's
  name, branding or screenshots in it.
- `../scripts/` — CLIs used by the workflow. Python scripts use only the
  standard library, except `music.py` (numpy). `tts_elevenlabs.py` uses urllib only; its
  tests replace the network call and never spend credits. The default voice id
  lives in `DEFAULT_VOICE` and in SKILL.md / references/voiceover.md; change all three together. `render.js` needs Playwright.
- `../scripts/demo.py` + `../assets/demo/<default|self>/` (`index.html`, `narration.txt`, `clips.json`)
  + `../assets/demo/clips/` (shared recordings)
  — the `--demo` variants. demo.py reads `OB` from the page. `default`: the
  template's scenes 1-6 (keep them identical to `assets/template/index.html`),
  then scenes 7-9 about this skill. `self`: six scenes about the skill.
  `assets/demo/clips/` holds each approved line once (voice TABZn6CDfjMNGrsnGzzD, with the
  spliced "Shoo-gaw-doe Ray" / "A.I. skills"); `--voice` reuses them so the
  narrated demos rebuild identically. If you change a narration line, replace
  its recording (and `clips/README.md`) and keep `clips.json` in step; a test
  checks that the maps match the lines, every recording is used and none is
  stored twice. Keep the install
  commands in step with the repo README.
- `../tests/test_scripts.py` — unit tests plus an end-to-end run of the
  template; tests skip when ffmpeg, numpy, Node or Playwright is missing.
- `../CHANGELOG.md` — update together with `metadata.version` in SKILL.md.

## Checks

From the repository root:

```sh
python3 -m unittest discover -s skills/video-related/dynamic-promo-video/tests -p 'test_*.py'
node --check skills/video-related/dynamic-promo-video/scripts/render.js
```

After changing the template, render previews of every scene and look at them:

```sh
cp skills/video-related/dynamic-promo-video/assets/template/index.html /tmp/promo/
node skills/video-related/dynamic-promo-video/scripts/render.js /tmp/promo/index.html --preview 0,6,12,17,23,29
```

## Contracts to keep

- `window.setT(t)` is pure: same `t`, same frame. No CSS animation or timers.
- Frame 0 is the finished cover (scene 1 has no fade-in).
- `window.DURATION` is the default render length.
- `timing.py` output lines (`const NB = [...]`, `mix.py args: ...`) are copied
  by the agent; keep their format stable.
- `verify.py` exits 1 when a stream is missing or durations differ.
