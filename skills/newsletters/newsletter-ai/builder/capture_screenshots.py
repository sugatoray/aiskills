"""Render a report YAML and screenshot it, to (re)generate the images
README.md embeds under assets/images/.

CLI:
    python capture_screenshots.py INPUT.yaml OUTPUT_DIR [SCENE_NAME ...]

Library:
    capture(input_yaml, output_dir, scenes=None) -> {name: Path}

Requires Node + a globally-installed `playwright` (with its Chromium
browser) — see screenshots.cjs, which does the actual browser driving.
This module only builds the HTML and shells out to it.
"""
from __future__ import annotations

import json
import os
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

import build_report

HERE = Path(__file__).resolve().parent
SCREENSHOTS_SCRIPT = HERE / "screenshots.cjs"

# Kept in sync with the SCENES array in screenshots.cjs — see
# test_available_scene_names_include_the_two_shipped_images for the
# regression check that they match.
SCENE_NAMES = ["report-overview-light", "report-citations-dark"]


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


def capture(input_yaml: "str | Path", output_dir: "str | Path", scenes: "list[str] | None" = None) -> dict:
    """Render `input_yaml` and capture each named scene (default: all of
    SCENE_NAMES) into `output_dir/<scene>.png`. Returns {name: Path}.

    Raises ValueError for an unknown scene name, FileNotFoundError if
    Node can't be found, and RuntimeError if the capture itself fails
    (page error, Playwright missing, etc.) — the underlying stderr is
    included in the message.
    """
    if scenes is not None:
        unknown = sorted(set(scenes) - set(SCENE_NAMES))
        if unknown:
            raise ValueError(f"unknown scene name(s): {unknown} (known: {SCENE_NAMES})")
    else:
        scenes = SCENE_NAMES

    if shutil.which("node") is None:
        raise FileNotFoundError("node is required to capture screenshots but was not found on PATH")

    output_dir = Path(output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)

    with tempfile.TemporaryDirectory() as tmp:
        html_path = Path(tmp) / "report.html"
        build_report.build(input_yaml, html_path)

        result = subprocess.run(
            ["node", str(SCREENSHOTS_SCRIPT), str(html_path), str(output_dir), *scenes],
            capture_output=True,
            text=True,
            env=_node_env(),
            timeout=120,
        )
        if result.returncode != 0:
            raise RuntimeError(
                f"screenshot capture failed (exit {result.returncode}):\n"
                f"stdout={result.stdout}\nstderr={result.stderr}"
            )

    return {name: output_dir / f"{name}.png" for name in scenes}


def main(argv=None) -> int:
    import argparse

    parser = argparse.ArgumentParser(description="Render a report YAML and screenshot it")
    parser.add_argument("input", help="path to the report YAML file")
    parser.add_argument("output_dir", help="directory to write the PNG screenshot(s) into")
    parser.add_argument("scenes", nargs="*", help=f"scene name(s) to capture (default: all — {', '.join(SCENE_NAMES)})")
    args = parser.parse_args(argv)

    try:
        written = capture(args.input, args.output_dir, scenes=args.scenes or None)
    except (ValueError, FileNotFoundError, RuntimeError) as exc:
        print(f"error: {exc}", file=sys.stderr)
        return 1

    for name, path in written.items():
        print(f"wrote {path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
