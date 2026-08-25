"""Red/Green tests for the screenshot-automation used to (re)generate
README.md's images (builder/capture_screenshots.py + builder/screenshots.cjs).

Skipped automatically if Node/Playwright aren't available, rather than
failing the whole suite over missing tooling — see conftest.py.
"""
import pathlib
import struct
import sys

import pytest

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from conftest import ROOT, BUILDER, playwright_available  # noqa: E402

sys.path.insert(0, str(BUILDER))

FIXTURES = pathlib.Path(__file__).parent / "fixtures"
SAMPLE = FIXTURES / "sample.yaml"

pytestmark = pytest.mark.skipif(
    not playwright_available(), reason="node/playwright not available in this environment"
)

PNG_SIGNATURE = b"\x89PNG\r\n\x1a\n"


def _png_dimensions(path: pathlib.Path) -> tuple[int, int]:
    """Read width/height straight out of the PNG IHDR chunk (stdlib only,
    no image library needed) — also doubles as "is this actually a valid
    PNG" since it will raise/mismatch on anything else."""
    data = path.read_bytes()
    assert data[:8] == PNG_SIGNATURE, f"{path} is not a PNG file"
    # bytes 8-11: IHDR chunk length (always 13); 12-15: b"IHDR"; 16-23: width, height (big-endian uint32 each)
    assert data[12:16] == b"IHDR"
    width, height = struct.unpack(">II", data[16:24])
    return width, height


def test_available_scene_names_include_the_two_shipped_images():
    import capture_screenshots

    names = capture_screenshots.SCENE_NAMES
    assert "report-overview-light" in names
    assert "report-citations-dark" in names


def test_capture_writes_a_valid_png_per_scene(tmp_path):
    import capture_screenshots

    written = capture_screenshots.capture(SAMPLE, tmp_path)
    assert set(written) == set(capture_screenshots.SCENE_NAMES)
    for name, path in written.items():
        assert path.exists(), f"{name} was not written"
        width, height = _png_dimensions(path)
        assert width > 800 and height > 400, f"{name} has implausible dimensions {width}x{height}"


def test_capture_produces_visibly_different_light_and_dark_scenes(tmp_path):
    import capture_screenshots

    written = capture_screenshots.capture(SAMPLE, tmp_path)
    light = written["report-overview-light"].read_bytes()
    dark = written["report-citations-dark"].read_bytes()
    assert light != dark
    # a dark-themed screenshot of mostly-background pixels compresses to a
    # meaningfully different size than a light one of the same viewport;
    # this is a coarse but dependency-free sanity check that theming
    # actually took effect rather than capturing the same page twice.
    assert abs(len(light) - len(dark)) > 1000


def test_capture_accepts_a_subset_of_scene_names(tmp_path):
    import capture_screenshots

    written = capture_screenshots.capture(SAMPLE, tmp_path, scenes=["report-overview-light"])
    assert set(written) == {"report-overview-light"}
    assert (tmp_path / "report-overview-light.png").exists()
    assert not (tmp_path / "report-citations-dark.png").exists()


def test_capture_rejects_unknown_scene_name(tmp_path):
    import capture_screenshots

    with pytest.raises(ValueError):
        capture_screenshots.capture(SAMPLE, tmp_path, scenes=["not-a-real-scene"])


def test_cli_writes_expected_files(tmp_path):
    import subprocess

    from conftest import node_env  # noqa: reuse for consistency, unused directly here

    result = subprocess.run(
        [sys.executable, str(BUILDER / "capture_screenshots.py"), str(SAMPLE), str(tmp_path)],
        capture_output=True,
        text=True,
        timeout=60,
    )
    assert result.returncode == 0, f"stdout={result.stdout!r} stderr={result.stderr!r}"
    assert (tmp_path / "report-overview-light.png").exists()
    assert (tmp_path / "report-citations-dark.png").exists()
