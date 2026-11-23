#!/usr/bin/env python3
"""agent-sessions-insight collector: read-only summary of local coding-agent session logs. No network."""
import argparse, json, os, re, sqlite3, statistics, sys, datetime as dt
from collections import Counter
from dataclasses import dataclass, field
from pathlib import Path
from urllib.parse import unquote

UTC = dt.timezone.utc
DOCS = {"CLAUDE.md", "HANDOFF.md", "MEMORY.md", "SPEC.md", "README.md", "CHANGELOG.md", "AGENTS.md"}
TESTS = ("pytest", "npm test", "npm run test", "vitest", "jest", "cargo test", "go test", "node --test", "unittest")
WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]


@dataclass
class Session:
    agent: str
    id: str
    project: str = ""
    start: dt.datetime = None
    end: dt.datetime = None
    prompts: int = 0
    first_prompt: str = ""
    tools: Counter = field(default_factory=Counter)
    cmds: Counter = field(default_factory=Counter)
    docs: Counter = field(default_factory=Counter)
    test_runs: int = 0

    @property
    def minutes(self):
        return round((self.end - self.start).total_seconds() / 60, 1) if self.start and self.end else 0.0


# ---------- helpers ----------
def to_dt(x):
    """ISO string, epoch seconds or epoch milliseconds -> aware UTC datetime, else None."""
    try:
        if isinstance(x, (int, float)) and not isinstance(x, bool):
            return dt.datetime.fromtimestamp(x / 1000 if x > 1e11 else x, UTC)
        if isinstance(x, str) and x:
            t = dt.datetime.fromisoformat(x.replace("Z", "+00:00"))
            return t if t.tzinfo else t.replace(tzinfo=UTC)
    except (ValueError, OverflowError, OSError):
        pass
    return None


def read_jsonl(path):
    try:
        with open(path, errors="ignore") as f:
            for line in f:
                try:
                    e = json.loads(line)
                except ValueError:
                    continue
                if isinstance(e, dict):
                    yield e
    except OSError:
        return


def touch(s, t):
    if t is None:
        return
    s.start = t if s.start is None or t < s.start else s.start
    s.end = t if s.end is None or t > s.end else s.end


def note_tool(s, name, command="", paths=()):
    s.tools[name] += 1
    for p in paths:
        if isinstance(p, str) and os.path.basename(p) in DOCS:
            s.docs[os.path.basename(p)] += 1
    if command and any(k in command for k in TESTS):
        s.test_runs += 1


def note_prompt(s, text):
    text = (text or "").strip()
    if not text:
        return
    s.prompts += 1
    s.first_prompt = s.first_prompt or text[:160].replace("\n", " ")


def text_of(c):
    if isinstance(c, str):
        return c
    if isinstance(c, list):
        return " ".join(b.get("text", "") for b in c if isinstance(b, dict) and b.get("type") in ("text", "input_text"))
    return ""


def base(p):
    return os.path.basename((p or "").rstrip("/")) or ""


def finish(sessions, keep_empty=False):
    return [s for s in sessions if s.start is not None and (keep_empty or s.prompts or s.tools)]


def load_json(path):
    try:
        return json.loads(Path(path).read_text(errors="ignore"))
    except (OSError, ValueError):
        return None


# ---------- Claude Code: ~/.claude/projects/<project>/<session>.jsonl ----------
def parse_claude(root):
    S = {}
    for f in Path(root).glob("*/*.jsonl"):
        for e in read_jsonl(f):
            t = to_dt(e.get("timestamp"))
            if t is None or e.get("isSidechain"):
                continue
            sid = e.get("sessionId") or f.stem
            s = S.setdefault(sid, Session("claude-code", sid))
            if not s.project and e.get("cwd"):
                s.project = base(e["cwd"])
            touch(s, t)
            m = e.get("message") or {}
            c = m.get("content")
            if e.get("type") == "user" and not e.get("isMeta"):
                x = text_of(c).strip()
                if "<command-name>" in x:
                    s.cmds[x.split("<command-name>")[1].split("</command-name>")[0].strip()] += 1
                elif x and not x.startswith("<") and not x.startswith("Caveat:"):
                    note_prompt(s, x)
            elif e.get("type") == "assistant" and isinstance(c, list):
                for b in c:
                    if isinstance(b, dict) and b.get("type") == "tool_use":
                        i = b.get("input") or {}
                        note_tool(s, b.get("name", "?"), str(i.get("command", "")),
                                  [i.get("file_path"), i.get("path"), i.get("notebook_path")])
        for s in S.values():
            s.project = s.project or base(f.parent.name)
    return finish(S.values())


