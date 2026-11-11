#!/usr/bin/env python3
"""Build a demo video in one command (--demo).

    python3 demo.py                            # default demo, music only
    python3 demo.py --voice                    # default demo, narrated (bundled clips)
    python3 demo.py --variant self --voice     # the skill explaining itself, narrated
    python3 demo.py --voice-id <voice-id>      # narrated with another voice via the ElevenLabs API
    python3 demo.py --clips-dir clips/         # narrated with clips made elsewhere
                                               # (e.g. by the ElevenLabs MCP connector)

Variants (assets/demo/<variant>/: index.html, narration.txt, clips/):
  default  The generic template's six placeholder scenes (standing in for the
           viewer's own video), then three scenes on making such a video with
           /dynamic-promo-video from sugatoray/aiskills: a bridge, the three
           install routes, get started. 48s.
  self     Six scenes about the skill itself: cover, the problem, the scene
           engine's code, the three install routes, usage, get started. 32s.

--voice uses the variant's bundled clips: the default ElevenLabs voice
(TABZn6CDfjMNGrsnGzzD) with the owner-approved pronunciations, so the narrated
demo is rebuilt exactly, with no ElevenLabs calls. Narration lines are one per
scene (`-` = no narration); scenes stretch to fit them. Music and rendering are
deterministic, so the same command gives the same video.

Output in --out-dir (default ./promo-demo): index.html, thumbnail.png,
demo_silent.mp4, music.wav, vo*.mp3 (if narrated), demo_final.mp4, check/.
"""
import argparse
import glob
import json
import re
import os
import shutil
import subprocess
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
SKILL = os.path.dirname(HERE)
DEMOS = os.path.join(SKILL, "assets", "demo")
VARIANTS = ("default", "self")
DEFAULT_VOICE = "TABZn6CDfjMNGrsnGzzD"


def read_narration(path):
    with open(path, encoding="utf-8") as f:
        return [ln.strip() for ln in f if ln.strip() and not ln.lstrip().startswith("#")]


def page_ob(path):
    """The page's authored scene boundaries (`const OB = [...]`)."""
    with open(path, encoding="utf-8") as f:
        m = re.search(r"const OB = \[([^\]]*)\];", f.read())
    if not m:
        sys.exit(f"demo.py: no `const OB = [...]` in {path}")
    return [float(x) for x in m.group(1).split(",")]


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
    p.add_argument("--variant", choices=VARIANTS, default="default", help="which demo (default: default)")
    v = p.add_mutually_exclusive_group()
    v.add_argument("--voice", action="store_true",
                   help=f"narrate with the bundled clips (voice {DEFAULT_VOICE}); no ElevenLabs calls")
    v.add_argument("--voice-id", help="narrate with this ElevenLabs voice via the API (needs a key); "
                                      f"{DEFAULT_VOICE} uses the bundled clips")
    v.add_argument("--clips-dir", help="narrate with existing vo<scene>.mp3 clips from this folder")
    p.add_argument("--music-style", choices=["calm", "energetic"], default="energetic")
    p.add_argument("--music-volume", type=float,
                   help="music level before ducking (default 0.6 without voice, 0.3 with voice)")
    p.add_argument("--fps", default="24")
    a = p.parse_args(argv)

    folder = os.path.join(DEMOS, a.variant)
    PAGE = os.path.join(folder, "index.html")
    NARRATION = os.path.join(folder, "narration.txt")
    if a.voice_id == DEFAULT_VOICE:  # same voice as the bundled clips: reuse them
        a.voice, a.voice_id = True, None
    if a.voice:
        a.clips_dir = os.path.join(folder, "clips")
    out = os.path.abspath(a.out_dir)
    os.makedirs(out, exist_ok=True)
    shutil.copy(PAGE, os.path.join(out, "index.html"))
    OB = page_ob(PAGE)
    scenes = len(OB) - 1
    voiced = bool(a.voice_id or a.clips_dir)
    print(f"== demo variant: {a.variant}", flush=True)
    voices = []
    total = OB[-1]

    if voiced:
        lines = read_narration(NARRATION)
        if len(lines) != scenes:
            sys.exit(f"demo.py: {NARRATION} has {len(lines)} lines for {scenes} scenes")
        clips = ["-" if text == "-" else f"vo{i}.mp3" for i, text in enumerate(lines)]
        if a.clips_dir:
            missing = [c for c in clips if c != "-" and not os.path.exists(os.path.join(a.clips_dir, c))]
            if missing:
                sys.exit(f"demo.py: need {len(clips) - clips.count('-')} clips in {a.clips_dir}; missing: {', '.join(missing)}")
            for c in clips:
                if c != "-":
                    shutil.copy(os.path.join(a.clips_dir, c), out)
        else:
            step(f"narration (ElevenLabs voice {a.voice_id})",
                 py("tts_elevenlabs.py", "--script", NARRATION, "--voice", a.voice_id, "--out-dir", out), out)
        print("== retime scenes to the narration", flush=True)
        r = subprocess.run(py("timing.py", "--authored", ",".join(f"{x:g}" for x in OB), "--clips", *clips,
                              "--write-html", "index.html", "--json"), cwd=out, capture_output=True, text=True)
        if r.returncode != 0:
            sys.exit(f"demo.py: timing failed: {r.stderr.strip()}")
        plan = json.loads(r.stdout)
        total = plan["total"]
        voices = [arg for s, c in zip(plan["starts"], clips) if s is not None for arg in ("--voice", f"{s:g}:{c}")]
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
          f"({a.variant}, {'narrated' if voiced else 'music only'}), cover: {os.path.join(out, 'thumbnail.png')}")


if __name__ == "__main__":
    main()
