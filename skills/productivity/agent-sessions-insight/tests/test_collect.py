"""Tests for scripts/collect.py. Run from the skill directory: python3 -m unittest discover -s tests -v (or python3 -m pytest)."""
import json, sqlite3, sys, tempfile, unittest, datetime as dt
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "scripts"))
import collect

UTC = dt.timezone.utc
NOW = dt.datetime(2026, 11, 22, 12, 0, tzinfo=UTC)


def jl(path, rows, trailing_garbage=False):
    path.parent.mkdir(parents=True, exist_ok=True)
    text = "\n".join(json.dumps(r) for r in rows) + "\n"
    if trailing_garbage:
        text += "not json\n"
    path.write_text(text)


def js(path, obj):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(obj))


def ms(iso):
    return int(dt.datetime.fromisoformat(iso).timestamp() * 1000)


class Base(unittest.TestCase):
    def setUp(self):
        self._t = tempfile.TemporaryDirectory()
        self.home = Path(self._t.name)

    def tearDown(self):
        self._t.cleanup()


# ---------- fixtures ----------
def claude_fixture(home):
    p = home / ".claude" / "projects" / "-w-sample-app"
    jl(p / "s1.jsonl", [
        {"type": "user", "sessionId": "s1", "timestamp": "2026-11-20T10:00:00Z", "cwd": "/w/sample-app",
         "message": {"content": "Add tests for the parser"}},
        {"type": "user", "sessionId": "s1", "timestamp": "2026-11-20T10:00:30Z",
         "message": {"content": "<command-name>/plan</command-name>"}},
        {"type": "assistant", "sessionId": "s1", "timestamp": "2026-11-20T10:05:00Z",
         "message": {"content": [{"type": "tool_use", "name": "Bash", "input": {"command": "pytest -q"}},
                                  {"type": "tool_use", "name": "Edit", "input": {"file_path": "/w/sample-app/HANDOFF.md"}}]}},
        {"type": "user", "sessionId": "s1", "timestamp": "2026-11-20T10:06:00Z",
         "message": {"content": [{"type": "tool_result", "content": "ok"}]}},
        {"type": "user", "sessionId": "s1", "timestamp": "2026-11-20T10:07:00Z", "isSidechain": True,
         "message": {"content": "subagent prompt"}},
    ], trailing_garbage=True)
    jl(p / "s2.jsonl", [
        {"type": "user", "sessionId": "s2", "timestamp": "2026-11-02T09:00:00Z", "cwd": "/w/sample-app",
         "message": {"content": [{"type": "text", "text": "fix bug"}]}},
    ])


def codex_fixture(home):
    d = home / ".codex" / "sessions" / "2026" / "11" / "20"
    jl(d / "rollout-2026-11-20T08-00-00-aaa.jsonl", [
        {"timestamp": "2026-11-20T08:00:00Z", "type": "session_meta", "payload": {"id": "aaa", "cwd": "/w/cx"}},
        {"timestamp": "2026-11-20T08:00:05Z", "type": "event_msg", "payload": {"type": "user_message", "message": "refactor parser"}},
        {"timestamp": "2026-11-20T08:00:06Z", "type": "response_item", "payload": {"type": "message", "role": "user",
         "content": [{"type": "input_text", "text": "<environment_context>x</environment_context>"}]}},
        {"timestamp": "2026-11-20T08:01:00Z", "type": "response_item", "payload": {"type": "function_call", "name": "shell",
         "arguments": json.dumps({"command": ["bash", "-lc", "pytest -q"]})}},
        {"timestamp": "2026-11-20T08:02:00Z", "type": "response_item", "payload": {"type": "function_call", "name": "apply_patch",
         "arguments": "*** Begin Patch\n*** Update File: /w/cx/SPEC.md\n@@\n*** End Patch"}},
    ])
    jl(d / "rollout-2026-11-20T09-00-00-bbb.jsonl", [  # old layout: no event_msg
        {"timestamp": "2026-11-20T09:00:00Z", "type": "session_meta", "payload": {"id": "bbb", "cwd": "/w/cx2"}},
        {"timestamp": "2026-11-20T09:00:05Z", "type": "response_item", "payload": {"type": "message", "role": "user",
         "content": [{"type": "input_text", "text": "fix bug"}]}},
    ])


