import fs from "node:fs";
import chalk from "chalk";
import { logger } from "../utils/logger.js";
import { installedSkillPath } from "../utils/paths.js";
import { findSkillMd, readFrontmatter } from "../utils/fs.js";
export function infoCommand(name) {
    const dir = installedSkillPath(name);
    if (!fs.existsSync(dir)) {
        logger.error(`"${name}" is not installed.`);
        process.exitCode = 1;
        return;
    }
    const skillMd = findSkillMd(dir);
    const fm = skillMd ? readFrontmatter(skillMd) : {};
    logger.info(chalk.bold(name));
    logger.info(`  ${chalk.dim("path:")}        ${dir}`);
    for (const [key, value] of Object.entries(fm)) {
        logger.info(`  ${chalk.dim(key + ":").padEnd(24)}${value}`);
    }
}
