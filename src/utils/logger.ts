import chalk from "chalk";

/** Thin wrapper over console so command code reads intent, not ANSI codes. */
export const logger = {
  info: (msg: string) => console.log(msg),
  success: (msg: string) => console.log(chalk.green("✔ ") + msg),
  warn: (msg: string) => console.warn(chalk.yellow("⚠ ") + msg),
  error: (msg: string) => console.error(chalk.red("✖ ") + msg),
  dim: (msg: string) => console.log(chalk.dim(msg)),
};