def pi_fixture(home):
    d = home / ".pi" / "agent" / "sessions" / "--w-proj--"
    jl(d / "2026-11-18T10-00-00-000Z_uuid1.jsonl", [
        {"type": "session", "version": 3, "id": "uuid1", "timestamp": "2026-11-18T10:00:00Z", "cwd": "/w/proj"},
        {"type": "message", "id": "a1", "timestamp": "2026-11-18T10:00:01Z",
         "message": {"role": "user", "content": [{"type": "text", "text": "add cache"}], "timestamp": ms("2026-11-18T10:00:01+00:00")}},
        {"type": "message", "id": "a2", "parentId": "a1", "timestamp": "2026-11-18T10:01:00Z",
         "message": {"role": "assistant", "content": [
             {"type": "toolCall", "id": "t1", "name": "edit", "arguments": {"path": "/w/proj/CLAUDE.md"}},
             {"type": "toolCall", "id": "t2", "name": "bash", "arguments": {"command": "pytest"}}],
          "timestamp": ms("2026-11-18T10:01:00+00:00")}},
        {"type": "message", "id": "a3", "parentId": "a2", "timestamp": "2026-11-18T10:02:00Z",
         "message": {"role": "bashExecution", "command": "npm test", "output": "", "exitCode": 0}},
        {"type": "message", "id": "a4", "parentId": "a3", "timestamp": "2026-11-18T10:03:00Z",
         "message": {"role": "user", "content": "second prompt as plain string"}},
    ])


def opencode_json_fixture(home):
    s = home / ".local" / "share" / "opencode" / "storage"
    js(s / "session" / "proj1" / "ses_1.json", {"id": "ses_1", "directory": "/w/oc", "title": "t",
                                                "time": {"created": ms("2026-11-10T07:00:00+00:00"), "updated": ms("2026-11-10T07:30:00+00:00")}})
    js(s / "message" / "ses_1" / "msg_1.json", {"id": "msg_1", "sessionID": "ses_1", "role": "user", "time": {"created": ms("2026-11-10T07:00:00+00:00")}})
    js(s / "message" / "ses_1" / "msg_2.json", {"id": "msg_2", "sessionID": "ses_1", "role": "assistant", "time": {"created": ms("2026-11-10T07:01:00+00:00")}})
    js(s / "part" / "msg_1" / "prt_1.json", {"id": "prt_1", "type": "text", "text": "build api"})
    js(s / "part" / "msg_2" / "prt_2.json", {"id": "prt_2", "type": "tool", "tool": "bash", "state": {"input": {"command": "pytest"}}})
    js(s / "part" / "msg_2" / "prt_3.json", {"id": "prt_3", "type": "tool", "tool": "edit", "state": {"input": {"filePath": "/w/oc/README.md"}}})


def opencode_sqlite_fixture(home):
    db = home / ".local" / "share" / "opencode" / "opencode.db"
    db.parent.mkdir(parents=True, exist_ok=True)
    c = sqlite3.connect(db)
    c.executescript("""
      create table session(id text primary key, directory text, time_created integer, time_updated integer);
      create table message(id text primary key, session_id text, data text);
      create table part(id text primary key, message_id text, session_id text, data text);""")
    c.execute("insert into session values('ses_9','/w/oc9',?,?)", (ms("2026-11-12T07:00:00+00:00"), ms("2026-11-12T07:40:00+00:00")))
    c.execute("insert into message values('m1','ses_9',?)", (json.dumps({"role": "user", "time": {"created": ms("2026-11-12T07:00:00+00:00")}}),))
    c.execute("insert into message values('m2','ses_9',?)", (json.dumps({"role": "assistant", "time": {"created": ms("2026-11-12T07:01:00+00:00")}}),))
    c.execute("insert into part values('p1','m1','ses_9',?)", (json.dumps({"type": "text", "text": "write docs"}),))
    c.execute("insert into part values('p2','m2','ses_9',?)", (json.dumps({"type": "tool", "tool": "write", "state": {"input": {"filePath": "/w/oc9/CHANGELOG.md"}}}),))
    c.commit(); c.close()


