"""Tests for the dynamic-promo-video scripts.

Run from the repository root:
    python3 -m unittest discover -s skills/video-related/dynamic-promo-video/tests -p 'test_*.py'

Tests that need ffmpeg, numpy, Node or Playwright are skipped when those are
missing. The pipeline test renders the real template (about 2s of frames).
"""
import importlib.util
import json
import os
import re
import shutil
import subprocess
import sys
import tempfile
import unittest
import wave

HERE = os.path.dirname(os.path.abspath(__file__))
SKILL = os.path.dirname(HERE)
SCRIPTS = os.path.join(SKILL, "scripts")
TEMPLATE = os.path.join(SKILL, "assets", "template", "index.html")

HAS_FFMPEG = bool(shutil.which("ffmpeg") and shutil.which("ffprobe"))
HAS_NUMPY = importlib.util.find_spec("numpy") is not None


def load(name):
    spec = importlib.util.spec_from_file_location(name, os.path.join(SCRIPTS, f"{name}.py"))
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


def has_playwright():
    if not shutil.which("node"):
        return False
    r = subprocess.run(["node", "-e", "require('playwright')"], capture_output=True)
    return r.returncode == 0


def run(*args, cwd=None):
    return subprocess.run(list(args), cwd=cwd, capture_output=True, text=True)


class TimingTest(unittest.TestCase):
    def setUp(self):
        self.t = load("timing")

    def test_short_clips_keep_authored_boundaries(self):
        nb, starts = self.t.plan([0, 4, 9], [2.0, 3.0])
        self.assertEqual(nb, [0, 4, 9])
        self.assertEqual(starts, [0.3, 4.3])

    def test_long_clip_stretches_its_scene_and_shifts_the_rest(self):
        nb, starts = self.t.plan([0, 4, 9], [5.0, 1.0])
        self.assertEqual(nb, [0, 5.7, 10.7])
        self.assertEqual(starts, [0.3, 6.0])

    def test_needs_one_clip_per_scene(self):
        with self.assertRaises(ValueError):
            self.t.plan([0, 4, 9], [1.0])

    def test_write_html_replaces_nb_line(self):
        with tempfile.TemporaryDirectory() as d:
            page = os.path.join(d, "index.html")
            shutil.copy(TEMPLATE, page)
            self.t.write_nb(page, [0, 4.5, 9.25])
            with open(page) as f:
                html = f.read()
            self.assertIn("const NB = [0, 4.5, 9.25];", html)
            self.assertNotIn("OB.slice()", html)

    def test_boundaries_must_increase(self):
        with self.assertRaises(ValueError):
            self.t.plan([0, 4, 4], [1.0, 1.0])


class MixCommandTest(unittest.TestCase):
    def setUp(self):
        self.m = load("mix")

    def test_voices_and_music_are_ducked_and_limited(self):
        cmd = self.m.build_command("v.mp4", "o.mp4", [(0.3, "a.mp3"), (4.25, "b.mp3")], "m.wav", 0.3, 10.0)
        graph = cmd[cmd.index("-filter_complex") + 1]
        self.assertIn("adelay=300:all=1", graph)
        self.assertIn("adelay=4250:all=1", graph)
        self.assertIn("amix=inputs=2:normalize=0[v]", graph)
        self.assertIn("[3:a]", graph)  # music is the input after the two voices
        self.assertIn("sidechaincompress", graph)
        self.assertIn("alimiter=limit=0.95", graph)
        self.assertEqual(cmd[cmd.index("-t") + 1], "10.000")
        self.assertIn("copy", cmd)

    def test_single_voice_no_music(self):
        cmd = self.m.build_command("v.mp4", "o.mp4", [(0.3, "a.mp3")])
        graph = cmd[cmd.index("-filter_complex") + 1]
        self.assertIn("[a0]anull[v]", graph)
        self.assertNotIn("sidechaincompress", graph)

    def test_audio_from_copies_streams(self):
        cmd = self.m.build_command("v.mp4", "o.mp4", [], audio_from="old.mp4")
        self.assertNotIn("-filter_complex", cmd)
        self.assertIn("1:a", cmd)

    def test_nothing_to_mix_is_an_error(self):
        with self.assertRaises(ValueError):
            self.m.build_command("v.mp4", "o.mp4", [])


