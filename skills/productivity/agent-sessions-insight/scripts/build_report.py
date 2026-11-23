#!/usr/bin/env python3
"""Build the agent-sessions-insight HTML report from the collector's JSON.

Reads the JSON that collect.py wrote (and, optionally, the agent's reading of it),
validates both, and writes a copy of assets/agent-sessions-insight.html with them in
its <script type="application/json" id="report-data"> block. Nothing else in the
template changes, and every '<' in the data is escaped. Stdlib only; no network.

Insights JSON (every key optional; written by the agent, shown as judgement):

    {"overview": ["sentence", ...],
     "kinds":    [{"name": "Building tools", "sessions": 12, "projects": ["sample-app"],
                   "examples": ["add a parser"], "evidence": "project names, first prompts"}],
     "habits":   ["sentence", {"title": "Test first", "detail": "sentence", "evidence": "where it shows"}],
     "friction": [{"title": "Long sessions", "detail": "sentence", "evidence": "where it shows"}],
     "agents":   ["sentence", ...],
     "threads":  [{"thread": "sample-app parser", "next": "Run the slow tests", "when": "Nov 2"}],
     "caveat":   "What the report is and isn't based on."}

Usage:
    build_report.py --data agent-sessions-insight-data.json [--insights insights.json] [-o agent-sessions-insight.html]
    build_report.py --demo [-o demo.html]       # the bundled demo report, byte for byte

Exit codes: 0 ok, 2 invalid input.
"""
import argparse, datetime as dt, json, pathlib, re, sys

TEMPLATE = pathlib.Path(__file__).resolve().parent.parent / "assets" / "agent-sessions-insight.html"
BLOCK = re.compile(r'(<script type="application/json" id="report-data">)(.*?)(</script>)', re.S)
SUMMARY_KEYS = ("window_days", "sessions", "active_days", "prompts", "first", "last", "median_minutes",
                "longest_minutes", "median_gap_days", "longest_gap_days", "per_agent", "per_month",
                "per_weekday", "per_hour", "projects", "tools", "commands", "doc_edits", "test_runs")
INSIGHT_KEYS = ("overview", "kinds", "habits", "friction", "agents", "threads", "caveat")
LIST_KEYS = INSIGHT_KEYS[:-1]


class ReportError(ValueError):
    pass


def _strings(x):
    return isinstance(x, list) and all(isinstance(s, str) for s in x)


def _count(x):
    return isinstance(x, int) and not isinstance(x, bool) and x >= 0


def _card(x, *required, optional="evidence"):
    """A dict whose required keys are non-empty strings and whose optional key, if present, is a string."""
    return (isinstance(x, dict) and all(isinstance(x.get(k), str) and x[k].strip() for k in required)
            and isinstance(x.get(optional, ""), str))


def validate_data(d):
    """The collector's JSON: {"summary": {...}, "sessions": [...]}. Raise ReportError on the first problem."""
    if not isinstance(d, dict) or not isinstance(d.get("summary"), dict):
        raise ReportError('data must be an object with a "summary" object (the collector\'s JSON)')
    s = d["summary"]
    missing = [k for k in SUMMARY_KEYS if k not in s]
    if missing:
        raise ReportError("summary is missing: " + ", ".join(missing))
    for k in ("window_days", "sessions", "active_days", "prompts", "test_runs"):
        if not _count(s[k]):
            raise ReportError("summary.%s must be a whole number >= 0" % k)
    for k in ("per_agent", "per_month", "per_weekday", "per_hour", "doc_edits"):
        if not isinstance(s[k], dict):
            raise ReportError("summary.%s must be an object" % k)
    for k in ("projects", "tools", "commands"):
        if not isinstance(s[k], list):
            raise ReportError("summary.%s must be a list" % k)
    if not isinstance(d.get("sessions"), list) or not all(isinstance(r, dict) for r in d["sessions"]):
        raise ReportError('"sessions" must be a list of objects')