# ---------- Codex CLI: ~/.codex/sessions/YYYY/MM/DD/rollout-*.jsonl, lines {timestamp,type,payload} ----------
PATCH_FILE = re.compile(r"\*\*\* (?:Add|Update|Delete) File: (.+)")


def _args_of(raw):
    """Codex arguments arrive as a JSON string (or a patch text). Return (command_text, raw_text)."""
    if not isinstance(raw, str):
        return "", ""
    try:
        d = json.loads(raw)
    except ValueError:
        return "", raw
    cmd = d.get("command") if isinstance(d, dict) else None
    return (" ".join(map(str, cmd)) if isinstance(cmd, list) else str(cmd or "")), raw


def parse_codex(root):
    out = []
    for f in sorted(Path(root).rglob("rollout-*.jsonl")):
        s, resp_users, saw_event_prompt = Session("codex", f.stem), [], False
        for e in read_jsonl(f):
            touch(s, to_dt(e.get("timestamp")))
            p, kind = e.get("payload") or {}, e.get("type")
            if kind == "session_meta":
                s.id, s.project = p.get("id") or s.id, base(p.get("cwd"))
            elif kind == "event_msg" and p.get("type") == "user_message":
                saw_event_prompt = True
                note_prompt(s, p.get("message"))
            elif kind == "response_item":
                pt = p.get("type")
                if pt == "message" and p.get("role") == "user":
                    resp_users.append(text_of(p.get("content")).strip())
                elif pt in ("function_call", "custom_tool_call"):
                    cmd, raw = _args_of(p.get("arguments") if "arguments" in p else p.get("input"))
                    note_tool(s, p.get("name", "?"), cmd, [x.strip() for x in PATCH_FILE.findall(raw)])
        if not saw_event_prompt:                      # older rollouts: prompts only exist as response_items
            for x in resp_users:
                if x and not x.startswith("<"):
                    note_prompt(s, x)
        s.project = s.project or base(f.parent.name)
        out.append(s)
    return finish(out)


# ---------- Pi: ~/.pi/agent/sessions/--<cwd>--/<ts>_<id>.jsonl (header + message entries) ----------
def parse_pi(root):
    out = []
    for f in sorted(Path(root).rglob("*.jsonl")):
        s = Session("pi", f.stem.split("_", 1)[-1])
        for e in read_jsonl(f):
            touch(s, to_dt(e.get("timestamp")))
            if e.get("type") == "session":
                s.id, s.project = e.get("id") or s.id, base(e.get("cwd"))
            elif e.get("type") == "message":
                m = e.get("message") or {}
                role, c = m.get("role"), m.get("content")
                if role == "user":
                    note_prompt(s, text_of(c))
                elif role == "assistant" and isinstance(c, list):
                    for b in c:
                        if isinstance(b, dict) and b.get("type") == "toolCall":
                            a = b.get("arguments") or {}
                            note_tool(s, b.get("name", "?"), str(a.get("command", "")), [a.get("path"), a.get("file_path")])
                elif role == "bashExecution":
                    note_tool(s, "bash", str(m.get("command", "")))
        out.append(s)
    return finish(out)


# ---------- OpenCode: ~/.local/share/opencode (JSON files under storage/, or SQLite opencode*.db) ----------
def _oc_message(s, role, parts):
    """parts: list of part dicts for one message."""
    if role == "user":
        note_prompt(s, " ".join(p.get("text", "") for p in parts if p.get("type") == "text"))
    for p in parts:
        if p.get("type") == "tool":
            i = (p.get("state") or {}).get("input") or {}
            note_tool(s, p.get("tool", "?"), str(i.get("command", "")), [i.get("filePath"), i.get("path"), i.get("file_path")])


