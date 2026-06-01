# logos-web — Agent Instructions

## Model Policy

- **Prefer Opus.** Use an Opus model (e.g. `claude-opus-4-8`) whenever possible.
- **Never use Haiku.** Do not run on Haiku 4.5 or any Haiku model under any circumstances.
- Do not silently downgrade the model. If a switch happens, flag it to the user instead of proceeding quietly.

## Commit Attribution

- **Claude must never appear in commits.** Never add a `Co-Authored-By: Claude ...`
  trailer, and never list Claude as the author or committer. Commits must be
  authored solely by the human developer.