def validate_insights(ins):
    if not isinstance(ins, dict):
        raise ReportError("insights must be an object")
    unknown = [k for k in ins if k not in INSIGHT_KEYS]
    if unknown:
        raise ReportError("insights has unknown key(s): %s (known: %s)" % (", ".join(unknown), ", ".join(INSIGHT_KEYS)))
    for k in ("overview", "agents"):
        if k in ins and not _strings(ins[k]):
            raise ReportError("insights.%s must be a list of strings" % k)
    hb = ins.get("habits", [])
    if not isinstance(hb, list) or not all(isinstance(h, str) or _card(h, "title", "detail") for h in hb):
        raise ReportError("insights.habits must be a list of sentences or {title, detail, evidence?} strings")
    for n, kd in enumerate(ins.get("kinds", []), 1):
        ok = (isinstance(kd, dict) and isinstance(kd.get("name"), str) and kd["name"].strip()
              and _count(kd.get("sessions")) and _strings(kd.get("projects", [])) and _strings(kd.get("examples", []))
              and isinstance(kd.get("evidence", ""), str))
        if not ok:
            raise ReportError("insights.kinds item %d needs a name, sessions (a whole number >= 0), and "
                              "projects/examples as lists of strings" % n)
    if not isinstance(ins.get("kinds", []), list):
        raise ReportError("insights.kinds must be a list")
    fr = ins.get("friction", [])
    if not isinstance(fr, list) or not all(_card(f, "title", "detail") for f in fr):
        raise ReportError("insights.friction must be a list of {title, detail, evidence?} strings")
    th = ins.get("threads", [])
    if not isinstance(th, list) or not all(_card(t, "thread", "next", optional="when") for t in th):
        raise ReportError("insights.threads must be a list of {thread, next, when?} strings")
    if not isinstance(ins.get("caveat", ""), str):
        raise ReportError("insights.caveat must be a string")


def make_report(data, insights=None, now=None):
    validate_data(data)
    ins = {k: [] for k in LIST_KEYS}
    ins["caveat"] = ""
    if insights is not None:
        validate_insights(insights)
        ins.update(insights)
    now = now or dt.datetime.now(dt.timezone.utc)
    meta = {"generated": now.isoformat(timespec="seconds"), "window_days": data["summary"]["window_days"],
            "agents": sorted(data["summary"]["per_agent"])}
    return {"summary": data["summary"], "sessions": data["sessions"], "insights": ins, "meta": meta}


def embed(template_html, report):
    """Put the report into the template's data block, escaping every '<'."""
    payload = "\n" + json.dumps(report, indent=1, ensure_ascii=False).replace("<", "\\u003c") + "\n"
    if len(BLOCK.findall(template_html)) != 1:
        raise RuntimeError("template must contain exactly one report-data block")
    return BLOCK.sub(lambda m: m.group(1) + payload + m.group(3), template_html)


def describe(report):
    s = report["summary"]
    return "%d sessions on %d active days, last %d days" % (s["sessions"], s["active_days"], s["window_days"])


def _load(path, what):
    try:
        return json.loads(pathlib.Path(path).read_text(encoding="utf-8"))
    except OSError as e:
        raise ReportError("cannot read %s file: %s" % (what, e))
    except ValueError as e:
        raise ReportError("%s is not valid JSON (%s)" % (what, e))


def main(argv=None):
    ap = argparse.ArgumentParser(description="Build the agent-sessions-insight HTML report.")
    ap.add_argument("--data", help="the collector's JSON (agent-sessions-insight-data.json)")
    ap.add_argument("--insights", help="optional JSON with the agent's reading (overview, kinds, habits, friction, agents)")
    ap.add_argument("-o", "--output", default="agent-sessions-insight.html", help="HTML path (default: %(default)s)")
    ap.add_argument("--demo", action="store_true", help="copy the bundled demo report byte for byte; takes no data")
    a = ap.parse_args(argv)
    out = pathlib.Path(a.output)
    if a.demo:
        if a.data or a.insights:
            print("error: --demo copies the bundled report as is; drop --data and --insights", file=sys.stderr)
            return 2
        out.parent.mkdir(parents=True, exist_ok=True)
        out.write_bytes(TEMPLATE.read_bytes())
        demo = json.loads(BLOCK.search(TEMPLATE.read_text(encoding="utf-8")).group(2))
        print("wrote %s (demo, unchanged): %s" % (out, describe(demo)))
        return 0
    if not a.data:
        ap.error("--data is required unless --demo is given")
    try:
        data = _load(a.data, "data")
        insights = _load(a.insights, "insights") if a.insights else None
        report = make_report(data, insights)
    except ReportError as e:
        print("error: %s" % e, file=sys.stderr)
        return 2
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(embed(TEMPLATE.read_text(encoding="utf-8"), report), encoding="utf-8")
    print("wrote %s: %s" % (out, describe(report)))
    return 0


if __name__ == "__main__":
    sys.exit(main())
