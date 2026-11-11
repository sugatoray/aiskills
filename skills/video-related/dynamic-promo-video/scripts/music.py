#!/usr/bin/env python3
"""Synthesize a simple royalty-free background track (mono WAV, 44.1 kHz).

Use only when no licensed track is supplied, and tell the user it is a simple
synthesized track.

    python3 music.py --style calm --duration 32 --out music.wav
    python3 music.py --style energetic --duration 32 --out music.wav --bpm 124

Styles
  calm       pad chords + soft plucked arpeggio with echo; fade in 2s, out 2.5s
  energetic  ~124 BPM four-on-the-floor kick (sine sweep), offbeat hats, claps on
             2 and 4, offbeat bass, 16th-note arpeggio, chord pad; builds in softly
             (pad + arpeggio first) before the beat drops

Chords: Am-F-C-G, one per bar. Peaks are normalized to --peak (default 0.85).
Needs numpy. Output is deterministic for a given --seed.
"""
import argparse
import sys
import wave

try:
    import numpy as np
except ImportError:  # pragma: no cover
    sys.exit("music.py: numpy is required (pip install numpy)")

SR = 44100
CHORDS = [[57, 60, 64], [53, 57, 60], [55, 60, 64], [55, 59, 62]]  # Am F C G (MIDI)
ROOTS = [45, 41, 48, 43]


def hz(m):
    return 440.0 * 2 ** ((m - 69) / 12)


def add(buf, start, sig):
    s = int(round(start * SR))
    if s >= len(buf):
        return
    e = min(len(buf), s + len(sig))
    buf[s:e] += sig[: e - s]


def tone(f, length, decay, harmonics=(1.0, 0.3, 0.12)):
    t = np.arange(int(length * SR)) / SR
    sig = sum(a * np.sin(2 * np.pi * f * (k + 1) * t) for k, a in enumerate(harmonics))
    env = np.exp(-t * decay) * np.minimum(1, t / 0.004)  # 4 ms attack, no click
    return sig * env


def pad(total, bar, gain):
    buf = np.zeros(total)
    n_bars = int(np.ceil(total / SR / bar)) + 1
    length = bar + 0.6
    t = np.arange(int(length * SR)) / SR
    env = np.minimum(1, t / 0.35) * np.minimum(1, (length - t) / 0.6)
    for b in range(n_bars):
        sig = np.zeros_like(t)
        for m in CHORDS[b % 4]:
            for det in (-0.002, 0.002):
                f = hz(m) * (1 + det)
                sig += np.sin(2 * np.pi * f * t) + 0.25 * np.sin(4 * np.pi * f * t)
        add(buf, b * bar, gain * sig * env / 12)
    return buf


def arpeggio(total, bar, step, decay, gain, echo_delay=None, start_bar=0):
    buf = np.zeros(total)
    seconds = total / SR
    i = 0
    while True:
        at = start_bar * bar + i * step
        if at >= seconds:
            break
        chord = CHORDS[int(at // bar) % 4]
        notes = chord + [n + 12 for n in chord]
        add(buf, at, gain * tone(hz(notes[i % len(notes)] + 12), min(1.2, step * 6), decay))
        i += 1
    if echo_delay:
        d = int(echo_delay * SR)
        out = buf.copy()
        out[d:] += 0.35 * buf[:-d]
        out[2 * d:] += 0.12 * buf[: -2 * d]
        buf = out
    return buf


def kick():
    t = np.arange(int(0.3 * SR)) / SR
    phase = 2 * np.pi * (45 * t + 75 / 30 * (1 - np.exp(-30 * t)))
    return np.sin(phase) * np.exp(-t * 9)


def hat(rng):
    n = np.diff(rng.standard_normal(int(0.05 * SR) + 1))
    t = np.arange(len(n)) / SR
    return 0.25 * n * np.exp(-t * 70)


def clap(rng):
    length = int(0.2 * SR)
    t = np.arange(length) / SR
    n = np.diff(rng.standard_normal(length + 1))
    env = np.exp(-t * 25)
    for off in (0.0, 0.012, 0.024):  # three quick bursts
        env = np.maximum(env, (t >= off) * np.exp(-np.maximum(t - off, 0) * 180))
    return 0.35 * n * env


def bass(f, length):
    t = np.arange(int(length * SR)) / SR
    return np.tanh(2.2 * np.sin(2 * np.pi * f * t)) * np.exp(-t * 7) * np.minimum(1, t / 0.005)


def calm(seconds, bpm, rng):
    total = int(seconds * SR)
    beat = 60 / bpm
    bar = 4 * beat
    mix = pad(total, bar, 0.9)
    mix += arpeggio(total, bar, beat / 2, decay=5, gain=0.18, echo_delay=beat * 0.75)
    return mix, 2.0, 2.5


def energetic(seconds, bpm, rng):
    total = int(seconds * SR)
    beat = 60 / bpm
    bar = 4 * beat
    build = 2 if seconds > 6 * bar else (1 if seconds > 3 * bar else 0)
    mix = pad(total, bar, 0.55)
    arp = arpeggio(total, bar, beat / 4, decay=14, gain=0.12)
    ramp = np.minimum(1, np.arange(total) / max(1, int(build * bar * SR))) if build else 1.0
    mix += arp * (0.5 + 0.5 * ramp)
    drop = build * bar
    k, h, c = kick(), hat(rng), clap(rng)
    b = drop
    i = 0
    while b < seconds:
        add(mix, b, 0.9 * k)                                  # four on the floor
        add(mix, b + beat / 2, h)                             # offbeat hat
        if i % 2 == 1:
            add(mix, b, c)                                    # claps on 2 and 4
        root = ROOTS[int(b // bar) % 4]
        add(mix, b + beat / 2, 0.32 * bass(hz(root), beat / 2))  # offbeat bass
        b += beat
        i += 1
    return mix, 1.0, 2.5


def render(style, seconds, bpm=None, seed=7, peak=0.85):
    if seconds <= 0:
        raise ValueError("duration must be positive")
    rng = np.random.default_rng(seed)
    if style == "calm":
        mix, fin, fout = calm(seconds, bpm or 80, rng)
    elif style == "energetic":
        mix, fin, fout = energetic(seconds, bpm or 124, rng)
    else:
        raise ValueError(f"unknown style: {style}")
    fin, fout = min(fin, seconds / 4), min(fout, seconds / 4)
    t = np.arange(len(mix)) / SR
    mix *= np.minimum(1, t / fin) * np.minimum(1, (seconds - t) / fout)
    m = np.max(np.abs(mix))
    if m > 0:
        mix *= peak / m
    return mix


def write_wav(path, mix):
    data = (np.clip(mix, -1, 1) * 32767).astype("<i2")
    with wave.open(path, "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(data.tobytes())


def main(argv=None):
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument("--style", choices=["calm", "energetic"], default="calm")
    p.add_argument("--duration", type=float, required=True, help="seconds; match the final video")
    p.add_argument("--out", default="music.wav")
    p.add_argument("--bpm", type=float, help="default 80 (calm) or 124 (energetic)")
    p.add_argument("--seed", type=int, default=7)
    p.add_argument("--peak", type=float, default=0.85)
    a = p.parse_args(argv)
    mix = render(a.style, a.duration, a.bpm, a.seed, a.peak)
    write_wav(a.out, mix)
    print(f"wrote {a.out} ({a.style}, {a.duration:g}s, synthesized)")


if __name__ == "__main__":
    main()
