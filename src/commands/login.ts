import axios from "axios";
import { logger } from "../utils/logger.js";
import { promptToken, getToken } from "../utils/auth.js";

/**
 * If a working token is already saved, just report who you are. Otherwise
 * (no token, or a rejected one) prompt, save, and verify.
 */
export async function loginCommand(opts: { force?: boolean }): Promise<void> {
  try {
    if (!opts.force && getToken()) {
      const user = await whoami();
      if (user) {
        logger.success(`Already logged in as ${user}`);
        logger.dim("  (use bbskill login --force to switch tokens)");
        return;
      }
      logger.warn("Your saved token no longer works.");
    }

    await promptToken(opts.force ? "Replacing your saved GitHub token." : "Log in to GitHub.");
    const user = await whoami();
    if (!user) throw new Error("GitHub rejected that token.");
    logger.success(`Logged in as ${user}`);
  } catch (err) {
    logger.error((err as Error).message);
    process.exitCode = 1;
  }
}

async function whoami(): Promise<string | null> {
  try {
    const res = await axios.get("https://api.github.com/user", {
      headers: { "User-Agent": "bbskill-cli", Authorization: `Bearer ${getToken()}` },
    });
    return res.data.login;
  } catch {
    return null;
  }
}
