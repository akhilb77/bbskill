import fs from "node:fs";
import path from "node:path";
import axios, { AxiosError } from "axios";
import AdmZip from "adm-zip";
import type { SkillSource } from "./source.js";
import { copyDir, listDirs, makeTempDir, removeDir } from "../utils/fs.js";
import { getToken, promptToken } from "../utils/auth.js";

/**
 * Downloads a GitHub repository archive (zipball of the default branch) and
 * extracts it. GitHub's `/zipball` endpoint follows the default branch and
 * redirects to codeload, so we never have to guess main vs master.
 */
export class GitHubSource implements SkillSource {
  readonly name = "GitHub";

  async fetch(url: string): Promise<string> {
    const { owner, repo, subpath } = parseRepoUrl(url);
    const zipUrl = `https://api.github.com/repos/${owner}/${repo}/zipball`;

    const token = getToken();
    let data: ArrayBuffer;
    try {
      data = await download(zipUrl, token);
    } catch (err) {
      const status = (err as AxiosError).response?.status;
      // 401 = bad/expired token. 404 without a token is how GitHub reports a
      // private repo to anonymous callers. Ask once, save, and retry; any
      // other failure is real and propagates.
      let fresh: string;
      if (status === 401 && token) {
        fresh = await promptToken("Your saved GitHub token was rejected (expired?).");
      } else if ((status === 404 || status === 401) && !token) {
        fresh = await promptToken(
          `Could not reach ${owner}/${repo} — if it's private, a GitHub token is needed.`
        );
      } else {
        throw err;
      }
      data = await download(zipUrl, fresh);
    }

    const dest = makeTempDir();
    const zip = new AdmZip(Buffer.from(data));
    zip.extractAllTo(dest, true);

    // A `/tree/<branch>/<subpath>` URL targets one folder: stage just that
    // folder so the validator can't pick up a sibling skill's SKILL.md.
    if (subpath) {
      const wrap = listDirs(dest);
      const repoRoot = wrap.length === 1 ? path.join(dest, wrap[0]) : dest;
      const target = path.join(repoRoot, subpath);
      if (!fs.existsSync(target)) {
        removeDir(dest);
        throw new Error(`"${subpath}" not found in ${owner}/${repo}.`);
      }
      const staged = makeTempDir();
      copyDir(target, staged);
      removeDir(dest);
      return staged;
    }

    // Returns the temp root. The zipball wraps files in an `owner-repo-<sha>/`
    // folder, but the validator locates SKILL.md recursively, so callers only
    // need this one path to both use and clean up.
    return dest;
  }
}

async function download(zipUrl: string, token?: string): Promise<ArrayBuffer> {
  const res = await axios.get<ArrayBuffer>(zipUrl, {
    responseType: "arraybuffer",
    // GitHub requires a UA; the token (when present) unlocks private repos
    // and lifts the anonymous rate limit.
    headers: {
      "User-Agent": "bbskill-cli",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  return res.data;
}

/**
 * Accepts `https://github.com/owner/repo(.git)?`, `owner/repo`, and
 * folder links like `https://github.com/owner/repo/tree/<branch>/<subpath>`.
 */
export function parseRepoUrl(input: string): {
  owner: string;
  repo: string;
  subpath?: string;
} {
  const cleaned = input.trim().replace(/\/+$/, "").replace(/\.git$/, "");
  const m =
    cleaned.match(/github\.com[/:]([^/]+)\/([^/]+)(?:\/tree\/[^/]+\/(.+))?/) ??
    cleaned.match(/^([\w.-]+)\/([\w.-]+)$/);
  if (!m) {
    throw new Error(`Not a valid GitHub repository: "${input}"`);
  }
  return { owner: m[1], repo: m[2], subpath: m[3] };
}
