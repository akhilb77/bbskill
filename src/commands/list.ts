import fs from "node:fs";
import path from "node:path";
import chalk from "chalk";
import { spinner } from "../utils/spinner.js";
import { logger } from "../utils/logger.js";
import { skillsDir } from "../utils/paths.js";
import { listDirs, findSkillMd, readFrontmatter, removeDir } from "../utils/fs.js";
import { GitHubSource } from "../sources/github.js";
import { storeRepo } from "../config.js";

export async function listCommand(where?: string): Promise<void> {
  if (where === "org") return listOrg();
  if (where) {
    logger.error(`Unknown argument "${where}". Use "bbskill list" or "bbskill list org".`);
    process.exitCode = 1;
    return;
  }

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

/** List skills available in the org store repo, marking the ones already installed. */
async function listOrg(): Promise<void> {
  
  let root: string | undefined;
  try {
    spinner.start(`Fetching ${storeRepo()}…`);
    root = await new GitHubSource().fetch(storeRepo());

    // The zipball wraps content in a single `owner-repo-<sha>/` folder.
    const wrap = listDirs(root);
    const repoRoot = wrap.length === 1 ? path.join(root, wrap[0]) : root;

    const names = listDirs(repoRoot).filter((d) =>
      fs.existsSync(path.join(repoRoot, d, "SKILL.md"))
    );
    spinner.stop();

    if (names.length === 0) {
      logger.info(`The store (${storeRepo()}) has no skills yet.`);
      return;
    }

    const installed = new Set(listDirs(skillsDir()));
    logger.info(chalk.bold(`Skills in store ${storeRepo()} (${names.length}):`));
    for (const name of names) {
      const desc = readFrontmatter(path.join(repoRoot, name, "SKILL.md")).description ?? "";
      const mark = installed.has(name) ? chalk.green(" [installed]") : "";
      logger.info(`  ${chalk.cyan(name)}${mark}${desc ? chalk.dim(" — " + desc) : ""}`);
    }
    logger.dim(`  Install with: bbskill install <name>`);
  } catch (err) {
    spinner.fail("Could not fetch the store");
    logger.error((err as Error).message);
    process.exitCode = 1;
  } finally {
    if (root) removeDir(root);
  }
}
