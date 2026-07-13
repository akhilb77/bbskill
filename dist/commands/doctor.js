import fs from "node:fs";
import { logger } from "../utils/logger.js";
import { skillsDir } from "../utils/paths.js";
import { listDirs } from "../utils/fs.js";
/** Environment sanity check: Node version and the skills directory. */
export function doctorCommand() {
    const major = Number(process.versions.node.split(".")[0]);
    check(major >= 18, `Node.js ${process.versions.node}`, "Node.js >= 18 required");
    const dir = skillsDir();
    if (fs.existsSync(dir)) {
        let writable = true;
        try {
            fs.accessSync(dir, fs.constants.W_OK);
        }
        catch {
            writable = false;
        }
        check(writable, `Skills directory writable (${dir})`, `Not writable: ${dir}`);
        logger.dim(`  ${listDirs(dir).length} skill(s) installed`);
    }
    else {
        logger.warn(`Skills directory does not exist yet: ${dir}`);
        logger.dim("  (it will be created on first install)");
    }
}
function check(ok, okMsg, failMsg) {
    if (ok) {
        logger.success(okMsg);
    }
    else {
        logger.error(failMsg);
        process.exitCode = 1;
    }
}
