import axios, { AxiosError } from "axios";
import AdmZip from "adm-zip";
import type { SkillSource } from "./source.js";
import { makeTempDir } from "../utils/fs.js";
import { getToken, promptToken } from "../utils/auth.js";

/**
 * Downloads a GitHub repository archive (zipball of the default branch) and
 * extracts it. GitHub's `/zipball` endpoint follows the default branch and
 * redirects to codeload, so we never have to guess main vs master.
 */
export class GitHubSource implements SkillSource {
  readonly name = "GitHub";

  async fetch(url: string): Promise<string> {
    const { owner, repo } = parseRepoUrl(url);
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

/** Accepts `https://github.com/owner/repo(.git)?` and `owner/repo`. */
export function parseRepoUrl(input: string): { owner: string; repo: string } {
  const cleaned = input.trim().replace(/\.git$/, "");
  const m =
    cleaned.match(/github\.com[/:]([^/]+)\/([^/]+)/) ??
    cleaned.match(/^([\w.-]+)\/([\w.-]+)$/);
  if (!m) {
    throw new Error(`Not a valid GitHub repository: "${input}"`);
  }
  return { owner: m[1], repo: m[2] };
}
