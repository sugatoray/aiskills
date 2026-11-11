# Music and mix

## Music (`scripts/music.py`)

Use a licensed track if the user supplies one. Otherwise synthesize one and
tell the user it is simple and synthesized.

```bash
python3 SKILL_DIR/scripts/music.py --style calm --duration 32 --out music.wav
python3 SKILL_DIR/scripts/music.py --style energetic --duration 32 --out music.wav
```

- **calm** (80 BPM): pad chords + soft plucked arpeggio with echo; fades in
  2s and out 2.5s.
- **energetic** (124 BPM): four-on-the-floor kick (sine sweep), offbeat hats
  (differenced noise), claps on 2 and 4, offbeat bass, 16th-note arpeggio,
  chord pad; the first two bars are pad + arpeggio only, then the beat drops.
- Chords Am-F-C-G, one per bar. Peaks normalized to 0.85 (`--peak`).
  `--bpm` and `--seed` change tempo and the noise; output is deterministic.
- Match `--duration` to the final video (timing.py prints the total).

## Mix (`scripts/mix.py`)

```bash
python3 SKILL_DIR/scripts/mix.py --video promo_silent.mp4 --music music.wav \
  --voice 0.3:vo0.mp3 --voice 4.3:vo1.mp3 ... --out promo_final.mp4
```

What it builds (print it with `--dry-run`):

1. each voice clip → mono 44.1 kHz → `adelay` to its start time;
2. voices `amix`ed with `normalize=0`;
3. music at `--music-volume` (0.3), ducked by a `sidechaincompress` keyed on
   the voices (threshold 0.03, ratio 8, attack 15 ms, release 350 ms);
4. voices + ducked music mixed, `alimiter` at 0.95, padded and cut to the
   video's duration; video stream copied, audio AAC 192k.

Only visuals changed? Re-render the silent video and reuse the old audio:

```bash
python3 SKILL_DIR/scripts/mix.py --video promo_silent.mp4 --audio-from promo_final_v1.mp4 --out promo_final.mp4
```

## Manual equivalent

If the scripts cannot be used, the same graph by hand:

```
ffmpeg -i silent.mp4 -i vo0.mp3 ... -i vo5.mp3 -i music.wav -filter_complex \
"[1]adelay=300|300[a1];...;[a1]...[a6]amix=inputs=6:normalize=0,aformat=sample_rates=44100:channel_layouts=mono[v]; \
[7]aformat=sample_rates=44100:channel_layouts=mono,volume=0.3[m];[v]asplit[v1][v2]; \
[m][v1]sidechaincompress=threshold=0.03:ratio=8:attack=15:release=350[md]; \
[md][v2]amix=inputs=2:normalize=0:duration=longest,alimiter=limit=0.95[a]" \
-map 0:v -map "[a]" -c:v copy -c:a aac -b:a 192k -t DURATION final.mp4
```

adelay values are milliseconds.
