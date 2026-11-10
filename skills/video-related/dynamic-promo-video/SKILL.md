---
name: dynamic-promo-video
description: "Build a short narrated promo/intro video (HTML scenes, zoom/tilt, voiceover, music) for a library, app or product. Use for explainer or launch videos made from code, real screenshots and TTS."
license: MIT
metadata:
  name: dynamic-promo-video
  type: skill
  author: sugatoray
  version: "1.0.0"
  source_url: "https://github.com/sugatoray/aiskills/tree/master/skills/video-related/dynamic-promo-video"
---

# Dynamic promo video (HTML scenes + voiceover + music)

Produces a 1280x720, ~25-45s MP4: animated scenes built in HTML, rendered frame by frame with Playwright, encoded with ffmpeg, narrated with a TTS voice (e.g. ElevenLabs), with ducked background music.

## 0. Before building
- Research the subject first: README, package page, marketplace listing, install commands. Use real names, commands and versions. Do not invent features.
- Use the project's real branding (banner, icon, colors, fonts) and real screenshots from its docs where possible. Check the repo for docs images before drawing anything.
- Sandbox network is allowlisted: npm registry, marketplace and github.com web pages are usually blocked from the shell. Git clone of a public repo often works (use the add_repo tool, then clone). If the repo's own CLAUDE.md says to read docs first and the task is not editing the repo, say you are skipping them.
- Make a task list. Last task: check frames and audio, then deliver.

## 1. Storyboard (write the narration first)
Typical 6 scenes: (1) cover/title, (2) the problem, (3) the product in action, (4) install commands, (5) editor/extension usage, (6) end card with commands and links.
Write one narration line per scene (about 2.5-3 words per second). Scene length is set by the narration, not the other way round.

## 2. Scene engine (deterministic, one HTML file)
All scenes are `position:absolute` layers in one `index.html`. A global `window.setT(t)` sets every element's opacity/transform from time `t`. Rendering never relies on CSS animation or real time.
- Helpers: `cl`, `ease = 1-(1-x)^3`, `seg(t,a,b)` = clamped progress, `tf(el,p,dy)` = fade + rise.
- Scene visibility with 0.5s crossfade from a list `SC=[[id,start,end],...]`.
- **Frame 0 must be a finished cover**, not an empty fade-in. Social platforms use the first frame as the preview. Scene 1 is fully visible at t=0 and only fades out. Export that frame as `thumbnail.png` too.
- Retiming: keep animation authored in "old" time and map real time with a piecewise-linear warp: `NB` (new scene boundaries from audio lengths) to `OB` (authored boundaries). `window.setT=function(tt){const t=warp(tt);...}`.
- Dynamic camera on screenshots: wrap a window in a `perspective(1500px)` container, animate `rotateY/rotateX/rotateZ`, `scale` (1 to 1.4), `transform-origin`, and scroll the inner image with `translateY` along keyframes with smoothstep. Keep zoom away from neighbouring text columns.
- Typing effect: slice a command string by `seg(t,a,b)`. Blinking cursor with `Math.floor(t*2)%2`.
- Icons (npm, Homebrew, VS Code, etc.): inline `<symbol>` SVGs used via `<use>`. State they are simplified drawings, not official logos, unless official files are supplied.
- Pitfall: do not reuse a class name that a script queries with `querySelectorAll` (e.g. `.chip`), or those elements get hidden. Use unique class names.

## 3. Render
```js
const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1280,height:720}});
await p.goto('file://'+process.cwd()+'/index.html');const FPS=24,D=DURATION;
for(let i=0;i<FPS*D;i++){await p.evaluate(t=>setT(t),i/FPS);await p.screenshot({path:`frames/f_${String(i).padStart(4,'0')}.png`});}
await b.close();})();
```
- Always `rm -f frames/*` before a full render (stale frames get encoded otherwise).
- Render preview frames at chosen times first (`node render.js 2,7,11`) and look at them before the full render. Chromium and Playwright are preinstalled; do not reinstall.
- Encode: `ffmpeg -framerate 24 -i frames/f_%04d.png -c:v libx264 -preset veryfast -crf 20 -pix_fmt yuv420p out.mp4`.

