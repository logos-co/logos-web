# Docs

Root documentation for the logos-web monorepo. Each app and package keeps its own README and, where needed, its own docs folder; this file indexes all of them.

## Root docs

| Doc                                      | Read it when                                                                      |
| ---------------------------------------- | --------------------------------------------------------------------------------- |
| [architecture.md](architecture.md)       | understanding how the workspaces fit together and how content flows               |
| [deployment.md](deployment.md)           | understanding branches, CI and what deploys where                                 |
| [components.md](components.md)           | working on shared UI components (Figma node IDs)                                  |
| [funnel/README.md](funnel/README.md)     | working on the funnel forms end to end                                            |
| [media-migration.md](media-migration.md) | working on the blog.logos.co to logos.co/media redirects (migration not finished) |

## Workspace docs

| Workspace                | README                                          | Docs                                             |
| ------------------------ | ----------------------------------------------- | ------------------------------------------------ |
| apps/web                 | [README](../apps/web/README.md)                 | [docs](../apps/web/docs/README.md)               |
| apps/cms                 | [README](../apps/cms/README.md)                 | [docs](../apps/cms/docs/README.md)               |
| apps/api                 | [README](../apps/api/README.md)                 | [architecture](../apps/api/docs/architecture.md) |
| apps/logos-crm           | [README](../apps/logos-crm/README.md)           | [docs](../apps/logos-crm/docs/README.md)         |
| apps/logos-demos         | [README](../apps/logos-demos/README.md)         | [docs](../apps/logos-demos/docs/README.md)       |
| apps/past-present-future | [README](../apps/past-present-future/README.md) | n/a                                              |
| packages/content         | [README](../packages/content/README.md)         | [AGENTS](../packages/content/AGENTS.md)          |
| packages/funnel          | [README](../packages/funnel/README.md)          | [AGENTS](../packages/funnel/AGENTS.md)           |
| packages/ui              | [README](../packages/ui/README.md)              | n/a                                              |
| packages/tokens          | [README](../packages/tokens/README.md)          | n/a                                              |
| packages/types           | [README](../packages/types/README.md)           | n/a                                              |
| packages/config          | [README](../packages/config/README.md)          | n/a                                              |

## AI tooling

The single source of agent context is `AGENTS.md` (root plus nested). Known limits of the tools in use:

- Claude Code below v2.1.277 reads no `AGENTS.md`.
- A personal `CLAUDE.local.md` disables `AGENTS.md` for that user; the fix is `instructionFiles: claude-md-and-agents-md` in `~/.claude/settings.json`.
- VS Code Copilot reads nested `AGENTS.md` files only with `chat.useNestedAgentsMdFiles`.
