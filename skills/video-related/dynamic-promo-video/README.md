# dynamic-promo-video

Build a short (~25-45s, 1280x720) narrated promo or intro video for a library,
app or product: animated HTML scenes with zoom/tilt camera moves over real
screenshots, rendered frame by frame with Playwright, encoded with ffmpeg, a
TTS voiceover, and background music that ducks under the voice.

```text
/dynamic-promo-video make a 30s launch video for <repo or product>
```

## What's inside

| Path | What it is |
| --- | --- |
| [`SKILL.md`](SKILL.md) | The workflow the agent follows. |
| [`assets/template/index.html`](assets/template/index.html) | Deterministic 6-scene starter (cover, problem, product camera, install, usage, end card). |
| [`scripts/render.js`](scripts/render.js) | Preview frames, thumbnail, full frame render and silent MP4 encode. |
| [`scripts/timing.py`](scripts/timing.py) | Retimes scenes to fit the voice clips; prints `NB` and the mix arguments. |
| [`scripts/music.py`](scripts/music.py) | Synthesizes a simple calm or energetic track (numpy). |
| [`scripts/mix.py`](scripts/mix.py) | Mixes voice + ducked music onto the silent video. |
| [`scripts/verify.py`](scripts/verify.py) | Checks streams, durations, loudness per second; extracts frames to look at. |
| [`references/`](references/) | Scene engine, real screenshots, voiceover, music and mix details. |
| [`tests/`](tests/) | Unit and end-to-end tests for the scripts and template. |

## Requirements

Node with Playwright and Chromium, ffmpeg/ffprobe, Python 3 with numpy. A TTS
connector (e.g. ElevenLabs) for the narration; a connected browser only if real
web pages must be screenshotted.

## Quick run

```sh
cp SKILL_DIR/assets/template/index.html .
node SKILL_DIR/scripts/render.js index.html --preview 0,6,12,17,23,29 --thumbnail thumbnail.png
python3 SKILL_DIR/scripts/timing.py --authored 0,4,9,15,21,26,31 --clips vo0.mp3 vo1.mp3 vo2.mp3 vo3.mp3 vo4.mp3 vo5.mp3
node SKILL_DIR/scripts/render.js index.html --encode promo_silent.mp4
python3 SKILL_DIR/scripts/music.py --style energetic --duration 33 --out music.wav
python3 SKILL_DIR/scripts/mix.py --video promo_silent.mp4 --music music.wav --voice 0.3:vo0.mp3 ... --out promo_final.mp4
python3 SKILL_DIR/scripts/verify.py promo_final.mp4 --frames 2,6,12,18,24,30
```

## Install

```sh
npx skills add sugatoray/aiskills --skill dynamic-promo-video
npx skills add sugatoray/aiskills --skill dynamic-promo-video --global
```

Or, in Claude Code:

```
/plugin marketplace add sugatoray/aiskills
/plugin install video-related-skills@sugatoray
```
