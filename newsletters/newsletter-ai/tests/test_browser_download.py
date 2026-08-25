"""Red/Green regression test for the "Download data" button, driven
through a real browser (Playwright/Node), not just string assertions.

Pure-Python round-trip tests (test_fuse.py) can't catch bugs in the
client-side JS decode path (e.g. atob() producing a binary string instead
of properly decoded Unicode text for multi-byte characters). This test
builds a real report, opens it in headless Chromium, clicks the button,
and diffs the downloaded file against the source YAML byte-for-byte.

Skipped automatically if Node/Playwright aren't available in this
environment, rather than failing the whole suite over missing tooling.
"""
import os
import pathlib
import shutil
import subprocess
import sys

import pytest

ROOT = pathlib.Path(__file__).resolve().parents[1]
BUILDER = ROOT / "builder"
CHECK_SCRIPT = pathlib.Path(__file__).parent / "browser" / "check_download.cjs"
SAMPLE = pathlib.Path(__file__).parent / "fixtures" / "sample.yaml"

sys.path.insert(0, str(BUILDER))


def _node_env() -> dict:
    env = dict(os.environ)
    if shutil.which("npm"):
        try:
            root = subprocess.run(
                ["npm", "root", "-g"], capture_output=True, text=True, check=True
            ).stdout.strip()
            if root:
                env["NODE_PATH"] = root
        except (subprocess.CalledProcessError, OSError):
            pass
    return env


def _node_available() -> bool:
    return shutil.which("node") is not None


def _playwright_available() -> bool:
    result = subprocess.run(
        ["node", "-e", "require.resolve('playwright')"],
        capture_output=True,
        env=_node_env(),
    )
    return result.returncode == 0


pytestmark = pytest.mark.skipif(
    not _node_available() or not _playwright_available(),
    reason="node/playwright not available in this environment",
)


def test_downloaded_data_matches_source_byte_for_byte(tmp_path):
    import build_report  # noqa: local import after sys.path setup

    target = tmp_path / "out"
    html_path, yaml_path = build_report.build(SAMPLE, report_path=target)

    result = subprocess.run(
        ["node", str(CHECK_SCRIPT), str(html_path), str(yaml_path), str(tmp_path / "downloaded.yaml")],
        capture_output=True,
        text=True,
        timeout=30,
        env=_node_env(),
    )
    assert result.returncode == 0, f"stdout={result.stdout!r} stderr={result.stderr!r}"
    assert "OK" in result.stdout
