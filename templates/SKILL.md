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

## Phase Dispatch

Each phase runs in a **subagent** via the Agent tool. The orchestrator (you) never executes phase work directly — you dispatch it, receive results, and manage user interaction. This keeps your context window minimal across the full workflow lifecycle.

### Inline Execution Fallback

The Agent tool may not be available in all environments (e.g., sandboxed worktrees, restricted tool sets). When the Agent tool is unavailable:

1. **Detect early** — Before dispatching the first phase, check if the Agent tool is available. If not, switch to inline execution mode for the entire workflow.
2. **Follow the same phase references** — Read and follow the phase reference file (`references/phase-N-*.md`) exactly as a subagent would. The phase instructions, exit criteria, and return summary format still apply.
3. **Maintain the orchestrator/executor boundary mentally** — Even when executing inline, separate the "orchestrator" concerns (phase detection, review gates, commits, user interaction) from the "executor" concerns (codebase exploration, file creation, test execution). Complete all executor work first, then switch to orchestrator mode to present results.
4. **Review gates still apply** — After completing phase work inline, present results to the user in the same format as if a subagent had returned them. Do not skip the review gate just because execution was inline.
5. **Log the fallback** — Note in your output that the Agent tool was unavailable and execution was performed inline.

### Dispatch Template

For each phase, call the Agent tool with a prompt following this structure:

```
You are a subagent executing Phase N ({PHASE_NAME}) for the `{FEATURE_NAME}` feature in the `{PROJECT_NAME}` project.

## Context

- **Feature:** `{FEATURE_NAME}`
- **Branch:** `feature/{FEATURE_NAME}`
- **Project root:** {PROJECT_ROOT}
- **Test command:** {TEST_COMMAND}
- **Base branch:** {BASE_BRANCH}
- **Commit format:** {COMMIT_FORMAT}
- **Spec:** {SPEC_PATH or "N/A — this phase creates it"}
- **Plan:** {PLAN_PATH or "N/A — this phase creates it"}

## Task Definition (Phase 3 only)

{TASK_DEFINITION from PLAN.md — include only for Phase 3 subagents}

## Instructions

1. Read `{PHASE_REFERENCE_PATH}` for your full instructions
2. Read the project's `CLAUDE.md` for conventions (test command, commit format, etc.)
3. {PHASE_SPECIFIC_INSTRUCTION}
4. When done, return a structured summary (format defined in the reference file)
5. Do NOT interact with the user — return results to the orchestrator
6. Do NOT commit unless your phase instructions explicitly say to

## Return Summary

Return a structured summary using the exact format (field names and ordering) required by the referenced phase reference file's **“Return Summary”** section (`{PHASE_REFERENCE_PATH}`).

If the phase reference requires additional fields beyond the common ones, include them; if it omits a field, do not invent it.
```

### Phase Reference Table

| Phase | Reference | Subagent receives | Subagent produces |
|-------|-----------|-------------------|-------------------|
| 1. SPEC | `references/phase-1-spec.md` | User request, project root | `SPEC.md` + directory (or clarifying questions) |
| 2. PLAN | `references/phase-2-plan.md` | `SPEC.md` path, project root | `PLAN.md` + git branch |
| 3. IMPLEMENT | `references/phase-3-implement.md` | Single task definition, `SPEC.md` path, branch, test command, completed tasks | Tests + code + refactor for ONE task (no commit) |
| 4. VERIFY | `references/phase-4-verify.md` | All artifacts, branch, project settings | Verification results, PR (if applicable) |

### Context Variables

Collect these from Project Detection and pass them to every subagent:

| Variable | Source | Example |
|----------|--------|---------|
| `FEATURE_NAME` | Naming Convention / user request | `add-ssl-filters` |
| `PROJECT_ROOT` | Current working directory | `/home/user/myproject` |
| `TEST_COMMAND` | CLAUDE.md | `npm test` |
| `SPEC_PATH` | Naming Convention | `docs/workflow/add-ssl-filters/SPEC.md` |
| `PLAN_PATH` | Naming Convention | `docs/workflow/add-ssl-filters/PLAN.md` |
| `PHASE_REFERENCE_PATH` | Phase Reference Table | `references/phase-3-implement.md` |
| `BASE_BRANCH` | CLAUDE.md | `main` |
| `COMMIT_FORMAT` | CLAUDE.md | `conventional` |

