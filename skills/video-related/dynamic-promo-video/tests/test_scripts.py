"""Tests for the dynamic-promo-video scripts.

Run from the repository root:
    python3 -m unittest discover -s skills/video-related/dynamic-promo-video/tests -p 'test_*.py'

Tests that need ffmpeg, numpy, Node or Playwright are skipped when those are
missing. The pipeline test renders the real template (about 2s of frames).
"""
import importlib.util
import os
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


if __name__ == "__main__":
    unittest.main()
