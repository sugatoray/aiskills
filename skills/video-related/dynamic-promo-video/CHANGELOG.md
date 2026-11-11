# Changelog

All notable changes to this skill are documented here.
Format based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [1.3.0] - 2026-11-11

### Added

- `--demo` flag: builds the demo video from the bare template in one command
  with `scripts/demo.py`. Music only by default (energetic track, music level
  0.6); narrated when a voice flag is given, at music level 0.3 with ducking.
  The API-key route uses `demo.py --voice-id`; clips made with the MCP connector
  go in with `--clips-dir`.
- `--voice` flag: narrate with the default ElevenLabs voice
  `TABZn6CDfjMNGrsnGzzD`.
- `assets/demo/narration.txt`: six narration lines for the demo, one per
  template scene.
- `timing.py --write-html PAGE`: writes the new `const NB = [...]` line into
  the page instead of pasting it by hand.
- Tests for `--write-html` and for `demo.py`, both music-only and narrated with
  stand-in clips (checks that a long clip stretches its scene). 24 tests in all.

### Changed

- A voice flag with no ElevenLabs route available now makes the agent ask
  (connect the connector, add a key or attach clips) instead of falling back to
  music only. Without a voice flag, a real project still falls back to music only.
- SKILL.md: an Inputs table for the three flags and a Demo section.
- README: flags table, narration routes, demo outputs, quick run for the demo,
  and a Tests section.

## [1.2.0] - 2026-11-11

### Added

- `--voice-elevenlabs=<voice-id>` flag; default voice `TABZn6CDfjMNGrsnGzzD`.
- Narration route selection: the ElevenLabs MCP connector, else an API key
  (`ELEVENLABS_API_KEY` or a network secret for `api.elevenlabs.io`), else a
  music-only video.
- `scripts/tts_elevenlabs.py`: one clip per scene from a narration file;
  `--dry-run`, skips existing clips, `--force` to redo chosen scenes, never
  retries a paid request, stops at once on 401/403/404.
- Tests for the TTS script that replace the network call, so they spend no
  credits.

### Changed

- `references/voiceover.md` rewritten around the routes: MCP connector, API
  key, neither.

## [1.1.0] - 2026-11-11

### Added

- `assets/template/index.html`: deterministic 6-scene starter with the
  helpers, time warp, crossfades, perspective camera and typing effect.
- `scripts/render.js` (preview, thumbnail, render, encode), `scripts/timing.py`
  (retime scenes to the voice clips), `scripts/music.py` (calm / energetic
  synthesized track), `scripts/mix.py` (voice + ducked music, `--audio-from`,
  `--dry-run`), `scripts/verify.py` (streams, durations, loudness per second,
  frames).
- `references/` for the scene engine, screenshots, voiceover, music and mix.
- `tests/test_scripts.py`, README, CHANGELOG, maintainer notes and agent
  metadata.

### Changed

- `SKILL.md` is now the workflow only; details moved to `references/` and
  inline code to `scripts/`.

### Fixed

- Template product scene: the zoomed window no longer covers the caption.
- `verify.py`: a short tail of audio is no longer reported as a silent second,
  and the last frame of short or low-fps clips is extracted reliably.

## [1.0.0] - 2026-11-10

### Added

- `/dynamic-promo-video` skill: storyboard, HTML scene engine, Playwright
  render, ffmpeg encode, TTS voiceover, music, mix and verification steps.
- Repository frontmatter (MIT license, metadata), the `video-related-skills`
  plugin and marketplace entry.
