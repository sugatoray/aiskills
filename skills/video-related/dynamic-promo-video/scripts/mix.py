#!/usr/bin/env python3
"""Mix narration and music onto a silent video (ffmpeg).

Each voice clip is delayed to its start time; the music is lowered and ducked
under the voice with a sidechain compressor; the result is limited and muxed
with the video stream copied as is. Output duration = video duration.

    python3 mix.py --video promo_silent.mp4 --music music.wav \\
        --voice 0.3:vo0.mp3 --voice 4.3:vo1.mp3 ... --out promo_final.mp4

    # visuals changed, audio did not: reuse the previous final's audio track
    python3 mix.py --video promo_silent.mp4 --audio-from promo_final_v1.mp4 --out promo_final.mp4

Voice start times come from timing.py ("mix.py args" line). Use --dry-run to
print the ffmpeg command without running it.
"""
import argparse
import shlex
import shutil
import subprocess
import sys


def duration(path):
    r = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration",
                        "-of", "default=nw=1:nk=1", path], capture_output=True, text=True)
    if r.returncode != 0 or not r.stdout.strip():
        sys.exit(f"mix.py: cannot read duration of {path}: {r.stderr.strip()}")
    return float(r.stdout.strip())


def parse_voice(s):
    start, sep, path = s.partition(":")
    if not sep or not path:
        raise argparse.ArgumentTypeError(f"expected START:FILE, got {s!r}")
    try:
        return float(start), path
    except ValueError:
        raise argparse.ArgumentTypeError(f"bad start time in {s!r}")


def build_command(video, out, voices, music=None, music_volume=0.3, total=None, audio_from=None):
    """Return the ffmpeg argv. `voices` is a list of (start_seconds, path)."""
    cmd = ["ffmpeg", "-y", "-loglevel", "error", "-i", video]
    if audio_from:
        cmd += ["-i", audio_from, "-map", "0:v", "-map", "1:a", "-c", "copy"]
        if total:
            cmd += ["-t", f"{total:.3f}"]
        return cmd + [out]
    if not voices and not music:
        raise ValueError("nothing to mix: give --voice and/or --music (or --audio-from)")
    fmt = "aformat=sample_rates=44100:channel_layouts=mono"
    parts = []
    for path in [p for _, p in voices] + ([music] if music else []):
        cmd += ["-i", path]
    for i, (start, _) in enumerate(voices):
        ms = max(0, int(round(start * 1000)))
        parts.append(f"[{i + 1}:a]{fmt},adelay={ms}:all=1[a{i}]")
    if voices:
        labels = "".join(f"[a{i}]" for i in range(len(voices)))
        parts.append(f"{labels}amix=inputs={len(voices)}:normalize=0[v]" if len(voices) > 1 else "[a0]anull[v]")
    if music:
        parts.append(f"[{len(voices) + 1}:a]{fmt},volume={music_volume}[m]")
    if voices and music:
        parts.append("[v]asplit[v1][v2]")
        parts.append("[m][v1]sidechaincompress=threshold=0.03:ratio=8:attack=15:release=350[md]")
        parts.append("[md][v2]amix=inputs=2:normalize=0:duration=longest,alimiter=limit=0.95,apad[a]")
    elif voices:
        parts.append("[v]alimiter=limit=0.95,apad[a]")
    else:
        parts.append("[m]alimiter=limit=0.95,apad[a]")
    cmd += ["-filter_complex", ";".join(parts), "-map", "0:v", "-map", "[a]",
            "-c:v", "copy", "-c:a", "aac", "-b:a", "192k"]
    if total:
        cmd += ["-t", f"{total:.3f}"]
    return cmd + [out]


def main(argv=None):
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument("--video", required=True, help="silent video (from render.js --encode)")
    p.add_argument("--out", required=True, help="output, e.g. promo_final.mp4")
    p.add_argument("--voice", action="append", type=parse_voice, default=[], metavar="START:FILE",
                   help="voice clip and its start time in seconds; repeat in scene order")
    p.add_argument("--music", help="background music (WAV/MP3)")
    p.add_argument("--music-volume", type=float, default=0.3, help="music gain before ducking (default 0.3)")
    p.add_argument("--audio-from", help="copy the audio track of this file instead of mixing")
    p.add_argument("--dry-run", action="store_true", help="print the ffmpeg command only")
    a = p.parse_args(argv)
    if not shutil.which("ffmpeg") and not a.dry_run:
        sys.exit("mix.py: ffmpeg not found")
    total = None if a.dry_run else duration(a.video)
    try:
        cmd = build_command(a.video, a.out, a.voice, a.music, a.music_volume, total, a.audio_from)
    except ValueError as e:
        p.error(str(e))
    if a.dry_run:
        print(shlex.join(cmd))
        return
    r = subprocess.run(cmd)
    if r.returncode != 0:
        sys.exit("mix.py: ffmpeg failed")
    print(f"wrote {a.out} ({total:.2f}s, {len(a.voice)} voice clip(s){', music' if a.music else ''})")


if __name__ == "__main__":
    main()
