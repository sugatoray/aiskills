"""Red/Green tests for report_data.py — the YAML -> render-context layer.

Run: pytest newsletters/newsletter-ai/tests -q
"""
import pathlib
import sys

import pytest

SCRIPTS = pathlib.Path(__file__).resolve().parents[1] / "scripts"
sys.path.insert(0, str(SCRIPTS))

import report_data  # noqa: E402


def minimal_doc():
    return {
        "meta": {"title": "T", "window": "W", "generated": "G"},
        "sections": [
            {
                "id": "home",
                "kind": "home",
                "nav_label": "Overview",
                "icon": "home",
                "title": "Overview",
                "cards": [{"target": "part1", "icon": "trend", "badge": "cyan", "title": "01", "desc": "d"}],
            },
            {
                "id": "part1",
                "kind": "standard",
                "nav_label": "Part 1",
                "icon": "trend",
                "title": "Part 1",
                "items": [{"title": "Item 1"}],
            },
        ],
    }


# ---------------------------------------------------------------- validate()

def test_validate_requires_meta():
    errors = report_data.validate({})
    assert any(e.startswith("meta") for e in errors)


def test_validate_valid_minimal_doc_has_no_errors():
    assert report_data.validate(minimal_doc()) == []


def test_validate_requires_sections_nonempty():
    doc = minimal_doc()
    doc["sections"] = []
    errors = report_data.validate(doc)
    assert any("sections" in e for e in errors)


def test_validate_rejects_duplicate_section_ids():
    doc = minimal_doc()
    doc["sections"][1]["id"] = "home"
    errors = report_data.validate(doc)
    assert any("duplicate" in e.lower() for e in errors)


def test_validate_rejects_bad_id_format():
    doc = minimal_doc()
    doc["sections"][1]["id"] = "Part One!"
    errors = report_data.validate(doc)
    assert any("id" in e for e in errors)


def test_validate_rejects_unknown_kind():
    doc = minimal_doc()
    doc["sections"][1]["kind"] = "weird"
    errors = report_data.validate(doc)
    assert any("kind" in e for e in errors)


def test_validate_standard_section_requires_items():
    doc = minimal_doc()
    doc["sections"][1]["items"] = []
    errors = report_data.validate(doc)
    assert any("items" in e for e in errors)


def test_validate_rejects_non_http_source_url():
    doc = minimal_doc()
    doc["sections"][1]["items"][0]["sources"] = [{"label": "X", "url": "javascript:alert(1)"}]
    errors = report_data.validate(doc)
    assert any("url" in e for e in errors)


def test_validate_rejects_source_missing_label():
    doc = minimal_doc()
    doc["sections"][1]["items"][0]["sources"] = [{"url": "https://example.com"}]
    errors = report_data.validate(doc)
    assert any("label" in e for e in errors)


def test_validate_rejects_home_card_pointing_at_unknown_section():
    doc = minimal_doc()
    doc["sections"][0]["cards"][0]["target"] = "does-not-exist"
    errors = report_data.validate(doc)
    assert any("target" in e for e in errors)


# ---------------------------------------------------------- compute_references()

def test_compute_references_dedupes_by_url_and_numbers_sequentially():
    section = {
        "items": [
            {"title": "a", "sources": [{"label": "X", "url": "https://x.com"}]},
            {
                "title": "b",
                "sources": [
                    {"label": "X again", "url": "https://x.com"},
                    {"label": "Y", "url": "https://y.com"},
                ],
            },
        ]
    }
    report_data.compute_references(section)
    assert [r["url"] for r in section["references"]] == ["https://x.com", "https://y.com"]
    assert [r["n"] for r in section["references"]] == [1, 2]
    assert section["items"][0]["ref_numbers"] == [1]
    assert section["items"][1]["ref_numbers"] == [1, 2]


def test_compute_references_item_without_sources_gets_empty_ref_numbers():
    section = {"items": [{"title": "no sources"}]}
    report_data.compute_references(section)
    assert section["items"][0]["ref_numbers"] == []
    assert section["references"] == []


def test_compute_references_keeps_first_seen_label():
    section = {
        "items": [
            {"title": "a", "sources": [{"label": "First label", "url": "https://x.com"}]},
            {"title": "b", "sources": [{"label": "Different label, same url", "url": "https://x.com"}]},
        ]
    }
    report_data.compute_references(section)
    assert section["references"][0]["label"] == "First label"


# -------------------------------------------------------------- build_context()

def test_build_context_raises_on_invalid_doc():
    with pytest.raises(report_data.ValidationError):
        report_data.build_context({})


def test_build_context_returns_data_with_references_attached():
    ctx = report_data.build_context(minimal_doc())
    part1 = next(s for s in ctx["sections"] if s["id"] == "part1")
    assert "references" in part1
    home = next(s for s in ctx["sections"] if s["id"] == "home")
    assert home["references"] == []


def test_build_context_error_message_lists_all_problems():
    try:
        report_data.build_context({})
    except report_data.ValidationError as exc:
        assert "meta" in str(exc)
        assert "sections" in str(exc)
    else:
        pytest.fail("expected ValidationError")


# -------------------------------------------------------------------- load_yaml()

def test_load_yaml_reads_a_mapping(tmp_path):
    p = tmp_path / "doc.yaml"
    p.write_text("meta:\n  title: T\nsections: []\n", encoding="utf-8")
    data = report_data.load_yaml(p)
    assert data["meta"]["title"] == "T"


def test_load_yaml_rejects_non_mapping_top_level(tmp_path):
    p = tmp_path / "doc.yaml"
    p.write_text("- just\n- a\n- list\n", encoding="utf-8")
    with pytest.raises(report_data.ValidationError):
        report_data.load_yaml(p)