def _opencode_json(storage):
    out = []
    for sf in sorted((storage / "session").glob("*/*.json")):
        d = load_json(sf)
        if not isinstance(d, dict):
            continue
        sid = d.get("id") or sf.stem
        s = Session("opencode", sid, project=base(d.get("directory")))
        t = d.get("time") or {}
        touch(s, to_dt(t.get("created"))); touch(s, to_dt(t.get("updated")))
        for mf in sorted((storage / "message" / sid).glob("*.json")):
            m = load_json(mf)
            if not isinstance(m, dict):
                continue
            touch(s, to_dt((m.get("time") or {}).get("created")))
            parts = [p for p in (load_json(pf) for pf in sorted((storage / "part" / (m.get("id") or mf.stem)).glob("*.json"))) if isinstance(p, dict)]
            _oc_message(s, m.get("role"), parts)
        out.append(s)
    return out


def _opencode_sqlite(db):
    try:
        con = sqlite3.connect("file:%s?mode=ro" % db, uri=True)
        sess = con.execute("select id, directory, time_created, time_updated from session").fetchall()
        msgs = con.execute("select id, session_id, data from message").fetchall()
        parts = con.execute("select message_id, data from part").fetchall()
        con.close()
    except sqlite3.Error:
        return []                       # schema differs from the one this adapter knows; skip rather than guess
    by_msg = {}
    for mid, data in parts:
        try:
            by_msg.setdefault(mid, []).append(json.loads(data))
        except (TypeError, ValueError):
            pass
    S = {sid: Session("opencode", sid, project=base(d), start=to_dt(c), end=to_dt(u)) for sid, d, c, u in sess}
    for mid, sid, data in msgs:
        s = S.get(sid)
        try:
            m = json.loads(data)
        except (TypeError, ValueError):
            continue
        if s is None or not isinstance(m, dict):
            continue
        touch(s, to_dt((m.get("time") or {}).get("created")))
        _oc_message(s, m.get("role"), [p for p in by_msg.get(mid, []) if isinstance(p, dict)])
    return list(S.values())


def parse_opencode(root):
    root = Path(root)
    out = _opencode_json(root / "storage")
    for db in sorted(root.glob("opencode*.db")):
        out += _opencode_sqlite(db)
    return finish(out)


# ---------- GitHub Copilot CLI: ~/.copilot/session-state/<id>/events.jsonl (event schema unverified: tolerant) ----------
def parse_copilot(root):
    root, out = Path(root), []
    files = [(d / "events.jsonl", d.name) for d in sorted(root.glob("*")) if d.is_dir()]
    files += [(f, f.stem) for f in sorted(root.glob("*.jsonl"))]
    for f, sid in files:
        s = Session("copilot-cli", sid)
        for e in read_jsonl(f):
            touch(s, to_dt(e.get("timestamp") or e.get("ts") or e.get("time")))
            kind = str(e.get("type") or e.get("kind") or "").lower()
            d = e.get("data") if isinstance(e.get("data"), dict) else {}
            cwd = (d.get("context") or {}).get("cwd") if isinstance(d.get("context"), dict) else None
            cwd = cwd or d.get("cwd") or e.get("cwd")
            if cwd and not s.project:
                s.project = base(cwd)
            if "user" in kind and ("message" in kind or "prompt" in kind):
                note_prompt(s, d.get("content") or d.get("text") or d.get("prompt") or "")
            elif "tool" in kind and "start" in kind:
                a = d.get("arguments") if isinstance(d.get("arguments"), dict) else {}
                note_tool(s, d.get("toolName") or d.get("name") or "?", str(a.get("command", "")),
                          [a.get("path"), a.get("file_path"), a.get("filePath")])
        s.project = s.project or "(unknown)"
        out.append(s)
    return finish(out, keep_empty=True)       # unknown schema still yields a dated session


