import fs from "node:fs";
import path from "node:path";
import { GitHubSource } from "./github.js";
import { StoreSource } from "./store.js";
import { LocalSource } from "./local.js";
/**
 * Map an install argument to the source that can fetch it:
 *   - an existing folder on disk → local copy
 *   - anything that looks like a repo (URL or owner/repo) → GitHub directly
 *   - a bare skill name → the shared skill-store repo
 * Local paths are checked first so `./owner/repo`-shaped folder names on disk
 * beat the GitHub pattern.
 */
export function resolveSource(ref) {
    if (fs.existsSync(path.resolve(ref)) && fs.statSync(path.resolve(ref)).isDirectory()) {
        return new LocalSource();
    }
    const looksLikeRepo = /github\.com/.test(ref) || /^[\w.-]+\/[\w.-]+$/.test(ref);
    if (looksLikeRepo)
        return new GitHubSource();
    if (/^[a-z0-9][a-z0-9-]*$/.test(ref))
        return new StoreSource();
    throw new Error(`"${ref}" is neither a GitHub repo (owner/repo or URL) nor a valid skill name.`);
}
