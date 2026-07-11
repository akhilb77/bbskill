import fs from "node:fs";
import path from "node:path";
import type { SkillSource } from "./source.js";
import { GitHubSource } from "./github.js";
import { storeRepo } from "../config.js";
import { copyDir, listDirs, makeTempDir, removeDir } from "../utils/fs.js";

/**
 * The skill store: a single GitHub repo whose top-level folders are skills
 * (`<repo>/<skill-name>/SKILL.md`). Fetching by name downloads the store's
 * zipball and stages just the requested skill's folder.
 */
export class StoreSource implements SkillSource {
  readonly name = `store (${storeRepo()})`;

  async fetch(skillName: string): Promise<string> {
    const root = await new GitHubSource().fetch(storeRepo());
    try {
      // The zipball wraps content in a single `owner-repo-<sha>/` folder.
      const dirs = listDirs(root);
      const repoRoot = dirs.length === 1 ? path.join(root, dirs[0]) : root;

      const skillDir = path.join(repoRoot, skillName);
      if (!fs.existsSync(path.join(skillDir, "SKILL.md"))) {
        const available = listDirs(repoRoot).filter((d) =>
          fs.existsSync(path.join(repoRoot, d, "SKILL.md"))
        );
        throw new Error(
          `Skill "${skillName}" not found in ${storeRepo()}.` +
            (available.length
              ? ` Available: ${available.join(", ")}`
              : " The store has no skills yet.")
        );
      }

      // Stage only the requested skill so the validator can't pick up a
      // sibling skill's SKILL.md.
      const staged = makeTempDir();
      copyDir(skillDir, staged);
      return staged;
    } finally {
      removeDir(root);
    }
  }
}
