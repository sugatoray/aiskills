---
name: dynamic-promo-video
description: "Build a short narrated promo/intro video (HTML scenes, zoom/tilt, voiceover, music) for a library, app or product. Use for explainer or launch videos made from code, real screenshots and TTS."
license: MIT
metadata:
  name: dynamic-promo-video
  type: skill
  author: sugatoray
  version: "1.1.0"
  source_url: "https://github.com/sugatoray/aiskills/tree/master/skills/video-related/dynamic-promo-video"
---

# Dynamic promo video (HTML scenes + voiceover + music)

Produces a 1280x720, ~25-45s MP4: animated scenes in one HTML page, rendered frame by frame with Playwright, encoded with ffmpeg, narrated with a TTS voice (e.g. ElevenLabs), with ducked background music.

`SKILL_DIR` below means this skill's folder. Only the template is copied into the work folder; the scripts run from `SKILL_DIR/scripts/` (each has `--help`). Needs Node + Playwright/Chromium (preinstalled in cloud sessions; do not reinstall), ffmpeg/ffprobe, Python 3 with numpy.

| Step | Use |
| --- | --- |
| Scenes | `assets/template/index.html` · details: [references/scene-engine.md](references/scene-engine.md) |
| Real page screenshots | [references/screenshots.md](references/screenshots.md) |
| Voiceover | [references/voiceover.md](references/voiceover.md) · `scripts/timing.py` |
| Render + encode | `scripts/render.js` |
| Music, mix | `scripts/music.py`, `scripts/mix.py` · [references/music-and-mix.md](references/music-and-mix.md) |
| Check | `scripts/verify.py` |

## 0. Before building
- Research the subject first: README, package page, marketplace listing, install commands. Use real names, commands and versions. Do not invent features.
- Use the project's real branding (banner, icon, colors, fonts) and real screenshots from its docs where possible. Check the repo for docs images before drawing anything.
- Sandbox network is allowlisted: npm registry, marketplace and github.com web pages are usually blocked from the shell. Git clone of a public repo often works (use the add_repo tool, then clone). If the repo's own CLAUDE.md says to read docs first and the task is not editing the repo, say you are skipping them.
- Make a task list. Last task: check frames and audio, then deliver.

## 1. Storyboard (write the narration first)
Typical 6 scenes: (1) cover/title, (2) the problem, (3) the product in action, (4) install commands, (5) editor/extension usage, (6) end card with commands and links. The template has exactly these.
Write one narration line per scene (about 2.5-3 words per second). Scene length is set by the narration, not the other way round.

## 2. Build the scenes
Copy `SKILL_DIR/assets/template/index.html` into the work folder and edit it: brand CSS variables, scene text, real screenshots, camera keyframes. Rules that matter most:
- Everything is a function of `t` through `window.setT(t)`; no CSS animation, no timers.
- **Frame 0 is a finished cover** (social platforms use it as the preview). Scene 1 only fades out.
- Icons are simplified drawings, not official logos; say so unless official files are supplied.
- Do not reuse a class name a script queries with `querySelectorAll`.

## 3. Preview, then voice, then retime
```bash
node SKILL_DIR/scripts/render.js index.html --preview 0,6,12,17,23,29 --thumbnail thumbnail.png
```
Look at the preview frames before going on. Then produce the voice clips (see references/voiceover.md: one generation per scene, never re-run a paid generation) and retime:
```bash
python3 SKILL_DIR/scripts/timing.py --authored 0,4,9,15,21,26,31 --clips vo0.mp3 vo1.mp3 vo2.mp3 vo3.mp3 vo4.mp3 vo5.mp3
```
Paste the printed `const NB = [...]` into index.html. Scenes stretch to fit; the voice is never sped up.

## 4. Render, music, mix
```bash
node SKILL_DIR/scripts/render.js index.html --encode promo_silent.mp4
python3 SKILL_DIR/scripts/music.py --style energetic --duration <total> --out music.wav
python3 SKILL_DIR/scripts/mix.py --video promo_silent.mp4 --music music.wav --voice 0.3:vo0.mp3 ... --out promo_final.mp4
```
Use a licensed track instead of `music.py` when the user supplies one; if synthesized, say it is simple and synthesized. Copy the `--voice` arguments from timing.py's output. If only visuals change later, re-render and run `mix.py --audio-from <previous final>`.

## 5. Verify and deliver
```bash
python3 SKILL_DIR/scripts/verify.py promo_final.mp4 --frames <one time per scene>
```
- It must report both streams with near-equal durations; read the per-second dB line (voice present, music dipping under it).
- Look at frame 0, one frame per scene and the last frame in `check/`. Confirm no overlaps or clipped text.
- Say clearly which file has sound: keep the `_silent` / `_final` names.
- Send with SendUserFile (display render), plus `thumbnail.png`. Summarize in a few lines: what each scene shows, what is real vs. drawn, and what you could not verify (you have not listened to the audio).
- Offer a LinkedIn/social post note only if asked; keep claims to what the README documents (for example "early development").
