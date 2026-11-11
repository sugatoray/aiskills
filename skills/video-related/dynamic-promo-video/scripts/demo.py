#!/usr/bin/env python3
"""Build the demo video from the bare template in one command (--demo).

    python3 demo.py                                  # music only (no narration)
    python3 demo.py --voice-id TABZn6CDfjMNGrsnGzzD  # narrated via the ElevenLabs API
    python3 demo.py --clips-dir clips/               # narrated with clips made elsewhere
                                                     # (e.g. by the ElevenLabs MCP connector)

The demo is the template's six placeholder scenes with an energetic
synthesized track. With a voice, the lines in assets/demo/narration.txt are
spoken (one per scene) and the scenes are stretched to fit them.

Output in --out-dir (default ./promo-demo): index.html, thumbnail.png,
demo_silent.mp4, music.wav, vo*.mp3 (if narrated), demo_final.mp4, check/.
"""
import argparse
import glob
import json
import os
import shutil
import subprocess
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
SKILL = os.path.dirname(HERE)
TEMPLATE = os.path.join(SKILL, "assets", "template", "index.html")
NARRATION = os.path.join(SKILL, "assets", "demo", "narration.txt")
OB = [0, 4, 9, 15, 21, 26, 31]  # the template's authored scene boundaries


def step(title, cmd, cwd):
    print(f"== {title}", flush=True)
    r = subprocess.run(cmd, cwd=cwd)
    if r.returncode != 0:
        sys.exit(f"demo.py: step failed: {title}")


def py(script, *args):
    return [sys.executable, os.path.join(HERE, script), *args]


def main(argv=None):
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument("--out-dir", default="promo-demo")
    v = p.add_mutually_exclusive_group()
    v.add_argument("--voice-id", help="narrate with this ElevenLabs voice via the API (needs a key)")
    v.add_argument("--clips-dir", help="narrate with existing vo0.mp3 ... vo5.mp3 from this folder")
    p.add_argument("--music-style", choices=["calm", "energetic"], default="energetic")
    p.add_argument("--music-volume", type=float,
                   help="music level before ducking (default 0.6 without voice, 0.3 with voice)")
    p.add_argument("--fps", default="24")
    a = p.parse_args(argv)

    out = os.path.abspath(a.out_dir)
    os.makedirs(out, exist_ok=True)
    shutil.copy(TEMPLATE, os.path.join(out, "index.html"))
    scenes = len(OB) - 1
    voiced = bool(a.voice_id or a.clips_dir)
    voices = []
    total = OB[-1]

    if voiced:
        if a.clips_dir:
            clips = sorted(glob.glob(os.path.join(a.clips_dir, "vo*.mp3")))
            if len(clips) != scenes:
                sys.exit(f"demo.py: need {scenes} clips vo0.mp3..vo{scenes - 1}.mp3 in {a.clips_dir}, found {len(clips)}")
            for c in clips:
                shutil.copy(c, out)
        else:
            step(f"narration (ElevenLabs voice {a.voice_id})",
                 py("tts_elevenlabs.py", "--script", NARRATION, "--voice", a.voice_id, "--out-dir", out), out)
        clips = [f"vo{i}.mp3" for i in range(scenes)]
        print("== retime scenes to the narration", flush=True)
        r = subprocess.run(py("timing.py", "--authored", ",".join(map(str, OB)), "--clips", *clips,
                              "--write-html", "index.html", "--json"), cwd=out, capture_output=True, text=True)
        if r.returncode != 0:
            sys.exit(f"demo.py: timing failed: {r.stderr.strip()}")
        plan = json.loads(r.stdout)
        total = plan["total"]
        voices = [arg for s, c in zip(plan["starts"], clips) for arg in ("--voice", f"{s:g}:{c}")]
        print(f"   scenes: {plan['NB']}  total {total:g}s")

    step("render frames + silent video",
         ["node", os.path.join(HERE, "render.js"), "index.html", "--fps", a.fps,
          "--thumbnail", "thumbnail.png", "--encode", "demo_silent.mp4"], out)
    step("music", py("music.py", "--style", a.music_style, "--duration", f"{total:g}", "--out", "music.wav"), out)
    vol = a.music_volume if a.music_volume is not None else (0.3 if voiced else 0.6)
    step("mix", py("mix.py", "--video", "demo_silent.mp4", "--music", "music.wav", "--music-volume", f"{vol:g}",
                   *voices, "--out", "demo_final.mp4"), out)
    nb = plan["NB"] if voiced else OB
    mids = ",".join(f"{(x + y) / 2:g}" for x, y in zip(nb, nb[1:]))
    step("verify", py("verify.py", "demo_final.mp4", "--frames", mids), out)
    print(f"\ndemo ready: {os.path.join(out, 'demo_final.mp4')} "
          f"({'narrated' if voiced else 'music only'}), cover: {os.path.join(out, 'thumbnail.png')}")


if __name__ == "__main__":
    main()
