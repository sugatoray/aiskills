#!/usr/bin/env python3
"""Check a finished promo video before delivering it.

    python3 verify.py promo_final.mp4
    python3 verify.py promo_final.mp4 --frames 0,5,11,17,23,29 --frames-dir check/

Checks (exit 1 if a required one fails):
  - there is a video stream AND an audio stream               (required)
  - video and audio durations differ by at most --tolerance   (required)
  - overall loudness (mean / max dB, from ffmpeg volumedetect)
  - loudness per 1s window, so you can see voice present and music dipping;
    windows quieter than -50 dB are listed as silent
  - optional: extracts frames at given times (always adds the first and last
    frame) so you can look at them
It cannot tell you how the audio sounds: say so when you deliver.
"""
import argparse
import array
import json
import math
import os
import re
import subprocess
import sys


def ffprobe_streams(path):
    r = subprocess.run(["ffprobe", "-v", "error", "-show_entries",
                        "stream=codec_type,duration:format=duration", "-of", "json", path],
                       capture_output=True, text=True)
    if r.returncode != 0:
        sys.exit(f"verify.py: ffprobe failed on {path}: {r.stderr.strip()}")
    return json.loads(r.stdout)


def volumedetect(path):
    r = subprocess.run(["ffmpeg", "-hide_banner", "-nostats", "-i", path, "-vn", "-af", "volumedetect",
                        "-f", "null", "-"], capture_output=True, text=True)
    mean = re.search(r"mean_volume:\s*(-?[\d.]+|-inf) dB", r.stderr)
    peak = re.search(r"max_volume:\s*(-?[\d.]+|-inf) dB", r.stderr)
    to_f = lambda m: float(m.group(1)) if m and m.group(1) != "-inf" else float("-inf")
    return to_f(mean), to_f(peak)


def window_db(path, rate=8000):
    r = subprocess.run(["ffmpeg", "-v", "error", "-i", path, "-vn", "-ac", "1", "-ar", str(rate),
                        "-f", "s16le", "-"], capture_output=True)
    if r.returncode != 0:
        return []
    pcm = array.array("h")
    pcm.frombytes(r.stdout[: len(r.stdout) // 2 * 2])
    if sys.byteorder == "big":
        pcm.byteswap()
    out = []
    for s in range(0, len(pcm), rate):
        chunk = pcm[s:s + rate]
        if len(chunk) < rate // 2:  # ignore a short tail window
            break
        rms = math.sqrt(sum(x * x for x in chunk) / len(chunk)) / 32768
        out.append(20 * math.log10(rms) if rms > 0 else float("-inf"))
    return out


def extract_frames(path, times, outdir, total):
    """Extract a frame at each time, plus the very last frame (seeking from the end)."""
    os.makedirs(outdir, exist_ok=True)
    jobs = [(os.path.join(outdir, f"frame_{t:07.2f}.png"), ["-ss", f"{t:.3f}", "-i", path, "-frames:v", "1"])
            for t in sorted({min(max(0.0, t), total) for t in times}) if t < total - 0.3]
    jobs.append((os.path.join(outdir, "frame_last.png"), ["-sseof", "-0.3", "-i", path, "-update", "1"]))
    files = []
    for f, args in jobs:
        subprocess.run(["ffmpeg", "-v", "error", "-y", *args, f], check=False)
        if os.path.exists(f):
            files.append(f)
    return files


def main(argv=None):
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument("video")
    p.add_argument("--tolerance", type=float, default=0.5, help="max video/audio duration gap in s (default 0.5)")
    p.add_argument("--frames", help="comma-separated times to extract (first and last are always added)")
    p.add_argument("--frames-dir", default="check", help="where extracted frames go (default ./check)")
    p.add_argument("--no-frames", action="store_true", help="skip frame extraction")
    a = p.parse_args(argv)

    info = ffprobe_streams(a.video)
    total = float(info.get("format", {}).get("duration", 0) or 0)
    durs = {}
    for s in info.get("streams", []):
        durs.setdefault(s.get("codec_type"), float(s.get("duration") or total))
    ok = True
    print(f"file: {a.video}  ({total:.2f}s)")
    for kind in ("video", "audio"):
        if kind in durs:
            print(f"  {kind} stream: {durs[kind]:.2f}s")
        else:
            print(f"  FAIL: no {kind} stream")
            ok = False
    if "video" in durs and "audio" in durs:
        gap = abs(durs["video"] - durs["audio"])
        status = "ok" if gap <= a.tolerance else "FAIL"
        ok &= gap <= a.tolerance
        print(f"  duration gap: {gap:.2f}s ({status}, tolerance {a.tolerance:g}s)")
        mean, peak = volumedetect(a.video)
        print(f"  loudness: mean {mean:.1f} dB, max {peak:.1f} dB")
        if peak > -0.1:
            print("  warning: peaks at 0 dB, audio may clip")
        db = window_db(a.video)
        if db:
            print("  per-second dB: " + " ".join("-inf" if math.isinf(x) else f"{x:.0f}" for x in db))
            silent = [i for i, x in enumerate(db) if x < -50]
            if silent:
                print(f"  silent windows (< -50 dB) at seconds: {silent}")
    name = os.path.basename(a.video).lower()
    if "silent" in name and "audio" in durs:
        print("  warning: file is named *silent* but has an audio stream")
    if "final" in name and "audio" not in durs:
        print("  warning: file is named *final* but has no audio stream")

    if not a.no_frames and "video" in durs:
        times = [0.0]
        if a.frames:
            times += [float(x) for x in a.frames.split(",") if x.strip()]
        files = extract_frames(a.video, sorted(set(times)), a.frames_dir, total)
        print(f"  frames to look at ({len(files)}): {a.frames_dir}/")
    note = " (audio was measured, not listened to)" if "audio" in durs else ""
    print("result: " + ("OK" if ok else "FAILED") + note)
    sys.exit(0 if ok else 1)


if __name__ == "__main__":
    main()
