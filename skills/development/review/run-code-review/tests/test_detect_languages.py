"""Regression tests for scripts/detect_languages.py.

Run: python3 -m pytest skills/development/review/run-code-review/tests
"""

import importlib.util
import json
import subprocess
import sys
from pathlib import Path

SKILL = Path(__file__).resolve().parents[1]
SCRIPT = SKILL / "scripts" / "detect_languages.py"


def _load():
    spec = importlib.util.spec_from_file_location("detect_languages", SCRIPT)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


dl = _load()
ALL = ("REVIEW.md", "PATTERNS.md", "TOOLING.md", "SECURITY.md", "WISDOM.md")


def test_every_language_has_its_reference_folder_with_its_five_files():
    assert sorted(dl.LANGUAGES) == [
        "css", "html", "javascript", "json", "markdown", "powershell-script", "python",
        "rust", "shellscript", "sql", "toml", "typescript", "xml", "yaml",
    ]
    for lang in dl.LANGUAGES:
        folder = SKILL / dl.reference_dir(lang)
        assert dl.reference_dir(lang) == f"references/review_{lang}"
        for name in ("REVIEW.md", "PATTERNS.md", "TOOLING.md", "SECURITY.md", "WISDOM.md"):
            assert (folder / name).is_file(), f"{folder / name} is missing"


def test_extensions_map_to_languages():
    cases = {
        "src/app.py": "python", "stubs/app.pyi": "python",
        "web/index.js": "javascript", "web/a.mjs": "javascript", "web/a.cjs": "javascript", "web/App.jsx": "javascript",
        "web/index.ts": "typescript", "web/App.tsx": "typescript", "web/a.mts": "typescript", "types/x.d.ts": "typescript",
        "src/main.rs": "rust",
        "bin/run.sh": "shellscript", "bin/run.bash": "shellscript", "bin/run.zsh": "shellscript",
        "tools/Deploy.ps1": "powershell-script", "tools/Mod.psm1": "powershell-script", "tools/Mod.psd1": "powershell-script",
        "db/001_init.sql": "sql", "db/VIEW.SQL": "sql",
    }
    for path, lang in cases.items():
        assert dl.language_of(path) == lang, path


def test_typescript_also_reads_the_javascript_checklist():
    # TypeScript is JavaScript at run time, so its review needs both checklists.
    refs = dl.classify(["a.ts"])["languages"]["typescript"]["references"]
    assert refs[-1] == "references/review_javascript/REVIEW.md"
    assert dl.classify(["a.js"])["languages"]["javascript"]["references"] == [
        f"references/review_javascript/{n}" for n in ALL
    ]


def test_unknown_extensions_are_not_guessed():
    for path in ("go/main.go", "Makefile", "data.csv", "notes.txt"):
        assert dl.language_of(path) is None, path


def test_shebang_decides_for_files_without_a_known_extension(tmp_path):
    cases = {
        "run": ("#!/usr/bin/env bash\necho hi\n", "shellscript"),
        "posix": ("#!/bin/sh\n", "shellscript"),
        "tool": ("#!/usr/bin/env python3\n", "python"),
        "tool2": ("#!/usr/bin/python3.12 -u\n", "python"),
        "cli": ("#!/usr/bin/env node\n", "javascript"),
        "ps": ("#!/usr/bin/env pwsh\n", "powershell-script"),
        "envs": ("#!/usr/bin/env -S deno run\n", None),
        "plain": ("just text\n", None),
    }
    for name, (text, lang) in cases.items():
        path = tmp_path / name
        path.write_text(text, encoding="utf-8")
        assert dl.language_of(str(path)) == lang, name


def test_a_binary_or_missing_file_without_extension_is_unknown(tmp_path):
    blob = tmp_path / "blob"
    blob.write_bytes(b"\xff\xfe\x00\x01")
    assert dl.language_of(str(blob)) is None
    assert dl.language_of(str(tmp_path / "deleted-file")) is None


def test_vendored_and_generated_files_are_skipped():
    for path in (
        "node_modules/x/index.js", "web/dist/app.js", "target/debug/build.rs", "vendor/lib.py",
        "web/app.min.js", ".venv/lib/site.py", "pkg/__pycache__/x.py", "api/schema_pb2.py",
        "web/types.generated.ts", "third_party/a.sh",
    ):
        assert dl.is_skipped(path), path
    for path in ("src/app.py", "builder/main.rs", "distribution/x.js", "scripts/build.sh"):
        assert not dl.is_skipped(path), path


