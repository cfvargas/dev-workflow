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

Before starting, read the project's `CLAUDE.md` (or `AGENTS.md`) to extract these settings and pass them to every subagent: base branch, test command, lint command, type check, commit format, versioning, milestones, releases, project skills. Settings the user states in conversation override CLAUDE.md. Defaults when unspecified: `main` for base branch, conventional for commit format, `none` for versioning/milestones/releases. For test, lint, and type-check commands, never guess a default: pass a command only if it is confirmed (CLAUDE.md, user statement, or detected — e.g. a `test` script in `package.json`); otherwise pass "none" so Phases 3–4 use their no-infrastructure adaptations.

## Complexity Triage

Not every task needs the full 4-phase ceremony. Classify the task before starting, announce the classification with one line of reasoning, and proceed — ask the user only when genuinely borderline:

**Simple** — bugfix, config change, small tweak, single-file change:
> Skip Phase 1. Flow: `PLAN → IMPLEMENT → VERIFY`
> Phase 2 (PLAN) still creates the feature branch — no code touches the base branch directly. No SPEC.md is created: acceptance criteria live in the PLAN.md tasks, and downstream phases receive `Spec: N/A — simple flow`.

**Standard** — new feature, multi-file change, domain logic, anything where "obvious" business rules aren't obvious:
> Full flow: `SPEC → PLAN → IMPLEMENT → VERIFY`

When in doubt, go Standard. The cost of a spec you didn't need is low. The cost of ambiguity in implementation is high.

## Naming Convention

Phase 1 defines a `<feature-name>` used for the directory (`docs/workflow/<feature-name>/`) and branch (`feature/<feature-name>`). In the simple flow, Phase 2 defines it. See `references/phase-1-spec.md` and `references/phase-2-plan.md` for details.

## Workflow Overview

```
Phase 1: SPEC      →  docs/workflow/<feature-name>/SPEC.md   →  User reviews
Phase 2: PLAN      →  docs/workflow/<feature-name>/PLAN.md   →  User reviews + branch
Phase 3: IMPLEMENT →  Per-task loop: RED → GREEN → REFACTOR  →  User reviews each task
Phase 4: VERIFY    →  Checks + PR draft → user approves → deliver → Done
```

Phase 3 is iterative: it cycles through the plan's tasks one at a time. Each task is a vertical slice — for each one, the executor writes that task's failing tests (RED), implements until they pass (GREEN), and refactors; the user reviews before the next task starts. This prevents large code dumps and gives the user control at every step.

Each phase can run in a **separate session** with fresh context. The artifact from the previous phase is the only input needed.

## Phase Detection

When starting a session, detect the current phase by checking state in `docs/workflow/`:

1. **No workflow directory** → **Start Phase 1** (standard) or **Phase 2** (simple)
2. **`SPEC.md` exists, no `PLAN.md`** → **Start Phase 2**
3. **`PLAN.md` exists with tasks not yet `committed`/`skipped`** → **Start Phase 3** at the first pending task
4. **Every task `committed` (or `skipped`)** → **Start Phase 4**

Task progress is read from each task's **Status** line in PLAN.md — the orchestrator's bookkeeping (see the Phase 3 loop). If PLAN.md predates status tracking, reconstruct progress from task-referencing commit messages in `git log` and confirm with the user — do not run the test suite yourself to find out.

**Existing directory, different request:** If the user's request is unrelated to what an existing workflow directory contains, don't resume it silently — ask whether to continue the existing workflow or start a new feature.

**Simple flow without SPEC:** If `PLAN.md` shows `Complexity: simple` and there is no `SPEC.md`, this is expected — skip Phase 1 detection.

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
You are a subagent executing Phase N ({PHASE_NAME}) for the `{FEATURE_NAME}` feature in {PROJECT_ROOT}.

## Request

{USER_REQUEST — the user's request plus any clarification answers. Required for Phase 1 and
simple-flow Phase 2; a one-line recap for later phases.}

## Context

