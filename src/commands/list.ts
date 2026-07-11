import path from "node:path";
import chalk from "chalk";
import { logger } from "../utils/logger.js";
import { skillsDir } from "../utils/paths.js";
import { listDirs, findSkillMd, readFrontmatter } from "../utils/fs.js";

export function listCommand(): void {
  const dir = skillsDir();
  const names = listDirs(dir);

  if (names.length === 0) {
    logger.info("No skills installed.");
    logger.dim(`  (${dir})`);
    return;
  }

  logger.info(chalk.bold(`Installed skills (${names.length}):`));
  for (const name of names) {
    const skillMd = findSkillMd(path.join(dir, name));
    const desc = skillMd ? readFrontmatter(skillMd).description ?? "" : "";
    logger.info(`  ${chalk.cyan(name)}${desc ? chalk.dim(" — " + desc) : ""}`);
  }
}
