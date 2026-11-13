"""Regression tests for scripts/check_formats.py.

Run: python3 -m pytest skills/development/review/run-code-review/tests
"""

import importlib.util
import json
import subprocess
import sys
from pathlib import Path

import pytest

SKILL = Path(__file__).resolve().parents[1]
SCRIPT = SKILL / "scripts" / "check_formats.py"


def _load():
    sys.path.insert(0, str(SCRIPT.parent))
    spec = importlib.util.spec_from_file_location("check_formats", SCRIPT)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


cf = _load()


def _write(tmp_path, name, text):
    path = tmp_path / name
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(text, encoding="utf-8")
    return str(path)


def test_valid_json_is_ok_and_a_syntax_error_names_the_line(tmp_path):
    assert cf.check_file(_write(tmp_path, "a.json", '{"a": [1, 2]}'))["status"] == "ok"
    # A missing comma, not a trailing one: Python 3.13 reports a trailing comma
    # at the comma's own line, earlier versions at the closing brace.
    result = cf.check_file(_write(tmp_path, "b.json", '{\n  "a": 1\n  "b": 2\n}\n'))
    assert result["status"] == "error" and result["checker"] == "python json"
    assert "line 3" in result["message"]


def test_duplicate_json_keys_are_an_error(tmp_path):
    # Parsers disagree on which value wins, so a duplicate key is a defect, not a style point.
    result = cf.check_file(_write(tmp_path, "a.json", '{"a": 1, "b": {"x": 1, "x": 2}, "a": 3}'))
    assert result["status"] == "error"
    assert "duplicate key" in result["message"] and "'a'" in result["message"] and "'x'" in result["message"]


def test_json_that_only_some_parsers_accept(tmp_path):
    # Python's json module accepts NaN and Infinity; the JSON grammar and JSON.parse do not.
    for literal in ("NaN", "Infinity", "-Infinity"):
        result = cf.check_file(_write(tmp_path, "n.json", '{"a": %s}' % literal))
        assert result["status"] == "error" and literal.lstrip("-") in result["message"], literal
    # A byte-order mark parses here but not in JSON.parse or json.load: say so without failing the file.
    path = tmp_path / "bom.json"
    path.write_bytes(b'\xef\xbb\xbf{"a": 1}')
    result = cf.check_file(str(path))
    assert result["status"] == "ok" and "byte-order mark" in result["message"]


def test_json_with_comments_is_left_to_the_projects_tool(tmp_path):
    for name in ("a.jsonc", "a.json5", "tsconfig.json", "tsconfig.build.json", ".vscode/settings.json", ".devcontainer/devcontainer.json"):
        result = cf.check_file(_write(tmp_path, name, '{\n  // comment\n  "a": 1,\n}\n'))
        assert result["status"] == "unchecked", name
        assert "comments" in result["message"], name
    # The same content in an ordinary .json file is an error.
    assert cf.check_file(_write(tmp_path, "data.json", '{\n  // comment\n  "a": 1\n}\n'))["status"] == "error"
    # A comment-allowing file that is strict JSON is simply ok.
    assert cf.check_file(_write(tmp_path, "jsconfig.json", "{}"))["status"] == "ok"


def test_toml_uses_tomllib_when_python_has_it(tmp_path, monkeypatch):
    good = _write(tmp_path, "a.toml", '[tool]\nname = "x"\n')
    bad = _write(tmp_path, "b.toml", '[tool]\nname = "x"\nname = "y"\n')

    monkeypatch.setattr(cf, "_tomllib", None)
    result = cf.check_file(good)
    assert result["status"] == "unchecked" and "3.11" in result["message"]

    class FakeError(ValueError):
        pass

    class FakeTomllib:
        TOMLDecodeError = FakeError

        @staticmethod
        def loads(text):
            if text.count("name =") > 1:
                raise FakeError("Cannot overwrite a value (at line 3, column 11)")
            return {}

    monkeypatch.setattr(cf, "_tomllib", FakeTomllib)
    assert cf.check_file(good) == {"path": good, "language": "toml", "status": "ok", "checker": "python tomllib", "message": ""}
    result = cf.check_file(bad)
    assert result["status"] == "error" and "line 3" in result["message"]


