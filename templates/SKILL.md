---
name: dev-workflow
description: >
  Use this structured development workflow (SDD / dev-workflow) when the user wants to build, create, add,
  implement, fix, or refactor something — any task that involves writing or changing code. Activates for
  development requests like "build a REST API", "add dark mode", "fix the login bug", "implement caching",
  "create a new component", or "refactor the auth module". Also activates when the user explicitly says
  "dev-workflow", "SDD", "workflow", or uses /dev-workflow. Do NOT activate for read-only requests such as
  explain, summarize, or review — e.g. "explain this code", "what does this function do?", or "summarize
  this PR". This is a structured spec-driven workflow, not a generic code helper.
license: MIT
compatibility: Any project with git and CLAUDE.md
metadata:
  tags: workflow, sdd, tdd, development, planning, testing, spec-driven
---

# Spec Driven Development Workflow

You are orchestrating a structured development cycle based on Spec Driven Development (SDD). The core idea: define WHAT you want before writing code, then implement from structured specifications. Each phase produces a persistent artifact that the next session consumes — the files travel, not the context.

## Project Detection

Before starting, read the project's `CLAUDE.md` (or `AGENTS.md`) to extract these settings and pass them to every subagent: base branch, test command, lint command, type check, test runner (watch), commit format, versioning, milestones, releases, project skills. If a setting is not specified, use sensible defaults (e.g., `main` for base branch, `npm test` for test command, `npm run lint` for lint command, `vitest` for test runner, conventional for commit format, `none` for versioning/milestones/releases, skip if N/A for type check).

## Complexity Triage

Not every task needs the full 4-phase ceremony. Classify the task before starting:

**Simple** — bugfix, config change, small tweak, single-file change:
> Skip Phase 1. Flow: `PLAN → IMPLEMENT → VERIFY`
> Phase 2 (PLAN) still creates the feature branch — no code touches the base branch directly.

**Standard** — new feature, multi-file change, domain logic, anything where "obvious" business rules aren't obvious:
> Full flow: `SPEC → PLAN → IMPLEMENT → VERIFY`

When in doubt, go Standard. The cost of a spec you didn't need is low. The cost of ambiguity in implementation is high.

## Naming Convention

Phase 1 defines a `<feature-name>` used for the directory (`docs/workflow/<feature-name>/`) and branch (`feature/<feature-name>`). See `references/phase-1-spec.md` and `references/phase-2-plan.md` for details.

## Workflow Overview

```
Phase 1: SPEC      →  ANALYSIS.md + SPEC.md  →  User reviews
Phase 2: PLAN      →  PLAN.md + branch       →  User reviews
Phase 3: IMPLEMENT →  Per-task loop: RED → GREEN → REFACTOR → User reviews each task
Phase 4: VERIFY    →  Lint + Types + Commit/PR               →  Done
```

All workflow artifacts live in `docs/workflow/<feature-name>/` and are deleted in Phase 4.

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

When the Agent tool is unavailable, execute phase work inline instead of dispatching subagents. Read `references/inline-execution.md` for the full protocol. Key rule: still execute one phase at a time and stop at each review gate.

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
- **Analysis:** {ANALYSIS_PATH or "N/A"}
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

Return a structured summary using the exact format (field names and ordering) required by the referenced phase reference file's **"Return Summary"** section (`{PHASE_REFERENCE_PATH}`).

If the phase reference requires additional fields beyond the common ones, include them; if it omits a field, do not invent it.
```

### Phase Reference Table

| Phase | Reference | Subagent receives | Subagent produces |
|-------|-----------|-------------------|-------------------|
| 1. SPEC | `references/phase-1-spec.md` | User request, project root | `ANALYSIS.md` + `SPEC.md` + directory (or clarifying questions) |
| 2. PLAN | `references/phase-2-plan.md` | `SPEC.md` path, `ANALYSIS.md` path, project root | `PLAN.md` + git branch |
| 3. IMPLEMENT | `references/phase-3-implement.md` | Single task definition, `SPEC.md` path, branch, test command, completed tasks | Tests + code + refactor for ONE task (no commit) |
| 4. VERIFY | `references/phase-4-verify.md` | All artifacts, branch, project settings | Verification results, PR (if applicable) |

### Context Variables

Collect these from Project Detection and pass them to every subagent: `FEATURE_NAME`, `PROJECT_ROOT`, `TEST_COMMAND`, `SPEC_PATH`, `ANALYSIS_PATH`, `PLAN_PATH`, `PHASE_REFERENCE_PATH`, `BASE_BRANCH`, `COMMIT_FORMAT`.

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

The review gate is mandatory after every phase. Present results to the user and wait for explicit approval before proceeding.

**After each phase:** Present a summary (status, files created/modified, key decisions, next phase) and ask whether to proceed or if the user has feedback.

**Phase 3 tasks** use the task-specific format defined in the Phase 3 Task Loop section above.

**User approves:** For Phases 1, 2, 4 — proceed to the next phase. For Phase 3 — commit the task, then dispatch the next task.

**User requests changes:** Dispatch a **new** subagent with the same phase context plus the user's feedback and a note that files on disk already contain the previous subagent's work. Repeat until approved.

**Phase 1 returns questions:** Present the questions to the user, collect answers, and dispatch a new Phase 1 subagent with the original request plus answers. Subagents should return questions even when they could guess — surfacing design decisions is the point.

**Subagent returns an error:** See `references/error-handling.md`.

## Error Handling

When a subagent fails or returns incomplete results, follow the error-handling protocol in `references/error-handling.md`. This covers reporting to the user, retry/skip/abort options, and context-overflow recovery.

## Abort Protocol

If the user wants to abandon a workflow, handle it directly in the orchestrator (never delegate to a subagent). See `references/abort-protocol.md` for the full protocol including confirmation, pause/abort options, and cleanup.

## Rules

- **Artifacts are the source of truth.** Every decision lives in ANALYSIS.md, SPEC.md, or PLAN.md, not in conversation context. These files are working documents — they get deleted in Phase 4 before creating the PR.
- **Branch before code.** Every task — simple or standard — must have a `feature/<name>` branch created before any code is written. Never commit directly to the base branch. *Exception:* In worktree environments, the worktree's own branch provides equivalent isolation.
- **Tests before code.** When the project has a test runner, always write failing tests before implementation. Without test infrastructure, verify behavior manually against acceptance criteria.
- **Commit per task.** Each completed task gets its own commit immediately after user approval — before starting the next task.
- **User reviews each task.** In Phase 3, the user reviews after each task's cycle — not just at the end of the phase.
- **Read CLAUDE.md first.** Every project has different commands, conventions, and skills.
- **One phase per session.** Keep context clean. The user can continue in the same session, but the default is one phase per session.
- **Orchestrator delegates when possible.** When the Agent tool is available, all file creation, code writing, and test execution happen inside subagents. The orchestrator only performs git commits (Phase 3) and manages user interaction. When unavailable, execute inline per `references/inline-execution.md`.
- **One subagent per unit of work.** Phases 1, 2, and 4 each get one subagent. Phase 3 gets one subagent per task.
- **One phase per response in inline mode.** Even when executing inline, complete one phase, present the review gate, and stop.
- **Never self-answer clarifying questions.** Surface ambiguity to the user. The cost of one extra exchange is far lower than the cost of a spec built on assumptions.
- **Subagents never interact with the user.** All user-facing communication goes through the orchestrator.
- **New subagent for changes, never re-enter.** If the user requests changes, dispatch a fresh subagent with the feedback.
- **Abort stays in the orchestrator.** The abort protocol is never delegated to a subagent.
