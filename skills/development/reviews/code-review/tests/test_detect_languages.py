"""Regression tests for scripts/detect_languages.py.

Run: python3 -m pytest skills/development/reviews/code-review/tests
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


def test_every_language_has_its_reference_folder_with_the_three_files():
    assert sorted(dl.LANGUAGES) == [
        "javascript", "powershell-script", "python", "rust", "shellscript", "sql", "typescript",
    ]
    for lang in dl.LANGUAGES:
        folder = SKILL / dl.reference_dir(lang)
        assert dl.reference_dir(lang) == f"references/review_{lang}"
        for name in ("REVIEW.md", "PATTERNS.md", "TOOLING.md"):
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
        f"references/review_javascript/{n}" for n in ("REVIEW.md", "PATTERNS.md", "TOOLING.md")
    ]


def test_unknown_extensions_are_not_guessed():
    for path in ("README.md", "go/main.go", "Makefile", "data.json", "notes.txt"):
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
        "b.py", "a.py", "web/x.ts", "node_modules/y/index.js", "README.md", "a.py", "db/q.sql",
    ])
    assert list(report["languages"]) == ["python", "sql", "typescript"]
    assert report["languages"]["python"] == {
        "files": ["a.py", "b.py"],
        "references": [
            "references/review_python/REVIEW.md",
            "references/review_python/PATTERNS.md",
            "references/review_python/TOOLING.md",
        ],
    }
    assert report["skipped"] == ["node_modules/y/index.js"]
    assert report["unsupported"] == ["README.md"]


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
        "rust": {"files": ["untracked.rs"], "references": [f"references/review_rust/{n}" for n in ("REVIEW.md", "PATTERNS.md", "TOOLING.md")]},
        "typescript": {
            "files": ["new.ts"],
            "references": [f"references/review_typescript/{n}" for n in ("REVIEW.md", "PATTERNS.md", "TOOLING.md")]
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