def copilot_fixture(home):
    d = home / ".copilot" / "session-state"
    jl(d / "uuid-c1" / "events.jsonl", [
        {"type": "session.start", "timestamp": "2026-11-15T10:00:00Z", "data": {"context": {"cwd": "/w/cp"}}},
        {"type": "user.message", "timestamp": "2026-11-15T10:00:10Z", "data": {"content": "write docs"}},
        {"type": "tool.execution_start", "timestamp": "2026-11-15T10:01:00Z", "data": {"toolName": "bash", "arguments": {"command": "pytest -q"}}},
    ])
    jl(d / "uuid-c2" / "events.jsonl", [  # unknown event names: only timestamps usable
        {"kind": "zzz", "ts": "2026-11-16T10:00:00Z"},
        {"kind": "yyy", "ts": "2026-11-16T10:20:00Z"},
    ])


def epoch(iso):
    return int(dt.datetime.fromisoformat(iso).timestamp())


DEVIN = (".local", "share", "devin", "cli")


def devin_node(nid, role, iso, content="", tool_calls=None, mid=None):
    msg = {"message_id": mid or "m-" + nid, "role": role, "content": content, "metadata": {"created_at": iso}}
    if tool_calls is not None:
        msg["tool_calls"] = tool_calls
    return {"kind": "node", "at": epoch(iso.replace("Z", "+00:00")), "node": {"id": nid, "parent_id": None, "message": msg}}


def devin_dir_fixture(home):
    d = home.joinpath(*DEVIN) / "sessions" / "dv1"
    js(d / "meta.json", {"id": "dv1", "working_directory": "/w/dv", "title": "t",
                         "created_at": epoch("2026-11-19T10:00:00+00:00"), "last_activity_at": epoch("2026-11-19T10:45:00+00:00")})
    jl(d / "log.jsonl", [
        devin_node("n1", "system", "2026-11-19T10:00:00Z", "You are Devin"),
        devin_node("n2", "user", "2026-11-19T10:00:05Z", "add login page"),
        devin_node("n3", "assistant", "2026-11-19T10:01:00Z", "", [
            {"id": "c1", "type": "function", "function": {"name": "exec", "arguments": json.dumps({"command": "pytest -q"})}},
            {"id": "c2", "name": "edit", "arguments": {"file_path": "/w/dv/README.md"}}]),
        devin_node("n3", "assistant", "2026-11-19T10:01:00Z", "", [   # append-only rewrite of the same node
            {"id": "c1", "type": "function", "function": {"name": "exec", "arguments": json.dumps({"command": "pytest -q"})}},
            {"id": "c2", "name": "edit", "arguments": {"file_path": "/w/dv/README.md"}}]),
        {"kind": "tool_call_state", "at": epoch("2026-11-19T10:01:01+00:00"), "tool_call_id": "c1"},
        devin_node("n4", "user", "2026-11-19T10:30:00Z", "<system-reminder>x</system-reminder>"),
        devin_node("n5", "user", "2026-11-19T10:40:00Z", "now style it"),
    ], trailing_garbage=True)


