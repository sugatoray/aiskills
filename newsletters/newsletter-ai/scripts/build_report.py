"""Render a newsletter-ai report YAML into the interactive HTML report.

CLI:
    python build_report.py INPUT.yaml OUTPUT.html [--template PATH]

Library:
    render_html(data) -> str        # validated data (raw dict) -> full HTML
    build(input, output) -> Path    # YAML file -> HTML file
"""
from __future__ import annotations

import argparse
import sys
from pathlib import Path

import jinja2

import report_data

HERE = Path(__file__).resolve().parent
DEFAULT_TEMPLATE = HERE.parent / "assets" / "templates" / "report.html"


def render_html(data: dict, template_path: "str | Path" = DEFAULT_TEMPLATE) -> str:
    """Validate `data` and render it through the Jinja2 report template.

    Raises report_data.ValidationError if `data` doesn't conform to the
    schema (see report_data.validate for the exact checks).
    """
    ctx = report_data.build_context(data)
    template_path = Path(template_path)
    env = jinja2.Environment(
        loader=jinja2.FileSystemLoader(str(template_path.parent)),
        autoescape=True,
        trim_blocks=True,
        lstrip_blocks=True,
    )
    template = env.get_template(template_path.name)
    return template.render(**ctx)


def build(input_path: "str | Path", output_path: "str | Path", template_path: "str | Path" = DEFAULT_TEMPLATE) -> Path:
    data = report_data.load_yaml(input_path)
    html = render_html(data, template_path=template_path)
    output_path = Path(output_path)
    output_path.write_text(html, encoding="utf-8")
    return output_path


def main(argv=None) -> int:
    parser = argparse.ArgumentParser(description="Render a newsletter-ai report YAML into report.html")
    parser.add_argument("input", help="path to the report YAML file")
    parser.add_argument("output", help="path to write the rendered HTML file")
    parser.add_argument(
        "--template",
        default=str(DEFAULT_TEMPLATE),
        help="path to the Jinja2 template (default: assets/templates/report.html)",
    )
    args = parser.parse_args(argv)
    try:
        build(args.input, args.output, template_path=args.template)
    except report_data.ValidationError as exc:
        print(f"error: {exc}", file=sys.stderr)
        return 1
    print(f"wrote {args.output}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