def test_xml_wellformedness_and_entities(tmp_path):
    assert cf.check_file(_write(tmp_path, "a.xml", '<?xml version="1.0"?>\n<a><b/></a>\n'))["status"] == "ok"
    result = cf.check_file(_write(tmp_path, "b.xml", "<a>\n<b>\n</a>\n"))
    assert result["status"] == "error" and result["checker"] == "python expat" and "line 3" in result["message"]
    # A document that declares entities is never expanded here; it is reported, not parsed further.
    bomb = '<!DOCTYPE a [<!ENTITY x "xx"><!ENTITY y "&x;&x;">]>\n<a>&y;</a>\n'
    result = cf.check_file(_write(tmp_path, "c.xml", bomb))
    assert result["status"] == "unchecked" and "entit" in result["message"]


def test_yaml_is_checked_only_when_a_parser_is_importable(tmp_path, monkeypatch):
    good = _write(tmp_path, "a.yaml", "a: 1\nb:\n  - x\n")
    bad = _write(tmp_path, "b.yml", "a: 1\n  b: 2\n")

    monkeypatch.setattr(cf, "_yaml", None)
    result = cf.check_file(good)
    assert result["status"] == "unchecked" and "standard library" in result["message"]

    class FakeError(Exception):
        pass

    class FakeYaml:
        YAMLError = FakeError
        SafeLoader = MappingNode = SequenceNode = ScalarNode = type("Node", (), {})

        @staticmethod
        def compose_all(text, Loader=None):
            if "  b:" in text:
                raise FakeError("mapping values are not allowed here, line 2, column 4")
            return iter(())

    monkeypatch.setattr(cf, "_yaml", FakeYaml)
    assert cf.check_file(good)["status"] == "ok"
    assert cf.check_file(good)["checker"] == "python yaml (PyYAML)"
    result = cf.check_file(bad)
    assert result["status"] == "error" and "line 2" in result["message"]


def test_unreadable_and_undecodable_files_are_errors(tmp_path):
    assert cf.check_file(str(tmp_path / "gone.json"))["status"] == "error"
    path = tmp_path / "bad.json"
    path.write_bytes(b'{"a": "\xff\xfe"}')
    result = cf.check_file(str(path))
    assert result["status"] == "error" and "UTF-8" in result["message"]


def test_available_tools_reports_what_is_on_path(monkeypatch):
    monkeypatch.setattr(cf.shutil, "which", lambda name: "/usr/bin/jq" if name == "jq" else None)
    tools = cf.available_tools()
    assert tools["jq"] == "/usr/bin/jq" and tools["yamllint"] is None
    assert set(tools) == {"xmllint", "xsltproc", "jq", "yamllint", "actionlint", "taplo", "prettier", "check-jsonschema"}


def test_cli_checks_only_tool_first_files_and_exits_1_on_an_error(tmp_path):
    _write(tmp_path, "ok.json", "{}")
    _write(tmp_path, "app.py", "print(1)\n")
    _write(tmp_path, "package-lock.json", "{ not json")
    clean = subprocess.run([sys.executable, str(SCRIPT), "--local", "--json"], cwd=tmp_path, capture_output=True, text=True)
    assert clean.returncode == 0, clean.stderr
    report = json.loads(clean.stdout)
    assert [r["path"] for r in report["files"]] == ["ok.json"]
    assert report["counts"] == {"ok": 1, "error": 0, "unchecked": 0}
    assert "jq" in report["tools"]

    _write(tmp_path, "sub/bad.json", "{")
    failing = subprocess.run([sys.executable, str(SCRIPT), "--local", "-r"], cwd=tmp_path, capture_output=True, text=True)
    assert failing.returncode == 1
    assert "error  sub/bad.json" in failing.stdout and "ok     ok.json" in failing.stdout
    assert "tools on PATH:" in failing.stdout and "not found:" in failing.stdout

    only_xml = subprocess.run([sys.executable, str(SCRIPT), "--local", "-r", "-l", "xml"], cwd=tmp_path, capture_output=True, text=True)
    assert only_xml.returncode == 0 and "no json, toml, xml or yaml files in scope" in only_xml.stdout


def test_cli_without_input_is_a_usage_error(tmp_path):
    out = subprocess.run([sys.executable, str(SCRIPT)], cwd=tmp_path, capture_output=True, text=True)
    assert out.returncode == 2 and "--base REF" in out.stderr


