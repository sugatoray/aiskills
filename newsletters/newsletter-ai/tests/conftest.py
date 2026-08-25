"""Shared pytest helpers for tests that need to shell out to Node/Playwright
to drive a real browser (screenshot capture, download verification).
"""
import os
import pathlib
import shutil
import subprocess

ROOT = pathlib.Path(__file__).resolve().parents[1]
BUILDER = ROOT / "builder"


def node_env() -> dict:
    """Environment for subprocess node calls, with NODE_PATH pointed at the
    global npm root so a globally-installed `playwright` resolves even
    though this skill has no local node_modules/."""
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


def node_available() -> bool:
    return shutil.which("node") is not None


def playwright_available() -> bool:
    if not node_available():
        return False
    result = subprocess.run(
        ["node", "-e", "require.resolve('playwright')"],
        capture_output=True,
        env=node_env(),
    )
    return result.returncode == 0
