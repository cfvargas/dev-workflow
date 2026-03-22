# Phase 2: PLAN — How to Build It

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

Read `docs/workflow/<feature-name>/SPEC.md`. Understand every requirement, edge case, and acceptance criterion before making technical decisions.

### 3. Create the Feature Branch

The branch name matches the directory name. Check if the branch already exists first:

```bash
git checkout <base-branch>
git pull origin <base-branch>

# Check if branch exists locally
if git show-ref --verify --quiet refs/heads/feature/<feature-name>; then
  # Branch exists — switch to it and rebase on latest base
  git checkout feature/<feature-name>
  git rebase <base-branch>
else
  git checkout -b feature/<feature-name>
fi
```

**If the rebase has conflicts:** Stop the rebase (`git rebase --abort`), inform the user about the conflicting files, and ask how to proceed — merge instead, resolve manually, or start fresh.

If the branch exists from a previous attempt, inform the user and ask whether to continue from the existing branch or start fresh (`git branch -D` + recreate).

### 4. Research the Codebase

Make the architectural decisions:
- Which layers does this touch? (domain, application, infrastructure, UI)
- Which existing patterns to follow? (find similar features and use them as reference)
- What files need to be created vs modified?
- What are the dependencies and contracts?
- Load relevant project-specific skills from `.claude/skills/`

### 5. Write the Plan

Save to `docs/workflow/<feature-name>/PLAN.md`:

```markdown
# Plan: <Feature Name>

> Spec: [SPEC.md](./SPEC.md)
> Branch: `feature/<name>`
> Complexity: simple | standard

## Architecture Decisions
- Which layers this touches and why
- Patterns to follow (with file references)
- Dependencies and contracts

## File Map
Files that will be created or modified, organized by task.

## Tasks

Task ordering matters because Phase 3 executes them sequentially with TDD. The first task should always be writing the failing tests — this ensures the RED step happens before any implementation code exists. Then implementation tasks make those tests pass (GREEN).

**Order: test tasks → implementation tasks → refactor tasks.**

Each task is self-contained — the agent executing it should not need to guess or search for missing context.

### Task 1: Write Failing Tests for <Feature>
**Type:** test
**Files:**
- Create: `exact/path/to/file.ts`
- Modify: `exact/path/to/existing.ts`
- Test: `tests/exact/path/to/file.test.ts`

**Acceptance Criteria** (from spec):
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

### 6. Review the Plan

Before presenting to the user, self-check:
- Are there too many tasks? 3 tasks is better than 7 if 3 covers it.
- Is the agent creating unnecessary abstractions?
- Do test tasks come before implementation tasks?
- Does each task have all the context it needs embedded?
- Are acceptance criteria from the spec mapped to specific tasks?
- **No version bump task.** Version bumping happens in Phase 4, not here. Do not include it as a task in the plan.

### 7. Present for Review

Show the plan to the user. The plan is the last checkpoint before code gets written — it's worth spending time making sure it's pragmatic.

## Exit Criteria

- Feature branch `feature/<feature-name>` created from base branch
- `PLAN.md` is written at `docs/workflow/<feature-name>/PLAN.md`
- Tasks ordered: tests first, then implementation, then refactoring
- User has reviewed and approved the plan
- The user can close this session and start Phase 3 in a new one
