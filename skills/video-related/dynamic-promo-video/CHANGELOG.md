# Changelog

All notable changes to this skill are documented here.
Format based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [1.1.0] - 2026-11-11

### Added

- `assets/template/index.html`: deterministic 6-scene starter with the
  helpers, time warp, crossfades, perspective camera and typing effect.
- `scripts/render.js` (preview, thumbnail, render, encode), `scripts/timing.py`
  (retime scenes to the voice clips), `scripts/music.py` (calm / energetic
  synthesized track), `scripts/mix.py` (voice + ducked music),
  `scripts/verify.py` (streams, durations, loudness, frames).
- `references/` for the scene engine, screenshots, voiceover, music and mix.
- `tests/test_scripts.py`, README, maintainer notes and agent metadata.

### Changed

- `SKILL.md` is now the workflow only; details moved to `references/` and
  inline code to `scripts/`.

## [1.0.0] - 2026-11-10

### Added

- `/dynamic-promo-video` skill: storyboard, HTML scene engine, Playwright
  render, ffmpeg encode, TTS voiceover, music, mix and verification steps.