## Phase 3 Task Loop

Phase 3 is special: the orchestrator dispatches **one subagent per task**, not one subagent for the entire phase. This keeps each task's RED-GREEN-REFACTOR cycle in a fresh context.

### Orchestrator Procedure for Phase 3

1. **Read PLAN.md** and parse the task list.
2. **Determine progress:** Check which tasks already have passing tests and implementation (for session resumption). Identify the next incomplete task.
3. **For each incomplete task:**

   a. **Dispatch subagent** — Use the dispatch template with these Phase 3 specifics:
      - Include the full task definition from PLAN.md (task number, description, files, acceptance criteria, steps)
      - Include the SPEC.md path (subagent references acceptance criteria)
      - Include the branch name (subagent must be on the feature branch)
      - Include the test command
      - Include the list of previously completed tasks (so the subagent can check for regressions)
      - Add instruction: "Do NOT commit. The orchestrator handles commits after user approval."

   b. **Receive results** — The subagent returns a structured summary: status, files modified, test results, any concerns.

   c. **Present to user** — Show the task results using this format:
      ```
      Task {N}/{TOTAL}: {TASK_TITLE}
        Status: {pass/fail}
        Tests: {count} written, all passing
        Files modified: {list}
        Concerns: {any issues}

      Previously completed:
        Task 1: {title} — committed ({hash})
        Task 2: {title} — committed ({hash})
      ```
      Then ask: "Task N is done — tests pass and code is cleaned up. Any feedback or adjustments before I commit and move to the next task?"

   d. **Handle feedback** — See Review Gate Protocol below.

   e. **Commit on approval** — When the user approves, the orchestrator commits directly:
      ```bash
      git add {files from subagent summary}
      git commit -m "{commit message per project format}"
      ```
      The commit message should reference the task (e.g., `feat(auth): add token validation - task 2/5`). Do NOT include workflow artifacts (`docs/workflow/`).

      **If the commit fails** (sandbox restriction, permission error, worktree limitation):
      - Note the failure and the reason.
      - Do NOT halt the workflow. The implementation is complete on disk.
      - Inform the user that the commit could not be made and why.
      - Proceed to the next task (or Phase 4 if all tasks are done) with the understanding that commits will be batched later.
      - Track uncommitted tasks so Phase 4 can handle them.

   f. **Advance** — Move to the next task and repeat from step 3a.

4. **All tasks complete** — When all tasks are committed and tests pass, announce Phase 3 is done and proceed to Phase 4 detection.

## Review Gate Protocol

After every phase completes (whether via subagent or inline), present results to the user using this format:

```
Phase {N} ({PHASE_NAME}) Complete — {FEATURE_NAME}

  Complexity: {simple|standard}
  Status: {pass|questions|fail}

  Summary:
    {2-4 bullet points of what was produced}

  Files created/modified:
    {list}

  {Key decisions or concerns, if any}

  Next: Phase {N+1} ({NEXT_PHASE_NAME})

Shall I proceed to Phase {N+1}, or do you have feedback?
```

For Phase 3 tasks, use the task-specific format defined in the Phase 3 Task Loop section above.

### User Approves

- **Phases 1, 2, 4:** Proceed to the next phase (or end the workflow).
- **Phase 3:** Commit the task (orchestrator does the commit), then dispatch the next task's subagent.

### User Requests Changes

1. Collect the user's feedback.
2. Dispatch a **new** subagent with:
   - The same phase reference and context as before
   - The user's feedback as an additional instruction
   - A note that files on disk already contain the previous subagent's work — the new subagent should modify in place, not start from scratch
