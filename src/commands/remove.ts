import { logger } from "../utils/logger.js";
import { uninstallSkill } from "../services/installer.js";

export function removeCommand(name: string): void {
  try {
    uninstallSkill(name);
    logger.success(`Removed ${name}`);
  } catch (err) {
    logger.error((err as Error).message);
    process.exitCode = 1;
  }
}