def devin_sqlite_fixture(home, ids=("dv9",)):
    db = home.joinpath(*DEVIN) / "sessions.db"
    db.parent.mkdir(parents=True, exist_ok=True)
    c = sqlite3.connect(db)
    c.executescript("""
      create table sessions(id text primary key, working_directory text, model text, created_at integer,
                            last_activity_at integer, title text, main_chain_id text);
      create table message_nodes(session_id text, node_id text, parent_node_id text, chat_message text,
                                 created_at integer, metadata text);""")
    for sid in ids:
        c.execute("insert into sessions values(?,?,?,?,?,?,?)", (sid, "/w/" + sid, "m", epoch("2026-11-21T08:00:00+00:00"),
                                                                 epoch("2026-11-21T08:20:00+00:00"), "t", "x"))
        rows = [("a", None, {"message_id": "u1", "role": "user", "content": "write a migration"}),
                ("b", "a", {"message_id": "a1", "role": "assistant", "content": "",
                            "tool_calls": [{"id": "c1", "function": {"name": "edit", "arguments": json.dumps({"path": "/w/CHANGELOG.md"})}}]}),
                ("b2", "a", {"message_id": "a1", "role": "assistant", "content": "",     # forest: same message on a sibling branch
                             "tool_calls": [{"id": "c1", "function": {"name": "edit", "arguments": json.dumps({"path": "/w/CHANGELOG.md"})}}]})]
        for i, (nid, parent, m) in enumerate(rows):
            c.execute("insert into message_nodes values(?,?,?,?,?,?)",
                      (sid, nid, parent, json.dumps(m), epoch("2026-11-21T08:00:00+00:00") + 60 * i, "{}"))
    c.commit(); c.close()


GROK = (".grok", "sessions")
GROK_CWD = "%2Fw%2Fdemo-app"


def grok_update(ts, kind, **fields):
    upd = {"sessionUpdate": kind}
    upd.update(fields)
    return {"timestamp": epoch(ts), "method": "session/update",
            "params": {"sessionId": "s", "_meta": {"agentTimestampMs": epoch(ts) * 1000}, "update": upd}}


def grok_updates_fixture(home):
    d = home.joinpath(*GROK) / GROK_CWD / "0190a1b2-0000-7000-8000-000000000001"
    js(d / "summary.json", {"info": {"id": "0190a1b2-0000-7000-8000-000000000001", "cwd": "/w/demo-app"},
                            "created_at": "2026-11-19T09:00:00Z", "updated_at": "2026-11-19T09:40:00Z",
                            "session_summary": "t"})
    first = grok_update("2026-11-19T09:00:00+00:00", "user_message_chunk",
                        content={"type": "text", "text": "add a cache<system-reminder>x</system-reminder>",
                                 "_meta": {"displayText": "add a cache"}})
    first["params"]["_meta"]["promptId"] = "p1"
    again = grok_update("2026-11-19T09:00:01+00:00", "user_message_chunk", content={"type": "text", "text": " please"})
    again["params"]["_meta"]["promptId"] = "p1"          # second chunk of the same prompt
    second = grok_update("2026-11-19T09:30:00+00:00", "user_message_chunk", content={"type": "text", "text": "now document it"})
    second["params"]["_meta"]["promptId"] = "p2"
    jl(d / "updates.jsonl", [
        first, again,
        grok_update("2026-11-19T09:01:00+00:00", "agent_message_chunk", content={"type": "text", "text": "ok"}),
        grok_update("2026-11-19T09:02:00+00:00", "tool_call", toolCallId="c1", rawInput={"command": "pytest -q"},
                    _meta={"x.ai/tool": {"name": "run_terminal_command"}}),
        grok_update("2026-11-19T09:03:00+00:00", "tool_call_update", toolCallId="c1", status="completed"),
        second,
        grok_update("2026-11-19T09:31:00+00:00", "tool_call", toolCallId="c2", rawInput={"path": "/w/demo-app/README.md"},
                    _meta={"x.ai/tool": {"name": "edit_file"}}),
    ], trailing_garbage=True)


def grok_chat_history_fixture(home):
    d = home.joinpath(*GROK) / "%2Fw%2Fother-app" / "0190a1b2-0000-7000-8000-000000000002"
    js(d / "summary.json", {"info": {"id": "0190a1b2-0000-7000-8000-000000000002", "cwd": "/w/other-app"},
                            "created_at": "2026-11-18T14:00:00Z", "updated_at": "2026-11-18T14:30:00Z"})
    jl(d / "chat_history.jsonl", [
        {"type": "system", "content": "You are Grok"},
        {"type": "user", "content": "explain the parser"},
        {"type": "reasoning", "id": "r1", "summary": [{"type": "summary_text", "text": "thinking"}]},
        {"type": "assistant", "content": "", "id": "a1",
         "tool_calls": [{"id": "c1", "name": "read_file", "arguments": json.dumps({"path": "/w/other-app/AGENTS.md"})}]},
        {"type": "tool_result", "tool_call_id": "c1", "content": "..."},
    ])


