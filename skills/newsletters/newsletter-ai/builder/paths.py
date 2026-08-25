"""Resolve the -r/--report "folder-or-report.html" CLI argument into a
concrete (html_path, yaml_path) pair, so a rendered report and the source
data it was built from always land next to each other under a
predictable, matching basename.
"""
from __future__ import annotations

from pathlib import Path

HTML_SUFFIXES = {".html", ".htm"}


def resolve_report_paths(path: "str | Path", default_basename: str = "report") -> tuple[Path, Path]:
    """Given a path that names either a directory or an .html/.htm file,
    return (html_path, yaml_path).

    - A directory (existing, or not yet created, or with no recognized
      file suffix) gets `<default_basename>.html` / `.yaml` inside it.
    - An .html/.htm path is used as-is for the report; the yaml sidecar
      shares its parent directory and basename.
    """
    path = Path(path)
    if path.suffix.lower() in HTML_SUFFIXES:
        html_path = path
        yaml_path = path.with_suffix(".yaml")
    else:
        html_path = path / f"{default_basename}.html"
        yaml_path = path / f"{default_basename}.yaml"
    return html_path, yaml_path


def ensure_parent_dirs(*paths: Path) -> None:
    for p in paths:
        Path(p).parent.mkdir(parents=True, exist_ok=True)
