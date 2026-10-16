#!/usr/bin/env python3
"""Red-phase tests for the flight-status skill CLI.

Run: python3 -m unittest discover -s tests -v   (from the skill dir)
These tests fail until bin/flight-status is implemented (Green phase).
"""
import importlib.util
from importlib.machinery import SourceFileLoader
import json
import os
import shutil
import subprocess
import unittest
import sys
import unittest
from datetime import datetime
from unittest import mock

SKILL_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CLI_PATH = os.path.join(SKILL_DIR, "bin", "flight-status")


def load_cli():
    loader = SourceFileLoader("flight_status_cli", CLI_PATH)
    spec = importlib.util.spec_from_loader("flight_status_cli", loader)
    mod = importlib.util.module_from_spec(spec)
    loader.exec_module(mod)
    return mod


# --- Realistic fixtures (shape matches /opt/hatch/bin/flightaware output) ---

CANONICAL_JSON = {
    "body": {"idents": [{"ident": "SWR009", "ident_type": "designator"}]},
    "ok": True,
}

FLIGHT_JSON = {
    "body": {
        "flights": [
            {
                "ident": "SWR9",
                "ident_iata": "LX9",
                "flight_number": "9",
                "status": "En Route / Delayed",
                "cancelled": False,
                "diverted": False,
                "fa_flight_id": "SWR9-1791874242-airline-1700p",
                "progress_percent": 14,
                "origin": {"code_iata": "ORD", "city": "Chicago"},
                "destination": {"code_iata": "ZRH", "city": "Zurich"},
                "actual_landing_at": None,
                "estimated_landing_at": {
                    "user_local": "2026-10-16T05:04:52.000-04:00"
                },
                "estimated_gate_arrival_at": {
                    "user_local": "2026-10-16T05:14:52.000-04:00"
                },
                "scheduled_gate_arrival_at": {
                    "user_local": "2026-10-16T04:50:00.000-04:00"
                },
            }
        ]
    },
    "ok": True,
    "retrieved_at": {"user_local": "2026-10-15T23:35:58.000-04:00"},
}

POSITION_JSON = {
    "body": {
        "last_position": {
            "latitude": 46.91739,
            "longitude": -55.99555,
            "altitude": 360,
            "groundspeed": 532,
        }
    },
    "ok": True,
}


class ArgParsingTests(unittest.TestCase):
    def test_flight_is_required(self):
        cli = load_cli()
        with self.assertRaises(SystemExit):
            cli.parse_args([])

    def test_repeat_defaults_to_none(self):
        cli = load_cli()
        args = cli.parse_args(["--flight=LX009"])
        self.assertIsNone(args.repeat)

    def test_repeat_parses_minutes_and_hours(self):
        cli = load_cli()
        self.assertEqual(cli.parse_repeat("30mins"), 1800)
        self.assertEqual(cli.parse_repeat("30m"), 1800)
        self.assertEqual(cli.parse_repeat("1h"), 3600)
        self.assertEqual(cli.parse_repeat("90m"), 5400)

    def test_repeat_rejects_garbage(self):
        cli = load_cli()
        with self.assertRaises(ValueError):
            cli.parse_repeat("soonish")

    def test_start_datetime_defaults_to_now(self):
        cli = load_cli()
        args = cli.parse_args(["--flight=LX009"])
        parsed = datetime.strptime(args.start_datetime, "%Y-%m-%d %H:%M:%S")
        self.assertLess(abs((datetime.now() - parsed).total_seconds()), 10)

    def test_start_datetime_parses_explicit_value(self):
        cli = load_cli()
        args = cli.parse_args(
            ["--flight=LX009", "--start-datetime=2026-10-15 22:12:07"]
        )
        self.assertEqual(args.start_datetime, "2026-10-15 22:12:07")
        self.assertEqual(cli.departure_date(args), "2026-10-15")

    def test_start_datetime_rejects_bad_format(self):
        cli = load_cli()
        with self.assertRaises(ValueError):
            cli.parse_args(
                ["--flight=LX009", "--start-datetime=Oct 15 2026"]
            )

    def test_short_flag_f_for_flight(self):
        cli = load_cli()
        args = cli.parse_args(["-f", "LX009"])
        self.assertEqual(args.flight, "LX009")

    def test_short_flag_r_for_repeat(self):
        cli = load_cli()
        args = cli.parse_args(["-f", "LX009", "-r", "30mins"])
        self.assertEqual(args.repeat, "30mins")
        self.assertEqual(cli.parse_repeat(args.repeat), 1800)

    def test_short_flag_s_for_start_datetime(self):
        cli = load_cli()
        args = cli.parse_args(["-f", "LX009", "-s", "2026-10-15 22:12:07"])
        self.assertEqual(args.start_datetime, "2026-10-15 22:12:07")
        self.assertEqual(cli.departure_date(args), "2026-10-15")

    def test_short_flags_combined(self):
        cli = load_cli()
        args = cli.parse_args(
            ["-fLX009", "-r30m", "-s", "2026-10-15 22:12:07"]
        )
        self.assertEqual(args.flight, "LX009")
        self.assertEqual(args.repeat, "30m")
        self.assertEqual(args.start_datetime, "2026-10-15 22:12:07")

    def test_sample_flag_short_and_long(self):
        cli = load_cli()
        self.assertTrue(cli.parse_args(["-f", "LX009", "-m"]).sample)
        self.assertTrue(
            cli.parse_args(["--flight=LX009", "--sample"]).sample
        )
        self.assertFalse(cli.parse_args(["-f", "LX009"]).sample)

    def test_flight_marker_flag(self):
        cli = load_cli()
        self.assertEqual(
            cli.parse_args(["-f", "LX009", "-k", "knob"]).flight_marker,
            "knob",
        )
        self.assertEqual(
            cli.parse_args(
                ["--flight=LX009", "--flight-marker=paper-plane"]
            ).flight_marker,
            "paper-plane",
        )
        self.assertEqual(
            cli.parse_args(["-f", "LX009"]).flight_marker, "airliner"
        )
        with self.assertRaises(SystemExit):
            cli.parse_args(["-f", "LX009", "-k", "zeppelin"])

    def test_help_flag_shows_help_document(self):
        import io

        cli = load_cli()
        for flag in (["-h"], ["--help"]):
            buf = io.StringIO()
            with mock.patch("sys.stdout", buf):
                with self.assertRaises(SystemExit) as cm:
                    cli.parse_args(flag)
            self.assertEqual(cm.exception.code, 0)
            out = buf.getvalue()
            self.assertIn("flight-status", out)
            self.assertIn("--flight", out)
            self.assertIn("--repeat", out)
            self.assertIn("--start-datetime", out)
            self.assertIn("--sample", out)
            self.assertIn("--flight-marker", out)
            self.assertIn("--timezone", out)
            self.assertIn("examples:", out)
            self.assertIn("-f LX009", out)


