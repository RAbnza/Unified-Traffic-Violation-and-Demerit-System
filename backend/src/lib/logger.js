import util from "util";

const COLORS = {
  reset: "\x1b[0m",
  blue: "\x1b[34m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  green: "\x1b[32m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
};

function serialize(arg) {
  if (typeof arg === "string") return arg;
  return util.inspect(arg, { depth: 3, colors: false, compact: false });
}

function format(tag, color, args) {
  const body = args.map(serialize).join(" ");
  return `${color}[${tag}]${COLORS.reset} - ${body}`;
}

function write(method, tag, color, args) {
  // method: console.log or console.error
  method(format(tag, color, args));
}

export const logger = {
  log: (...args) => write(console.log, "LOG", COLORS.blue, args),
  info: (...args) => write(console.log, "INFO", COLORS.cyan, args),
  warn: (...args) => write(console.warn, "WARN", COLORS.yellow, args),
  error: (...args) => write(console.error, "ERROR", COLORS.red, args),
  success: (...args) => write(console.log, "SUCCESS", COLORS.green, args),
  debug: (...args) => write(console.log, "DEBUG", COLORS.magenta, args),
};

export default logger;