def test_classify_groups_files_and_keeps_the_rest_visible():
    report = dl.classify([
        "b.py", "a.py", "web/x.ts", "node_modules/y/index.js", "LICENSE", "a.py", "db/q.sql",
    ])
    assert list(report["languages"]) == ["python", "sql", "typescript"]
    assert report["languages"]["python"] == {
        "files": ["a.py", "b.py"],
        "tool_first": False,
        "references": [
            "references/review_python/REVIEW.md",
            "references/review_python/PATTERNS.md",
            "references/review_python/TOOLING.md",
            "references/review_python/SECURITY.md",
            "references/review_python/WISDOM.md",
        ],
    }
    assert report["skipped"] == ["node_modules/y/index.js"]
    assert report["unsupported"] == ["LICENSE"]


def test_windows_separators_are_normalised():
    report = dl.classify(["src\\app.py", "node_modules\\x\\a.js"])
    assert report["languages"]["python"]["files"] == ["src/app.py"]
    assert report["skipped"] == ["node_modules/x/a.js"]


def test_cli_prints_json_and_text(tmp_path):
    out = subprocess.run(
        [sys.executable, str(SCRIPT), "--json", "a.py", "x.rs", "LICENSE"],
        capture_output=True, text=True, check=True, cwd=tmp_path,
    ).stdout
    data = json.loads(out)
    assert list(data["languages"]) == ["python", "rust"]
    assert data["unsupported"] == ["LICENSE"]

    text = subprocess.run(
        [sys.executable, str(SCRIPT), "a.py", "x.rs", "LICENSE"],
        capture_output=True, text=True, check=True, cwd=tmp_path,
    ).stdout
    assert "python (1 file)" in text
    assert "references/review_rust/REVIEW.md" in text
    assert "unsupported (1): LICENSE" in text


def test_cli_reads_paths_from_stdin(tmp_path):
    out = subprocess.run(
        [sys.executable, str(SCRIPT), "--json", "-"],
        input="a.sql\n\nb.ps1\n", capture_output=True, text=True, check=True, cwd=tmp_path,
    ).stdout
    assert list(json.loads(out)["languages"]) == ["powershell-script", "sql"]


def test_cli_lists_files_changed_against_a_git_base(tmp_path):
    def git(*args):
        subprocess.run(
            ["git", "-c", "user.name=t", "-c", "user.email=t@example.com", *args],
            cwd=tmp_path, check=True, capture_output=True,
        )

    git("init", "-q", "-b", "main")
    (tmp_path / "keep.py").write_text("x = 1\n")
    (tmp_path / "gone.sh").write_text("echo\n")
    git("add", "."), git("commit", "-q", "-m", "base")
    git("checkout", "-q", "-b", "feature")
    (tmp_path / "new.ts").write_text("export {}\n")
    (tmp_path / "gone.sh").unlink()
    git("add", "-A"), git("commit", "-q", "-m", "change")
    (tmp_path / "untracked.rs").write_text("fn main() {}\n")

    out = subprocess.run(
        [sys.executable, str(SCRIPT), "--json", "--base", "main"],
        capture_output=True, text=True, check=True, cwd=tmp_path,
    ).stdout
    data = json.loads(out)
    # Deleted files have nothing to review; unchanged files are out of scope; untracked files are in.
    assert data["languages"] == {
        "rust": {"files": ["untracked.rs"], "tool_first": False, "references": [f"references/review_rust/{n}" for n in ALL]},
        "typescript": {
            "files": ["new.ts"],
            "tool_first": False,
            "references": [f"references/review_typescript/{n}" for n in ALL]
            + ["references/review_javascript/REVIEW.md"],
        },
    }


def test_cli_without_input_is_a_usage_error(tmp_path):
    result = subprocess.run([sys.executable, str(SCRIPT)], capture_output=True, text=True, cwd=tmp_path)
    assert result.returncode == 2
    assert "give file paths" in result.stderr


def test_cli_with_a_bad_base_fails_clearly(tmp_path):
    subprocess.run(["git", "init", "-q"], cwd=tmp_path, check=True)
    result = subprocess.run(
        [sys.executable, str(SCRIPT), "--base", "no-such-ref"], capture_output=True, text=True, cwd=tmp_path,
    )
    assert result.returncode == 1
    assert "no-such-ref" in result.stderr