class GeoMathTests(unittest.TestCase):
    def test_haversine_same_point_is_zero(self):
        cli = load_cli()
        self.assertAlmostEqual(
            cli.haversine_mi(41.9742, -87.9073, 41.9742, -87.9073), 0.0
        )

    def test_haversine_known_route(self):
        # JFK -> LHR great-circle is about 3,440 statute miles
        cli = load_cli()
        d = cli.haversine_mi(40.6413, -73.7781, 51.4700, -0.4543)
        self.assertTrue(3390 < d < 3490, f"got {d}")

    def test_journey_split_rounds(self):
        cli = load_cli()
        split = cli.journey_split(1599.0, 2940.0)
        self.assertEqual(split["pct"], 35)
        self.assertAlmostEqual(split["covered_mi"], 1599.0)
        self.assertAlmostEqual(split["remaining_mi"], 2940.0)

    def test_journey_split_landed_is_100(self):
        cli = load_cli()
        split = cli.journey_split(4436.0, 0.0)
        self.assertEqual(split["pct"], 100)


class EasternTimeTests(unittest.TestCase):
    def test_edt_label(self):
        cli = load_cli()
        self.assertEqual(
            cli.format_eastern("2026-10-15T23:35:58.000-04:00"),
            "11:35 PM EDT",
        )

    def test_est_label(self):
        cli = load_cli()
        self.assertEqual(
            cli.format_eastern("2026-01-15T23:35:58.000-05:00"),
            "11:35 PM EST",
        )


class FlightAwareParsingTests(unittest.TestCase):
    def test_parse_flight_facts(self):
        cli = load_cli()
        facts = cli.parse_flight_facts(FLIGHT_JSON)
        self.assertEqual(facts["ident_iata"], "LX9")
        self.assertEqual(facts["status"], "En Route / Delayed")
        self.assertFalse(facts["cancelled"])
        self.assertEqual(
            facts["fa_flight_id"], "SWR9-1791874242-airline-1700p"
        )
        self.assertEqual(facts["origin_iata"], "ORD")
        self.assertEqual(facts["destination_iata"], "ZRH")
        self.assertEqual(
            facts["estimated_landing_user_local"],
            "2026-10-16T05:04:52.000-04:00",
        )
        self.assertIsNone(facts["actual_landing_user_local"])

    def test_parse_position(self):
        cli = load_cli()
        pos = cli.parse_position(POSITION_JSON)
        self.assertAlmostEqual(pos["latitude"], 46.91739)
        self.assertAlmostEqual(pos["longitude"], -55.99555)
        self.assertEqual(pos["altitude_ft"], 36000)
        self.assertEqual(pos["groundspeed_kt"], 532)

    def test_parse_position_missing_returns_none(self):
        cli = load_cli()
        self.assertIsNone(cli.parse_position({"body": {"last_position": None}}))

    def test_canonical_ident(self):
        cli = load_cli()
        self.assertEqual(cli.parse_canonical_ident(CANONICAL_JSON), "SWR009")


