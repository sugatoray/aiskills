#!/usr/bin/env python3
"""Regenerate the demo data inside assets/agent-sessions-insight.html. For maintainers.

The template doubles as the demo report: its report-data block holds made-up sessions.
This script makes them deterministically (fixed seed and date), runs them through the
collector's own summarize() so the numbers agree with the rows, writes the demo
insights, and embeds the result with build_report.embed(). Only the data block changes.

Usage (from the skill directory):
    python3 scripts/make_demo.py            # rewrite the template's demo data
    python3 scripts/make_demo.py --check    # exit 1 if the shipped demo is stale; writes nothing

Run it after changing the data shape, summarize(), the insights format, or this file.
tests/test_make_demo.py fails while the shipped demo is stale. Stdlib only.
"""
import argparse, json, random, sys, datetime as dt
from pathlib import Path

SKILL = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(SKILL / "scripts"))
import build_report  # noqa: E402
import collect  # noqa: E402

TEMPLATE = SKILL / "assets" / "agent-sessions-insight.html"
UTC = dt.timezone.utc
NOW = dt.datetime(2026, 11, 22, 18, 0, tzinfo=UTC)
SEED = 7
P = {
 "billing-api": ("claude-code", ["Add retry with backoff to the invoice webhook", "Fix the rounding bug in proration", "Write tests for the tax calculator", "Refactor the Stripe client into a module"]),
 "taskq-cli": ("claude-code", ["Add a --json flag to the status command", "Make the release script idempotent", "Why does `taskq sync` hang on large repos?", "Add shell completions"]),
 "docs-site": ("codex", ["Update the getting-started guide for v2", "Fix broken links in the API reference", "Draft a migration guide"]),
 "infra-scripts": ("devin", ["Upgrade the Terraform provider and fix the plan", "Add a nightly backup job", "Rotate the staging certificates"]),
 "data-notebooks": ("codex", ["Plot weekly active users by plan", "Clean the churn dataset and explain the outliers"]),
}
TOOLS = {"claude-code": ["Bash", "Edit", "Read", "Grep", "Write"], "codex": ["shell", "apply_patch", "update_plan"], "devin": ["exec", "edit", "read", "browser"]}
DOCS = ["README.md", "CHANGELOG.md", "CLAUDE.md", "HANDOFF.md", "AGENTS.md"]


def sessions(rnd):
    """64 made-up sessions across five projects and three agents."""
    out = []
    for i in range(64):
        proj = rnd.choices(list(P), weights=[5, 4, 2, 2, 1])[0]
        agent, prompts = P[proj]
        if rnd.random() < .15: agent = rnd.choice(["claude-code", "codex", "devin"])
        d = rnd.randint(0, 88)
        if (NOW - dt.timedelta(days=d)).weekday() >= 5 and rnd.random() < .7: d = max(0, d - 2)
        h = rnd.choices(range(24), weights=[0]*7 + [1, 3, 5, 5, 4, 2, 4, 5, 5, 4, 3, 1, 1, 2, 2, 1, 0])[0]
        start = (NOW - dt.timedelta(days=d)).replace(hour=h, minute=rnd.randint(0, 59), second=0)
        if start > NOW: start -= dt.timedelta(days=1)
        mins = round(min(240, rnd.lognormvariate(3.3, .7)), 1)
        s = collect.Session(agent, "%08x" % rnd.getrandbits(32), project=proj, start=start, end=start + dt.timedelta(minutes=mins))
        for _ in range(rnd.randint(1, 9)): collect.note_prompt(s, rnd.choice(prompts))
        s.first_prompt = rnd.choice(prompts)
        for _ in range(rnd.randint(3, 40)):
            t = rnd.choice(TOOLS[agent]); cmd = "pytest -q" if t in ("Bash", "shell", "exec") and rnd.random() < .3 else ""
            collect.note_tool(s, t, cmd, [rnd.choice(DOCS)] if t in ("Edit", "apply_patch", "edit") and rnd.random() < .15 else [])
        if agent == "claude-code" and rnd.random() < .4: s.cmds[rnd.choice(["/plan", "/review", "/compact", "/init"])] += 1
        out.append(s)
    return out