class ElevenLabsTTSTest(unittest.TestCase):
    """No real requests: synthesize() is replaced by a fake."""

    def setUp(self):
        self.tts = load("tts_elevenlabs")
        self.dir = tempfile.TemporaryDirectory()
        self.d = self.dir.name
        self.script = os.path.join(self.d, "narration.txt")
        with open(self.script, "w") as f:
            f.write("# scene lines\nFirst line.\n\nSecond line here.\nThird.\n")
        self.calls = []

        def fake(text, voice, model, fmt, key, timeout=120):
            self.calls.append((text, voice, model, fmt, key))
            return b"ID3fake"
        self.tts.synthesize = fake

    def tearDown(self):
        self.dir.cleanup()

    def main(self, *args):
        self.tts.main(["--script", self.script, "--out-dir", self.d, *args])

    def test_default_voice(self):
        self.assertEqual(self.tts.DEFAULT_VOICE, "TABZn6CDfjMNGrsnGzzD")
        self.main()
        self.assertEqual([c[0] for c in self.calls], ["First line.", "Second line here.", "Third."])
        self.assertTrue(all(c[1] == "TABZn6CDfjMNGrsnGzzD" for c in self.calls))
        for i in range(3):
            self.assertTrue(os.path.exists(os.path.join(self.d, f"vo{i}.mp3")))

    def test_voice_override(self):
        self.main("--voice", "abc123")
        self.assertTrue(all(c[1] == "abc123" for c in self.calls))

    def test_existing_clips_are_not_regenerated_unless_forced(self):
        self.main()
        self.calls.clear()
        self.main()
        self.assertEqual(self.calls, [])
        self.main("--force", "1")
        self.assertEqual([c[0] for c in self.calls], ["Second line here."])

    def test_dry_run_spends_nothing(self):
        self.main("--dry-run")
        self.assertEqual(self.calls, [])
        self.assertFalse(os.path.exists(os.path.join(self.d, "vo0.mp3")))

    def test_unknown_voice_stops_without_retry(self):
        import io
        import urllib.error

        def fail(*a, **k):
            self.calls.append(a)
            raise urllib.error.HTTPError("u", 404, "voice not found", {}, io.BytesIO(b"voice_not_found"))
        self.tts.synthesize = fail
        with self.assertRaises(SystemExit):
            self.main("--voice", "nope")
        self.assertEqual(len(self.calls), 1, "stops after the first 404")

    def test_api_key_is_sent_as_header(self):
        import urllib.request
        seen = {}

        class Resp:
            def __enter__(self): return self
            def __exit__(self, *a): return False
            def read(self): return b"ID3"

        def fake_urlopen(req, timeout=0):
            seen["url"] = req.full_url
            seen["key"] = req.get_header("Xi-api-key")
            seen["body"] = json.loads(req.data)
            return Resp()
        orig = urllib.request.urlopen
        urllib.request.urlopen = fake_urlopen
        try:
            tts = load("tts_elevenlabs")
            self.assertEqual(tts.synthesize("Hi.", "v1", "m1", "mp3_44100_128", "k"), b"ID3")
        finally:
            urllib.request.urlopen = orig
        self.assertEqual(seen["url"], "https://api.elevenlabs.io/v1/text-to-speech/v1?output_format=mp3_44100_128")
        self.assertEqual(seen["key"], "k")
        self.assertEqual(seen["body"], {"text": "Hi.", "model_id": "m1"})


