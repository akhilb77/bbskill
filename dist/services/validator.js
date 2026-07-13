import path from "node:path";
import { SkillManifestSchema } from "../types.js";
import { findSkillMd, readFrontmatter } from "../utils/fs.js";
/**
 * Validate a staged directory as a Claude Skill: locate SKILL.md, parse its
 * frontmatter, and check it against the manifest schema. Returns the resolved
 * skill (name + directory) or throws with a message the CLI shows verbatim.
 */
const TEMPLATE = `A Claude Skill is a folder with a file named exactly SKILL.md that starts with:

---
name: my-skill-name
description: One line telling Claude when to use this skill.
---

(instructions for Claude below the frontmatter)`;
export function validateSkill(stagedDir) {
    const skillMd = findSkillMd(stagedDir);
    if (!skillMd) {
        throw new Error(`No SKILL.md found — this doesn't look like a Claude Skill.\n\n${TEMPLATE}`);
    }
    const parsed = SkillManifestSchema.safeParse(readFrontmatter(skillMd));
    if (!parsed.success) {
        const issues = parsed.error.issues
            .map((i) => `  • ${i.path.join(".") || "(root)"}: ${i.message}`)
            .join("\n");
        throw new Error(`Invalid SKILL.md frontmatter:\n${issues}\n\n${TEMPLATE}`);
    }
    return { manifest: parsed.data, path: path.dirname(skillMd) };
}
