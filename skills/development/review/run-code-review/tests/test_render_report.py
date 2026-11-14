"""Regression tests for scripts/render_report.py.

Run: python3 -m pytest skills/development/review/run-code-review/tests
"""

import copy
import importlib.util
import json
import re
import subprocess
import sys
from pathlib import Path

import pytest

SKILL = Path(__file__).resolve().parents[1]
SCRIPT = SKILL / "scripts" / "render_report.py"
EXAMPLE = SKILL / "assets" / "report-example.json"
SCHEMA = SKILL / "references" / "report.schema.json"


def _load():
    spec = importlib.util.spec_from_file_location("render_report", SCRIPT)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


rr = _load()


def example():
    return json.loads(EXAMPLE.read_text(encoding="utf-8"))


def run(*args, cwd, stdin=None):
    return subprocess.run([sys.executable, str(SCRIPT), *map(str, args)], cwd=cwd,
                          capture_output=True, text=True, input=stdin)


# --- remotes and host types -------------------------------------------------------------------

@pytest.mark.parametrize("url, host, project", [
    ("https://github.com/acme/shop", "github.com", "acme/shop"),
    ("https://github.com/acme/shop.git", "github.com", "acme/shop"),
    ("https://user:s3cret@github.com/acme/shop.git", "github.com", "acme/shop"),
    ("git@github.com:acme/shop.git", "github.com", "acme/shop"),
    ("ssh://git@gitlab.example.org:2222/group/sub/shop.git", "gitlab.example.org", "group/sub/shop"),
    ("https://gitlab.com/group/sub/shop/", "gitlab.com", "group/sub/shop"),
    ("https://git.acme.com:8443/team/shop.git", "git.acme.com:8443", "team/shop"),
])
def test_a_remote_url_gives_its_web_host_and_project_without_credentials(url, host, project):
    assert rr.parse_remote(url) == {"host": host, "project": project}


@pytest.mark.parametrize("url", ["/srv/git/shop.git", "file:///srv/git/shop.git", "", "https://github.com/"])
def test_a_remote_with_no_web_page_gives_nothing(url):
    assert rr.parse_remote(url) is None


@pytest.mark.parametrize("host, expected", [
    ("github.com", "github"), ("gitlab.com", "gitlab"),
    ("github.acme.com", "github"), ("gitlab.acme.io", "gitlab"),
    ("git.acme.com", None), ("127.0.0.1:8080", None),
])
def test_the_host_type_comes_from_the_host_name(host, expected):
    assert rr.detect_host_type(host) == expected


def test_host_type_overrides_the_host_name():
    assert rr.detect_host_type("git.acme.com", "gitlab") == "gitlab"
    assert rr.detect_host_type("github.com", "gitlab") == "gitlab"


@pytest.mark.parametrize("host_type, lines, anchor", [
    ("github", "13", "#L13"), ("github", "12-15", "#L12-L15"), ("github", "3, 5", "#L3"),
    ("github", "2, 7-11", "#L2"), ("gitlab", "13", "#L13"), ("gitlab", "12-15", "#L12-15"),
    ("github", "", ""), ("github", "n/a", ""),
])
def test_line_anchors_follow_each_host(host_type, lines, anchor):
    assert rr.line_anchor(host_type, lines) == anchor


def test_blob_urls_follow_each_host_and_encode_the_path():
    sha = "a" * 40
    assert rr.blob_url("github", "github.com", "acme/shop", sha, "app/users.py", "12-15") == \
        f"https://github.com/acme/shop/blob/{sha}/app/users.py#L12-L15"
    assert rr.blob_url("gitlab", "gitlab.com", "g/sub/shop", sha, "my dir/a#b.py", "4") == \
        f"https://gitlab.com/g/sub/shop/-/blob/{sha}/my%20dir/a%23b.py#L4"


# --- the report's shape ------------------------------------------------------------------------

def test_the_example_report_is_valid():
    assert rr.validate(example()) == []


