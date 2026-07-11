import axios from "axios";
import AdmZip from "adm-zip";
import type { SkillSource } from "./source.js";
import { makeTempDir } from "../utils/fs.js";

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

    const res = await axios.get<ArrayBuffer>(zipUrl, {
      responseType: "arraybuffer",
      // GitHub requires a UA; token is optional but lifts the rate limit.
      headers: {
        "User-Agent": "bbskill-cli",
        ...(process.env.GITHUB_TOKEN
          ? { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` }
          : {}),
      },
    });

    const dest = makeTempDir();
    const zip = new AdmZip(Buffer.from(res.data));
    zip.extractAllTo(dest, true);

    // Returns the temp root. The zipball wraps files in an `owner-repo-<sha>/`
    // folder, but the validator locates SKILL.md recursively, so callers only
    // need this one path to both use and clean up.
    return dest;
  }
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