class CardTests(unittest.TestCase):
    def test_card_html_contains_key_facts(self):
        cli = load_cli()
        html = cli.build_card_html(
            pct=35,
            covered_mi="1,599",
            remaining_mi="2,940",
            altitude="36,000 ft",
            speed="532 kt",
            report_time="11:35 PM EDT",
            map_png_bytes=b"\x89PNG\r\n\x1a\nfakepng",
            map_note="",
        )
        self.assertIn("35%", html)
        self.assertIn("1,599 mi covered", html)
        self.assertIn("2,940 mi to go", html)
        self.assertIn("11:35 PM EDT", html)
        self.assertIn("data:image/png;base64,", html)

    def test_card_html_omits_image_when_no_map(self):
        cli = load_cli()
        html = cli.build_card_html(
            pct=35,
            covered_mi="1,599",
            remaining_mi="2,940",
            altitude="36,000 ft",
            speed="532 kt",
            report_time="11:35 PM EDT",
            map_png_bytes=b"",
            map_note="Route map unavailable this run",
        )
        self.assertNotIn("data:image/png;base64,", html)
        self.assertIn("Route map unavailable this run", html)

    def test_card_html_shows_eta_with_old_bracket(self):
        cli = load_cli()
        html = cli.build_card_html(
            pct=43,
            covered_mi="1,953",
            remaining_mi="2,598",
            altitude="36,000 ft",
            speed="520 kt",
            report_time="12:14 AM EDT",
            map_png_bytes=b"\x89PNG\r\n\x1a\nfakepng",
            map_note="",
            eta_latest="5:05 AM EDT",
            eta_old="4:40 AM EDT",
        )
        self.assertIn("Expected arrival", html)
        self.assertIn("5:05 AM EDT", html)
        self.assertIn("[old: 4:40 AM EDT]", html)

    def test_card_html_omits_old_bracket_when_eta_unchanged(self):
        cli = load_cli()
        html = cli.build_card_html(
            pct=43,
            covered_mi="1,953",
            remaining_mi="2,598",
            altitude="36,000 ft",
            speed="520 kt",
            report_time="12:14 AM EDT",
            map_png_bytes=b"\x89PNG\r\n\x1a\nfakepng",
            map_note="",
            eta_latest="5:05 AM EDT",
            eta_old="5:05 AM EDT",
        )
        self.assertIn("5:05 AM EDT", html)
        self.assertNotIn("[old:", html)

    def test_card_html_shows_total_journey_time(self):
        cli = load_cli()
        html = cli.build_card_html(
            pct=43,
            covered_mi="1,953",
            remaining_mi="2,598",
            altitude="36,000 ft",
            speed="520 kt",
            report_time="12:14 AM EDT",
            map_png_bytes=b"\x89PNG\r\n\x1a\nfakepng",
            map_note="",
            journey_total="8h 4m",
        )
        self.assertIn("Total journey time 8h 4m", html)

    def test_card_html_has_expandable_map_and_source_link(self):
        cli = load_cli()
        html = cli.build_card_html(
            pct=43,
            covered_mi="1,953",
            remaining_mi="2,598",
            altitude="36,000 ft",
            speed="520 kt",
            report_time="12:14 AM EDT",
            map_png_bytes=b"\x89PNG\r\n\x1a\nfakepng",
            map_note="",
        )
        self.assertIn("zoom-in", html)  # tap-to-expand affordance
        self.assertIn("flightaware.com/live/flight/", html)

    def test_card_html_progress_bar_is_striped_milestone(self):
        cli = load_cli()
        html = cli.build_card_html(
            pct=43,
            covered_mi="1,953",
            remaining_mi="2,598",
            altitude="36,000 ft",
            speed="520 kt",
            report_time="12:14 AM EDT",
            map_png_bytes=b"\x89PNG\r\n\x1a\nfakepng",
            map_note="",
        )
        # striped remainder (#4)
        self.assertIn("repeating-linear-gradient", html)
        # milestone ticks + labels (#5)
        self.assertIn("25%", html)
        self.assertIn("50%", html)
        self.assertIn("75%", html)
        # default marker is the airliner
        self.assertIn("M21 16v-2l-8-5V3.5", html)
        self.assertIn("left:43%", html)

    def test_card_marker_knob(self):
        cli = load_cli()
        html = cli.build_card_html(
            pct=43,
            covered_mi="1,953",
            remaining_mi="2,598",
            altitude="36,000 ft",
            speed="520 kt",
            report_time="12:14 AM EDT",
            map_png_bytes=b"\x89PNG\r\n\x1a\nfakepng",
            map_note="",
            marker="knob",
        )
        self.assertIn("border-radius:50%", html)
        self.assertIn("left:43%", html)
        self.assertNotIn("M21 16v-2l-8-5V3.5", html)

    def test_card_marker_paper_plane(self):
        cli = load_cli()
        html = cli.build_card_html(
            pct=43,
            covered_mi="1,953",
            remaining_mi="2,598",
            altitude="36,000 ft",
            speed="520 kt",
            report_time="12:14 AM EDT",
            map_png_bytes=b"\x89PNG\r\n\x1a\nfakepng",
            map_note="",
            marker="paper-plane",
        )
        self.assertIn("M2 21l21-9L2 3v7l15 2-15 2v7z", html)
        self.assertNotIn("M21 16v-2l-8-5V3.5", html)

    def test_card_html_includes_map_note_when_given(self):
        cli = load_cli()
        html = cli.build_card_html(
            pct=35,
            covered_mi="1,599",
            remaining_mi="2,940",
            altitude="36,000 ft",
            speed="532 kt",
            report_time="11:35 PM EDT",
            map_png_bytes=b"\x89PNG\r\n\x1a\nfakepng",
            map_note="Route map rendered 10:18 PM EDT",
        )
        self.assertIn("Route map rendered 10:18 PM EDT", html)

    def test_card_header_parameterized(self):
        cli = load_cli()
        html = cli.build_card_html(
            pct=10,
            covered_mi="100",
            remaining_mi="900",
            altitude="35,000 ft",
            speed="500 kt",
            report_time="1:00 AM EDT",
            map_png_bytes=b"",
            map_note="",
            header="UA123 &middot; Sample report",
        )
        self.assertIn("UA123 &middot; Sample report", html)
        self.assertNotIn("Chicago", html)

    def test_card_header_defaults_to_lx009(self):
        cli = load_cli()
        html = cli.build_card_html(
            pct=35,
            covered_mi="1,599",
            remaining_mi="2,940",
            altitude="36,000 ft",
            speed="532 kt",
            report_time="11:35 PM EDT",
            map_png_bytes=b"\x89PNG\r\n\x1a\nfakepng",
            map_note="",
        )
        self.assertIn("LX009 &middot; Chicago &rarr; Zurich", html)

    def test_card_shows_status_pill_and_time_remaining(self):
        cli = load_cli()
        html = cli.build_card_html(
            pct=43,
            covered_mi="1,953",
            remaining_mi="2,598",
            altitude="36,000 ft",
            speed="520 kt",
            report_time="12:14 AM EDT",
            map_png_bytes=b"",
            map_note="",
            status_pill="En Route \u00b7 Delayed",
            status_tone="warn",
            time_remaining="\u22485h",
        )
        self.assertIn("En Route \u00b7 Delayed", html)
        self.assertIn("\u22485h", html)
        self.assertIn("to go", html)

    def test_card_meta_line_includes_position(self):
        cli = load_cli()
        html = cli.build_card_html(
            pct=43,
            covered_mi="1,953",
            remaining_mi="2,598",
            altitude="36,000 ft",
            speed="520 kt",
            report_time="12:14 AM EDT",
            map_png_bytes=b"",
            map_note="",
            position_label="47.5\u00b0N, 48.4\u00b0W",
        )
        self.assertIn("47.5\u00b0N, 48.4\u00b0W", html)
        self.assertIn("36,000 ft", html)

    def test_card_omits_corner_when_no_status_or_time(self):
        cli = load_cli()
        html = cli.build_card_html(
            pct=43,
            covered_mi="1,953",
            remaining_mi="2,598",
            altitude="36,000 ft",
            speed="520 kt",
            report_time="12:14 AM EDT",
            map_png_bytes=b"",
            map_note="",
        )
        self.assertNotIn("border-radius:999px", html)
        self.assertNotIn("\u2248", html)