# ---------- adapters ----------
class ClaudeAdapter(Base):
    def test_counts_and_signals(self):
        claude_fixture(self.home)
        ss = {s.id: s for s in collect.parse_claude(self.home / ".claude" / "projects")}
        self.assertEqual(set(ss), {"s1", "s2"})
        s = ss["s1"]
        self.assertEqual(s.agent, "claude-code")
        self.assertEqual(s.project, "sample-app")
        self.assertEqual(s.prompts, 1)                      # tool_result, command and sidechain excluded
        self.assertEqual(s.first_prompt, "Add tests for the parser")
        self.assertEqual(dict(s.cmds), {"/plan": 1})
        self.assertEqual(dict(s.tools), {"Bash": 1, "Edit": 1})
        self.assertEqual(dict(s.docs), {"HANDOFF.md": 1})
        self.assertEqual(s.test_runs, 1)
        self.assertEqual(s.minutes, 6.0)                    # sidechain timestamp ignored

    def test_corrupt_lines_are_skipped(self):
        claude_fixture(self.home)  # s1 ends with a garbage line
        self.assertEqual(len(collect.parse_claude(self.home / ".claude" / "projects")), 2)

    def test_missing_root_gives_empty(self):
        self.assertEqual(collect.parse_claude(self.home / "nope"), [])


class CodexAdapter(Base):
    def test_new_and_old_layouts(self):
        codex_fixture(self.home)
        ss = {s.id: s for s in collect.parse_codex(self.home / ".codex" / "sessions")}
        self.assertEqual(set(ss), {"aaa", "bbb"})
        a = ss["aaa"]
        self.assertEqual((a.agent, a.project), ("codex", "cx"))
        self.assertEqual(a.prompts, 1)                      # injected environment_context not counted
        self.assertEqual(a.first_prompt, "refactor parser")
        self.assertEqual(a.tools["shell"], 1)
        self.assertEqual(a.tools["apply_patch"], 1)
        self.assertEqual(a.test_runs, 1)
        self.assertEqual(dict(a.docs), {"SPEC.md": 1})
        self.assertEqual(ss["bbb"].prompts, 1)              # old layout falls back to response_item
        self.assertEqual(ss["bbb"].first_prompt, "fix bug")


class PiAdapter(Base):
    def test_tree_entries(self):
        pi_fixture(self.home)
        (s,) = collect.parse_pi(self.home / ".pi" / "agent" / "sessions")
        self.assertEqual((s.agent, s.id, s.project), ("pi", "uuid1", "proj"))
        self.assertEqual(s.prompts, 2)
        self.assertEqual(s.first_prompt, "add cache")
        self.assertEqual(s.tools["edit"], 1)
        self.assertEqual(s.tools["bash"], 2)                # toolCall bash + bashExecution
        self.assertEqual(s.test_runs, 2)                    # pytest + npm test
        self.assertEqual(dict(s.docs), {"CLAUDE.md": 1})
        self.assertEqual(s.minutes, 3.0)


class OpenCodeAdapter(Base):
    def check(self, s, project, prompt, docs):
        self.assertEqual((s.agent, s.project), ("opencode", project))
        self.assertEqual(s.prompts, 1)
        self.assertEqual(s.first_prompt, prompt)
        self.assertEqual(dict(s.docs), docs)

    def test_json_storage(self):
        opencode_json_fixture(self.home)
        (s,) = collect.parse_opencode(self.home / ".local" / "share" / "opencode")
        self.check(s, "oc", "build api", {"README.md": 1})
        self.assertEqual((s.tools["bash"], s.tools["edit"], s.test_runs), (1, 1, 1))
        self.assertEqual(s.minutes, 30.0)

    def test_sqlite_storage(self):
        opencode_sqlite_fixture(self.home)
        (s,) = collect.parse_opencode(self.home / ".local" / "share" / "opencode")
        self.check(s, "oc9", "write docs", {"CHANGELOG.md": 1})
        self.assertEqual(s.minutes, 40.0)

    def test_sqlite_with_unexpected_schema_is_skipped(self):
        db = self.home / "opencode" / "opencode.db"
        db.parent.mkdir(parents=True)
        sqlite3.connect(db).close()                          # empty database
        self.assertEqual(collect.parse_opencode(db.parent), [])


