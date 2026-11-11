#!/usr/bin/env python3
"""Generate one narration clip per scene with the ElevenLabs API.

Use this route when ELEVENLABS_API_KEY is set (or the session's network proxy
injects the key for api.elevenlabs.io). When the ElevenLabs MCP connector is
connected instead, use its creative_generate_speech tool (see
references/voiceover.md); this script is not needed then.

    python3 tts_elevenlabs.py --script narration.txt                 # default voice
    python3 tts_elevenlabs.py --script narration.txt --voice <voice-id>
    python3 tts_elevenlabs.py --script narration.txt --dry-run       # show the plan, spend nothing

narration.txt: one line per scene, in scene order (blank lines and lines
starting with # are skipped). Writes vo0.mp3, vo1.mp3, ... to --out-dir.

Every request costs credits, so: an existing clip is never regenerated unless
--force names it, and a failed request is reported, not retried.
"""
import argparse
import json
import os
import sys
import urllib.error
import urllib.request

DEFAULT_VOICE = "TABZn6CDfjMNGrsnGzzD"
DEFAULT_MODEL = "eleven_multilingual_v2"
API = "https://api.elevenlabs.io/v1/text-to-speech/{voice}?output_format={fmt}"


def read_lines(path):
    with open(path, encoding="utf-8") as f:
        return [ln.strip() for ln in f if ln.strip() and not ln.lstrip().startswith("#")]


def synthesize(text, voice, model, fmt, key, timeout=120):
    """POST one text to ElevenLabs and return the audio bytes."""
    body = json.dumps({"text": text, "model_id": model}).encode()
    headers = {"Content-Type": "application/json", "Accept": "audio/mpeg"}
    if key:
        headers["xi-api-key"] = key
    req = urllib.request.Request(API.format(voice=voice, fmt=fmt), data=body, headers=headers, method="POST")
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return r.read()


def main(argv=None):
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument("--script", required=True, help="narration text, one line per scene")
    p.add_argument("--voice", default=DEFAULT_VOICE, help=f"ElevenLabs voice id (default {DEFAULT_VOICE})")
    p.add_argument("--model", default=DEFAULT_MODEL, help=f"model id (default {DEFAULT_MODEL})")
    p.add_argument("--format", default="mp3_44100_128", help="output_format (default mp3_44100_128)")
    p.add_argument("--out-dir", default=".", help="where vo0.mp3, vo1.mp3, ... go (default .)")
    p.add_argument("--prefix", default="vo", help="clip file prefix (default vo)")
    p.add_argument("--force", default="", help="comma-separated scene numbers (0-based) to regenerate even if present")
    p.add_argument("--dry-run", action="store_true", help="print what would be generated; no requests")
    a = p.parse_args(argv)

    lines = read_lines(a.script)
    if not lines:
        p.error(f"{a.script} has no narration lines")
    force = {int(x) for x in a.force.split(",") if x.strip()}
    key = os.environ.get("ELEVENLABS_API_KEY", "")
    os.makedirs(a.out_dir, exist_ok=True)

    plan = []
    for i, text in enumerate(lines):
        out = os.path.join(a.out_dir, f"{a.prefix}{i}.mp3")
        skip = os.path.exists(out) and i not in force
        plan.append((i, text, out, skip))
    words = sum(len(t.split()) for _, t, _, s in plan if not s)
    chars = sum(len(t) for _, t, _, s in plan if not s)
    print(f"voice {a.voice}, model {a.model}: {sum(not s for *_, s in plan)} clip(s) to generate, "
          f"{chars} characters, ~{words / 2.7:.1f}s of speech")
    for i, text, out, skip in plan:
        print(f"  {'skip (exists)' if skip else 'generate':14} {out}: {text}")
    if a.dry_run:
        return
    if not key:
        print("note: ELEVENLABS_API_KEY is not set; relying on the network proxy to add the key", file=sys.stderr)

    failed = []
    for i, text, out, skip in plan:
        if skip:
            continue
        try:
            audio = synthesize(text, a.voice, a.model, a.format, key)
        except urllib.error.HTTPError as e:
            detail = e.read().decode(errors="replace")[:300]
            print(f"  FAILED {out}: HTTP {e.code} {detail}", file=sys.stderr)
            failed.append(i)
            if e.code in (401, 403, 404):  # bad key / no access / unknown voice: stop, do not spend more
                break
            continue
        except (urllib.error.URLError, TimeoutError) as e:
            print(f"  FAILED {out}: {e}", file=sys.stderr)
            failed.append(i)
            break
        with open(out, "wb") as f:
            f.write(audio)
        print(f"  wrote {out} ({len(audio)} bytes)")
    if failed:
        sys.exit(f"tts_elevenlabs.py: {len(failed)} clip(s) failed: {failed}; not retried (each request costs credits)")


if __name__ == "__main__":
    main()