3. When the new subagent returns, present updated results to the user.
4. Repeat until the user approves.

### Subagent Returned Clarifying Questions (Phase 1)

If the Phase 1 subagent (or inline executor) returns questions instead of a completed SPEC.md:
1. Present the questions to the user.
2. Collect answers.
3. Dispatch a new Phase 1 subagent (or re-execute inline) with the original request plus the user's answers.

**Important:** The subagent should return questions even when it *could* guess the answer from the codebase. The goal is to surface design decisions to the user, not to minimize round trips. A spec built on assumptions is worse than a spec that required one extra exchange.

### Subagent Returned an Error

See Error Handling below.

## Error Handling

When a subagent fails or returns incomplete results:

1. **Report to user** — Show what the subagent reported: error message, partial results, files that may have been modified.
2. **Offer options:**
   - **Retry** — Dispatch a new subagent with the same inputs. The new subagent will find any partial file writes from the failed attempt on disk and must handle that state.
   - **Retry with guidance** — User provides additional context or constraints, and a new subagent is dispatched with this guidance.
   - **Skip** (Phase 3 tasks only) — Mark the task as skipped and move to the next one. The user can come back to it later.
   - **Abort** — Use the Abort Protocol.
3. **Context overflow** — If a subagent signals it is running low on context (returns partial results with a note), the orchestrator dispatches a continuation subagent with the partial state and instructions to pick up where the previous one left off.

## Projects Without a Test Suite

Not every project has testing infrastructure. If the project has no test command in CLAUDE.md (or no test runner configured):

- **Phase 3 adapts:** Instead of the RED → GREEN → REFACTOR loop, use an IMPLEMENT → VERIFY → REFACTOR loop. "Verify" means manually confirming the behavior works (running the app, checking output, etc.) and documenting what was verified.
- **Encourage adding tests:** Suggest setting up a minimal test framework as the first task in the plan. This is a recommendation, not a hard requirement — the user decides.
- **Acceptance criteria still apply:** Even without automated tests, each task's acceptance criteria from the spec must be verified before moving on.

## Rules

- **Artifacts are the source of truth.** Every decision lives in SPEC.md or PLAN.md, not in conversation context. These files are working documents — they get deleted in Phase 4 before creating the PR.
- **Branch before code.** Every task — simple or standard — must have a `feature/<name>` branch created before any code is written. Never commit directly to the base branch. *Exception:* In worktree environments where branch switching is restricted, the worktree's own branch provides equivalent isolation — note this in the review gate.
- **Tests before code.** When the project has a test runner, always write failing tests before implementation. If there's no test infrastructure, verify behavior manually against acceptance criteria.
- **Commit per task.** Each completed task gets its own commit immediately after user approval — before starting the next task. This keeps the git history granular and reviewable.
- **User reviews each task.** In Phase 3, the user reviews after each task's cycle — not just at the end of the phase.
- **Read CLAUDE.md first.** Every project has different commands, conventions, and skills.
- **One phase per session.** Keep context clean. The user can continue in the same session if they want, but the default is one phase per session.
- **Orchestrator delegates when possible.** When the Agent tool is available, all file creation, code writing, and test execution happen inside subagents. The orchestrator only performs git commits (Phase 3) and manages user interaction. When the Agent tool is unavailable, the orchestrator executes phase work inline following the phase reference files (see Inline Execution Fallback).
- **Subagents never interact with the user.** All user-facing communication goes through the orchestrator. Subagents return structured summaries; the orchestrator presents results and collects feedback.
- **One subagent per unit of work.** Phases 1, 2, and 4 each get one subagent. Phase 3 gets one subagent per task. Never dispatch a single subagent for the entire Phase 3.
- **New subagent for changes, never re-enter.** If the user requests changes after reviewing subagent output, dispatch a fresh subagent with the feedback. Do not attempt to continue a previous subagent's context.
- **Abort stays in the orchestrator.** The abort protocol is never delegated to a subagent. If the user says "abort" at any point, handle it directly.

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
