# Voiceover (ElevenLabs)

## Choose the voice

- `--voice-elevenlabs=<voice-id>` sets the voice. `--voice` (or a bare
  `--voice-elevenlabs`) means the default `TABZn6CDfjMNGrsnGzzD`; so does no
  flag at all for a real project.
- `--demo` without a voice flag is music only. With one, the demo speaks the
  lines in `assets/demo/narration.txt`: via the MCP connector, generate one clip
  per line and pass them with `demo.py --clips-dir`; via an API key, run
  `demo.py --voice-id <voice-id>`, which calls tts_elevenlabs.py itself.
- Say which voice id you used when you deliver.
- If ElevenLabs rejects the id (unknown voice, no access), stop and ask the user
  for another id. Do not swap in a different voice on your own.

## Write the narration

One line per scene, about 2.5-3 words per second, saved as `narration.txt`
(blank lines and `#` comments are ignored). Plan from estimates before any
clip exists:

```bash
python3 SKILL_DIR/scripts/timing.py --authored 0,4,9,15,21,26,31 --durations 3.2,4.8,5.1,4.4,4.0,4.9
```

(duration ≈ words / 2.7).

## Names the voice gets wrong

Write the name the way it sounds in the narration text (e.g. `sugatoray` →
`Shoo-gaw-doe Ray`). To find the spelling cheaply, generate the name alone
(about 15 credits a try) and let the user pick, instead of regenerating whole
lines. To fix a clip that is otherwise fine, splice the approved name sample
into it rather than paying for the whole line again: find the word by its
consonants in a spectrogram, match loudness, 10 ms crossfades. Map every
"s/sh/f" burst of the whole line to its word first; matching only the bursts
near the guess can cut the wrong word and leave the old one in. Then confirm
that every burst after the cut is still there, shifted by the same amount.

## Route A: ElevenLabs MCP connector

Use this when the connector's tools load (ToolSearch for `creative_generate_speech`).

- Create one flow, then one `creative_generate_speech` call per scene on that
  flow, with `voice_id` = the chosen id and `generations_count: 1`.
  **Never re-run a generation to retry: each one costs credits.**
- Read each clip's `duration_secs` from `creative_get_flow_run_status`.
- The shell usually cannot download from the provider's storage (403). Do not
  try workarounds. Give the user the flow link and the script with start times,
  and ask them to download and attach the clips in scene order
  (`vo0.mp3` ... `vo5.mp3`).

## Route B: API key (`scripts/tts_elevenlabs.py`)

Use this when `ELEVENLABS_API_KEY` is set, or the session's network secrets
hold a key for `api.elevenlabs.io` (the proxy adds it to the request). If
neither exists and the user wants narration, ask for the key with the
credential tool if one is available; never ask for it to be pasted in chat.

```bash
python3 SKILL_DIR/scripts/tts_elevenlabs.py --script narration.txt --voice <voice-id> --dry-run
python3 SKILL_DIR/scripts/tts_elevenlabs.py --script narration.txt --voice <voice-id>
```

- Writes `vo0.mp3` ... into `--out-dir` (default `.`). Model
  `eleven_multilingual_v2`, `mp3_44100_128` unless `--model` / `--format`.
- Existing clips are skipped, so re-running after a failure only generates
  what is missing. Re-generate a specific clip with `--force 2,4`.
- It does not retry failures. On 401/403/404 (bad key, no access, unknown
  voice) it stops at once.

## Route C: neither is available

Say so once. Offer: connect the ElevenLabs connector, add an API key, or
attach recorded clips. If the user wants to go on without them, make a
music-only video: skip retiming and run `mix.py` with `--music` only.

## Then retime

Check each clip with ffprobe, then:

```bash
python3 SKILL_DIR/scripts/timing.py --authored 0,4,9,15,21,26,31 --clips vo0.mp3 vo1.mp3 vo2.mp3 vo3.mp3 vo4.mp3 vo5.mp3 --write-html index.html
```

`--write-html` writes the new boundaries into the page. It also prints the `const NB = [...]` line for index.html, the total duration, and
the `--voice START:FILE` arguments for mix.py. Each clip starts at its scene
start + 0.3s (`--pad-before`) and keeps at least 0.4s after it
(`--pad-after`). Scenes stretch to fit; never speed the voice up.