class SampleTests(unittest.TestCase):
    def test_main_sample_mode_needs_no_network(self):
        import tempfile

        cli = load_cli()

        def boom(cmd):
            raise AssertionError("network call in sample mode: %r" % (cmd,))

        with tempfile.TemporaryDirectory() as out:
            with mock.patch.object(cli, "_run", side_effect=boom):
                rc = cli.main(["-f", "LX009", "-m", f"--out-dir={out}"])
            self.assertEqual(rc, 0)
            card = os.path.join(out, "lx009-card.html")
            self.assertTrue(os.path.exists(card))
            html = open(card).read()
            self.assertIn("43%", html)
            self.assertIn("Expected arrival", html)
            self.assertIn("Sample report", html)
            report = json.load(open(os.path.join(out, "report.json")))
            self.assertTrue(report["sample"])
            self.assertEqual(report["flight"], "LX009")

    def test_main_sample_mode_announcement_mentions_sample(self):
        import io
        import tempfile

        cli = load_cli()
        with tempfile.TemporaryDirectory() as out:
            buf = io.StringIO()
            with mock.patch.object(cli, "_run") as run_mock:
                with mock.patch("sys.stdout", buf):
                    cli.main(["--flight=LX009", "--sample",
                              f"--out-dir={out}"])
            run_mock.assert_not_called()
            self.assertIn("43%", buf.getvalue())
            self.assertIn("sample", buf.getvalue().lower())

    def test_sample_mode_passes_marker_flag(self):
        import tempfile

        cli = load_cli()
        with tempfile.TemporaryDirectory() as out:
            cli.main(["-f", "LX009", "-m", "-k", "knob",
                      f"--out-dir={out}"])
            html = open(os.path.join(out, "lx009-card.html")).read()
            self.assertIn("border-radius:50%", html)
            self.assertNotIn("M21 16v-2l-8-5V3.5", html)

    def test_sample_mode_converts_times_with_tz_flag(self):
        import tempfile

        cli = load_cli()

        with tempfile.TemporaryDirectory() as out:
            rc = cli.main(["-f", "LX009", "-m", "-t", "Europe/Zurich",
                           f"--out-dir={out}"])
            self.assertEqual(rc, 0)
            html = open(os.path.join(out, "lx009-card.html")).read()
            self.assertIn("6:14 AM CEST", html)
            self.assertIn("11:05 AM CEST", html)
            self.assertNotIn("EDT", html)
            report = json.load(open(os.path.join(out, "report.json")))
            self.assertEqual(report["display_timezone"], "Europe/Zurich")


class DurationTests(unittest.TestCase):
    def test_format_duration_hm(self):
        cli = load_cli()
        self.assertEqual(
            cli.format_duration_hm(
                "2026-10-15T21:01:20.000-04:00",
                "2026-10-16T05:04:52.000-04:00",
            ),
            "8h 4m",
        )


