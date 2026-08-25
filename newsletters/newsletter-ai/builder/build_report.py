"""Render a newsletter-ai report YAML into the interactive HTML report.

CLI:
    python build_report.py INPUT.yaml OUTPUT.html [--template PATH] [--no-fuse]
    python build_report.py INPUT.yaml -r/--report PATH [--template PATH] [--no-fuse]

PATH for -r/--report may be a folder (gets report.html + report.yaml
inside it) or an explicit .html/.htm file (gets a .yaml sidecar with the
same basename next to it). Either way the rendered HTML also has the
source YAML fused into it by default (see fuse.py) unless --no-fuse is
given, so the .html file alone stays fully reproducible even without its
.yaml sidecar.

Library:
    render_html(data) -> str                          # dict -> full HTML
    build(input, output) -> Path                       # legacy: single file
    build(input, report_path=path) -> (Path, Path)      # html + yaml sidecar
"""
from __future__ import annotations

import argparse
import copy
import sys
from pathlib import Path

import jinja2
import yaml

import fuse
import paths
import report_data

HERE = Path(__file__).resolve().parent
DEFAULT_TEMPLATE = HERE.parent / "assets" / "templates" / "report.html"


def render_html(
    data: dict,
    template_path: "str | Path" = DEFAULT_TEMPLATE,
    *,
    embed_data: bool = True,
    source_yaml_text: "str | None" = None,
) -> str:
    """Validate `data` and render it through the Jinja2 report template.

    Raises report_data.ValidationError if `data` doesn't conform to the
    schema (see report_data.validate for the exact checks).

    When `embed_data` is true (the default), the source YAML is fused
    into the returned HTML (see fuse.embed_source) for single-file
    distribution. Pass `source_yaml_text` when the exact original file
    text is available (preserves comments/formatting byte-for-byte);
    otherwise a canonical re-dump of `data` is embedded instead.
    """
    snapshot = copy.deepcopy(data) if embed_data and source_yaml_text is None else None
    ctx = report_data.build_context(data)
    template_path = Path(template_path)
    env = jinja2.Environment(
        loader=jinja2.FileSystemLoader(str(template_path.parent)),
        autoescape=True,
        trim_blocks=True,
        lstrip_blocks=True,
    )
    template = env.get_template(template_path.name)
    html = template.render(**ctx)
    if embed_data:
        yaml_text = source_yaml_text if source_yaml_text is not None else yaml.safe_dump(
            snapshot, sort_keys=False, allow_unicode=True
        )
        html = fuse.embed_source(html, yaml_text)
    return html


def build(
    input_path: "str | Path",
    output_path: "str | Path | None" = None,
    *,
    report_path: "str | Path | None" = None,
    template_path: "str | Path" = DEFAULT_TEMPLATE,
    embed_data: bool = True,
):
    """Render `input_path` (a report YAML file).

    - `output_path` given (legacy form): writes exactly that one HTML
      file (fused by default) and returns its Path.
    - `report_path` given: resolves it to a (html_path, yaml_path) pair
      via paths.resolve_report_paths, writes the rendered+fused HTML to
      html_path and an exact copy of the source YAML text to yaml_path,
      and returns (html_path, yaml_path).
    - Neither given: raises ValueError.
    """
    if output_path is None and report_path is None:
        raise ValueError("build() requires either output_path or report_path")

    input_path = Path(input_path)
    raw_text = input_path.read_text(encoding="utf-8")
    data = report_data.load_yaml(input_path)

    if report_path is not None:
        html_path, yaml_path = paths.resolve_report_paths(report_path)
        paths.ensure_parent_dirs(html_path, yaml_path)
        html = render_html(
            data, template_path=template_path, embed_data=embed_data,
            source_yaml_text=raw_text if embed_data else None,
        )
        html_path.write_text(html, encoding="utf-8")
        yaml_path.write_text(raw_text, encoding="utf-8")
        return html_path, yaml_path

    output_path = Path(output_path)
    paths.ensure_parent_dirs(output_path)
    html = render_html(
        data, template_path=template_path, embed_data=embed_data,
        source_yaml_text=raw_text if embed_data else None,
    )
    output_path.write_text(html, encoding="utf-8")
    return output_path


def main(argv=None) -> int:
    parser = argparse.ArgumentParser(description="Render a newsletter-ai report YAML into report.html")
    parser.add_argument("input", help="path to the report YAML file")
    parser.add_argument(
        "output", nargs="?", default=None,
        help="path to write the rendered HTML file (legacy single-file form)",
    )
    parser.add_argument(
        "-r", "--report", dest="report", default=None,
        help="write report.html + report.yaml (or <name>.html + <name>.yaml) into this "
             "folder-or-report.html path, instead of a single --output file",
    )
    parser.add_argument(
        "--no-fuse", dest="fuse_data", action="store_false", default=True,
        help="do not embed the source YAML into the rendered HTML",
    )
    parser.add_argument(
        "--template",
        default=str(DEFAULT_TEMPLATE),
        help="path to the Jinja2 template (default: assets/templates/report.html)",
    )
    args = parser.parse_args(argv)

    if args.output is None and args.report is None:
        parser.error("either OUTPUT or -r/--report PATH is required")

    try:
        if args.report is not None:
            html_path, yaml_path = build(
                args.input, report_path=args.report, template_path=args.template, embed_data=args.fuse_data,
            )
            print(f"wrote {html_path}")
            print(f"wrote {yaml_path}")
        else:
            out = build(
                args.input, args.output, template_path=args.template, embed_data=args.fuse_data,
            )
            print(f"wrote {out}")
    except report_data.ValidationError as exc:
        print(f"error: {exc}", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