class CopilotAdapter(Base):
    def test_known_events_and_timestamp_only_fallback(self):
        copilot_fixture(self.home)
        ss = {s.id: s for s in collect.parse_copilot(self.home / ".copilot" / "session-state")}
        k = ss["uuid-c1"]
        self.assertEqual((k.agent, k.project, k.prompts, k.first_prompt), ("copilot-cli", "cp", 1, "write docs"))
        self.assertEqual((k.tools["bash"], k.test_runs), (1, 1))
        u = ss["uuid-c2"]                                    # unknown schema still yields a dated session
        self.assertEqual((u.prompts, u.minutes), (0, 20.0))


class DevinAdapter(Base):
    root = property(lambda self: self.home.joinpath(*DEVIN))

    def test_session_folders(self):
        devin_dir_fixture(self.home)
        (s,) = collect.parse_devin(self.root)
        self.assertEqual((s.agent, s.id, s.project), ("devin", "dv1", "dv"))
        self.assertEqual((s.prompts, s.first_prompt), (2, "add login page"))
        self.assertEqual((s.tools["exec"], s.tools["edit"], s.test_runs), (1, 1, 1))   # rewritten node counted once
        self.assertEqual(dict(s.docs), {"README.md": 1})
        self.assertEqual(s.minutes, 45.0)

    def test_sqlite_sessions_db(self):
        devin_sqlite_fixture(self.home)
        (s,) = collect.parse_devin(self.root)
        self.assertEqual((s.agent, s.project, s.prompts, s.first_prompt), ("devin", "dv9", 1, "write a migration"))
        self.assertEqual((s.tools["edit"], dict(s.docs)), (1, {"CHANGELOG.md": 1}))      # duplicate branch counted once
        self.assertEqual(s.minutes, 20.0)

    def test_folder_wins_over_db_for_the_same_session(self):
        devin_dir_fixture(self.home); devin_sqlite_fixture(self.home, ids=("dv1", "dv9"))
        ss = collect.parse_devin(self.root)
        self.assertEqual(sorted(s.id for s in ss), ["dv1", "dv9"])
        self.assertEqual(next(s for s in ss if s.id == "dv1").first_prompt, "add login page")

    def test_unexpected_db_schema_and_missing_root(self):
        self.root.mkdir(parents=True)
        sqlite3.connect(self.root / "sessions.db").close()
        self.assertEqual(collect.parse_devin(self.root), [])
        self.assertEqual(collect.parse_devin(self.home / "nope"), [])

    def test_session_folder_without_meta_uses_log(self):
        devin_dir_fixture(self.home)
        (self.root / "sessions" / "dv1" / "meta.json").unlink()
        (s,) = collect.parse_devin(self.root)
        self.assertEqual((s.id, s.project, s.prompts), ("dv1", "(unknown)", 2))


