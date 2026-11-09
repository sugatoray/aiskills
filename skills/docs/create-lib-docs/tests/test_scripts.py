"""Regression tests for the create-lib-docs scripts. Run: python3 -m pytest skills/docs/create-lib-docs/tests"""

import importlib.util
from pathlib import Path

SCRIPTS = Path(__file__).resolve().parents[1] / "scripts"


def _load(name):
    spec = importlib.util.spec_from_file_location(name, SCRIPTS / f"{name}.py")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


check_docs = _load("check_docs")
build_llms_txt = _load("build_llms_txt")


def _site(tmp_path, pages):
    for rel, text in pages.items():
        path = tmp_path / rel
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(text, encoding="utf-8")
    return tmp_path


LICENSE_PAGE = (
    "# License\n\nLib is MIT; the plugins it bundles keep their own licenses.\n\n"
    "| Part | License | Declared in |\n| --- | --- | --- |\n| lib | MIT | `LICENSE` |\n"
)

GOOD = {
    "README.md": "# Lib\n\nLib does things.\n\n### Guides\n\n- [Guides](guides/README.md): all guides\n"
    "- [Ref](ref.md#the-flag): the reference\n\n### License\n\n- [License](license.md): what is licensed how\n",
    "license.md": LICENSE_PAGE,
    "guides/README.md": "# Guides\n\nTask recipes.\n\n- [Do X](do-x.md)\n",
    "guides/do-x.md": "# Do X\n\nHow to do X.\n\n```bash\nlib x\n```\n\n![X flow](../img.svg)\n",
    "ref.md": "# Reference\n\nEvery flag.\n\n## The flag\n\n## The flag\n\nSee [twice](#the-flag-1).\n",
    "img.svg": "<svg/>",
}


def test_github_slug():
    assert check_docs.github_slug("`--resume SESSION_ID`") == "--resume-session_id"
    assert check_docs.github_slug("Exit codes & errors") == "exit-codes--errors"
    assert check_docs.github_slug("[Link](x.md) title") == "link-title"


def test_clean_site_passes_once_llms_txt_is_built(tmp_path):
    site = _site(tmp_path, GOOD)
    assert check_docs.check(site) == []
    index, full = build_llms_txt.build(site)
    (site / "llms.txt").write_text(index)
    assert check_docs.check(site) == []
    assert index.splitlines()[:3] == ["# Lib", "", "> Lib does things."]
    assert "- [Do X](guides/do-x.md): How to do X." in index  # description from the page itself
    assert full.index("source: guides/README.md") < full.index("source: guides/do-x.md") < full.index("source: ref.md")


def test_problems_are_reported(tmp_path):
    site = _site(
        tmp_path,
        {
            **GOOD,
            "README.md": GOOD["README.md"] + "\n[gone](missing.md) [bad](ref.md#nope)\n",
            "guides/do-x.md": "# Do X\n\n```\nno language\n```\n\n![](../img.svg)\n",
            "orphan.md": "# Orphan\n",
            "llms.txt": "# Lib\n\n- [Ref](ref.md)\n",
        },
    )
    problems = "\n".join(check_docs.check(site))
    assert "broken link: missing.md" in problems
    assert "no heading for anchor #nope" in problems
    assert "code fence without a language" in problems
    assert "image without alt text" in problems
    assert "orphan.md: not reachable from README.md" in problems
    assert "doesn't list orphan.md" in problems


def test_folder_link_without_readme_is_fine(tmp_path):
    # GitHub lists a folder's files, so linking one that has no README.md isn't broken.
    site = _site(tmp_path, {"README.md": "# L\n\nSee [fixtures](fixtures/) and [License](license.md).\n", "fixtures/a.json": "{}", "license.md": LICENSE_PAGE})
    assert check_docs.check(site) == []


def test_links_inside_code_are_ignored(tmp_path):
    site = _site(tmp_path, {"README.md": "# L\n\n````markdown\n```bash\n[x](nowhere.md)\n```\n````\n\n`[y](nope.md)` [License](license.md)\n", "license.md": LICENSE_PAGE})
    assert check_docs.check(site) == []


def test_a_license_page_is_required(tmp_path):
    pages = {k: v for k, v in GOOD.items() if k != "license.md"}
    pages["README.md"] = pages["README.md"].replace("- [License](license.md): what is licensed how\n", "")
    problems = "\n".join(check_docs.check(_site(tmp_path, pages)))
    assert "license.md: missing" in problems


def test_the_license_page_needs_a_table(tmp_path):
    site = _site(tmp_path, {**GOOD, "license.md": "# License\n\nLib is MIT.\n"})
    problems = "\n".join(check_docs.check(site))
    assert "license.md: no table" in problems


def test_the_license_page_must_be_linked_from_the_landing_page(tmp_path):
    readme = GOOD["README.md"].replace("- [License](license.md): what is licensed how\n", "")
    problems = "\n".join(check_docs.check(_site(tmp_path, {**GOOD, "README.md": readme})))
    assert "license.md: not reachable from README.md" in problems


def test_the_skill_asks_for_the_license_page():
    root = SCRIPTS.parent
    skill = (root / "SKILL.md").read_text(encoding="utf-8")
    assert "license.md" in skill and "### License" in skill, "SKILL.md puts license.md in the tree and the landing page"
    templates = (root / "references" / "templates.md").read_text(encoding="utf-8")
    assert "## License page" in templates, "templates.md has a License page skeleton"
    patterns = (root / "references" / "patterns.md").read_text(encoding="utf-8")
    assert "license.md" in patterns, "patterns.md maps licensing onto the information architecture"