@unittest.skipUnless(HAS_NUMPY, "numpy not installed")
class MusicTest(unittest.TestCase):
    def setUp(self):
        self.mu = load("music")

    def test_styles_have_length_and_peak(self):
        for style in ("calm", "energetic"):
            mix = self.mu.render(style, 5.0)
            self.assertEqual(len(mix), 5 * self.mu.SR)
            self.assertAlmostEqual(float(abs(mix).max()), 0.85, places=3)
            self.assertLess(abs(float(mix[0])), 0.01, "starts from a fade-in")

    def test_deterministic(self):
        a = self.mu.render("energetic", 3.0, seed=1)
        b = self.mu.render("energetic", 3.0, seed=1)
        self.assertTrue((a == b).all())

    def test_writes_mono_wav(self):
        with tempfile.TemporaryDirectory() as d:
            out = os.path.join(d, "m.wav")
            r = run(sys.executable, os.path.join(SCRIPTS, "music.py"), "--duration", "2", "--out", out)
            self.assertEqual(r.returncode, 0, r.stderr)
            with wave.open(out) as w:
                self.assertEqual((w.getnchannels(), w.getframerate()), (1, 44100))
                self.assertEqual(w.getnframes(), 2 * 44100)


@unittest.skipUnless(HAS_FFMPEG and HAS_NUMPY, "ffmpeg or numpy missing")
class MixAndVerifyTest(unittest.TestCase):
    def test_mix_then_verify(self):
        with tempfile.TemporaryDirectory() as d:
            j = lambda f: os.path.join(d, f)
            run("ffmpeg", "-v", "error", "-f", "lavfi", "-i", "testsrc=size=320x180:rate=12:duration=4",
                "-pix_fmt", "yuv420p", j("clip_silent.mp4"))
            run("ffmpeg", "-v", "error", "-f", "lavfi", "-i", "sine=frequency=440:duration=1.5", j("vo0.mp3"))
            run(sys.executable, os.path.join(SCRIPTS, "music.py"), "--duration", "4", "--out", j("music.wav"))
            r = run(sys.executable, os.path.join(SCRIPTS, "verify.py"), j("clip_silent.mp4"), "--no-frames")
            self.assertEqual(r.returncode, 1, "a silent video must fail verification")
            self.assertIn("no audio stream", r.stdout)
            r = run(sys.executable, os.path.join(SCRIPTS, "mix.py"), "--video", j("clip_silent.mp4"),
                    "--music", j("music.wav"), "--voice", f"0.5:{j('vo0.mp3')}", "--out", j("clip_final.mp4"))
            self.assertEqual(r.returncode, 0, r.stderr)
            r = run(sys.executable, os.path.join(SCRIPTS, "verify.py"), j("clip_final.mp4"),
                    "--frames", "2", "--frames-dir", j("check"))
            self.assertEqual(r.returncode, 0, r.stdout + r.stderr)
            self.assertIn("duration gap: 0.0", r.stdout)
            self.assertEqual(len(os.listdir(j("check"))), 3)  # first, 2s, last


