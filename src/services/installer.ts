import fs from "node:fs";
import { type SkillPackage } from "../types.js";
import { installedSkillPath, skillsDir } from "../utils/paths.js";
import { copyDir, removeDir } from "../utils/fs.js";

/**
 * Copy a validated skill into `~/.claude/skills/<name>`. Refuses to clobber an
 * existing install unless `force` is set, satisfying the PRD's "destination
 * must not contain conflicting files" check.
 */
export function installSkill(skill: SkillPackage, force = false): string {
  const dest = installedSkillPath(skill.manifest.name);

  if (fs.existsSync(dest)) {
    if (!force) {
      throw new Error(
        `"${skill.manifest.name}" is already installed. Use --force to overwrite.`
      );
    }
    removeDir(dest);
  }

  fs.mkdirSync(skillsDir(), { recursive: true });
  copyDir(skill.path, dest);
  return dest;
}

export function uninstallSkill(name: string): void {
  const dest = installedSkillPath(name);
  if (!fs.existsSync(dest)) {
    throw new Error(`"${name}" is not installed.`);
  }
  removeDir(dest);
}