# --- 1.1.0: --lang, --security, scope flags, and the html/xml/css/markdown languages ---


def test_lang_aliases_resolve_to_language_keys():
    assert dl.parse_langs("py,js,ts,sh,ps1,html,sql,xml,css,rs,md") == [
        "css", "html", "javascript", "markdown", "powershell-script", "python",
        "rust", "shellscript", "sql", "typescript", "xml",
    ]
    assert dl.parse_langs("python, Rust ,PS1") == ["powershell-script", "python", "rust"]
    # Nothing, or the flag alone, means every language.
    assert dl.parse_langs(None) == sorted(dl.LANGUAGES)
    assert dl.parse_langs("") == sorted(dl.LANGUAGES)


def test_unknown_lang_is_rejected_with_the_valid_names():
    try:
        dl.parse_langs("py,cobol")
    except ValueError as error:
        assert "cobol" in str(error) and "py" in str(error) and "markdown" in str(error)
    else:
        raise AssertionError("expected ValueError")


def test_new_languages_map_by_extension():
    cases = {
        "site/index.html": "html", "site/a.htm": "html",
        "data/feed.xml": "xml", "schema/a.xsd": "xml", "t/a.xslt": "xml",
        "site/main.css": "css", "site/a.scss": "css", "site/a.less": "css",
        "README.md": "markdown", "docs/a.markdown": "markdown",
    }
    for path, lang in cases.items():
        assert dl.language_of(path) == lang, path


def test_lang_filter_keeps_other_languages_visible_as_filtered():
    report = dl.classify(["a.py", "b.rs", "c.sql", "LICENSE"], langs=["python", "sql"])
    assert list(report["languages"]) == ["python", "sql"]
    assert report["filtered"] == ["b.rs"]
    assert report["unsupported"] == ["LICENSE"]
    assert dl.classify(["a.py"])["filtered"] == []


def test_security_mode_lists_only_the_security_references():
    report = dl.classify(["a.py", "web/x.ts"], security=True)
    assert report["mode"] == "security"
    assert report["languages"]["python"]["references"] == [
        "references/review_python/SECURITY.md",
        "references/review_python/WISDOM.md",
    ]
    assert report["languages"]["typescript"]["references"] == [
        "references/review_typescript/SECURITY.md",
        "references/review_typescript/WISDOM.md",
        "references/review_javascript/SECURITY.md",
    ]
    assert dl.classify(["a.py"])["mode"] == "full"


def test_cli_lang_flag_alone_means_all_languages(tmp_path):
    for args in (["--lang"], ["-l"], []):
        out = subprocess.run(
            [sys.executable, str(SCRIPT), "--json", *args, "--", "a.py", "b.css"],
            capture_output=True, text=True, check=True, cwd=tmp_path,
        ).stdout
        assert list(json.loads(out)["languages"]) == ["css", "python"], args


def test_cli_lang_and_security_flags(tmp_path):
    out = subprocess.run(
        [sys.executable, str(SCRIPT), "--json", "-l", "py,md", "-s", "a.py", "b.css", "c.md"],
        capture_output=True, text=True, check=True, cwd=tmp_path,
    ).stdout
    data = json.loads(out)
    assert list(data["languages"]) == ["markdown", "python"]
    assert data["filtered"] == ["b.css"]
    assert data["mode"] == "security"

    bad = subprocess.run(
        [sys.executable, str(SCRIPT), "-l", "cobol", "a.py"], capture_output=True, text=True, cwd=tmp_path,
    )
    assert bad.returncode == 2
    assert "cobol" in bad.stderr


def _tree(tmp_path):
    (tmp_path / "sub" / "deep").mkdir(parents=True)
    (tmp_path / "top.py").write_text("x = 1\n")
    (tmp_path / "sub" / "mid.sql").write_text("SELECT 1;\n")
    (tmp_path / "sub" / "deep" / "low.rs").write_text("fn main() {}\n")
    (tmp_path / "node_modules").mkdir()
    (tmp_path / "node_modules" / "dep.js").write_text("\n")


