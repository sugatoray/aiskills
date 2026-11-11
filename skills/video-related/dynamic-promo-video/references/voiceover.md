# Voiceover (TTS connector)

- Write the narration first: one line per scene, about 2.5-3 words per second.
- Create one flow, then one generation per scene (`generations_count:1`, same
  flow, voice id from the user, or picked from the voice list and named).
  **Never re-run a generation to retry: it costs credits.**
- Read each clip's `duration_secs` from creative_get_flow_run_status.
- The shell usually cannot download from the TTS provider's storage (403). Do
  not try workarounds. Give the user the flow link and the script with start
  times, and ask them to download and attach the clips in scene order
  (`vo0.mp3` ... `vo5.mp3`).
- Check each attached clip with ffprobe; then retime:

  ```bash
  python3 SKILL_DIR/scripts/timing.py --authored 0,4,9,15,21,26,31 --clips vo0.mp3 vo1.mp3 vo2.mp3 vo3.mp3 vo4.mp3 vo5.mp3
  ```

  It prints the `const NB = [...]` line for index.html, the total duration, and
  the `--voice START:FILE` arguments for mix.py. Each clip starts at its scene
  start + 0.3s (`--pad-before`) and keeps at least 0.4s after it
  (`--pad-after`). Scenes stretch to fit; never speed the voice up.
- Before the clips exist, `--durations 3.2,4.8,...` with estimates (words / 2.7)
  gives a rough plan.
