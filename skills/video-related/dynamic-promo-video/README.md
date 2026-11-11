# dynamic-promo-video

Build a short (~25-45s, 1280x720) narrated promo or intro video for a library,
app or product: animated HTML scenes with zoom/tilt camera moves over real
screenshots, rendered frame by frame with Playwright, encoded with ffmpeg, an
ElevenLabs voiceover, and background music that ducks under the voice.

## Usage

```text
/dynamic-promo-video make a 30s launch video for <repo or product>
/dynamic-promo-video --voice make a launch video for <repo>
/dynamic-promo-video --voice-elevenlabs=<voice-id> make a launch video for <repo>
/dynamic-promo-video --demo
/dynamic-promo-video --demo --voice
/dynamic-promo-video --demo --voice-elevenlabs=<voice-id>
```

### Flags

| Flag | What it does |
| --- | --- |
| `--demo` | Builds the demo video from the bare template: six placeholder scenes and an energetic synthesized track. No research or editing. Music only unless a voice flag is given. |
| `--voice` | Narrates with the default ElevenLabs voice, `TABZn6CDfjMNGrsnGzzD`. |
| `--voice-elevenlabs=<voice-id>` | Narrates with that ElevenLabs voice. A bare `--voice-elevenlabs` is the same as `--voice`. |

### Narration

ElevenLabs is used through the first route that is available:

1. the **ElevenLabs MCP connector**, one `creative_generate_speech` call per scene;
2. an **API key**: `ELEVENLABS_API_KEY`, or a network secret for
   `api.elevenlabs.io`, used by [`scripts/tts_elevenlabs.py`](scripts/tts_elevenlabs.py).

| Situation | Result |
| --- | --- |
| Real project, no voice flag | Narrated with the default voice if a route exists, else music only. |
| `--demo`, no voice flag | Music only. |
| Any voice flag, a route exists | Narrated with that voice. |
| Any voice flag, no route | The agent says so and asks you to connect the connector, add a key or attach clips. It never drops the voice silently. |

Each generated clip costs ElevenLabs credits. Clips are made once per scene and
never re-generated to retry. If ElevenLabs rejects a voice id, the agent asks for
another instead of picking one itself.

### The demo

`--demo` runs [`scripts/demo.py`](scripts/demo.py). With a voice, it speaks the six
lines in [`assets/demo/narration.txt`](assets/demo/narration.txt), one per
scene, and stretches a scene when its line runs long. It writes to `promo-demo/`:
`demo_final.mp4`, `thumbnail.png`, `demo_silent.mp4`, `music.wav`, the voice
clips (if narrated) and frames to check in `check/`.

## What's inside

| Path | What it is |
| --- | --- |
| [`SKILL.md`](SKILL.md) | The workflow the agent follows. |
| [`assets/template/index.html`](assets/template/index.html) | Deterministic 6-scene starter (cover, problem, product camera, install, usage, end card). |
| [`assets/demo/narration.txt`](assets/demo/narration.txt) | The demo's six narration lines. |
| [`scripts/demo.py`](scripts/demo.py) | `--demo` in one command: template, music, optional narration, render, mix, verify. |
| [`scripts/render.js`](scripts/render.js) | Preview frames, thumbnail, full frame render and silent MP4 encode. |
| [`scripts/tts_elevenlabs.py`](scripts/tts_elevenlabs.py) | One narration clip per scene via the ElevenLabs API; `--dry-run`, skips existing clips, never retries. |
| [`scripts/timing.py`](scripts/timing.py) | Retimes scenes to fit the voice clips; `--write-html` writes the new timings into the page. |
| [`scripts/music.py`](scripts/music.py) | Synthesizes a simple calm or energetic track (numpy). |
| [`scripts/mix.py`](scripts/mix.py) | Mixes voice + ducked music onto the silent video; `--audio-from` reuses an earlier mix. |
| [`scripts/verify.py`](scripts/verify.py) | Checks streams, durations and loudness per second; extracts frames to look at. |
| [`references/`](references/) | Scene engine, real screenshots, voiceover, music and mix details. |
| [`tests/`](tests/) | Unit and end-to-end tests for the scripts, template and demo. |

## Requirements

- Node with Playwright and Chromium, ffmpeg/ffprobe, Python 3 with numpy.
- Optional: the ElevenLabs MCP connector or an API key, for narration.
- Optional: a connected browser, only if real web pages must be screenshotted.

## Quick run

`SKILL_DIR` is this folder.

The demo:

```sh
python3 SKILL_DIR/scripts/demo.py                                  # music only
python3 SKILL_DIR/scripts/demo.py --voice-id TABZn6CDfjMNGrsnGzzD  # narrated (API key)
python3 SKILL_DIR/scripts/demo.py --clips-dir clips/               # narrated (clips from the MCP connector)
```

A real video, step by step:

```sh
cp SKILL_DIR/assets/template/index.html .
node SKILL_DIR/scripts/render.js index.html --preview 0,6,12,17,23,29 --thumbnail thumbnail.png
python3 SKILL_DIR/scripts/tts_elevenlabs.py --script narration.txt --voice TABZn6CDfjMNGrsnGzzD
python3 SKILL_DIR/scripts/timing.py --authored 0,4,9,15,21,26,31 --clips vo0.mp3 vo1.mp3 vo2.mp3 vo3.mp3 vo4.mp3 vo5.mp3 --write-html index.html
node SKILL_DIR/scripts/render.js index.html --encode promo_silent.mp4
python3 SKILL_DIR/scripts/music.py --style energetic --duration 33 --out music.wav
python3 SKILL_DIR/scripts/mix.py --video promo_silent.mp4 --music music.wav --voice 0.3:vo0.mp3 ... --out promo_final.mp4
python3 SKILL_DIR/scripts/verify.py promo_final.mp4 --frames 2,6,12,18,24,30
```

`timing.py` prints the total duration (for `music.py --duration`) and the
`--voice` arguments for `mix.py`. A full 31s render takes about a minute.

## Tests

From the repository root:

```sh
python3 -m unittest discover -s skills/video-related/dynamic-promo-video/tests -p 'test_*.py'
```

The tests never call ElevenLabs: the network call is replaced by a fake, and
the narrated demo uses silent stand-in clips. Tests that need ffmpeg, numpy,
Node or Playwright are skipped when those are missing.

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
