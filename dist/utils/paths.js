import os from "node:os";
import path from "node:path";
/**
 * The Claude skills directory: `~/.claude/skills`. `os.homedir()` resolves the
 * Windows user profile as well as the macOS/Linux home, so this is the one
 * place platform differences are handled.
 */
export function skillsDir() {
    return path.join(os.homedir(), ".claude", "skills");
}
export function installedSkillPath(name) {
    return path.join(skillsDir(), name);
}
