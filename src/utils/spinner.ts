import ora from "ora";

/** One shared spinner so auth prompts can pause it mid-command. */
export const spinner = ora();