# ---------- Devin CLI: ~/.local/share/devin/cli (sessions/<id>/{meta.json,log.jsonl}, or legacy sessions.db) ----------
def _devin_message(s, m):
    """m: one chat message {message_id, role, content, tool_calls, metadata}."""
    if not isinstance(m, dict):
        return
    touch(s, to_dt((m.get("metadata") or {}).get("created_at")))
    role, c = m.get("role"), m.get("content")
    if role == "user":
        x = text_of(c).strip()
        if x and not x.startswith("<"):
            note_prompt(s, x)
    elif role == "assistant":
        for tc in m.get("tool_calls") or []:
            if not isinstance(tc, dict):
                continue
            f = tc.get("function") if isinstance(tc.get("function"), dict) else tc
            a = f.get("arguments")
            if isinstance(a, str):
                try:
                    a = json.loads(a)
                except ValueError:
                    a = {}
            a = a if isinstance(a, dict) else {}
            cmd = a.get("command", "")
            note_tool(s, f.get("name") or "?", " ".join(map(str, cmd)) if isinstance(cmd, list) else str(cmd),
                      [a.get("file_path"), a.get("path"), a.get("filePath")])


def _devin_folders(root):
    out = []
    for d in sorted((root / "sessions").glob("*")):
        log = d / "log.jsonl"
        if not log.is_file():
            continue
        meta = load_json(d / "meta.json")
        meta = meta if isinstance(meta, dict) else {}
        s = Session("devin", meta.get("id") or d.name, project=base(meta.get("working_directory")) or "(unknown)")
        touch(s, to_dt(meta.get("created_at"))); touch(s, to_dt(meta.get("last_activity_at")))
        nodes = {}                                   # append-only log: keep the latest record per node id
        for e in read_jsonl(log):
            touch(s, to_dt(e.get("at")))
            n = e.get("node")
            if e.get("kind") == "node" and isinstance(n, dict):
                nodes[n.get("id") or len(nodes)] = n.get("message")
        for m in nodes.values():
            _devin_message(s, m)
        out.append(s)
    return out


def _devin_sqlite(db):
    try:
        con = sqlite3.connect("file:%s?mode=ro" % db, uri=True)
        sess = con.execute("select id, working_directory, created_at, last_activity_at from sessions").fetchall()
        msgs = con.execute("select session_id, chat_message, created_at from message_nodes order by created_at").fetchall()
        con.close()
    except sqlite3.Error:
        return []                       # schema differs from the one this adapter knows; skip rather than guess
    S = {sid: Session("devin", sid, project=base(d) or "(unknown)", start=to_dt(c), end=to_dt(u)) for sid, d, c, u in sess}
    seen = set()                        # message_nodes is a forest: one message can sit on several branches
    for sid, data, created in msgs:
        s = S.get(sid)
        try:
            m = json.loads(data)
        except (TypeError, ValueError):
            continue
        if s is None or not isinstance(m, dict):
            continue
        key = (sid, m.get("message_id") or data)
        if key in seen:
            continue
        seen.add(key)
        touch(s, to_dt(created))
        _devin_message(s, m)
    return list(S.values())


def parse_devin(root):
    root = Path(root)
    out = _devin_folders(root)
    have = {s.id for s in out}
    if (root / "sessions.db").is_file():
        out += [s for s in _devin_sqlite(root / "sessions.db") if s.id not in have]
    return finish(out)


# ---------- Grok CLI: ~/.grok/sessions/<percent-encoded cwd>/<uuid>/ (summary.json, updates.jsonl, chat_history.jsonl) ----------
def _grok_args(a):
    if isinstance(a, str):
        try:
            a = json.loads(a)
        except ValueError:
            return {}
    return a if isinstance(a, dict) else {}


def _grok_tool(s, name, a):
    cmd = a.get("command", "")
    note_tool(s, name or "?", " ".join(map(str, cmd)) if isinstance(cmd, list) else str(cmd),
              [a.get("path"), a.get("file_path"), a.get("filePath")])


