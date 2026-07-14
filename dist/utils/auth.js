import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import readline from "node:readline/promises";
import { spinner } from "./spinner.js";
import { logger } from "./logger.js";
const configPath = path.join(os.homedir(), ".bbskill", "config.json");
/** Saved token, with the GITHUB_TOKEN env var as an override. */
export function getToken() {
    if (process.env.GITHUB_TOKEN)
        return process.env.GITHUB_TOKEN;
    try {
        return JSON.parse(fs.readFileSync(configPath, "utf8")).token;
    }
    catch {
        return undefined;
    }
}
export function saveToken(token) {
    fs.mkdirSync(path.dirname(configPath), { recursive: true });
    fs.writeFileSync(configPath, JSON.stringify({ token }, null, 2));
    logger.dim(`  (token saved to ${configPath})`);
}
/**
 * Ask the user for a token in the terminal and save it for next time.
 * `reason` explains why we're asking (first run vs expired).
 */
export async function promptToken(reason) {
    if (!process.stdin.isTTY) {
        throw new Error(`${reason} Run "bbskill login" or set GITHUB_TOKEN.`);
    }
    const wasSpinning = spinner.isSpinning;
    if (wasSpinning)
        spinner.stop();
    logger.info(reason);
    logger.dim("  Create one at https://github.com/settings/tokens (repo read access).");
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    const token = (await rl.question("Paste your GitHub token: ")).trim();
    rl.close();
    if (!token)
        throw new Error("No token entered.");
    saveToken(token);
    if (wasSpinning)
        spinner.start();
    return token;
}
