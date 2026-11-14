// Colored output for the aiskills CLI, with no dependencies.
//
// Color is on when the output stream is a terminal, and can be forced either way:
//   --no-color / --color (setColorFlag)  >  NO_COLOR  >  FORCE_COLOR
//   >  `aiskills config color` always|never (setColorConfig)  >  a terminal (not TERM=dumb)
// stdout and stderr are decided separately, so `aiskills info | less` is plain while
// errors on the terminal stay red. JSON output never goes through these painters.

const CODES = { bold: [1, 22], dim: [2, 22], red: [31, 39], green: [32, 39], yellow: [33, 39], cyan: [36, 39] };
const set = (v) => v !== undefined && v !== "";

/**
 * Whether to color: flag (true/false from --color/--no-color, or null), the environment,
 * config ("auto", "always" or "never" from `aiskills config color`), and whether the stream is a terminal.
 */
export function colorChoice({ flag = null, env = process.env, config = "auto", isTTY = false } = {}) {
  if (flag === true || flag === false) return flag;
  if (set(env.NO_COLOR)) return false;
  if (set(env.FORCE_COLOR)) return !["0", "false"].includes(String(env.FORCE_COLOR).toLowerCase());
  if (config === "always") return true;
  if (config === "never") return false;
  return Boolean(isTTY) && env.TERM !== "dumb";
}

let flag = null;
let configured = "auto";
const decided = new Map();

/** `aiskills config color`: "auto", "always" or "never". */
export function setColorConfig(value) {
  configured = value ?? "auto";
  decided.clear();
}

/** --color (true), --no-color (false), or back to automatic (null). */
export function setColorFlag(value) {
  flag = value;
  decided.clear();
}

function enabled(stream) {
  if (!decided.has(stream)) decided.set(stream, colorChoice({ flag, config: configured, isTTY: stream.isTTY }));
  return decided.get(stream);
}

const painter = (stream) =>
  Object.fromEntries(Object.entries(CODES).map(([name, [open, close]]) => [name, (s) => (enabled(stream()) ? `\x1b[${open}m${s}\x1b[${close}m` : String(s))]));

/** paint.out.<color>(text) for stdout, paint.err.<color>(text) for stderr. */
export const paint = { out: painter(() => process.stdout), err: painter(() => process.stderr) };

export const PREFIX = "[aiskills]";
/** A message on stdout. */
export const log = (...a) => console.log(paint.out.dim(PREFIX), ...a);
/** A message that something worked (green). */
export const ok = (...a) => console.log(paint.out.dim(PREFIX), paint.out.green(a.join(" ")));
/** A warning on stderr (yellow). */
export const warn = (...a) => console.warn(paint.err.dim(PREFIX), paint.err.yellow(a.join(" ")));
/** An error on stderr: its first line red, any hint lines below it plain. */
export function fail(message) {
  const [first, ...rest] = String(message).split("\n");
  console.error(paint.err.dim(PREFIX), [paint.err.red(first), ...rest].join("\n"));
}
