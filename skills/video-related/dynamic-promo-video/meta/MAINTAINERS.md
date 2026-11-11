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
- `../scripts/demo.py` + `../assets/demo/index.html` + `../assets/demo/narration.txt`
  — the `--demo` video about this skill. demo.py reads `OB` from the page. Keep
  one narration line per scene, and keep the install commands on the page in
  step with the repo README (a test checks them). The generic template stays
  free of project names.
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
