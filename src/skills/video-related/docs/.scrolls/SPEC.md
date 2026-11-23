# SPEC.md — Feature Spec

What video-related skills does, feature by feature. Add a section per feature when it ships — describe *what* it does and *why* it matters to a user, not the implementation detail (that belongs in code comments or `WISDOM.md`).

Filled in from `skills/video-related/dynamic-promo-video/CHANGELOG.md` (1.0.0 to 1.6.2, all dated 2026-11-10/11). The CHANGELOG stays the authoritative record; this file says what the skill does today.

## `/dynamic-promo-video`: a short narrated promo video from code (1.0.0, PR #161; bundled in the npm package since 0.7.0)
You describe a library, app or product, and the skill builds a short (~25-45s, 1280x720) promo or intro video: animated HTML scenes with zoom/tilt camera moves over real screenshots, a voiceover, and background music that ducks under the voice. It's for explainer and launch videos made from code, without a video editor.

- **Workflow:** storyboard, then HTML scenes, a Playwright render frame by frame, an ffmpeg encode, voiceover, music, mix, and a verification pass. `SKILL.md` is the workflow only; details load from `references/` when a step needs them (1.1.0).
- **Scene template:** `assets/template/index.html` is a deterministic six-scene starter with a time warp, crossfades, a perspective camera and a typing effect, so every render of the same page is identical (1.1.0).
- **Scripts** (1.1.0): `render.js` (preview, thumbnail, render, encode), `timing.py` (retime scenes to the voice clips, and since 1.3.0 `--write-html` writes the new timing into the page), `music.py` (a calm or energetic synthesized track), `mix.py` (voice plus ducked music) and `verify.py` (streams, durations, loudness per second, frames).

## Narration routes (1.2.0, 1.3.0)
The voiceover comes from the ElevenLabs MCP connector if it's connected, else an API key (`ELEVENLABS_API_KEY` or a network secret for `api.elevenlabs.io`). `--voice-elevenlabs=<voice-id>` picks a voice, and `--voice` uses the default one. `tts_elevenlabs.py` makes one clip per scene. It has `--dry-run`, skips clips that already exist, never retries a paid request, and stops at once on 401/403/404.

If a voice was asked for but no route is available, the agent asks (connect the connector, add a key, or attach clips) instead of quietly making a silent video. Without a voice flag, a real project falls back to music only.

## Scenes without narration (1.5.0)
A narration line of `-` keeps a scene at its authored length with no voice: `tts_elevenlabs.py` skips it, and `timing.py` accepts it.

## Ready-made demos: `--demo` and `--demo=self` (1.3.0 to 1.6.2)
- **`--demo`** (the default variant): the template's six scenes as a placeholder for the viewer's own video, then how to make one with the skill: a bridge, the three install routes from `sugatoray/aiskills`, and getting started. 48s. Its cover says it's a demo of `/dynamic-promo-video`, so a social preview explains itself.
- **`--demo=self`:** the skill explaining itself in six scenes.
- **Music only** by default. **`--voice`** narrates either demo with bundled, owner-approved recordings in `assets/demo/clips/` (8 clips, stored once, mapped to scenes by each variant's `clips.json`). That makes no ElevenLabs calls, and the narrated demos rebuild identical to the approved videos, frame by frame and sample by sample. Another voice works through an API key (`demo.py --voice-id`) or MCP-made clips (`--clips-dir`).
- `SKILL.md` maps each request to its `demo.py` command, and step 3 covers fixing a name the voice says wrong: a name-only sample spliced into the clip (`references/voiceover.md`).

## Fixes worth knowing
- **1.3.1:** the music no longer stops when the last voice line ends. The voice track is padded to the full video length before ducking.
- **1.1.0:** the template's zoomed product window no longer covers the caption; `verify.py` no longer reports a short audio tail as a silent second, and reliably extracts the last frame of short or low-fps clips.

<!--
## <Feature name>
What it does, from a user's perspective. A pointer to where it lives in the code
(`path/to/file.ext:line`) if that saves the next reader time.
-->
