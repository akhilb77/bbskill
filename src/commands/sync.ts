import fs from "node:fs";
import path from "node:path";
import ora from "ora";
import { logger } from "../utils/logger.js";
import { GitHubSource } from "../sources/github.js";
import { storeRepo } from "../config.js";
import { validateSkill } from "../services/validator.js";
import { installSkill } from "../services/installer.js";
import { skillsDir } from "../utils/paths.js";
import { listDirs, removeDir } from "../utils/fs.js";

/**
 * Bring local skills in line with the store. Downloads the store once, then:
 *   - default: re-installs (updates) store skills that are already installed
 *   - --all:   also installs store skills you don't have yet
 * Skills installed from other sources (not in the store) are left untouched.
 */
export async function syncCommand(opts: { all?: boolean }): Promise<void> {
  const spinner = ora();
  let root: string | undefined;

  try {
    spinner.start(`Fetching ${storeRepo()}…`);
    root = await new GitHubSource().fetch(storeRepo());

    // The zipball wraps content in a single `owner-repo-<sha>/` folder.
    const wrap = listDirs(root);
    const repoRoot = wrap.length === 1 ? path.join(root, wrap[0]) : root;

    const storeSkills = listDirs(repoRoot).filter((d) =>
      fs.existsSync(path.join(repoRoot, d, "SKILL.md"))
    );
    const installed = new Set(listDirs(skillsDir()));
    const targets = opts.all
      ? storeSkills
      : storeSkills.filter((s) => installed.has(s));
    spinner.stop();

    if (storeSkills.length === 0) {
      logger.info(`The store (${storeRepo()}) has no skills yet.`);
      return;
    }
    if (targets.length === 0) {
      logger.info("None of your installed skills come from the store — nothing to update.");
      logger.dim(`  Store has: ${storeSkills.join(", ")}. Run sync --all to install them.`);
      return;
    }

    for (const name of targets) {
      try {
        const skill = validateSkill(path.join(repoRoot, name));
        installSkill(skill, true);
        logger.success(`${installed.has(name) ? "Updated" : "Installed"} ${name}`);
      } catch (err) {
        logger.error(`${name}: ${(err as Error).message}`);
        process.exitCode = 1;
      }
    }

    const skipped = storeSkills.filter((s) => !targets.includes(s));
    if (skipped.length) {
      logger.dim(`  In store but not installed: ${skipped.join(", ")} (use --all)`);
    }
  } catch (err) {
    spinner.fail("Sync failed");
    logger.error((err as Error).message);
    process.exitCode = 1;
  } finally {
    if (root) removeDir(root);
  }
}