def test_cli_path_lists_a_folder_and_recurse_goes_below_it(tmp_path):
    _tree(tmp_path)
    run = lambda *args: json.loads(subprocess.run(
        [sys.executable, str(SCRIPT), "--json", *args], capture_output=True, text=True, check=True, cwd=tmp_path,
    ).stdout)
    assert list(run("-p", "sub")["languages"]) == ["sql"]
    deep = run("--path", "sub", "--recurse")
    assert deep["languages"]["rust"]["files"] == ["sub/deep/low.rs"]
    assert deep["languages"]["sql"]["files"] == ["sub/mid.sql"]
    assert run("-p", "top.py")["languages"]["python"]["files"] == ["top.py"]


def test_cli_local_is_the_current_folder(tmp_path):
    _tree(tmp_path)
    run = lambda *args, cwd: json.loads(subprocess.run(
        [sys.executable, str(SCRIPT), "--json", *args], capture_output=True, text=True, check=True, cwd=cwd,
    ).stdout)
    assert list(run("--local", cwd=tmp_path)["languages"]) == ["python"]
    everything = run("--local", "-r", cwd=tmp_path)
    assert list(everything["languages"]) == ["python", "rust", "sql"]
    assert everything["skipped"] == ["node_modules/"]  # a skipped folder is listed once, not walked
    assert list(run("--local", "-r", cwd=tmp_path / "sub")["languages"]) == ["rust", "sql"]


def test_cli_reporoot_reviews_the_whole_repository_from_a_subfolder(tmp_path):
    _tree(tmp_path)
    subprocess.run(["git", "init", "-q"], cwd=tmp_path, check=True)
    subprocess.run(["git", "add", "-A"], cwd=tmp_path, check=True)
    out = subprocess.run(
        [sys.executable, str(SCRIPT), "--json", "-t"], capture_output=True, text=True, check=True, cwd=tmp_path / "sub",
    ).stdout
    data = json.loads(out)
    assert list(data["languages"]) == ["python", "rust", "sql"]
    # Named from the folder the command ran in, so each path opens as printed.
    assert data["languages"]["rust"]["files"] == ["deep/low.rs"]
    assert data["languages"]["python"]["files"] == ["../top.py"]
    assert data["languages"]["sql"]["files"] == ["mid.sql"]


def test_cli_reporoot_outside_a_repository_fails_clearly(tmp_path):
    result = subprocess.run([sys.executable, str(SCRIPT), "-t"], capture_output=True, text=True, cwd=tmp_path)
    assert result.returncode == 1
    assert "not inside a git repository" in result.stderr


def test_cli_scope_flags_are_mutually_exclusive(tmp_path):
    result = subprocess.run(
        [sys.executable, str(SCRIPT), "-t", "--local"], capture_output=True, text=True, cwd=tmp_path,
    )
    assert result.returncode == 2


# --- tool-first formats: json, yaml, toml (and xml, which keeps its full review) ---


def test_json_yaml_and_toml_map_by_extension_and_alias():
    cases = {
        "package.json": "json", "cfg/a.jsonc": "json", "cfg/a.json5": "json",
        "ci/build.yaml": "yaml", ".github/workflows/ci.yml": "yaml",
        "pyproject.toml": "toml", "Cargo.toml": "toml",
    }
    for path, lang in cases.items():
        assert dl.language_of(path) == lang, path
    assert dl.parse_langs("json,yml,toml,xml") == ["json", "toml", "xml", "yaml"]
    assert dl.parse_langs("YAML") == ["yaml"]


def test_lock_files_and_minified_css_are_skipped():
    for path in (
        "package-lock.json", "web/npm-shrinkwrap.json", "pnpm-lock.yaml", "skills-lock.json",
        "Cargo.lock", "uv.lock", "poetry.lock", "yarn.lock", "web/site.min.css",
    ):
        assert dl.is_skipped(path), path
    for path in ("package.json", "locks.json", "ci/lock.yaml", "block.toml", "web/site.css"):
        assert not dl.is_skipped(path), path


def test_tool_first_languages_are_marked():
    assert dl.TOOL_FIRST == ("json", "toml", "xml", "yaml")
    report = dl.classify(["a.json", "b.yaml", "c.toml", "d.xml", "e.py", "f.md"])
    flags = {lang: entry["tool_first"] for lang, entry in report["languages"].items()}
    assert flags == {"json": True, "markdown": False, "python": False, "toml": True, "xml": True, "yaml": True}
    # Tool-first changes the order of work, not the reading list: xml keeps its full review.
    assert report["languages"]["xml"]["references"] == [f"references/review_xml/{n}" for n in ALL]
    text = dl.render_text(report)
    assert "json (1 file) [tool-first: run the checks in TOOLING.md before reading]" in text
    assert "python (1 file)\n" in text