- **Feature:** `{FEATURE_NAME}` (Phase 1: "TBD — you derive it, see the reference")
- **Branch:** `feature/{FEATURE_NAME}` (Phase 1: "none yet — Phase 2 creates it")
- **Test command:** {TEST_COMMAND, or "none — no test infrastructure"}
- **Lint / type check:** {LINT_COMMAND / TYPE_CHECK_COMMAND, or "not configured — skip"}
- **Base branch / commit format:** {BASE_BRANCH} / {COMMIT_FORMAT}
- **Versioning / milestones / releases:** {conventions from Project Detection, or "none"}
- **Spec:** {SPEC_PATH, "N/A — this phase creates it", or "N/A — simple flow, acceptance criteria are in the PLAN.md tasks"}
- **Plan:** {PLAN_PATH or "N/A — this phase creates it"}

## Task Definition (Phase 3 only)

{TASK_DEFINITION from PLAN.md. When resuming a task with pre-existing or broken files, list what
exists and what is broken so the subagent repairs rather than recreates.}

## Stage (Phase 4 only)

- **Stage:** {verification | delivery} — always state it; the reference defaults to verification
- **Uncommitted/skipped tasks:** {tasks with intended commit messages / skip reasons, or "none"}
- **Delivery only:** {the user's approved decisions (version bump, milestone, release) and the
  complete Stage 1 PR body draft, verbatim}

## Instructions

1. Read `{PHASE_REFERENCE_PATH}` for your full instructions
2. Read the project's `CLAUDE.md` for conventions not already provided above — values in the
   Context block are authoritative and override CLAUDE.md
3. When done, return a structured summary in the exact format (field names and ordering) of the
   reference file's "Return Summary" section
4. If you run low on context, stop at a safe point and return **Status: partial** with what was
   completed and the exact next steps
