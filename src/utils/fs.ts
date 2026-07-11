import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { parse as parseYaml } from "yaml";

/** Recursively find the first `SKILL.md` at or below `root` (breadth-first). */
export function findSkillMd(root: string): string | null {
  const queue = [root];
  while (queue.length) {
    const dir = queue.shift()!;
    let entries: fs.Dirent[];
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      continue;
    }
    const hit = entries.find((e) => e.isFile() && e.name === "SKILL.md");
    if (hit) return path.join(dir, "SKILL.md");
    for (const e of entries) {
      if (e.isDirectory() && e.name !== ".git" && e.name !== "node_modules") {
        queue.push(path.join(dir, e.name));
      }
    }
  }
  return null;
}

/**
 * Extract and parse the YAML frontmatter block from a SKILL.md. Real skills use
 * folded scalars (`description: >`) and quoted values, so this uses a real YAML
 * parser rather than line matching. Non-string values are stringified for
 * display; validation happens against the schema in the validator.
 */
export function readFrontmatter(skillMdPath: string): Record<string, string> {
  const raw = fs.readFileSync(skillMdPath, "utf8");
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return {};
  const parsed = parseYaml(match[1]) as Record<string, unknown> | null;
  if (!parsed || typeof parsed !== "object") return {};
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(parsed)) {
    out[k] = typeof v === "string" ? v.trim() : String(v);
  }
  return out;
}

export function makeTempDir(prefix = "bbskill-"): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}

export function removeDir(dir: string): void {
  fs.rmSync(dir, { recursive: true, force: true });
}

export function copyDir(from: string, to: string): void {
  fs.cpSync(from, to, { recursive: true });
}

export function listDirs(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => e.name);
}
