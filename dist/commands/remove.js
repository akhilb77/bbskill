import { logger } from "../utils/logger.js";
import { uninstallSkill } from "../services/installer.js";
export function removeCommand(name) {
    try {
        uninstallSkill(name);
        logger.success(`Removed ${name}`);
    }
    catch (err) {
        logger.error(err.message);
        process.exitCode = 1;
    }
}