def test_parser_and_path_collection_are_reusable(tmp_path):
    # check_formats.py takes the same scope flags, so it builds on these two functions.
    (tmp_path / "a.json").write_text("{}")
    args = dl.build_parser("x").parse_args(["-p", str(tmp_path), "-l", "json"])
    assert dl.collect_paths(args) == [(tmp_path / "a.json").as_posix()]
    try:
        dl.collect_paths(dl.build_parser("x").parse_args([]))
    except dl.UsageError as error:
        assert "--base REF" in str(error)
    else:
        raise AssertionError("expected UsageError")


def _cli(*args, cwd):
    out = subprocess.run([sys.executable, str(SCRIPT), "--json", *args], capture_output=True, text=True, cwd=cwd)
    assert out.returncode == 0, out.stderr
    return json.loads(out.stdout)


def _write(root, name, text="x\n"):
    path = root / name
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(text)


def test_recurse_in_a_git_checkout_leaves_out_ignored_files(tmp_path):
    subprocess.run(["git", "init", "-q"], cwd=tmp_path, check=True)
    _write(tmp_path, ".gitignore", ".next/\ncoverage/\n.pytest_cache/\n")
    for name in ("src/a.py", "src/deep/b.py", "new.py", ".next/static/chunk.js",
                 "coverage/lcov-report/index.html", ".pytest_cache/README.md"):
        _write(tmp_path, name)
    subprocess.run(["git", "add", ".gitignore", "src"], cwd=tmp_path, check=True)
    everything = _cli("--local", "-r", cwd=tmp_path)
    assert list(everything["languages"]) == ["python"]
    assert everything["languages"]["python"]["files"] == ["new.py", "src/a.py", "src/deep/b.py"]
    assert everything["unsupported"] == [".gitignore"] and everything["skipped"] == []
    assert _cli("-p", "src", cwd=tmp_path)["languages"]["python"]["files"] == ["src/a.py"]
    assert _cli("--local", cwd=tmp_path / "src")["languages"]["python"]["files"] == ["a.py"]
    (tmp_path / "src" / "a.py").unlink()  # tracked, deleted in the working tree: nothing to read
    assert _cli("-p", "src", "-r", cwd=tmp_path)["languages"]["python"]["files"] == ["src/deep/b.py"]


def test_recurse_lists_an_untracked_skipped_folder_once(tmp_path):
    subprocess.run(["git", "init", "-q"], cwd=tmp_path, check=True)
    _write(tmp_path, "src/a.py")
    for i in range(50):
        _write(tmp_path, f"node_modules/p{i}/index.js")
    result = _cli("--local", "-r", cwd=tmp_path)
    assert result["skipped"] == ["node_modules/"]
    outside = tmp_path / "plain"
    _write(outside, "src/a.py")
    _write(outside, "node_modules/p/index.js")
    _write(outside, "pkg/vendor/lib.py")
    plain = _cli("--local", "-r", cwd=outside)
    assert plain["skipped"] == ["node_modules/", "pkg/vendor/"]
    assert plain["languages"]["python"]["files"] == ["src/a.py"]


def test_text_output_shortens_long_file_lists():
    report = dl.classify([f"bin/tool{i}" for i in range(30)])
    line = [row for row in dl.render_text(report).splitlines() if row.startswith("unsupported")][0]
    assert line.startswith("unsupported (30): bin/tool0, bin/tool1,")
    assert line.endswith("… and 10 more (--json lists all)") and line.count("bin/tool") == 20
    assert len(dl.classify([f"x{i}" for i in range(30)])["unsupported"]) == 30  # JSON keeps every file


def test_a_missing_path_is_a_usage_error(tmp_path):
    _write(tmp_path, "src/a.py")
    out = subprocess.run([sys.executable, str(SCRIPT), "-p", "src", "-p", "scr"], capture_output=True, text=True, cwd=tmp_path)
    assert out.returncode == 2 and "scr: no such file or folder" in out.stderr

