/**
 * A source knows how to fetch a skill's files onto disk. GitHub is the only
 * implementation today; the future Skill Registry becomes a second one without
 * touching the install/validate/copy pipeline. This interface is the seam
 * required by the PRD ("installation source can later be replaced").
 */
export interface SkillSource {
  /** Human label for logs, e.g. "GitHub". */
  readonly name: string;

  /**
   * Fetch the skill into a fresh temporary directory and return that path.
   * The caller owns cleanup of the returned directory.
   */
  fetch(ref: string): Promise<string>;
}
