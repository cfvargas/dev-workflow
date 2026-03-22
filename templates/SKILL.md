---
name: dev-workflow
description: >
  Use when the user explicitly asks to run the Spec Driven Development workflow (SDD) / structured dev-workflow,
  e.g. they say "dev-workflow", "SDD", "workflow", or use /dev-workflow. Do NOT use for
  generic feature requests like "build X" unless they explicitly requested the workflow.
license: MIT
compatibility: Any project with git and CLAUDE.md
metadata:
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
| Versioning | semver, calver, none | none |
| Milestones | per-version, per-sprint, none | none |
| Releases | GitHub releases, tags only, none | none |
| Project skills | `.claude/skills/` entries | — |

## Complexity Triage

Not every task needs the full 4-phase ceremony. Classify the task before starting:

**Simple** — bugfix, config change, small tweak, single-file change:
→ Skip Phase 1. Flow: `PLAN → IMPLEMENT → VERIFY`
→ Phase 2 (PLAN) still creates the feature branch — no code touches the base branch directly.

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

## Projects Without a Test Suite

Not every project has testing infrastructure. If the project has no test command in CLAUDE.md (or no test runner configured):

- **Phase 3 adapts:** Instead of the RED → GREEN → REFACTOR loop, use an IMPLEMENT → VERIFY → REFACTOR loop. "Verify" means manually confirming the behavior works (running the app, checking output, etc.) and documenting what was verified.
- **Encourage adding tests:** Suggest setting up a minimal test framework as the first task in the plan. This is a recommendation, not a hard requirement — the user decides.
- **Acceptance criteria still apply:** Even without automated tests, each task's acceptance criteria from the spec must be verified before moving on.

## Rules

- **Artifacts are the source of truth.** Every decision lives in SPEC.md or PLAN.md, not in conversation context. These files are working documents — they get deleted in Phase 4 before creating the PR.
- **Branch before code.** Every task — simple or standard — must have a `feature/<name>` branch created before any code is written. Never commit directly to the base branch.
- **Tests before code.** When the project has a test runner, always write failing tests before implementation. If there's no test infrastructure, verify behavior manually against acceptance criteria.
- **Commit per task.** Each completed task gets its own commit immediately after user approval — before starting the next task. This keeps the git history granular and reviewable.
- **User reviews each task.** In Phase 3, the user reviews after each task's cycle — not just at the end of the phase.
- **Read CLAUDE.md first.** Every project has different commands, conventions, and skills.
- **One phase per session.** Keep context clean. The user can continue in the same session if they want, but the default is one phase per session.

## Abort Protocol

If the user wants to abandon a workflow at any point:

1. **Ask for confirmation** — "Are you sure you want to abort? I can also just pause if you want to come back later."
2. **Offer options:**
   - **Pause** (default) — Stop here. Artifacts and branch persist. Phase Detection picks up later.
   - **Abort, keep branch** — Remove workflow artifacts (`rm -rf docs/workflow/<feature-name>`) but keep the branch (useful if there's salvageable code).
   - **Full abort** — Remove everything:
     ```bash
     git checkout <base-branch>
     git branch -D feature/<feature-name>
     rm -rf docs/workflow/<feature-name>
     ```
3. **Confirm cleanup** — list exactly what was removed so the user knows the state is clean.
4. If `docs/workflow/` is now empty, remove it too: `rmdir docs/workflow 2>/dev/null`
