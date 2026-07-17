# Phase 2: PLAN — How to Build It

## Subagent Context

You are a subagent executing Phase 2 (PLAN) of the SDD workflow. Your job is to produce an implementation plan (`PLAN.md`), create the feature branch, and return a structured summary to the orchestrator. You do NOT interact with the user directly — all user communication goes through the orchestrator that dispatched you.

**What you received from the orchestrator:**
- Feature name
- Project root path
- Path to SPEC.md (read it first) — or, if Phase 1 was skipped (simple task), the user's request description
- Base branch name
- Project settings (test command, commit format, etc.)

**Before you begin:** Read the project's `CLAUDE.md` (or `AGENTS.md`) for conventions, domain context, and project-specific skills. Settings already provided in your dispatch context are authoritative and override CLAUDE.md.

---

**Goal:** Translate the spec into a technical implementation plan with ordered, self-contained tasks. Create the feature branch.

**Input:** `docs/workflow/<feature-name>/SPEC.md` (read it first). If Phase 1 was skipped (simple task), gather context from the user's request.

**Output:** `docs/workflow/<feature-name>/PLAN.md` + git branch `feature/<feature-name>` created.

## Steps

### 1. Identify the Feature

Find the existing workflow directory in `docs/workflow/`. The directory name IS the feature name (set in Phase 1).

If Phase 1 was skipped (simple task), define the feature name now and create the directory:
```bash
mkdir -p docs/workflow/<feature-name>
```

### 2. Read the Spec

Read `docs/workflow/<feature-name>/SPEC.md`. Understand every requirement, edge case, and acceptance criterion before making technical decisions. In the simple flow there is no SPEC.md — derive acceptance criteria from the user's request and embed them in the tasks.

### 3. Create the Feature Branch

**Worktree check first:** If you are operating inside a git worktree (e.g., `.claude/worktrees/`), skip this entire step — no checkout, no pull, no branch creation. The worktree is already on its own isolated branch; record that branch name in your return summary as the working branch.

Otherwise, the branch name matches the directory name. Check if the branch already exists first:

```bash
git checkout <base-branch>
# Pull only if a remote exists — a missing remote is not a failure, just note it in the summary
git remote get-url origin > /dev/null 2>&1 && git pull origin <base-branch>

# Check if branch exists locally
if git show-ref --verify --quiet refs/heads/feature/<feature-name>; then
  # Branch exists — switch to it and rebase on latest base
  git checkout feature/<feature-name>
  git rebase <base-branch>
else
  git checkout -b feature/<feature-name>
fi
```

**If the rebase has conflicts:** Stop the rebase (`git rebase --abort`) and report the conflicting files in your return summary. The orchestrator will handle user interaction about how to proceed.

If the branch exists from a previous attempt, note this in your return summary so the orchestrator can inform the user.

### 4. Research the Codebase

Make the architectural decisions:
- Which layers does this touch? (domain, application, infrastructure, UI)
- Which existing patterns to follow? (find similar features and use them as reference)
- What files need to be created vs modified?
- What are the dependencies and contracts?
- Load relevant project-specific skills from `.claude/skills/`
- **Address NFRs from the spec:** If the spec includes non-functional requirements (performance, observability, constraints), the architecture decisions must explain HOW each one will be met. The spec says "what" — the plan says "how."

### 5. Write the Plan

Save to `docs/workflow/<feature-name>/PLAN.md`:

```markdown
# Plan: <Feature Name>

> Spec: [SPEC.md](./SPEC.md)  (omit in the simple flow)
> Branch: `feature/<name>`
> Complexity: simple | standard

## Architecture Decisions
- Which layers this touches and why
- Patterns to follow (with file references)
- Dependencies and contracts

## File Map
Files that will be created or modified, organized by task.

## Tasks

Each task is a **vertical slice**: one coherent unit of behavior that Phase 3 implements with its own RED → GREEN → REFACTOR cycle. The task's tests are written INSIDE that cycle, driven by the task's acceptance criteria — do NOT create separate "write the tests" tasks. A tests-only task can never pass Phase 3's full-suite regression check.

Order tasks by dependency: foundations first, then features that build on them. Each task is self-contained — the agent executing it should not need to guess or search for missing context.

### Task 1: <Descriptive Name>
**Status:** pending
**Files:**
- Create: `exact/path/to/file.ts`
- Modify: `exact/path/to/existing.ts`
- Test: `tests/exact/path/to/file.test.ts`

**Acceptance Criteria** (from spec, or from the request in the simple flow):
- Given X, When Y, Then Z

**Steps:**
- [ ] Step 1 (one action, 2-5 min max)
- [ ] Step 2
- [ ] Step 3

### Task 2: <Descriptive Name>
...

## Testing Strategy
- Which acceptance criteria map to which tests
- Mocking strategy (what to mock, what to hit real)
- Edge cases from spec that need explicit test coverage
```

The **Status** line is bookkeeping the orchestrator updates as the workflow advances (`pending` → `committed <hash>` / `done — uncommitted` / `skipped — <reason>`). Always initialize it to `pending`.

### 6. Self-Check

Before returning results, verify:
- Are there too many tasks? 3 tasks is better than 7 if 3 covers it.
- Is the agent creating unnecessary abstractions?
- Is each task a vertical slice with its own acceptance criteria and test file paths — so Phase 3 can run a full RED → GREEN → REFACTOR cycle on it?
- Does each task have all the context it needs embedded?
- Are acceptance criteria from the spec mapped to specific tasks?
- **No version bump task.** Version bumping happens in Phase 4's delivery stage, not here. Do not include it as a task in the plan.

## Exit Criteria

- Feature branch `feature/<feature-name>` created from base branch — or, in a worktree environment, the worktree branch recorded as the working branch
- `PLAN.md` is written at `docs/workflow/<feature-name>/PLAN.md`
- Tasks ordered by dependency; every task is a self-contained vertical slice with `Status: pending`

## Return Summary

When you are done, return a structured summary to the orchestrator in this format:

- **Status:** pass | partial (ran low on context — include exact next steps) | fail (error encountered)
- **Branch:** name of the branch created or checked out (e.g., `feature/add-ssl-filters`)
- **Branch note:** newly created, already existed, worktree branch used, or no remote configured (pull skipped)
- **PLAN.md summary:**
  - Complexity: simple | standard
  - Number of tasks
  - Task list with titles (brief)
  - Architecture decisions (brief)
- **Rebase conflicts:** yes/no — if yes, list conflicting files
- **Issues or concerns:** anything the orchestrator should know
