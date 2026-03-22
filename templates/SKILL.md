---
name: dev-workflow
description: >
  Use when the user explicitly asks to run the Spec Driven Development workflow (SDD) / structured dev-workflow,
  e.g. they say "dev-workflow", "SDD", "workflow", or use /dev-workflow. Do NOT use for
  generic feature requests like "build X" unless they explicitly requested the workflow.
license: MIT
compatibility: Any project with tests, git, and CLAUDE.md
metadata:
  version: "1.0"
  tags: workflow, sdd, tdd, development, planning, testing, spec-driven
---

# Spec Driven Development Workflow

You are orchestrating a structured development cycle based on Spec Driven Development (SDD). The core idea: define WHAT you want before writing code, then implement from structured specifications. Each phase produces a persistent artifact that the next session consumes — the files travel, not the context.

## Project Detection

Before starting, read the project's `CLAUDE.md` (or `AGENTS.md`) to determine:

| Setting | Examples | Default |
|---------|----------|---------|
| Base branch | `develop`, `main`, `master` | `main` |
| Test command | `npm test`, `pytest`, `cargo test` | `npm test` |
| Lint command | `npm run lint`, `ruff check` | `npm run lint` |
| Type check | `npm run typescript`, `mypy .` | Skip if N/A |
| Test runner (watch) | `vitest`, `jest --watch` | `vitest` |
| Commit format | conventional, project-specific | conventional |
| Project skills | `.claude/skills/` entries | — |

## Complexity Triage

Not every task needs the full 4-phase ceremony. Classify the task before starting:

**Simple** — bugfix, config change, small tweak, single-file change:
→ Skip Phase 1. Flow: `PLAN → IMPLEMENT → VERIFY`

**Standard** — new feature, multi-file change, domain logic, anything where "obvious" business rules aren't obvious:
→ Full flow: `SPEC → PLAN → IMPLEMENT → VERIFY`

When in doubt, go Standard. The cost of a spec you didn't need is low. The cost of ambiguity in implementation is high.

## Naming Convention

Phase 1 defines a `<feature-name>` (e.g., `add-ssl-filters`, `fix-pagination`). This name is used consistently:

- **Directory:** `docs/workflow/<feature-name>/`
- **Branch:** `feature/<feature-name>`

Phase 1 creates the directory. Phase 2 creates the git branch matching it.

## Workflow Overview

```
Phase 1: SPEC      →  docs/workflow/<feature-name>/SPEC.md   →  User reviews
Phase 2: PLAN      →  docs/workflow/<feature-name>/PLAN.md   →  User reviews + branch
Phase 3: IMPLEMENT →  Per-task loop: RED → GREEN → REFACTOR → User reviews each task
Phase 4: VERIFY    →  Lint + Types + Commit/PR               →  Done
```

Phase 3 is iterative: it cycles through each task in the plan one at a time. For each task, it writes failing tests (RED), implements until they pass (GREEN), refactors, and then presents the results for user review before moving to the next task. This prevents large code dumps and gives the user control at every step.

Each phase can run in a **separate session** with fresh context. The artifact from the previous phase is the only input needed.

## Phase Detection

When starting a session, detect the current phase by checking state in `docs/workflow/<feature-name>/`:

1. **No workflow directory** or directory exists but no `SPEC.md` and no `PLAN.md` → **Start Phase 1** (standard) or **Phase 2** (simple — user confirms)
2. **`SPEC.md` exists, no `PLAN.md`** → **Start Phase 2**
3. **`PLAN.md` exists, not all tasks are implemented** → **Start Phase 3** (check which tasks still need tests/implementation)
4. **All tasks implemented and tests pass** → **Start Phase 4**

**Simple flow without SPEC:** If `PLAN.md` exists and its header shows `Complexity: simple` with no `SPEC.md`, this is expected — skip Phase 1 detection.

**Phase 3 resume:** Phase 3 is iterative — it may span multiple sessions. When resuming, check which tasks from PLAN.md already have passing tests and implementation. Pick up from the next incomplete task.

**Ambiguous states:**
- Test files exist but have syntax/import errors → still Phase 3 (fix the tests for that task)
- Test files exist and pass but no implementation code → the tests may be wrong, investigate before advancing
- Multiple workflow directories exist → ask the user which feature to continue

## Phase Instructions

Each phase has detailed instructions in a reference file. Read ONLY the reference for the current phase — loading all phases wastes context.

| Phase | Reference | Input | Output |
|-------|-----------|-------|--------|
| 1. SPEC | `references/phase-1-spec.md` | User request | `SPEC.md` + directory |
| 2. PLAN | `references/phase-2-plan.md` | `SPEC.md` | `PLAN.md` + git branch |
| 3. IMPLEMENT | `references/phase-3-implement.md` | `PLAN.md` + `SPEC.md` | Per-task: tests + code + refactor, user-reviewed |
| 4. VERIFY | `references/phase-4-verify.md` | All tasks passing | Commit/PR |

## Rules

- **Artifacts are the source of truth.** Every decision lives in SPEC.md or PLAN.md, not in conversation context.
- **Tests before code.** Always. Within each task, write failing tests before implementation.
- **User reviews each task.** In Phase 3, the user reviews after each task's RED → GREEN → REFACTOR cycle — not just at the end of the phase.
- **Read CLAUDE.md first.** Every project has different commands, conventions, and skills.
- **One phase per session.** Keep context clean. The user can continue in the same session if they want, but the default is one phase per session.

## Abort Protocol

If the user wants to abandon a workflow at any point:

1. **Ask for confirmation** — "Are you sure? This will clean up the branch and workflow artifacts."
2. **Clean up the branch** (if created):
   ```bash
   git checkout <base-branch>
   git branch -D feature/<feature-name>
   ```
3. **Remove workflow artifacts:**
   ```bash
   rm -rf docs/workflow/<feature-name>
   ```
4. **Confirm cleanup** — list what was removed so the user knows the state is clean.

If the user wants to **pause** (not abort), just stop. The artifacts persist and Phase Detection will pick up where they left off in a future session.
