import path from "node:path";
import type { SkillSource } from "./source.js";
import { copyDir, makeTempDir } from "../utils/fs.js";

/**
 * "Fetches" a skill from a folder already on disk by staging a copy in a temp
 * dir. Copying (rather than pointing at the original) keeps the install
 * pipeline uniform: the command always owns and cleans up the staged path,
 * and the user's original folder is never touched.
 */
export class LocalSource implements SkillSource {
  readonly name = "local folder";

  async fetch(dir: string): Promise<string> {
    const staged = makeTempDir();
    copyDir(path.resolve(dir), staged);
    return staged;
  }
}