def test_the_schema_and_the_validator_require_the_same_fields():
    schema = json.loads(SCHEMA.read_text(encoding="utf-8"))
    assert set(schema["required"]) == set(rr.REQUIRED)
    finding = schema["$defs"]["finding"]
    assert set(finding["required"]) == set(rr.FINDING_REQUIRED)
    assert finding["properties"]["severity"]["enum"] == list(rr.SEVERITIES)
    assert schema["properties"]["verdict"]["enum"] == list(rr.VERDICTS)


@pytest.mark.parametrize("change, message", [
    (lambda r: r.pop("verdict"), "verdict"),
    (lambda r: r.update(schema_version=2), "schema_version"),
    (lambda r: r["findings"][0].update(severity="critical"), "severity"),
    (lambda r: r["findings"][1].update(id=1), "id"),
    (lambda r: r["findings"][0].pop("impact"), "impact"),
    (lambda r: r.update(verdict="Approve"), "blocker"),
])
def test_an_invalid_report_is_named_in_the_errors(change, message):
    report = example()
    change(report)
    errors = rr.validate(report)
    assert errors and any(message in e for e in errors), errors


def test_counts_come_from_the_findings():
    assert rr.counts(example()) == {"blocker": 3, "major": 3, "minor": 0, "nit": 0}


# --- Markdown ----------------------------------------------------------------------------------

def test_markdown_follows_the_report_template():
    md = rr.render_markdown(example())
    assert md.startswith("# Code review: branch `feature/search` against `main`")
    assert "**Verdict: Request changes** — the new search is open to SQL injection" in md
    assert "| Blocker | 3 |" in md and "| Nit | 0 |" in md
    order = [md.index(h) for h in ("## Scope and method", "## Findings", "## Tests", "## Suggested order of work")]
    assert order == sorted(order)
    assert "| 1 | Blocker | `app/users.py:13` | The search text is pasted into the SQL statement |" in md
    assert "### 1. The search text is pasted into the SQL statement — Blocker" in md
    assert "- **Confidence:** confirmed — ran it against" in md
    assert "  ```diff\n  -    rows = conn.execute(" in md
    assert "## Questions" not in md and "## Pre-existing issues" not in md  # empty sections dropped
    assert "1. Findings 1 and 2 together" in md


def test_markdown_lists_nits_apart_from_the_findings_table():
    report = example()
    report["findings"].append({"id": 7, "severity": "nit", "title": "Spell `recieve` as `receive`",
                               "file": "app/users.py", "lines": "3", "confidence": "confirmed",
                               "problem": "typo", "impact": "none"})
    md = rr.render_markdown(report)
    assert "## Nits\n\n- `app/users.py:3` — Spell `recieve` as `receive`" in md
    assert "| 7 |" not in md


def test_markdown_links_a_location_when_the_finding_has_a_url():
    report = example()
    report["findings"][0]["url"] = "https://github.com/acme/shop/blob/abc/app/users.py#L13"
    md = rr.render_markdown(report)
    assert "[`app/users.py:13`](https://github.com/acme/shop/blob/abc/app/users.py#L13)" in md


# --- HTML --------------------------------------------------------------------------------------

def _data(html):
    match = re.search(r'<script type="application/json" id="report-data">(.*?)</script>', html, re.S)
    assert match, "no report-data block"
    return json.loads(match.group(1))


def test_html_carries_the_report_as_inert_data():
    report = example()
    report["title"] = "</script><script>alert(1)</script> <!-- x"
    html = rr.render_html(report)
    data = _data(html)
    assert data["title"] == report["title"]
    assert data["findings"][3]["confidence_note"].startswith("for the function — in Chromium, a query of `<img")
    assert "<img" not in html and "alert(1)</script>" not in html and "<!-- x" not in html
    assert data["counts"] == {"blocker": 3, "major": 3, "minor": 0, "nit": 0}
    assert data["markdown"].startswith("# Code review:")


def test_html_is_one_file_with_no_network_requests():
    html = rr.render_html(example())
    assert html.startswith("<!doctype html>")
    assert not re.search(r'(src|href)\s*=\s*"(https?:)?//', html)
    assert "@import" not in html


# --- the command line --------------------------------------------------------------------------

