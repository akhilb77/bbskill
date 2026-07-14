#!/usr/bin/env node
import { createRequire } from "node:module";
import { Command } from "commander";
import { installCommand } from "./commands/install.js";
import { removeCommand } from "./commands/remove.js";
import { listCommand } from "./commands/list.js";
import { infoCommand } from "./commands/info.js";
import { doctorCommand } from "./commands/doctor.js";
import { uploadCommand } from "./commands/upload.js";
import { syncCommand } from "./commands/sync.js";
import { loginCommand } from "./commands/login.js";
const { version } = createRequire(import.meta.url)("../package.json");
const program = new Command();
program
    .name("bbskill")
    .description("Install and manage Claude Code Skills")
    .version(version, "-v, --version");
program
    .command("install")
    .argument("<source>", "GitHub URL (owner/repo), a store skill name, or a local folder")
    .option("-f, --force", "overwrite an existing install")
    .description("Install a skill into ~/.claude/skills")
    .action(installCommand);
program
    .command("upload")
    .argument("<dir>", "path to a local skill folder (must contain SKILL.md)")
    .option("-f, --force", "overwrite the skill if it already exists in the store")
    .description("Publish a local skill to the shared skill store")
    .action(uploadCommand);
program
    .command("sync")
    .option("-a, --all", "also install store skills you don't have yet")
    .description("Update installed skills from the store (--all installs everything)")
    .action(syncCommand);
program
    .command("remove")
    .argument("<name>", "installed skill name")
    .description("Remove an installed skill")
    .action(removeCommand);
program
    .command("list")
    .argument("[where]", '"org" to list skills available in the org store')
    .description("List installed skills, or the org store's skills with `list org`")
    .action(listCommand);
program
    .command("info")
    .argument("<name>", "installed skill name")
    .description("Show details about an installed skill")
    .action(infoCommand);
program
    .command("login")
    .option("-f, --force", "replace the saved token even if it still works")
    .description("Save a GitHub token for private-repo access (asked again only when it expires)")
    .action(loginCommand);
program
    .command("doctor")
    .description("Check the local environment")
    .action(doctorCommand);
program
    .command("version")
    .description("Print the CLI version")
    .action(() => console.log(version));
program.parseAsync();
