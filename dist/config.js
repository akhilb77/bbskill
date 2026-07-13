/**
 * The GitHub repo that acts as the skill store ("registry"). Override with the
 * BBSKILL_REPO env var — switching from a personal test repo to the org repo
 * is a config change, not a code change.
 */
export function storeRepo() {
    return process.env.BBSKILL_REPO ?? "akhilb77/claude-skills";
}
