# dev-workflow

CLI tool that installs the **Spec Driven Development (SDD)** workflow skill into [Claude Code](https://docs.anthropic.com/en/docs/claude-code) projects.

SDD is a structured development cycle: define **what** you want before writing code, then implement from specifications. Each phase produces a persistent artifact that the next session consumes.

```
SPEC → PLAN → IMPLEMENT → VERIFY
```

## Install

```bash
npm i -g dev-workflow
```

Requires Node.js >= 18.

## Usage

### Initialize

Install the SDD skill into your Claude Code configuration:

```bash
dev-workflow init          # global (default)
dev-workflow init --local  # current project only
```

### Update

Update the skill files to the latest version:

```bash
dev-workflow update
```

### Status

Check where the skill is installed:

```bash
dev-workflow status
```

## How it works

Once installed, the `/dev-workflow` slash command becomes available in Claude Code. It guides you through four phases:

1. **SPEC** — Define what the feature does (functional requirements, edge cases, acceptance criteria)
2. **PLAN** — Translate the spec into ordered tasks with file maps and architecture decisions
3. **IMPLEMENT** — Build each task iteratively: RED → GREEN → REFACTOR, with user review between tasks
4. **VERIFY** — Lint, type-check, commit, and open a PR

Each phase can run in a separate session — the artifacts travel, not the context.

## License

MIT
