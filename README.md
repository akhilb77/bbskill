# BBSkill

Internal CLI for installing and managing [Claude Code Skills](https://code.claude.com/docs/en/skills.md). Skills are installed into `~/.claude/skills`, where Claude Code discovers them automatically.

## Install

```bash
npm install -g https://github.com/akhilb77/bbskill/archive/refs/heads/main.tar.gz
```

Re-run the same command to update. (Use the tarball URL, not `github:akhilb77/bbskill` — npm on Windows has a bug installing global git deps.)

## Development setup

```bash
npm install
npm run build
npm link        # makes the global `bbskill` command available
```

## Commands

```bash
bbskill install <source>      # GitHub URL (owner/repo), store skill name, or local folder
bbskill install <source> -f   # overwrite an existing install
bbskill upload <dir>          # publish a local skill folder to the skill store
bbskill sync                  # update installed skills from the store
bbskill sync --all            # also install store skills you don't have yet
bbskill remove <name>         # uninstall a skill
bbskill list                  # list installed skills
bbskill list org              # list skills available in the org store
bbskill info <name>           # show a skill's details
bbskill doctor                # check the local environment
bbskill version
```

## The skill store

Bare-name installs (`bbskill install abc-skill`), `upload`, and `sync` all use a
shared GitHub repo whose top-level folders are skills (`<repo>/<skill-name>/SKILL.md`).
The default store is set in `src/config.ts`; override it per machine with:

```bash
BBSKILL_REPO=your-org/claude-skills
```

## Architecture

```
src/
  index.ts           commander wiring (entry point)
  config.ts          store repo config
  types.ts           Zod skill-manifest schema
  commands/          one file per CLI command
  sources/           where skills come from — SkillSource interface with
                     GitHub, store, and local-folder implementations
  services/          validator (SKILL.md checks) + installer (copy/remove)
  utils/             paths, logger, filesystem helpers
```

New installation sources (e.g. a future registry) implement the `SkillSource`
interface in `src/sources/source.ts` and get one branch in `resolve.ts` —
nothing else changes.

## Development

```bash
npm run dev -- <command>   # run from TypeScript source without building
npm run build              # compile to dist/
```