class TimezoneTests(unittest.TestCase):
    def test_tz_flag_parsing(self):
        cli = load_cli()
        self.assertEqual(
            cli.parse_args(["-f", "LX009", "-t", "Europe/Zurich"]).timezone,
            "Europe/Zurich",
        )
        self.assertEqual(
            cli.parse_args(["--flight=LX009", "--tz=start"]).timezone,
            "start",
        )
        self.assertEqual(
            cli.parse_args(["--flight=LX009", "--timezone=end"]).timezone,
            "end",
        )
        self.assertIsNone(cli.parse_args(["-f", "LX009"]).timezone)

    def test_resolve_timezone_iana(self):
        cli = load_cli()
        self.assertEqual(
            cli.resolve_timezone("Europe/Zurich", "ORD", "ZRH"),
            "Europe/Zurich",
        )

    def test_resolve_timezone_shorthands(self):
        cli = load_cli()
        self.assertEqual(
            cli.resolve_timezone("start", "ORD", "ZRH"), "America/Chicago"
        )
        self.assertEqual(
            cli.resolve_timezone("end", "ORD", "ZRH"), "Europe/Zurich"
        )
        self.assertEqual(
            cli.resolve_timezone("START", "ORD", "ZRH"), "America/Chicago"
        )

    def test_resolve_timezone_rejects_garbage(self):
        cli = load_cli()
        with self.assertRaises(ValueError):
            cli.resolve_timezone("Narnia/Nowhere", "ORD", "ZRH")

    def test_resolve_timezone_default_falls_back_to_origin(self):
        cli = load_cli()
        with mock.patch.object(cli, "_local_timezone_name", return_value=None):
            self.assertEqual(
                cli.resolve_timezone(None, "ORD", "ZRH"), "America/Chicago"
            )

    def test_format_in_tz(self):
        cli = load_cli()
        self.assertEqual(
            cli.format_in_tz("2026-10-16T05:05:00-04:00", "Europe/Zurich"),
            "11:05 AM CEST",
        )
        self.assertEqual(
            cli.format_in_tz(
                "2026-10-16T05:05:00-04:00", "America/Chicago"
            ),
            "4:05 AM CDT",
        )
        self.assertEqual(
            cli.format_in_tz(
                "2026-10-16T00:14:00-04:00",
                "America/Indiana/Indianapolis",
            ),
            "12:14 AM EDT",
        )


class StatusPillTests(unittest.TestCase):
    def test_delayed(self):
        cli = load_cli()
        self.assertEqual(
            cli.status_pill_info("En Route / Delayed", False, False, False),
            ("En Route \u00b7 Delayed", "warn"),
        )

    def test_landed(self):
        cli = load_cli()
        self.assertEqual(
            cli.status_pill_info("Landed", False, False, True),
            ("Landed", "ok"),
        )

    def test_on_time(self):
        cli = load_cli()
        self.assertEqual(
            cli.status_pill_info("En Route / On Time", False, False, False),
            ("En Route \u00b7 On Time", "ok"),
        )

    def test_cancelled(self):
        cli = load_cli()
        self.assertEqual(
            cli.status_pill_info("Cancelled", True, False, False),
            ("Cancelled", "bad"),
        )

    def test_scheduled_defaults_to_info(self):
        cli = load_cli()
        self.assertEqual(
            cli.status_pill_info("Scheduled", False, False, False),
            ("Scheduled", "info"),
        )


class TimeRemainingTests(unittest.TestCase):
    def test_hours(self):
        cli = load_cli()
        self.assertEqual(cli.format_time_remaining(2598, 520), "\u22485h")

    def test_minutes(self):
        cli = load_cli()
        self.assertEqual(cli.format_time_remaining(90, 500), "\u224811m")

    def test_zero_or_no_speed_omitted(self):
        cli = load_cli()
        self.assertEqual(cli.format_time_remaining(0, 520), "")
        self.assertEqual(cli.format_time_remaining(100, 0), "")


class PositionLabelTests(unittest.TestCase):
    def test_format(self):
        cli = load_cli()
        self.assertEqual(
            cli.format_position_label(47.53, -48.43), "47.5\u00b0N, 48.4\u00b0W"
        )
        self.assertEqual(
            cli.format_position_label(-33.9, 151.2), "33.9\u00b0S, 151.2\u00b0E"
        )


class AnnouncementTests(unittest.TestCase):
    def test_announcement_states_percentage_and_timestamp(self):
        cli = load_cli()
        text = cli.build_announcement(
            flight="LX009",
            origin_city="Chicago",
            dest_city="Zurich",
            pct=35,
            covered_mi="1,599",
            remaining_mi="2,940",
            est_landing="5:04 AM EDT",
            delay_note="roughly 25 minutes behind schedule",
            report_time="11:35 PM EDT",
        )
        self.assertIn("35%", text)
        self.assertIn("1,599", text)
        self.assertIn("reported at 11:35 PM EDT", text)
        self.assertIn("LX009", text)


class MapFallbackTests(unittest.TestCase):
    def test_empty_render_keeps_previous_map(self):
        cli = load_cli()
        with mock.patch.object(cli, "_run", return_value=b""):
            kept, note = cli.refresh_map(
                fa_flight_id="SWR9-1791874242-airline-1700p",
                tmp_path="/tmp/x-new.png",
                keep_path="/tmp/x-keep.png",
            )
        self.assertTrue(kept)  # previous map kept
        self.assertIn("earlier render", note)


