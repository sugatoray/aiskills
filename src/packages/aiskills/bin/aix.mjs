#!/usr/bin/env node
// Entry point for the `aix` command: the same CLI as `aiskills`, always in
// --route mode (skills that aren't bundled are handed to `npx skills`).
// The flag is set before the CLI module loads, so a dynamic import is needed.
process.env.AISKILLS_ROUTE = "1";
await import("../src/scripts/cli.mjs");