def test_without_output_the_markdown_goes_to_stdout(tmp_path):
    result = run(EXAMPLE, cwd=tmp_path)
    assert result.returncode == 0, result.stderr
    assert result.stdout.startswith("# Code review:")


def test_each_output_format_follows_the_extension(tmp_path):
    result = run(EXAMPLE, "-o", "r.html", "-o", "r.md", "-o", "r.json", "--no-links", cwd=tmp_path)
    assert result.returncode == 0, result.stderr
    assert (tmp_path / "r.html").read_text().startswith("<!doctype html>")
    assert (tmp_path / "r.md").read_text().startswith("# Code review:")
    data = json.loads((tmp_path / "r.json").read_text())
    assert data["schema_version"] == 1 and data["counts"]["blocker"] == 3
    assert "wrote r.html" in result.stdout
    assert "Request changes — 3 blocker, 3 major, 0 minor, 0 nit" in result.stdout


def test_a_folder_gets_a_dated_html_file(tmp_path):
    (tmp_path / "out").mkdir()
    result = run(EXAMPLE, "-o", "out", cwd=tmp_path)
    assert result.returncode == 0, result.stderr
    files = list((tmp_path / "out").iterdir())
    assert len(files) == 1
    assert re.fullmatch(r"run-code-review-branch-feature-search-against-main-\d{8}-\d{4}\.html", files[0].name), files


def test_bare_output_means_the_current_folder(tmp_path):
    result = run(EXAMPLE, "-o", cwd=tmp_path)
    assert result.returncode == 0, result.stderr
    assert len(list(tmp_path.glob("run-code-review-*.html"))) == 1


def test_a_different_file_is_kept_without_force(tmp_path):
    (tmp_path / "r.md").write_text("mine\n")
    result = run(EXAMPLE, "-o", "r.md", cwd=tmp_path)
    assert result.returncode == 3
    assert (tmp_path / "r.md").read_text() == "mine\n"
    assert "--force" in result.stderr
    assert run(EXAMPLE, "-o", "r.md", "-f", cwd=tmp_path).returncode == 0
    assert (tmp_path / "r.md").read_text().startswith("# Code review:")
    again = run(EXAMPLE, "-o", "r.md", cwd=tmp_path)
    assert again.returncode == 0 and "up to date" in again.stdout


def test_an_unknown_extension_is_a_usage_error(tmp_path):
    result = run(EXAMPLE, "-o", "r.txt", cwd=tmp_path)
    assert result.returncode == 2 and ".html, .md or .json" in result.stderr


def test_an_invalid_report_writes_nothing(tmp_path):
    bad = example()
    del bad["findings"][0]["file"]
    path = tmp_path / "bad.json"
    path.write_text(json.dumps(bad))
    result = run(path, "-o", "r.html", cwd=tmp_path)
    assert result.returncode == 2 and "file" in result.stderr
    assert not (tmp_path / "r.html").exists()


def test_the_report_can_come_from_stdin(tmp_path):
    result = run("-", cwd=tmp_path, stdin=EXAMPLE.read_text())
    assert result.returncode == 0 and result.stdout.startswith("# Code review:")


# --- links from a real git checkout ------------------------------------------------------------

def _git(repo, *args):
    return subprocess.run(["git", "-c", "user.name=t", "-c", "user.email=t@example.com", *args],
                          cwd=repo, check=True, capture_output=True, text=True).stdout.strip()


@pytest.fixture
def shop(tmp_path):
    """A checkout of the example's files whose branch is pushed to origin."""
    repo = tmp_path / "shop"
    for name in ("app/users.py", "web/render.js", "scripts/deploy.sh", "config/settings.json",
                 ".github/workflows/ci.yml"):
        (repo / name).parent.mkdir(parents=True, exist_ok=True)
        (repo / name).write_text("x\n")
    _git(repo.parent, "init", "-q", "-b", "main", str(repo))
    _git(repo, "add", "-A")
    _git(repo, "commit", "-q", "-m", "base")
    _git(repo, "remote", "add", "origin", "https://bot:tok123@github.com/acme/shop.git")
    _git(repo, "update-ref", "refs/remotes/origin/main", "HEAD")
    _git(repo, "branch", "-q", "--set-upstream-to=origin/main")
    return repo


