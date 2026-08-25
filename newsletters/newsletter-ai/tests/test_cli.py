"""Red/Green tests for build_report.py's CLI/library wiring of:
  - `-r`/`--report PATH` (folder-or-report.html): writes the rendered
    html AND a sidecar .yaml with the exact source text, side by side.
  - fusing (embedding the source YAML into the HTML) by default, with
    `--no-fuse` to opt out.
  - the legacy two-positional-argument form still working unchanged.
"""
import pathlib
import subprocess
import sys

ROOT = pathlib.Path(__file__).resolve().parents[1]
BUILDER = ROOT / "builder"
FIXTURES = pathlib.Path(__file__).parent / "fixtures"
sys.path.insert(0, str(BUILDER))

import build_report  # noqa: E402
import fuse  # noqa: E402

SAMPLE = FIXTURES / "sample.yaml"


# --------------------------------------------------------------- library API

def test_build_with_report_path_writes_html_and_yaml_side_by_side(tmp_path):
    target = tmp_path / "out"
    html_path, yaml_path = build_report.build(SAMPLE, report_path=target)
    assert html_path == target / "report.html"
    assert yaml_path == target / "report.yaml"
    assert html_path.exists()
    assert yaml_path.exists()


def test_report_path_yaml_sidecar_matches_source_byte_for_byte(tmp_path):
    target = tmp_path / "out.html"
    _, yaml_path = build_report.build(SAMPLE, report_path=target)
    assert yaml_path.read_text(encoding="utf-8") == SAMPLE.read_text(encoding="utf-8")


def test_report_path_html_has_fused_data_by_default(tmp_path):
    target = tmp_path / "out"
    html_path, _ = build_report.build(SAMPLE, report_path=target)
    extracted = fuse.extract_source(html_path.read_text(encoding="utf-8"))
    assert extracted == SAMPLE.read_text(encoding="utf-8")


def test_legacy_positional_output_still_works(tmp_path):
    out = tmp_path / "legacy.html"
    result = build_report.build(SAMPLE, out)
    assert out.exists()
    assert result == out


def test_legacy_positional_output_is_fused_by_default(tmp_path):
    out = tmp_path / "legacy.html"
    build_report.build(SAMPLE, out)
    extracted = fuse.extract_source(out.read_text(encoding="utf-8"))
    assert extracted == SAMPLE.read_text(encoding="utf-8")


def test_no_fuse_suppresses_embedded_data(tmp_path):
    out = tmp_path / "no-fuse.html"
    build_report.build(SAMPLE, out, embed_data=False)
    assert fuse.extract_source(out.read_text(encoding="utf-8")) is None


def test_build_requires_either_output_or_report_path():
    import pytest

    with pytest.raises(ValueError):
        build_report.build(SAMPLE)


# --------------------------------------------------------------------- CLI

def _run_cli(*args):
    return subprocess.run(
        [sys.executable, str(BUILDER / "build_report.py"), *args],
        capture_output=True,
        text=True,
    )


def test_cli_legacy_two_positional_args(tmp_path):
    out = tmp_path / "cli-legacy.html"
    result = _run_cli(str(SAMPLE), str(out))
    assert result.returncode == 0, result.stderr
    assert out.exists()


def test_cli_dash_r_report_flag_writes_pair(tmp_path):
    target = tmp_path / "cli-out"
    result = _run_cli(str(SAMPLE), "-r", str(target))
    assert result.returncode == 0, result.stderr
    assert (target / "report.html").exists()
    assert (target / "report.yaml").exists()


def test_cli_long_form_report_flag(tmp_path):
    target = tmp_path / "cli-out2"
    result = _run_cli(str(SAMPLE), "--report", str(target))
    assert result.returncode == 0, result.stderr
    assert (target / "report.html").exists()
    assert (target / "report.yaml").exists()


def test_cli_no_fuse_flag(tmp_path):
    target = tmp_path / "cli-out3"
    result = _run_cli(str(SAMPLE), "-r", str(target), "--no-fuse")
    assert result.returncode == 0, result.stderr
    html = (target / "report.html").read_text(encoding="utf-8")
    assert fuse.extract_source(html) is None


def test_cli_errors_cleanly_with_neither_output_nor_report(tmp_path):
    result = _run_cli(str(SAMPLE))
    assert result.returncode != 0