class EndToEndTests(unittest.TestCase):
    def _fake_run(self, cmd):
        if cmd[0] == "canonical-flight":
            return json.dumps(CANONICAL_JSON).encode()
        if cmd[0] == "flight":
            return json.dumps(FLIGHT_JSON).encode()
        if cmd[0] == "position":
            return json.dumps(POSITION_JSON).encode()
        if cmd[0] == "map":
            return b""  # map renderer glitch -> fallback path
        raise AssertionError(f"unexpected command {cmd}")

    def test_main_text_only_when_position_missing(self):
        import tempfile

        cli = load_cli()
        no_pos = {"body": {"last_position": None}, "ok": True}

        def fake_no_pos(cmd):
            if cmd[0] == "position":
                return json.dumps(no_pos).encode()
            return self._fake_run(cmd)

        with tempfile.TemporaryDirectory() as out:
            with mock.patch.object(cli, "_run", side_effect=fake_no_pos):
                rc = cli.main(["--flight=LX009", f"--out-dir={out}"])
            self.assertEqual(rc, 0)
            with open(os.path.join(out, "report.json")) as f:
                report = json.load(f)
            self.assertIsNone(report["position"])
            self.assertFalse(
                os.path.exists(os.path.join(out, "lx009-card.html"))
            )

    def test_main_produces_report_with_mocked_flightaware(self):
        import tempfile

        cli = load_cli()
        with tempfile.TemporaryDirectory() as out:
            keep = os.path.join(out, "lx009-map.png")
            with open(keep, "wb") as f:
                f.write(b"\x89PNG\r\n\x1a\noldmap")
            with mock.patch.object(cli, "_run", side_effect=self._fake_run):
                rc = cli.main(
                    [
                        "--flight=LX009",
                        f"--out-dir={out}",
                        "--map-keep-name=lx009-map.png",
                    ]
                )
            self.assertEqual(rc, 0)
            report_path = os.path.join(out, "report.json")
            self.assertTrue(os.path.exists(report_path))
            with open(report_path) as f:
                report = json.load(f)
            self.assertEqual(report["flight"], "LX009")
            self.assertEqual(report["journey"]["pct"], 35)
            self.assertEqual(report["report_time_display"], "11:35 PM EDT")
            card_path = os.path.join(out, "lx009-card.html")
            self.assertTrue(os.path.exists(card_path))
            with open(card_path) as f:
                self.assertIn("35%", f.read())


class PinchZoomTests(unittest.TestCase):
    def test_expanded_map_supports_pinch_zoom(self):
        cli = load_cli()
        html = cli.build_card_html(
            pct=43,
            covered_mi="1,953",
            remaining_mi="2,598",
            altitude="36,000 ft",
            speed="520 kt",
            report_time="12:14 AM EDT",
            map_png_bytes=b"\x89PNG\r\n\x1a\nfakepng",
            map_note="",
        )
        compact = html.replace(" ", "")
        self.assertIn("touchstart", html)
        self.assertIn("touchmove", html)
        self.assertIn("touch-action:none", compact)
        # the script targets the expanded image by id
        self.assertIn("routemapfullimg", html)


class PngCodecTests(unittest.TestCase):
    def test_encode_decode_roundtrip(self):
        cli = load_cli()
        w, h = 10, 8
        pixels = bytearray(w * h * 3)
        for y in range(h):
            for x in range(w):
                i = (y * w + x) * 3
                pixels[i] = (x * 25) % 256
                pixels[i + 1] = (y * 30) % 256
                pixels[i + 2] = (x + y) % 256
        png = cli._encode_png_rgb(w, h, pixels)
        self.assertTrue(png.startswith(b"\x89PNG"))
        w2, h2, px2 = cli._decode_png_rgb(png)
        self.assertEqual((w2, h2), (w, h))
        self.assertEqual(bytes(px2), bytes(pixels))

    def test_decode_rejects_non_png(self):
        cli = load_cli()
        with self.assertRaises(ValueError):
            cli._decode_png_rgb(b"not a png")


class DotDetectionTests(unittest.TestCase):
    def _synthetic_map(self):
        cli = load_cli()
        w, h = 120, 60
        pixels = bytearray(w * h * 3)
        for y in range(h):
            for x in range(w):
                i = (y * w + x) * 3
                pixels[i], pixels[i + 1], pixels[i + 2] = 0, 51, 102
        for cx, cy in [(20, 30), (100, 30)]:
            for y in range(cy - 3, cy + 4):
                for x in range(cx - 3, cx + 4):
                    if (x - cx) ** 2 + (y - cy) ** 2 <= 9 and 0 <= x < w \
                            and 0 <= y < h:
                        i = (y * w + x) * 3
                        pixels[i], pixels[i + 1], pixels[i + 2] = 255, 255, 0
        # yellow noise that must not be mistaken for dots
        for x, y in [(50, 10), (51, 10), (70, 50)]:
            i = (y * w + x) * 3
            pixels[i], pixels[i + 1], pixels[i + 2] = 255, 255, 0
        return cli._encode_png_rgb(w, h, pixels)

    def test_find_two_yellow_dots(self):
        cli = load_cli()
        dots = cli._find_airport_dots(self._synthetic_map())
        self.assertEqual(len(dots), 2)
        dots.sort()
        self.assertAlmostEqual(dots[0][0], 20, delta=1.5)
        self.assertAlmostEqual(dots[0][1], 30, delta=1.5)
        self.assertAlmostEqual(dots[1][0], 100, delta=1.5)
        self.assertAlmostEqual(dots[1][1], 30, delta=1.5)

    def test_no_dots_returns_empty(self):
        cli = load_cli()
        w, h = 20, 20
        pixels = bytearray(w * h * 3)  # all black, no yellow
        dots = cli._find_airport_dots(cli._encode_png_rgb(w, h, pixels))
        self.assertEqual(dots, [])


