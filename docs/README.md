# Docs

Reference material for topics that span more than one workspace. Each file below says what it covers; anything owned by a single app or package is documented in that workspace instead.

## Cross-workspace topics

- [architecture.md](architecture.md): how the workspaces depend on each other and how content gets from `content/**` to the site
- [deployment.md](deployment.md): branches, CI and what deploys where
- [components.md](components.md): shared UI components, their props and their Figma nodes
- [funnel/README.md](funnel/README.md): the funnel forms, from `apps/web` through `apps/api` to Notion
- [media-migration.md](media-migration.md): the redirect map for moving blog.logos.co to logos.co/media
- [oss-scanner.md](oss-scanner.md): the offline OSS Scanner image, what it builds and type-checks, its build-only environment values and the files it excludes

## Workspaces

| Workspace                | README                                          | Deeper docs                                      |
| ------------------------ | ----------------------------------------------- | ------------------------------------------------ |
| apps/web                 | [README](../apps/web/README.md)                 | [docs](../apps/web/docs/README.md)               |
| apps/cms                 | [README](../apps/cms/README.md)                 | [docs](../apps/cms/docs/README.md)               |
| apps/api                 | [README](../apps/api/README.md)                 | [architecture](../apps/api/docs/architecture.md) |
| apps/logos-crm           | [README](../apps/logos-crm/README.md)           | [docs](../apps/logos-crm/docs/README.md)         |
| apps/logos-demos         | [README](../apps/logos-demos/README.md)         | [docs](../apps/logos-demos/docs/README.md)       |
| apps/past-present-future | [README](../apps/past-present-future/README.md) |                                                  |
| packages/content         | [README](../packages/content/README.md)         | [AGENTS](../packages/content/AGENTS.md)          |
| packages/funnel          | [README](../packages/funnel/README.md)          | [AGENTS](../packages/funnel/AGENTS.md)           |
| packages/ui              | [README](../packages/ui/README.md)              |                                                  |
| packages/tokens          | [README](../packages/tokens/README.md)          |                                                  |
| packages/types           | [README](../packages/types/README.md)           |                                                  |
| packages/config          | [README](../packages/config/README.md)          |                                                  |

## Writing docs

READMEs are for people: what the thing is, how to run it, where to go next. `AGENTS.md` files hold rules for coding agents. Reference material goes in a `docs/` folder, in the narrowest workspace that owns all the code it describes, and root `docs/` is only for topics that span workspaces. Start each doc with a `# Title` and one sentence of scope that links the code it covers, and update it in the same PR as the behaviour change. The full rules are in the Documentation section of the root [AGENTS.md](../AGENTS.md).

## AI tooling

Agent context comes only from `AGENTS.md` files, the root one plus one per workspace where needed. There is no `CLAUDE.md`. A few tool limits worth knowing:

- Claude Code below v2.1.277 reads no `AGENTS.md`.
- A personal `CLAUDE.local.md` turns `AGENTS.md` off for you; set `instructionFiles: claude-md-and-agents-md` in `~/.claude/settings.json` to fix it.
- VS Code Copilot reads nested `AGENTS.md` files only when `chat.useNestedAgentsMdFiles` is on.
