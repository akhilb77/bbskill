import axios from "axios";
import { logger } from "../utils/logger.js";
import { promptToken, getToken } from "../utils/auth.js";

/** Prompt for a GitHub token, save it, and verify it against the API. */
export async function loginCommand(): Promise<void> {
  try {
    await promptToken(getToken() ? "Replacing your saved GitHub token." : "Log in to GitHub.");
    const res = await axios.get("https://api.github.com/user", {
      headers: { "User-Agent": "bbskill-cli", Authorization: `Bearer ${getToken()}` },
    });
    logger.success(`Logged in as ${res.data.login}`);
  } catch (err) {
    logger.error((err as Error).message);
    process.exitCode = 1;
  }
}