class GrokAdapter(Base):
    root = property(lambda self: self.home.joinpath(*GROK))

    def test_updates_log(self):
        grok_updates_fixture(self.home)
        (s,) = collect.parse_grok(self.root)
        self.assertEqual((s.agent, s.id, s.project), ("grok", "0190a1b2-0000-7000-8000-000000000001", "demo-app"))
        self.assertEqual((s.prompts, s.first_prompt), (2, "add a cache"))         # chunks of one prompt count once
        self.assertEqual((s.tools["run_terminal_command"], s.tools["edit_file"], s.test_runs), (1, 1, 1))
        self.assertEqual(dict(s.docs), {"README.md": 1})
        self.assertEqual(s.minutes, 40.0)

    def test_chat_history_fallback(self):
        grok_chat_history_fixture(self.home)
        (s,) = collect.parse_grok(self.root)
        self.assertEqual((s.project, s.prompts, s.first_prompt), ("other-app", 1, "explain the parser"))
        self.assertEqual((s.tools["read_file"], dict(s.docs)), (1, {"AGENTS.md": 1}))
        self.assertEqual(s.minutes, 30.0)

    def test_subagent_sessions_are_skipped(self):
        grok_chat_history_fixture(self.home)
        d = self.root / "%2Fw%2Fother-app" / "0190a1b2-0000-7000-8000-000000000002"
        js(d / "summary.json", {"info": {"id": "x", "cwd": "/w/other-app"}, "session_kind": "subagent",
                                "created_at": "2026-11-18T14:00:00Z", "updated_at": "2026-11-18T14:30:00Z"})
        self.assertEqual(collect.parse_grok(self.root), [])

    def test_folder_without_summary_uses_the_folder_names(self):
        grok_updates_fixture(self.home)
        d = self.root / GROK_CWD / "0190a1b2-0000-7000-8000-000000000001"
        (d / "summary.json").unlink()
        (s,) = collect.parse_grok(self.root)
        self.assertEqual((s.id, s.project, s.prompts), ("0190a1b2-0000-7000-8000-000000000001", "demo-app", 2))

    def test_missing_root(self):
        self.assertEqual(collect.parse_grok(self.home / "nope"), [])


class GenericAdapter(Base):
    def test_role_content_jsonl(self):
        jl(self.home / "x" / "a.jsonl", [
            {"timestamp": "2026-11-01T10:00:00Z", "role": "user", "content": "hello"},
            {"timestamp": "2026-11-01T10:10:00Z", "type": "tool_use", "name": "bash", "input": {"command": "pytest"}},
        ])
        (s,) = collect.parse_generic(self.home / "x", agent="hermes")
        self.assertEqual((s.agent, s.prompts, s.tools["bash"], s.test_runs, s.minutes), ("hermes", 1, 1, 1, 10.0))


# ---------- discovery, summary, CLI ----------
class Discover(Base):
    def test_all_agents_found_and_filterable(self):
        for f in (claude_fixture, codex_fixture, pi_fixture, opencode_json_fixture, copilot_fixture, devin_dir_fixture, grok_updates_fixture):
            f(self.home)
        agents = {s.agent for s in collect.discover(self.home)}
        self.assertEqual(agents, {"claude-code", "codex", "pi", "opencode", "copilot-cli", "devin", "grok"})
        only = collect.discover(self.home, agents=["codex"])
        self.assertEqual({s.agent for s in only}, {"codex"})

    def test_unknown_agent_name_raises(self):
        with self.assertRaises(ValueError):
            collect.discover(self.home, agents=["nope"])


class Summarize(Base):
    def sessions(self):
        claude_fixture(self.home); codex_fixture(self.home); pi_fixture(self.home)
        return collect.discover(self.home)

    def test_window_filters_old_sessions(self):
        ss = self.sessions()
        everything = collect.summarize(ss, days=365, now=NOW, tz=UTC)
        recent = collect.summarize(ss, days=3, now=NOW, tz=UTC)     # cut-off 19 Nov: drops the 2 Nov and 18 Nov sessions
        self.assertEqual(everything["sessions"], 5)
        self.assertEqual(recent["sessions"], 3)
        self.assertEqual(recent["per_agent"], {"claude-code": 1, "codex": 2})

    def test_aggregates(self):
        a = collect.summarize(self.sessions(), days=365, now=NOW, tz=UTC)
        self.assertEqual(a["per_agent"], {"claude-code": 2, "codex": 2, "pi": 1})
        self.assertEqual(a["prompts"], 1 + 1 + 1 + 1 + 2)
        self.assertEqual(a["per_month"], {"2026-11": 5})
        self.assertEqual(a["active_days"], 3)                         # 2, 18, 20 Nov
        self.assertEqual(a["longest_gap_days"], 16)
        self.assertEqual(a["test_runs"], 1 + 1 + 2)
        self.assertEqual(a["doc_edits"], {"HANDOFF.md": 1, "SPEC.md": 1, "CLAUDE.md": 1})
        self.assertEqual(dict(a["commands"]), {"/plan": 1})
        self.assertEqual(a["per_weekday"]["Fri"], 3)                  # 20 Nov 2026 is a Friday

    def test_empty_returns_none(self):
        self.assertIsNone(collect.summarize([], days=30, now=NOW, tz=UTC))


