"""Load, validate, and prepare newsletter-ai report data for rendering.

The report YAML describes one edition: a `meta` block plus an ordered list
of `sections` (a "home" landing section and any number of "standard"
content sections). Each standard section's `items` may carry `sources`
(label + absolute http(s) URL); `compute_references` dedupes those by URL
into a per-section reference list and annotates each item with the shared
reference numbers, so the template can render both an inline citation and
a matching entry in that section's References accordion from the same
data — no hand-numbered cross-references to keep in sync.

See assets/example/sample-report.yaml for a complete, valid document.
"""
from __future__ import annotations

import re
from pathlib import Path
from typing import Any

import yaml

ID_RE = re.compile(r"^[a-z0-9][a-z0-9-]*$")
VALID_KINDS = {"home", "standard"}


class ValidationError(Exception):
    """Raised when a report document fails schema validation."""


def load_yaml(path: "str | Path") -> dict:
    """Read a YAML file and return its top-level mapping.

    Raises ValidationError if the file's top level isn't a mapping (a
    common mistake — e.g. accidentally writing a bare list).
    """
    text = Path(path).read_text(encoding="utf-8")
    data = yaml.safe_load(text)
    if not isinstance(data, dict):
        raise ValidationError(f"{path}: top-level YAML must be a mapping (got {type(data).__name__})")
    return data


def validate(data: dict) -> list[str]:
    """Return a list of human-readable validation errors (empty = valid)."""
    errors: list[str] = []

    meta = data.get("meta")
    if not isinstance(meta, dict):
        errors.append("meta: required mapping is missing")
    else:
        for key in ("title", "window", "generated"):
            if not meta.get(key):
                errors.append(f"meta.{key}: required")

    sections = data.get("sections")
    if not isinstance(sections, list) or not sections:
        errors.append("sections: required non-empty list")
        return errors

    seen_ids: set[str] = set()
    for i, sec in enumerate(sections):
        prefix = f"sections[{i}]"
        sid = sec.get("id")
        if not sid or not ID_RE.match(str(sid)):
            errors.append(f"{prefix}.id: required, lowercase kebab-case (e.g. 'part1')")
        elif sid in seen_ids:
            errors.append(f"{prefix}.id: duplicate id {sid!r}")
        else:
            seen_ids.add(sid)

        kind = sec.get("kind", "standard")
        if kind not in VALID_KINDS:
            errors.append(f"{prefix}.kind: must be one of {sorted(VALID_KINDS)}, got {kind!r}")

        for key in ("nav_label", "icon", "title"):
            if not sec.get(key):
                errors.append(f"{prefix}.{key}: required")

        if kind == "standard":
            items = sec.get("items")
            if not isinstance(items, list) or not items:
                errors.append(f"{prefix}.items: required non-empty list for standard sections")
            else:
                for j, item in enumerate(items):
                    iprefix = f"{prefix}.items[{j}]"
                    if not item.get("title"):
                        errors.append(f"{iprefix}.title: required")
                    for k, src in enumerate(item.get("sources") or []):
                        sprefix = f"{iprefix}.sources[{k}]"
                        if not src.get("label"):
                            errors.append(f"{sprefix}.label: required")
                        url = src.get("url", "")
                        if not url.startswith(("http://", "https://")):
                            errors.append(f"{sprefix}.url: must be an absolute http(s) URL, got {url!r}")

        if kind == "home":
            for j, card in enumerate(sec.get("cards") or []):
                if not card.get("target"):
                    errors.append(f"{prefix}.cards[{j}].target: required")

    if not any(e.startswith("sections[") and ".id:" in e for e in errors):
        ids = {s["id"] for s in sections}
        for i, sec in enumerate(sections):
            if sec.get("kind", "standard") == "home":
                for j, card in enumerate(sec.get("cards") or []):
                    target = card.get("target")
                    if target and target not in ids:
                        errors.append(f"sections[{i}].cards[{j}].target: {target!r} does not match any section id")

    return errors


def compute_references(section: dict) -> dict:
    """Dedupe a standard section's item sources by URL (first-seen order)
    into `section["references"]`, and set each item's `ref_numbers` to the
    shared reference numbers for its own sources. Mutates and returns
    `section`."""
    refs: list[dict[str, Any]] = []
    url_to_n: dict[str, int] = {}
    for item in section.get("items", []):
        nums = []
        for src in item.get("sources") or []:
            url = src["url"]
            if url not in url_to_n:
                n = len(refs) + 1
                url_to_n[url] = n
                refs.append({"n": n, "label": src["label"], "url": url})
            nums.append(url_to_n[url])
        item["ref_numbers"] = nums
    section["references"] = refs
    return section


def build_context(data: dict) -> dict:
    """Validate `data` and attach computed references to every standard
    section, ready to hand to the Jinja2 template. Raises ValidationError
    with every problem found (not just the first) if invalid."""
    errors = validate(data)
    if errors:
        raise ValidationError("; ".join(errors))
    for sec in data["sections"]:
        if sec.get("kind", "standard") == "standard":
            compute_references(sec)
        else:
            sec["references"] = []
    return data