def _grok_updates(s, path):
    """updates.jsonl: one ACP session update per line, with a unix-seconds timestamp (or _meta.agentTimestampMs)."""
    seen_prompts = set()
    for e in read_jsonl(path):
        prm = e.get("params") if isinstance(e.get("params"), dict) else {}
        meta = prm.get("_meta") if isinstance(prm.get("_meta"), dict) else {}
        touch(s, to_dt(e.get("timestamp") or meta.get("agentTimestampMs") or meta.get("timestamp")))
        u = prm.get("update") if isinstance(prm.get("update"), dict) else {}
        kind = u.get("sessionUpdate")
        if kind == "user_message_chunk":
            pid = meta.get("promptId")
            if pid is not None and pid in seen_prompts:
                continue                                  # a later chunk of a prompt already counted
            c = u.get("content") if isinstance(u.get("content"), dict) else {}
            text = ((c.get("_meta") or {}).get("displayText") or c.get("text") or "").strip()
            if text and not text.startswith("<"):
                seen_prompts.add(pid)
                note_prompt(s, text)
        elif kind == "tool_call":
            name = ((u.get("_meta") or {}).get("x.ai/tool") or {}).get("name") or u.get("title")
            _grok_tool(s, name, _grok_args(u.get("rawInput")))


def _grok_chat_history(s, path):
    """chat_history.jsonl: the model's messages, typed system/user/reasoning/assistant/tool_result; no timestamps."""
    for e in read_jsonl(path):
        kind = e.get("type")
        if kind == "user":
            x = text_of(e.get("content")).strip()
            if x and not x.startswith("<"):
                note_prompt(s, x)
        elif kind == "assistant":
            for tc in e.get("tool_calls") or []:
                if isinstance(tc, dict):
                    f = tc.get("function") if isinstance(tc.get("function"), dict) else tc
                    _grok_tool(s, f.get("name"), _grok_args(f.get("arguments")))


def parse_grok(root):
    out = []
    for d in sorted(Path(root).glob("*/*")):
        if not d.is_dir():
            continue
        summ = load_json(d / "summary.json")
        summ = summ if isinstance(summ, dict) else {}
        if str(summ.get("session_kind") or "").startswith("subagent"):
            continue                                       # subagents are part of their parent's work, like Claude sidechains
        info = summ.get("info") if isinstance(summ.get("info"), dict) else {}
        s = Session("grok", info.get("id") or d.name,
                    project=base(info.get("cwd")) or base(unquote(d.parent.name)) or "(unknown)")
        touch(s, to_dt(summ.get("created_at"))); touch(s, to_dt(summ.get("updated_at")))
        if (d / "updates.jsonl").is_file():
            _grok_updates(s, d / "updates.jsonl")
        elif (d / "chat_history.jsonl").is_file():
            _grok_chat_history(s, d / "chat_history.jsonl")
        out.append(s)
    return finish(out)


# ---------- generic fallback: any JSONL with timestamps, role/content and tool_use-like lines ----------
def parse_generic(root, agent="generic"):
    out = []
    for f in sorted(Path(root).rglob("*.jsonl")):
        s = Session(agent, f.stem, project=base(f.parent.name))
        for e in read_jsonl(f):
            touch(s, to_dt(e.get("timestamp") or e.get("ts") or e.get("time") or e.get("created_at")))
            m = e.get("message") if isinstance(e.get("message"), dict) else {}
            role = e.get("role") or m.get("role")
            if role == "user":
                note_prompt(s, text_of(e["content"] if "content" in e else m.get("content")))
            if str(e.get("type", "")).lower() in ("tool_use", "tool_call", "toolcall", "function_call"):
                i = e.get("input") or e.get("arguments") or {}
                if isinstance(i, str):
                    try:
                        i = json.loads(i)
                    except ValueError:
                        i = {}
                i = i if isinstance(i, dict) else {}
                note_tool(s, e.get("name", "?"), str(i.get("command", "")), [i.get("file_path"), i.get("path")])
        out.append(s)
    return finish(out)


# ---------- discovery and CLI ----------
AGENTS = {
    "claude-code": (".claude/projects", parse_claude),
    "codex": (".codex/sessions", parse_codex),
    "pi": (".pi/agent/sessions", parse_pi),
    "opencode": (".local/share/opencode", parse_opencode),
    "copilot-cli": (".copilot/session-state", parse_copilot),
    "devin": (".local/share/devin/cli", parse_devin),
    "grok": (".grok/sessions", parse_grok),
}