class ProjectionTests(unittest.TestCase):
    def test_project_known_point(self):
        cli = load_cli()
        proj = cli._make_projection(
            (40.0, 60.0), (160.0, 40.0),  # pixel dots
            (40.0, -90.0), (50.0, 90.0),  # latlon
        )
        x, y = proj(45.0, 0.0)
        self.assertAlmostEqual(x, 100.0, places=1)
        # y is linear in mercator space; check it's between the dots
        self.assertTrue(40.0 < y < 60.0)

    def test_mercator_known_values(self):
        cli = load_cli()
        self.assertAlmostEqual(cli._merc_x(-180.0), 0.0)
        self.assertAlmostEqual(cli._merc_x(180.0), 1.0)
        self.assertAlmostEqual(cli._merc_x(0.0), 0.5)
        self.assertAlmostEqual(cli._merc_y(0.0), 0.5)
        self.assertAlmostEqual(cli._merc_y(45.0), 0.3597, places=3)


class TrackOverlayTests(unittest.TestCase):
    def _synthetic_map_with_dots(self):
        cli = load_cli()
        w, h = 200, 100
        pixels = bytearray(w * h * 3)
        for y in range(h):
            for x in range(w):
                i = (y * w + x) * 3
                pixels[i], pixels[i + 1], pixels[i + 2] = 0, 51, 102
        # dot A (40, 60) <-> (40N, 90W); dot B (160, 40) <-> (50N, 90E)
        for cx, cy in [(40, 60), (160, 40)]:
            for y in range(cy - 3, cy + 4):
                for x in range(cx - 3, cx + 4):
                    if (x - cx) ** 2 + (y - cy) ** 2 <= 9:
                        i = (y * w + x) * 3
                        pixels[i], pixels[i + 1], pixels[i + 2] = 255, 255, 0
        return cli._encode_png_rgb(w, h, pixels), w, h

    def test_overlay_draws_solid_line_on_track(self):
        cli = load_cli()
        png, w, h = self._synthetic_map_with_dots()
        fixes = [(40.0, -90.0), (45.0, 0.0), (50.0, 90.0)]
        out = cli.overlay_flown_track(
            png, fixes, (40.0, -90.0), (50.0, 90.0))
        w2, h2, px2 = cli._decode_png_rgb(out)
        self.assertEqual((w2, h2), (w, h))

        def is_green(x, y):
            i = (int(y) * w + int(x)) * 3
            r, g, b = px2[i], px2[i + 1], px2[i + 2]
            return g > 150 and r < 120 and b < 120

        proj = cli._make_projection(
            (40.0, 60.0), (160.0, 40.0), (40.0, -90.0), (50.0, 90.0))
        mx, my = proj(45.0, 0.0)
        # the track midpoint pixel (and its neighborhood) is solid green
        self.assertTrue(
            any(is_green(mx + dx, my + dy)
                for dx in range(-2, 3) for dy in range(-2, 3)))
        # far from the track stays background
        self.assertFalse(is_green(100, 10))

    def test_overlay_empty_track_returns_original(self):
        cli = load_cli()
        png, _, _ = self._synthetic_map_with_dots()
        self.assertEqual(
            cli.overlay_flown_track(png, [], (40.0, -90.0), (50.0, 90.0)),
            png)

    def test_overlay_assigns_dots_regardless_of_size_order(self):
        # The dest dot is drawn larger, so _find_airport_dots returns it
        # first; the overlay must still map origin->west dot, dest->east dot.
        cli = load_cli()
        w, h = 200, 100
        pixels = bytearray(w * h * 3)
        for y in range(h):
            for x in range(w):
                i = (y * w + x) * 3
                pixels[i], pixels[i + 1], pixels[i + 2] = 0, 51, 102
        for cx, cy, r in [(40, 60, 3), (160, 40, 5)]:
            for y in range(cy - r, cy + r + 1):
                for x in range(cx - r, cx + r + 1):
                    if (x - cx) ** 2 + (y - cy) ** 2 <= r * r:
                        i = (y * w + x) * 3
                        pixels[i], pixels[i + 1], pixels[i + 2] = 255, 255, 0
        png = cli._encode_png_rgb(w, h, pixels)
        dots = cli._find_airport_dots(png)
        self.assertEqual(len(dots), 2)
        # dest dot (larger) comes first
        self.assertGreater(dots[0][0], dots[1][0])

        fixes = [(40.0, -90.0), (45.0, 0.0), (50.0, 90.0)]
        out = cli.overlay_flown_track(
            png, fixes, (40.0, -90.0), (50.0, 90.0))
        _, _, px2 = cli._decode_png_rgb(out)

        def is_green(x, y):
            i = (int(y) * w + int(x)) * 3
            r, g, b = px2[i], px2[i + 1], px2[i + 2]
            return g > 150 and r < 120 and b < 120

        proj = cli._make_projection(
            (40.0, 60.0), (160.0, 40.0), (40.0, -90.0), (50.0, 90.0))
        mx, my = proj(45.0, 0.0)
        self.assertTrue(
            any(is_green(mx + dx, my + dy)
                for dx in range(-2, 3) for dy in range(-2, 3)))

    def test_overlay_without_dots_returns_original(self):
        cli = load_cli()
        w, h = 20, 20
        png = cli._encode_png_rgb(w, h, bytearray(w * h * 3))
        self.assertEqual(
            cli.overlay_flown_track(
                png, [(0.0, 0.0)], (0.0, 0.0), (1.0, 1.0)),
            png)

    def test_truncate_track_at_current_position(self):
        cli = load_cli()
        fixes = [(0.0, 0.0), (1.0, 1.0), (2.0, 2.0), (3.0, 3.0)]
        self.assertEqual(
            cli._truncate_track(fixes, 1.1, 1.1),
            [(0.0, 0.0), (1.0, 1.0)])
        self.assertEqual(cli._truncate_track([], 0.0, 0.0), [])




