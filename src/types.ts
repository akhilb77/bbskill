import { z } from "zod";

/**
 * A Claude Skill is a directory containing a `SKILL.md` file whose YAML
 * frontmatter carries at least a `name` and `description`. That frontmatter is
 * the manifest we validate before install.
 */
export const SkillManifestSchema = z.object({
  name: z
    .string()
    .min(1)
    .regex(
      /^[a-z0-9][a-z0-9-]*$/,
      "must be lowercase kebab-case (letters, digits, hyphens)"
    ),
  description: z.string().min(1),
});

export type SkillManifest = z.infer<typeof SkillManifestSchema>;

/** A skill discovered on disk (either a staged download or an installed one). */
export interface SkillPackage {
  manifest: SkillManifest;
  /** Absolute path to the skill directory (the folder containing SKILL.md). */
  path: string;
}