def _json_out(repo, *args):
    result = run(EXAMPLE, "-o", "r.json", "-f", *args, cwd=repo)
    assert result.returncode == 0, result.stderr
    return json.loads((repo / "r.json").read_text()), result


def test_findings_link_to_the_reviewed_commit_on_github(shop):
    sha = _git(shop, "rev-parse", "HEAD")
    data, result = _json_out(shop)
    assert data["repo"] == {"host_type": "github", "host": "github.com", "project": "acme/shop",
                            "remote": "origin", "commit": sha, "links": True, "reason": ""}
    assert data["findings"][0]["url"] == f"https://github.com/acme/shop/blob/{sha}/app/users.py#L13"
    assert data["findings"][2]["url"] == f"https://github.com/acme/shop/blob/{sha}/.github/workflows/ci.yml#L2"
    assert "tok123" not in (shop / "r.json").read_text() and "tok123" not in result.stdout


def test_a_self_hosted_server_needs_host_type(shop):
    _git(shop, "remote", "set-url", "origin", "git@git.acme.com:team/sub/shop.git")
    data, _ = _json_out(shop)
    assert data["repo"]["links"] is False and "--host-type" in data["repo"]["reason"]
    assert all(f["url"] is None for f in data["findings"])
    data, _ = _json_out(shop, "--host-type", "gitlab")
    assert data["findings"][1]["url"].startswith("https://git.acme.com/team/sub/shop/-/blob/")
    assert data["findings"][1]["url"].endswith("/app/users.py#L12-15")


def test_a_file_changed_since_the_commit_gets_no_link(shop):
    (shop / "app/users.py").write_text("changed\n")
    data, _ = _json_out(shop)
    assert data["findings"][0]["url"] is None and data["findings"][1]["url"] is None
    assert data["findings"][3]["url"] is not None


def test_an_unpushed_commit_turns_links_off(shop):
    (shop / "web/render.js").write_text("y\n")
    _git(shop, "commit", "-qam", "local only")
    data, _ = _json_out(shop)
    assert data["repo"]["links"] is False and "not pushed" in data["repo"]["reason"]
    assert all(f["url"] is None for f in data["findings"])


def test_a_subfolder_names_files_from_where_it_runs(shop):
    report = example()
    for f in report["findings"]:
        f["file"] = "../" + f["file"]
    (shop / "app" / "r.json").write_text(json.dumps(report))
    result = run("r.json", "-o", "out.json", cwd=shop / "app")
    assert result.returncode == 0, result.stderr
    data = json.loads((shop / "app" / "out.json").read_text())
    assert data["findings"][0]["url"].endswith("/app/users.py#L13")


def test_no_links_and_no_git_are_both_fine(shop, tmp_path):
    data, _ = _json_out(shop, "--no-links")
    assert data["repo"]["links"] is False and all(f["url"] is None for f in data["findings"])
    plain = tmp_path / "plain"
    plain.mkdir()
    result = run(EXAMPLE, "-o", "r.json", cwd=plain)
    assert result.returncode == 0, result.stderr
    assert json.loads((plain / "r.json").read_text())["repo"]["links"] is False


def test_the_report_may_name_the_reviewed_commit(shop):
    first = _git(shop, "rev-parse", "HEAD")
    (shop / "README.md").write_text("r\n")
    _git(shop, "add", "README.md")
    _git(shop, "commit", "-qm", "later")
    _git(shop, "update-ref", "refs/remotes/origin/main", "HEAD")
    report = example()
    report["commit"] = first
    (shop / "in.json").write_text(json.dumps(report))
    assert run("in.json", "-o", "r.json", cwd=shop).returncode == 0
    data = json.loads((shop / "r.json").read_text())
    assert data["repo"]["commit"] == first and first in data["findings"][0]["url"]


def test_render_does_not_change_its_input():
    report = example()
    before = copy.deepcopy(report)
    rr.render_html(report), rr.render_markdown(report)
    assert report == before
