import chalk from "chalk";
/** Thin wrapper over console so command code reads intent, not ANSI codes. */
export const logger = {
    info: (msg) => console.log(msg),
    success: (msg) => console.log(chalk.green("✔ ") + msg),
    warn: (msg) => console.warn(chalk.yellow("⚠ ") + msg),
    error: (msg) => console.error(chalk.red("✖ ") + msg),
    dim: (msg) => console.log(chalk.dim(msg)),
};