5. Do NOT interact with the user — return results to the orchestrator
6. Do NOT commit unless your phase instructions explicitly say to
```

### Phase Reference Table

| Phase | Reference | Subagent receives | Subagent produces |
|-------|-----------|-------------------|-------------------|
| 1. SPEC | `references/phase-1-spec.md` | User request, project root | `SPEC.md` + directory (or clarifying questions) |
| 2. PLAN | `references/phase-2-plan.md` | `SPEC.md` path (or the request, if simple), project root | `PLAN.md` + git branch |
| 3. IMPLEMENT | `references/phase-3-implement.md` | Single task definition, `SPEC.md`/`PLAN.md` paths, branch, test command, completed tasks | Tests + code for ONE task (no commit) |
| 4. VERIFY | `references/phase-4-verify.md` | All artifacts, branch, project settings, uncommitted tasks (if any) | Stage 1: verification + PR draft. Stage 2 (after approval): delivery |

## Phase 3 Task Loop

Phase 3 is special: the orchestrator dispatches **one subagent per task**, not one subagent for the entire phase. This keeps each task's RED-GREEN-REFACTOR cycle in a fresh context.

1. **Read PLAN.md** and parse the task list and each task's Status line.
2. **Determine progress:** tasks marked `committed`/`skipped` are done; start at the first pending task.
3. **For each pending task:**

   a. **Dispatch subagent** — Use the dispatch template with the full task definition from PLAN.md, the SPEC.md (or N/A) and PLAN.md paths, the branch, the test command, the list of previously completed tasks, and the instruction: "Do NOT commit. The orchestrator handles commits after user approval."

   b. **Validate results** — The subagent returns a structured summary. Sanity-check it before presenting: if the project has a test runner but zero tests were written, or the files touched don't match the task, treat it as a protocol violation — report it to the user and offer retry with guidance (`references/error-handling.md`) instead of the normal approval prompt.

   c. **Present to user:**
      ```
      Task {N}/{TOTAL}: {TASK_TITLE}
        Status: {pass/fail} — Tests: {count} written, all passing
        Files modified: {list}
        Concerns: {any issues}
      Previously completed: {task titles with commit hashes}
      ```
      Then ask: "Task N is done — tests pass and code is cleaned up. Any feedback before I commit and move to the next task?"

   d. **Handle feedback** — See Review Gate Protocol below.

   e. **Commit on approval** — The orchestrator commits the subagent's reported files directly (message per project format, referencing the task, e.g. `feat(auth): add token validation - task 2/5`). Never include `docs/workflow/` artifacts. Then update the task's **Status** line in PLAN.md to `committed <hash>`.

      **If the commit fails** (sandbox restriction, permission error): don't halt — the work is on disk. Tell the user why, mark the task's Status `done — uncommitted` in PLAN.md, and continue. Phase 4 receives the uncommitted-task list and commits them before delivery.

   f. **Advance** to the next pending task.

4. **All tasks resolved** — When every task is `committed`, `done — uncommitted`, or `skipped` (with the user's consent, surfaced explicitly), announce Phase 3 is done and proceed to Phase 4 detection.

## Review Gate Protocol

The review gate is mandatory after every phase. Present results to the user and wait for explicit approval before proceeding.

**After each phase:** Present a summary (status, files created/modified, key decisions, next phase) and ask whether to proceed or if the user has feedback.

**User approves:** For Phases 1 and 2 — proceed to the next phase. For Phase 3 — commit the task, then dispatch the next task. For Phase 4 — dispatch its **delivery stage** (`phase-4-verify.md`, Delivery section) with the approved decisions and the Stage 1 PR draft verbatim: it executes the approved version bump, deletes `docs/workflow/<feature-name>/`, pushes and creates the PR (when a remote and PR tooling exist), monitors CI, and applies the approved milestone/release decisions. Then the workflow is complete.

**Phase 4 verification bookkeeping:** When Stage 1 reports pending-task commits, update those tasks' Status lines in PLAN.md to `committed <hash>` before presenting the gate; if it reports `commit-restricted`, leave them `done — uncommitted` and warn the user.

**User requests changes:** Dispatch a **new** subagent with the same phase context plus the user's feedback and a note that files on disk already contain the previous subagent's work. Repeat until approved. *Exception:* if feedback at the Phase 4 gate requires code changes, dispatch a Phase 3-style task subagent for the change (the orchestrator commits on approval), then re-dispatch the verification stage; only feedback limited to the PR draft or recommendations re-dispatches verification directly.

**Phase 1 returns questions:** Present the questions to the user, collect answers, and dispatch a new Phase 1 subagent with the original request plus answers. Subagents should return questions even when they could guess — surfacing design decisions is the point.

**Subagent returns an error or `partial`:** See `references/error-handling.md`.

## Abort Protocol

If the user wants to abandon a workflow, handle it directly in the orchestrator (never delegate to a subagent). See `references/abort-protocol.md` for confirmation, pause/abort options, and cleanup.

## Rules

- **Artifacts are the source of truth.** Every decision lives in SPEC.md or PLAN.md, not in conversation context. They are working documents — deleted by Phase 4's delivery stage, never committed.
- **Branch before code.** Every task — simple or standard — must have a `feature/<name>` branch created before any code is written. Never commit directly to the base branch. *Exception:* In worktree environments, the worktree's own branch provides equivalent isolation.
- **Tests before code.** When the project has a test runner, always write failing tests before implementation. Without test infrastructure, verify behavior manually against acceptance criteria.
- **Commit per task.** Each completed task gets its own commit immediately after user approval — before starting the next task. The user reviews every task, not just the phase.
- **Read CLAUDE.md first.** Every project has different commands, conventions, and skills.
- **Phases may span sessions.** Artifacts make that possible. Within a session, on user approval at a gate, proceed directly to the next task or phase — approval, not session boundaries, gates progress.
- **Orchestrator delegates when possible.** With the Agent tool available, all file creation, code writing, and test execution happen inside subagents. The orchestrator performs only git commits, PLAN.md status bookkeeping, and user interaction. When unavailable, execute inline per `references/inline-execution.md` — one gated unit per response (a phase, a single Phase 3 task, or a single Phase 4 stage).
- **One subagent per unit of work.** Phases 1, 2, and each Phase 4 stage get one subagent. Phase 3 gets one subagent per task.
- **Never self-answer clarifying questions.** Surface ambiguity to the user. The cost of one extra exchange is far lower than the cost of a spec built on assumptions.
- **Subagents never interact with the user.** All user-facing communication goes through the orchestrator.
- **New subagent for changes, never re-enter.** If the user requests changes, dispatch a fresh subagent with the feedback.
- **Abort stays in the orchestrator.** The abort protocol is never delegated to a subagent.
