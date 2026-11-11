#!/usr/bin/env python3
"""Retime scenes to fit the narration.

Given the authored scene boundaries (OB) and one voice clip per scene, compute
new boundaries (NB) so every clip fits inside its scene with padding. Scenes are
only ever stretched, never squeezed below their authored length, and the voice
is never sped up.

    python3 timing.py --authored 0,4,9,15,21,26,31 --clips vo0.mp3 vo1.mp3 ...
    python3 timing.py --authored 0,4,9,15,21,26,31 --durations 3.2,4.8,5.1,4.4,4.0,4.9

Prints the `const NB = [...]` line for index.html, each clip's start time, the
total duration, and the matching `--voice START:FILE` arguments for mix.py.
A clip or duration of `-` marks a scene with no narration (it keeps its
authored length). Use --json for machine-readable output. --write-html index.html replaces the
page's `const NB = ...;` line with the new boundaries.
"""
import argparse
import json
import re
import shutil
import subprocess
import sys


def probe_duration(path):
    if not shutil.which("ffprobe"):
        sys.exit("timing.py: ffprobe not found; pass --durations instead")
    r = subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "default=nw=1:nk=1", path],
        capture_output=True, text=True,
    )
    if r.returncode != 0 or not r.stdout.strip():
        sys.exit(f"timing.py: cannot read duration of {path}: {r.stderr.strip()}")
    return float(r.stdout.strip())


def numbers(s):
    return [float(x) for x in s.split(",") if x.strip()]


def durations_arg(s):
    return [None if x.strip() == "-" else float(x) for x in s.split(",") if x.strip()]


def plan(authored, durations, pad_before=0.3, pad_after=0.4):
    if len(authored) != len(durations) + 1:
        raise ValueError(f"need one clip per scene: {len(authored) - 1} scenes, {len(durations)} clips")
    if any(b <= a for a, b in zip(authored, authored[1:])):
        raise ValueError("authored boundaries must increase")
    nb = [authored[0]]
    starts = []
    for i, d in enumerate(durations):
        if d is None:  # no narration in this scene
            length = authored[i + 1] - authored[i]
            starts.append(None)
        else:
            length = max(authored[i + 1] - authored[i], pad_before + d + pad_after)
            starts.append(round(nb[-1] + pad_before, 3))
        nb.append(round(nb[-1] + length, 3))
    return nb, starts


def write_nb(page, nb):
    with open(page, encoding="utf-8") as f:
        html = f.read()
    line = "const NB = [" + ", ".join(f"{x:g}" for x in nb) + "];"
    new, n = re.subn(r"const NB = [^;]*;", lambda _: line, html, count=1)
    if n != 1:
        raise SystemExit(f"timing.py: no `const NB = ...;` line in {page}")
    with open(page, "w", encoding="utf-8") as f:
        f.write(new)


def main(argv=None):
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument("--authored", required=True, help="comma-separated authored boundaries OB, e.g. 0,4,9,15")
    g = p.add_mutually_exclusive_group(required=True)
    g.add_argument("--clips", nargs="+", help="voice clips in scene order (durations read with ffprobe)")
    g.add_argument("--durations", help="comma-separated clip durations in seconds")
    p.add_argument("--pad-before", type=float, default=0.3, help="silence before each clip (default 0.3)")
    p.add_argument("--pad-after", type=float, default=0.4, help="minimum silence after each clip (default 0.4)")
    p.add_argument("--json", action="store_true", help="print JSON")
    p.add_argument("--write-html", metavar="PAGE", help="replace the `const NB = ...;` line in this page")
    a = p.parse_args(argv)

    authored = numbers(a.authored)
    durations = [None if c == "-" else probe_duration(c) for c in a.clips] if a.clips else durations_arg(a.durations)
    try:
        nb, starts = plan(authored, durations, a.pad_before, a.pad_after)
    except ValueError as e:
        p.error(str(e))

    if a.write_html:
        write_nb(a.write_html, nb)
    names = a.clips or [f"vo{i}.mp3" for i in range(len(durations))]
    if a.json:
        print(json.dumps({"OB": authored, "NB": nb, "starts": starts, "durations": durations,
                          "total": nb[-1], "clips": names}, indent=2))
        return
    fmt = lambda xs: ", ".join(f"{x:g}" for x in xs)
    print(f"const NB = [{fmt(nb)}];   // paste into index.html (OB = [{fmt(authored)}])")
    print(f"total duration: {nb[-1]:g}s")
    for i, (s, d, n) in enumerate(zip(starts, durations, names)):
        if d is None:
            print(f"scene {i + 1}: {nb[i]:g}-{nb[i + 1]:g}s  (no narration)")
            continue
        stretched = " (stretched)" if nb[i + 1] - nb[i] > authored[i + 1] - authored[i] + 1e-9 else ""
        print(f"scene {i + 1}: {nb[i]:g}-{nb[i + 1]:g}s  voice {n} at {s:g}s ({d:.2f}s){stretched}")
    print("mix.py args: " + " ".join(f"--voice {s:g}:{n}" for s, n in zip(starts, names) if s is not None))


if __name__ == "__main__":
    main()