class RenderScreenshotsTests(unittest.TestCase):
    SKILL_DIR = os.path.join(os.path.dirname(__file__), "..")
    SCRIPT = os.path.join(SKILL_DIR, "bin", "render-screenshots")
    SHOT_DIR = os.path.join(SKILL_DIR, "assets", "screenshots")

    def _load_script(self):
        import importlib.util
        from importlib.machinery import SourceFileLoader
        loader = SourceFileLoader("render_shots", self.SCRIPT)
        spec = importlib.util.spec_from_loader("render_shots", loader)
        mod = importlib.util.module_from_spec(spec)
        loader.exec_module(mod)
        return mod

    def test_render_script_exists_and_executable(self):
        self.assertTrue(os.path.isfile(self.SCRIPT))
        self.assertTrue(os.access(self.SCRIPT, os.X_OK))

    def test_render_script_help(self):
        r = subprocess.run(
            [self.SCRIPT, "--help"], capture_output=True, text=True)
        self.assertEqual(r.returncode, 0)
        self.assertIn("screenshot", r.stdout.lower())

    def test_sample_card_generation_deterministic(self):
        # bin/flight-status -m twice -> byte-identical HTML (the
        # reproducibility foundation for auto-generated screenshots).
        import tempfile
        cli = os.path.join(self.SKILL_DIR, "bin", "flight-status")
        outs = []
        for _ in range(2):
            with tempfile.TemporaryDirectory() as tmp:
                # pinned map so the card embeds it deterministically
                shutil.copy(
                    os.path.join(self.SKILL_DIR, "assets", "sample-map.png"),
                    os.path.join(tmp, "lx009-map.png"))
                r = subprocess.run(
                    [cli, "-f", "LX009", "-m", "--out-dir", tmp],
                    capture_output=True, text=True)
                self.assertEqual(r.returncode, 0)
                with open(os.path.join(tmp, "lx009-card.html"), "rb") as f:
                    outs.append(f.read())
        self.assertEqual(outs[0], outs[1])

    def test_render_card_png_deterministic(self):
        mod = self._load_script()
        png1 = mod.render_card_png(mod.sample_data(), mod.sample_map_bytes(),
                                   480)
        png2 = mod.render_card_png(mod.sample_data(), mod.sample_map_bytes(),
                                   480)
        self.assertEqual(png1, png2)
        self.assertTrue(png1.startswith(b"\x89PNG"))

    def test_screenshots_exist_with_expected_widths(self):
        from PIL import Image
        import io
        for name, width in (("card.png", 480), ("card-wide.png", 900)):
            p = os.path.join(self.SHOT_DIR, name)
            self.assertTrue(os.path.isfile(p), f"missing {name}")
            im = Image.open(p)
            self.assertEqual(im.size[0], width)

    def test_readme_embeds_screenshots(self):
        with open(os.path.join(self.SKILL_DIR, "README.md")) as f:
            readme = f.read()
        self.assertIn("assets/screenshots/card.png", readme)
        self.assertIn("assets/screenshots/card-wide.png", readme)


if __name__ == "__main__":
    unittest.main()


class FlightSelectionTests(unittest.TestCase):
    def _load_cli(self):
        import importlib.util
        from importlib.machinery import SourceFileLoader
        loader = SourceFileLoader(
            "cli_sel",
            os.path.join(os.path.dirname(__file__), "..", "bin",
                         "flight-status"))
        spec = importlib.util.spec_from_loader("cli_sel", loader)
        mod = importlib.util.module_from_spec(spec)
        loader.exec_module(mod)
        return mod

    def test_prefers_en_route_over_scheduled(self):
        cli = self._load_cli()
        data = {"body": {"flights": [
            {"status": "Scheduled", "fa_flight_id": "sched-1",
             "actual_takeoff_at": None},
            {"status": "En Route / On Time", "fa_flight_id": "enroute-1",
             "actual_takeoff_at": {"user_local": "2026-10-16T07:01:01-04:00"}},
        ]}}
        facts = cli.parse_flight_facts(data)
        self.assertEqual(facts["fa_flight_id"], "enroute-1")
        self.assertEqual(facts["status"], "En Route / On Time")

    def test_single_flight_unchanged(self):
        cli = self._load_cli()
        data = {"body": {"flights": [
            {"status": "Scheduled", "fa_flight_id": "only-1"},
        ]}}
        facts = cli.parse_flight_facts(data)
        self.assertEqual(facts["fa_flight_id"], "only-1")


if __name__ == "__main__":
    unittest.main()
