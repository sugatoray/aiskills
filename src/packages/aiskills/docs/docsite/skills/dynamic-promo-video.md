# dynamic-promo-video

Build a short narrated promo/intro video (HTML scenes, zoom/tilt, voiceover, music) for a library, app or product. Use for explainer or launch videos made from code, real screenshots and TTS.

| Property | Value |
| --- | --- |
| Group | `video-related-skills` (alias `video-related`) |
| Version | 1.5.0 |
| Starts | When you type `/dynamic-promo-video`, or your agent uses it when a task fits its description |
| License | MIT |
| Source | [skills/video-related/dynamic-promo-video](https://github.com/sugatoray/aiskills/tree/master/skills/video-related/dynamic-promo-video) |

## Install

For one agent (leave out `-a` for every agent `npx skills` finds):

<!-- verify -->
```bash
aiskills install -s dynamic-promo-video -a claude-code
```

```text
[aiskills] skills saved to ~/.config/sugatoray/aiskills/skills (flat layout)
[aiskills] bundled: dynamic-promo-video
[aiskills] running: npx -y skills@1.7.6 add ~/.config/sugatoray/aiskills --global --skill dynamic-promo-video --agent claude-code --yes
[aiskills] adding this install to the skills.sh count in the background (turn off: --no-stats)
```

Or the whole `video-related-skills` group:

```bash
aiskills install -G video-related -a claude-code
```

Into the current project instead: add `-p`. To remove it:

```bash
aiskills uninstall -s dynamic-promo-video
```

## What's inside

The files that ship with the skill, in `~/.config/sugatoray/aiskills/skills/dynamic-promo-video/`:

- `CHANGELOG.md`
- `README.md`
- `SKILL.md`
- `agents/claude-code.yaml`
- `agents/openai.yaml`
- `assets/demo/index.html`
- `assets/demo/narration.txt`
- `assets/template/index.html`
- `meta/MAINTAINERS.md`
- `references/music-and-mix.md`
- `references/scene-engine.md`
- `references/screenshots.md`
- `references/voiceover.md`
- `scripts/demo.py`
- `scripts/mix.py`
- `scripts/music.py`
- `scripts/render.js`
- `scripts/timing.py`
- `scripts/tts_elevenlabs.py`
- `scripts/verify.py`
- `tests/test_scripts.py`

See also: [All skills](README.md) · [README](https://github.com/sugatoray/aiskills/blob/master/skills/video-related/dynamic-promo-video/README.md) · [CHANGELOG](https://github.com/sugatoray/aiskills/blob/master/skills/video-related/dynamic-promo-video/CHANGELOG.md) · [Skill groups](../concepts/skill-groups.md)