@unittest.skipUnless(HAS_FFMPEG and has_playwright(), "ffmpeg, node or playwright missing")
class RenderTemplateTest(unittest.TestCase):
    def test_preview_thumbnail_and_encode(self):
        with tempfile.TemporaryDirectory() as d:
            shutil.copy(TEMPLATE, os.path.join(d, "index.html"))
            js = os.path.join(SCRIPTS, "render.js")
            r = run("node", js, "index.html", "--preview", "0,12", "--thumbnail", "thumbnail.png", cwd=d)
            self.assertEqual(r.returncode, 0, r.stderr)
            for f in ("thumbnail.png", "preview/p_0.00.png", "preview/p_12.00.png"):
                self.assertTrue(os.path.exists(os.path.join(d, f)), f)
            r = run("node", js, "index.html", "--duration", "2", "--fps", "6", "--encode", "t_silent.mp4", cwd=d)
            self.assertEqual(r.returncode, 0, r.stderr)
            self.assertEqual(len(os.listdir(os.path.join(d, "frames"))), 12)
            r = run("ffprobe", "-v", "error", "-select_streams", "v", "-show_entries", "stream=width,height",
                    "-of", "csv=p=0", os.path.join(d, "t_silent.mp4"))
            self.assertEqual(r.stdout.strip(), "1280,720")

    def test_frame_zero_is_a_finished_cover(self):
        with tempfile.TemporaryDirectory() as d:
            shutil.copy(TEMPLATE, os.path.join(d, "index.html"))
            script = (
                "const {chromium}=require('playwright');(async()=>{const b=await chromium.launch();"
                "const p=await b.newPage({viewport:{width:1280,height:720}});"
                "await p.goto('file://'+process.argv[1]);await p.evaluate(()=>setT(0));"
                "const o=await p.evaluate(()=>[getComputedStyle(document.getElementById('s-cover')).opacity,"
                "getComputedStyle(document.getElementById('s-problem')).opacity, window.DURATION]);"
                "console.log(JSON.stringify(o));await b.close();})();"
            )
            r = run("node", "-e", script, os.path.join(d, "index.html"))
            self.assertEqual(r.returncode, 0, r.stderr)
            self.assertEqual(r.stdout.strip(), '["1","0",31]')


@unittest.skipUnless(HAS_FFMPEG and HAS_NUMPY and has_playwright(), "ffmpeg, numpy, node or playwright missing")
class DemoTest(unittest.TestCase):
    """Runs scripts/demo.py end to end at 2 fps so it stays quick."""

    def demo(self, d, *args):
        r = run(sys.executable, os.path.join(SCRIPTS, "demo.py"), "--out-dir", d, "--fps", "2", *args)
        self.assertEqual(r.returncode, 0, r.stdout[-2000:] + r.stderr[-2000:])
        return r.stdout

    def duration(self, f):
        r = run("ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "default=nw=1:nk=1", f)
        return float(r.stdout)

    def test_music_only_demo(self):
        with tempfile.TemporaryDirectory() as d:
            out = self.demo(d)
            self.assertIn("music only", out)
            for f in ("demo_final.mp4", "demo_silent.mp4", "thumbnail.png", "music.wav"):
                self.assertTrue(os.path.exists(os.path.join(d, f)), f)
            self.assertFalse(any(f.startswith("vo") for f in os.listdir(d)))
            self.assertAlmostEqual(self.duration(os.path.join(d, "demo_final.mp4")), 31, delta=0.6)

    def test_narrated_demo_from_clips(self):
        with tempfile.TemporaryDirectory() as clips, tempfile.TemporaryDirectory() as d:
            for i in range(6):  # scene 6 gets a long clip, so the video must stretch
                secs = 7 if i == 5 else 2
                run("ffmpeg", "-v", "error", "-f", "lavfi", "-i", f"anullsrc=r=44100:cl=mono",
                    "-t", str(secs), os.path.join(clips, f"vo{i}.mp3"))
            out = self.demo(d, "--clips-dir", clips)
            self.assertIn("narrated", out)
            with open(os.path.join(d, "index.html")) as f:
                m = re.search(r"const NB = \[0, 4, 9, 15, 21, 26, (33\.7\d*)\];", f.read())
            self.assertIsNotNone(m, "last scene stretched to ~33.7s (7s clip + padding)")
            self.assertAlmostEqual(self.duration(os.path.join(d, "demo_final.mp4")), 33.7, delta=0.6)

    def test_needs_all_clips(self):
        with tempfile.TemporaryDirectory() as clips, tempfile.TemporaryDirectory() as d:
            r = run(sys.executable, os.path.join(SCRIPTS, "demo.py"), "--out-dir", d, "--clips-dir", clips)
            self.assertNotEqual(r.returncode, 0)
            self.assertIn("need 6 clips", r.stderr)


if __name__ == "__main__":
    unittest.main()