def discover(home, agents=None, extra=None):
    """Collect sessions from every known agent under `home`. `extra` maps name -> path: it overrides the
    location of a known agent, or reads an unknown agent's JSONL with the generic parser."""
    home, extra = Path(home), dict(extra or {})
    wanted = list(agents) if agents else list(AGENTS) + [n for n in extra if n not in AGENTS]
    unknown = [n for n in wanted if n not in AGENTS and n not in extra]
    if unknown:
        raise ValueError("unknown agent(s): %s (known: %s)" % (", ".join(unknown), ", ".join(AGENTS)))
    out = []
    for n in wanted:
        if n in AGENTS:
            sub, fn = AGENTS[n]
            out += fn(Path(extra[n]) if n in extra else home / sub)
        else:
            out += parse_generic(extra[n], agent=n)
    return out


def main(argv=None):
    ap = argparse.ArgumentParser(description="Summarise local coding-agent sessions (read-only, no network).")
    ap.add_argument("--days", type=int, default=180)
    ap.add_argument("--out", default="agent-sessions-insight-data.json")
    ap.add_argument("--home", default=str(Path.home()))
    ap.add_argument("--agents", default="", help="comma list of: " + ", ".join(AGENTS))
    ap.add_argument("--extra", action="append", default=[], metavar="NAME=PATH",
                    help="override a known agent's folder, or add another agent's JSONL folder (generic parser)")
    a = ap.parse_args(argv)
    extra = {k: os.path.expanduser(v) for k, v in (x.split("=", 1) for x in a.extra if "=" in x)}
    try:
        sessions = discover(a.home, [x for x in a.agents.split(",") if x] or None, extra)
    except ValueError as e:
        print(e, file=sys.stderr)
        return 2
    summary = summarize(sessions, a.days)
    if summary is None:
        print("No sessions found in the last %d days. Looked under %s for: %s" % (a.days, a.home, ", ".join(AGENTS)), file=sys.stderr)
        return 1
    cut = dt.datetime.now(UTC) - dt.timedelta(days=a.days)
    rows = [dict(agent=s.agent, id=s.id[:8], project=s.project, start=s.start.isoformat(), minutes=s.minutes, prompts=s.prompts,
                 first_prompt=s.first_prompt, top_tools=s.tools.most_common(4), commands=list(s.cmds)[:5])
            for s in sorted(sessions, key=lambda s: s.start) if s.start >= cut]
    Path(a.out).write_text(json.dumps(dict(summary=summary, sessions=rows), indent=1))
    print(json.dumps(summary, indent=1))
    print("\nwrote", a.out)
    return 0


# ---------- summary ----------
def summarize(sessions, days, now=None, tz=None):
    now = now or dt.datetime.now(UTC)
    cut = now - dt.timedelta(days=days)
    L = [s for s in sessions if s.start and s.start >= cut]
    if not L:
        return None
    loc = (lambda t: t.astimezone(tz)) if tz else (lambda t: t.astimezone())
    day_list = sorted({loc(s.start).date() for s in L})
    gaps = [(b - a).days for a, b in zip(day_list, day_list[1:])]
    total = lambda attr: sum((getattr(s, attr) for s in L), Counter())
    return dict(
        window_days=days, sessions=len(L), active_days=len(day_list), prompts=sum(s.prompts for s in L),
        first=min(s.start for s in L).isoformat(), last=max(s.end for s in L).isoformat(),
        median_minutes=statistics.median(s.minutes for s in L), longest_minutes=max(s.minutes for s in L),
        median_gap_days=statistics.median(gaps) if gaps else 0, longest_gap_days=max(gaps) if gaps else 0,
        per_agent=dict(Counter(s.agent for s in L)),
        per_month=dict(sorted(Counter(loc(s.start).strftime("%Y-%m") for s in L).items())),
        per_weekday=dict(Counter(WEEKDAYS[loc(s.start).weekday()] for s in L)),
        per_hour=dict(sorted(Counter(loc(s.start).hour for s in L).items())),
        projects=Counter(s.project for s in L).most_common(15),
        tools=total("tools").most_common(20), commands=total("cmds").most_common(20),
        doc_edits=dict(total("docs")), test_runs=sum(s.test_runs for s in L),
    )


if __name__ == "__main__":
    sys.exit(main())
