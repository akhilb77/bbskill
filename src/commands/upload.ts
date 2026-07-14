import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { spinner } from "../utils/spinner.js";
import { logger } from "../utils/logger.js";
import { copyDir, makeTempDir, removeDir } from "../utils/fs.js";
import { validateSkill } from "../services/validator.js";
import { storeRepo } from "../config.js";
import { skillsDir } from "../utils/paths.js";
import { getToken } from "../utils/auth.js";

/**
 * Publish a local skill folder to the skill store: validate it, clone the
 * store repo, copy the skill in as `<repo>/<name>/`, commit, and push.
 * Push auth rides on the user's existing git credentials (HTTPS).
 */
export async function uploadCommand(
  dir: string,
  opts: { force?: boolean }
): Promise<void> {
  
  let tmp: string | undefined;

  try {
    // A bare name that isn't a local folder falls back to the installed skill.
    let src = path.resolve(dir);
    if (!fs.existsSync(src) && fs.existsSync(path.join(skillsDir(), dir))) {
      src = path.join(skillsDir(), dir);
      logger.dim(`  (using installed skill at ${src})`);
    }
    const skill = validateSkill(src);
    const name = skill.manifest.name;
    // With a saved bbskill token, push over HTTPS with it directly so git
    // never prompts for a login. Without one, fall back to git's own auth.
    const token = getToken();
    const repoUrl = token
      ? `https://x-access-token:${token}@github.com/${storeRepo()}.git`
      : `https://github.com/${storeRepo()}.git`;

    spinner.start(`Cloning ${storeRepo()}…`);
    tmp = makeTempDir();
    const clone = path.join(tmp, "store");
    git(["clone", "--depth", "1", repoUrl, clone], tmp);

    const dest = path.join(clone, name);
    const existed = fs.existsSync(dest);
    if (existed) {
      if (!opts.force) {
        throw new Error(
          `"${name}" already exists in ${storeRepo()}. Use --force to overwrite.`
        );
      }
      removeDir(dest);
    }

    spinner.text = `Uploading ${name}…`;
    copyDir(skill.path, dest);
    git(["add", "-A"], clone);

    if (!git(["status", "--porcelain"], clone).trim()) {
      spinner.succeed(`${name} is already up to date in ${storeRepo()}`);
      return;
    }

    git(["commit", "-m", `${existed ? "Update" : "Add"} ${name}`], clone);
    git(["push"], clone);

    spinner.succeed(`Uploaded ${name} to ${storeRepo()}`);
    logger.dim(`  install with: bbskill install ${name}`);
  } catch (err) {
    spinner.fail("Upload failed");
    logger.error((err as Error).message);
    process.exitCode = 1;
  } finally {
    if (tmp) removeDir(tmp);
  }
}

function git(args: string[], cwd: string): string {
  return execFileSync("git", args, { cwd, encoding: "utf8", stdio: "pipe" });
}
