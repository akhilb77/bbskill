import ora from "ora";
import { logger } from "../utils/logger.js";
import { removeDir } from "../utils/fs.js";
import { resolveSource } from "../sources/resolve.js";
import { validateSkill } from "../services/validator.js";
import { installSkill } from "../services/installer.js";

export async function installCommand(
  ref: string,
  opts: { force?: boolean }
): Promise<void> {
  const spinner = ora();
  let staged: string | undefined;

  try {
    const source = resolveSource(ref);
    spinner.start(`Downloading from ${source.name}…`);
    staged = await source.fetch(ref);

    spinner.text = "Validating skill…";
    const skill = validateSkill(staged);

    spinner.text = `Installing ${skill.manifest.name}…`;
    const dest = installSkill(skill, opts.force);

    spinner.succeed(`Installed ${skill.manifest.name}`);
    logger.dim(`  ${dest}`);
  } catch (err) {
    spinner.fail("Install failed");
    logger.error((err as Error).message);
    process.exitCode = 1;
  } finally {
    // `staged` is the temp root returned by fetch(); best-effort cleanup.
    if (staged) removeDir(staged);
  }
}