class Cli(Base):
    def test_writes_json(self):
        claude_fixture(self.home); codex_fixture(self.home)
        out = self.home / "out.json"
        rc = collect.main(["--home", str(self.home), "--out", str(out), "--days", "3650"])
        self.assertEqual(rc, 0)
        data = json.loads(out.read_text())
        self.assertEqual(set(data), {"summary", "sessions"})
        self.assertEqual(data["summary"]["sessions"], 4)
        self.assertTrue(all({"agent", "project", "start", "minutes", "prompts", "first_prompt"} <= set(r) for r in data["sessions"]))

    def test_nothing_found_returns_1(self):
        self.assertEqual(collect.main(["--home", str(self.home), "--out", str(self.home / "o.json")]), 1)

    def test_agent_flag_and_extra_root(self):
        jl(self.home / "x" / "a.jsonl", [{"timestamp": "2026-11-01T10:00:00Z", "role": "user", "content": "hello"}])
        out = self.home / "o.json"
        rc = collect.main(["--home", str(self.home), "--out", str(out), "--days", "3650",
                           "--extra", "hermes=" + str(self.home / "x")])
        self.assertEqual(rc, 0)
        self.assertEqual(json.loads(out.read_text())["summary"]["per_agent"], {"hermes": 1})


    def test_extra_path_expands_tilde(self):
        import os
        jl(self.home / "x" / "a.jsonl", [{"timestamp": "2026-11-01T10:00:00Z", "role": "user", "content": "hello"}])
        out = self.home / "o.json"
        old = os.environ.get("HOME")
        os.environ["HOME"] = str(self.home)
        try:
            rc = collect.main(["--home", str(self.home), "--out", str(out), "--days", "3650", "--extra", "hermes=~/x"])
        finally:
            if old is None:
                del os.environ["HOME"]
            else:
                os.environ["HOME"] = old
        self.assertEqual(rc, 0)
        self.assertEqual(json.loads(out.read_text())["summary"]["per_agent"], {"hermes": 1})


class Hardening(Base):
    def test_unknown_agent_flag_returns_2(self):
        self.assertEqual(collect.main(["--home", str(self.home), "--agents", "nope", "--out", str(self.home / "o.json")]), 2)

    def test_first_prompt_is_truncated_and_single_line(self):
        jl(self.home / ".claude" / "projects" / "p" / "s.jsonl", [
            {"type": "user", "sessionId": "s", "timestamp": "2026-11-20T10:00:00Z", "cwd": "/w/p",
             "message": {"content": "line one\nline two " + "x" * 500}}])
        (s,) = collect.parse_claude(self.home / ".claude" / "projects")
        self.assertEqual(len(s.first_prompt), 160)
        self.assertNotIn("\n", s.first_prompt)

    def test_script_runs_as_a_program(self):
        import subprocess, sys as _sys
        claude_fixture(self.home)
        out = self.home / "o.json"
        r = subprocess.run([_sys.executable, collect.__file__, "--home", str(self.home), "--out", str(out), "--days", "3650"],
                           capture_output=True, text=True)
        self.assertEqual(r.returncode, 0, r.stderr)
        self.assertEqual(json.loads(out.read_text())["summary"]["per_agent"], {"claude-code": 2})

    def test_collector_never_writes_into_agent_folders(self):
        claude_fixture(self.home); codex_fixture(self.home)
        before = sorted(p.relative_to(self.home).as_posix() for p in self.home.rglob("*"))
        collect.discover(self.home)
        after = sorted(p.relative_to(self.home).as_posix() for p in self.home.rglob("*"))
        self.assertEqual(before, after)


if __name__ == "__main__":
    unittest.main()