def _git(cwd, *args):
    subprocess.run(
        ["git", "-c", "user.name=t", "-c", "user.email=t@example.com", *args],
        cwd=cwd, check=True, capture_output=True,
    )


def test_cli_reporoot_from_a_subfolder_reads_the_files_it_lists(tmp_path):
    _git(tmp_path, "init", "-q", "-b", "main")
    (tmp_path / "sub").mkdir()
    (tmp_path / "top.json").write_text('{"a": 1}\n')
    (tmp_path / "sub" / "inner.xml").write_text('<a/>\n')
    _git(tmp_path, "add", "."), _git(tmp_path, "commit", "-q", "-m", "base")

    out = subprocess.run([sys.executable, str(SCRIPT), "-t", "--json"], cwd=tmp_path / "sub", capture_output=True, text=True)
    data = json.loads(out.stdout)
    # Paths are given from where the command ran, so each one can be opened as printed.
    assert [(item["path"], item["status"]) for item in data["files"]] == [("../top.json", "ok"), ("inner.xml", "ok")]
    assert out.returncode == 0


def test_cli_base_from_a_subfolder_reads_the_files_it_lists(tmp_path):
    _git(tmp_path, "init", "-q", "-b", "main")
    (tmp_path / "sub").mkdir()
    (tmp_path / "sub" / "keep.json").write_text("{}\n")
    _git(tmp_path, "add", "."), _git(tmp_path, "commit", "-q", "-m", "base")
    _git(tmp_path, "checkout", "-q", "-b", "feature")
    (tmp_path / "changed.json").write_text('{"a": 1}\n')
    _git(tmp_path, "add", "."), _git(tmp_path, "commit", "-q", "-m", "change")
    (tmp_path / "sub" / "new.json").write_text('{"a": 1,}\n')

    out = subprocess.run([sys.executable, str(SCRIPT), "--base", "main", "--json"], cwd=tmp_path / "sub", capture_output=True, text=True)
    data = json.loads(out.stdout)
    assert [(item["path"], item["status"]) for item in data["files"]] == [("../changed.json", "ok"), ("new.json", "error")]
    assert out.returncode == 1


def test_yaml_duplicate_keys_are_errors_with_their_line(tmp_path):
    pytest.importorskip("yaml")
    top = cf.check_file(_write(tmp_path, "a.yaml", "debug: false\nport: 80\ndebug: true\n"))
    assert top["status"] == "error" and "duplicate key: 'debug' (line 3)" in top["message"], top
    nested = cf.check_file(_write(tmp_path, "b.yaml", "jobs:\n  - name: a\n    run: x\n    name: b\n"))
    assert nested["status"] == "error" and "'name' (line 4)" in nested["message"], nested
    second_document = cf.check_file(_write(tmp_path, "c.yaml", "a: 1\n---\nb: 1\nb: 2\n"))
    assert second_document["status"] == "error" and "'b' (line 4)" in second_document["message"]


def test_yaml_merge_keys_aliases_and_tags_are_not_duplicates(tmp_path):
    pytest.importorskip("yaml")
    merge = "base: &b {x: 1}\nchild:\n  <<: *b\n  y: 2\nother:\n  <<: *b\n"
    assert cf.check_file(_write(tmp_path, "m.yaml", merge))["status"] == "ok"
    # A tag is never acted on, and an alias bomb is not expanded: each node is visited once.
    assert cf.check_file(_write(tmp_path, "t.yaml", "!!python/object/apply:os.system ['exit 3']\n"))["status"] == "ok"
    rows = ["a: &a [x, x, x, x, x, x, x, x, x]"]
    rows += [f"{chr(98 + i)}: &{chr(98 + i)} [{', '.join(['*' + chr(97 + i)] * 9)}]" for i in range(8)]
    assert cf.check_file(_write(tmp_path, "lol.yaml", "\n".join(rows) + "\n"))["status"] == "ok"


def test_a_missing_path_is_a_usage_error(tmp_path):
    out = subprocess.run([sys.executable, str(SCRIPT), "-p", "nope"], cwd=tmp_path, capture_output=True, text=True)
    assert out.returncode == 2 and "nope: no such file or folder" in out.stderr

