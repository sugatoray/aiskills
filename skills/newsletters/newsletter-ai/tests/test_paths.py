"""Red/Green tests for builder/paths.py — resolving the -r/--report
"folder-or-report.html" argument into a concrete (html_path, yaml_path)
pair, so the rendered report and its source data always land next to
each other under a predictable name.
"""
import pathlib
import sys

ROOT = pathlib.Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "builder"))

import paths  # noqa: E402


def test_directory_path_gets_default_basename(tmp_path):
    html_path, yaml_path = paths.resolve_report_paths(tmp_path)
    assert html_path == tmp_path / "report.html"
    assert yaml_path == tmp_path / "report.yaml"


def test_nonexistent_directory_path_is_still_treated_as_a_folder(tmp_path):
    target = tmp_path / "brand-new-folder"
    html_path, yaml_path = paths.resolve_report_paths(target)
    assert html_path == target / "report.html"
    assert yaml_path == target / "report.yaml"


def test_html_suffix_path_is_treated_as_the_report_file(tmp_path):
    target = tmp_path / "weekly-brief.html"
    html_path, yaml_path = paths.resolve_report_paths(target)
    assert html_path == target
    assert yaml_path == tmp_path / "weekly-brief.yaml"


def test_htm_suffix_is_also_treated_as_a_file(tmp_path):
    target = tmp_path / "weekly-brief.htm"
    html_path, yaml_path = paths.resolve_report_paths(target)
    assert html_path == target
    assert yaml_path == tmp_path / "weekly-brief.yaml"


def test_custom_basename_used_for_directory_targets(tmp_path):
    html_path, yaml_path = paths.resolve_report_paths(tmp_path, default_basename="brief")
    assert html_path == tmp_path / "brief.html"
    assert yaml_path == tmp_path / "brief.yaml"


def test_string_input_accepted_same_as_path(tmp_path):
    html_path, yaml_path = paths.resolve_report_paths(str(tmp_path))
    assert html_path == tmp_path / "report.html"


def test_ensure_parent_dirs_creates_missing_directories(tmp_path):
    target = tmp_path / "a" / "b" / "c"
    html_path, yaml_path = paths.resolve_report_paths(target)
    assert not html_path.parent.exists()
    paths.ensure_parent_dirs(html_path, yaml_path)
    assert html_path.parent.exists()
    assert yaml_path.parent.exists()