## 4. Real page screenshots (GitHub, marketplace, docs)
- Shell and WebFetch usually cannot render those pages. Use the built-in browser (Claude_Browser tools) if the session is linked to the user's computer: load the tools with ToolSearch, call request_access for each site, navigate.
- Screenshots are saved as files on the container (path shown in the tool result under `tool-results/`); copy them into the video assets. Pass scale 1.
- Set a tall viewport (e.g. 1100x1727) with resize_window so one screenshot covers a lot at 800px wide; scroll with `window.scrollTo` and capture several shots (e.g. y=0,1650,3300). Stitch with PIL: paste later shots from row 55 on (to skip sticky headers) at offset `y*0.727`. Reset the viewport with preset desktop afterwards.
- If no browser is available, say so and ask the user to connect one; do not fake screenshots of live pages.

## 5. Voiceover (TTS connector)
- Create one flow, then one generation per scene (`generations_count:1`, same flow, voice id from the user). Never re-run a generation to retry: it costs credits.
- Read each clip's `duration_secs` from creative_get_flow_run_status. If the narration is longer than the scenes, retime the scenes (warp) with 0.3-0.6s padding; do not speed the voice up.
- The shell usually cannot download from the TTS provider's storage (403). Do not try workarounds. Give the user the flow link and the script with start times, and ask them to download and attach the clips in scene order; verify each clip's duration matches expectation with ffprobe.
- Voice start times: scene start + 0.3s.

## 6. Music
If no licensed track is supplied, synthesize one with numpy and write a WAV (mention it is synthesized and simple):
- Calm: pad chords + soft plucked arpeggio with echo, fade in 2s / out 2.5s.
- Energetic: ~124 BPM, four-on-the-floor kick (sine sweep), offbeat hats (differenced noise), claps on 2 and 4, offbeat bass, 16th-note arpeggio, chord pad (Am-F-C-G); build in softly before the beat drops.
- Normalize peaks to about 0.85. Match the final video duration.

## 7. Mix and mux
```
ffmpeg -i silent.mp4 -i vo0.mp3 ... -i vo5.mp3 -i music.wav -filter_complex \
"[1]adelay=300|300[a1];...;[a1]...[a6]amix=inputs=6:normalize=0,aformat=sample_rates=44100:channel_layouts=mono[v]; \
[7]aformat=sample_rates=44100:channel_layouts=mono,volume=0.3[m];[v]asplit[v1][v2]; \
[m][v1]sidechaincompress=threshold=0.03:ratio=8:attack=15:release=350[md]; \
[md][v2]amix=inputs=2:normalize=0:duration=longest,alimiter=limit=0.95[a]" \
-map 0:v -map "[a]" -c:v copy -c:a aac -b:a 192k -t DURATION final.mp4
```
adelay values are milliseconds per scene start. To change only visuals later, re-render silent frames and copy the audio track from the previous final: `-map 0:v -map 1:a -c copy`.

## 8. Verify and deliver
- `ffprobe` must show both a video and an audio stream with near-equal durations; run `volumedetect` and check a few 1s windows (voice present, music dipping).
- Look at frame 0, one frame per scene, and the last frame. Confirm no overlaps or clipped text.
- Say clearly which file has sound. A silent preview file is easy to confuse with the final one: name files `..._silent` or `..._final`.
- Send with SendUserFile (display render). Also send `thumbnail.png`. Summarize in a few lines: what each scene shows, what is real vs. drawn, and what you could not verify (you have not listened to the audio).
- Offer a LinkedIn/social post note only if asked; keep claims to what the README documents (for example "early development").