def build_demo():
    """The full demo report: {summary, sessions, insights, meta}, with meta.demo = True."""
    out = sessions(random.Random(SEED))
    summ = collect.summarize(out, 90, now=NOW, tz=UTC)
    cut = NOW - dt.timedelta(days=90)
    rows = [dict(agent=s.agent, id=s.id, project=s.project, start=s.start.isoformat(), minutes=s.minutes, prompts=s.prompts,
                 first_prompt=s.first_prompt, top_tools=s.tools.most_common(4), commands=list(s.cmds)[:5])
            for s in sorted(out, key=lambda s: s.start) if s.start >= cut]
    data = json.loads(json.dumps(dict(summary=summ, sessions=rows)))
    pa = summ["per_agent"]; byproj = dict(summ["projects"])
    busiest = max(summ["per_weekday"], key=summ["per_weekday"].get)
    ins = {
     "overview": [
       "You used coding agents on %d of the last 90 days, %d sessions in all: steady weekday use with short gaps (a median of %s days between active days)." % (summ["active_days"], summ["sessions"], summ["median_gap_days"]),
       "Most of the work is building and fixing two codebases, billing-api and taskq-cli; docs, infrastructure and data analysis fill the rest.",
       "Claude Code carries the coding, Codex the docs and notebooks, and Devin the infrastructure chores.",
       "Tests run often next to edits, which suggests a test-first habit; a few very long sessions are worth a look."],
     "kinds": [
       {"name": "Building features", "sessions": byproj.get("billing-api", 0) // 2 + byproj.get("taskq-cli", 0), "projects": ["billing-api", "taskq-cli"], "examples": ["Add retry with backoff to the invoice webhook", "Add a --json flag to the status command"], "evidence": "first prompts that start with Add or Make"},
       {"name": "Fixing bugs", "sessions": byproj.get("billing-api", 0) - byproj.get("billing-api", 0) // 2, "projects": ["billing-api", "taskq-cli"], "examples": ["Fix the rounding bug in proration", "Why does `taskq sync` hang on large repos?"], "evidence": "first prompts that start with Fix or Why"},
       {"name": "Docs and writing", "sessions": byproj.get("docs-site", 0), "projects": ["docs-site"], "examples": ["Draft a migration guide"], "evidence": "project name"},
       {"name": "Infrastructure", "sessions": byproj.get("infra-scripts", 0), "projects": ["infra-scripts"], "examples": ["Rotate the staging certificates"], "evidence": "project name and first prompts"},
       {"name": "Data analysis", "sessions": byproj.get("data-notebooks", 0), "projects": ["data-notebooks"], "examples": ["Plot weekly active users by plan"], "evidence": "project name"}],
     "habits": [
       {"title": "Tests next to edits", "detail": "%d test runs in %d sessions; tests usually run in the same session as the edits, which suggests a test-first habit." % (summ["test_runs"], summ["sessions"]), "evidence": "pytest in Bash and shell calls across billing-api and taskq-cli"},
       {"title": "A weekday rhythm", "detail": "%s is the busiest weekday, and most sessions start between 09:00 and 17:00." % dict(Mon="Monday", Tue="Tuesday", Wed="Wednesday", Thu="Thursday", Fri="Friday", Sat="Saturday", Sun="Sunday")[busiest], "evidence": "the weekday and hour charts"},
       {"title": "Docs as session memory", "detail": "CLAUDE.md, HANDOFF.md and README.md get edited along the way, so context carries over between sessions.", "evidence": "%d doc-file edits, most in billing-api and taskq-cli" % sum(summ["doc_edits"].values())},
       {"title": "One agent per kind of work", "detail": "Claude Code does the coding, Codex the docs and notebooks, Devin the infrastructure chores.", "evidence": "the Agents tab and the projects behind each agent"}],
     "friction": [
       {"title": "Very long sessions.", "detail": "The longest ran %s minutes: a session left open, or a task that should have been split." % summ["longest_minutes"], "evidence": "the Longest sessions table below"},
       {"title": "Repeated first prompts.", "detail": "The same few prompts open many sessions, which may mean a task was restarted rather than finished.", "evidence": "first prompts in the Data tab, for example the proration rounding fix"},
       {"title": "Gaps.", "detail": "The longest break between active days was %s days." % summ["longest_gap_days"], "evidence": "the timeline on the Frequency tab"}],
     "threads": [
       {"thread": "taskq-cli: sync on large repos", "next": "Profile `taskq sync` on a large repo before changing the walker.", "when": "last seen in November"},
       {"thread": "billing-api: Stripe client refactor", "next": "Finish moving the client into its own module and rerun the tax tests.", "when": "last seen in November"},
       {"thread": "infra-scripts: certificate rotation", "next": "Check the staging certificates were actually rotated.", "when": "last seen in October"}],
     "caveat": "The session logs of Claude Code, Codex CLI and Devin CLI on this machine, over the last 90 days. No Pi, OpenCode or Copilot CLI logs were found. Devin's log format is undocumented, so its tool counts may be low.",
     "agents": ["Claude Code has %d sessions, Codex %d and Devin %d. Each agent mostly sticks to its own projects." % (pa.get("claude-code", 0), pa.get("codex", 0), pa.get("devin", 0))],
    }
    rep = build_report.make_report(data, ins, now=NOW)
    rep["meta"]["demo"] = True
    return rep


def render(template_html):
    """The template with its data block replaced by a fresh demo."""
    return build_report.embed(template_html, build_demo())


def main(argv=None):
    ap = argparse.ArgumentParser(description="Regenerate the demo data in the report template.")
    ap.add_argument("--template", default=str(TEMPLATE), help="template to update (default: %(default)s)")
    ap.add_argument("--check", action="store_true", help="exit 1 if the template's demo is stale; write nothing")
    a = ap.parse_args(argv)
    path = Path(a.template)
    html = path.read_text(encoding="utf-8")
    fresh = render(html)
    if a.check:
        if fresh != html:
            print("demo data in %s is stale: run python3 scripts/make_demo.py" % path, file=sys.stderr)
            return 1
        print("demo data in %s is up to date" % path)
        return 0
    path.write_text(fresh, encoding="utf-8")
    print("wrote %s: %s" % (path, build_report.describe(build_demo())))
    return 0


if __name__ == "__main__":
    sys.exit(main())
