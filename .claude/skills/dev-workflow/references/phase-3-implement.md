# Phase 3: IMPLEMENT — Iterative RED → GREEN → REFACTOR

**Goal:** For each task in the plan, follow the TDD cycle: write failing tests (RED), implement until they pass (GREEN), refactor, and then review with the user before moving on. This keeps changes small, reviewable, and correctable.

**Input:** `docs/workflow/<feature-name>/PLAN.md` and `docs/workflow/<feature-name>/SPEC.md` (read both first).

**Output:** All tasks implemented with passing tests, reviewed incrementally by the user.

## Precondition

The plan must exist and be approved. If `PLAN.md` doesn't exist, go back to Phase 2.

You must be on the feature branch (`feature/<feature-name>`), NOT on the base branch. If you are on the base branch, go back to Phase 2 to create the branch before writing any code.

## The Iteration Loop

Work through tasks **one at a time**, in the order defined in PLAN.md. For each task:

```
┌──────────────────────────────────────────────┐
│  Task N                                      │
│                                              │
│  1. RED     — Write tests (they fail)        │
│  2. GREEN   — Implement (tests pass)         │
│  3. REFACTOR — Clean up code, review quality │
│  4. REVIEW  — User checks & gives feedback   │
│     ├─ OK → next task                        │
│     └─ Feedback → adjust, re-verify          │
└──────────────────────────────────────────────┘
```

Do NOT jump ahead to the next task until the user approves the current one. This is the core principle: small iterations with feedback between each one.

## Step 1: RED — Write Failing Tests

Write ONLY the test files for the current task. Do NOT write any implementation code. Do NOT write tests for other tasks.

Each Given/When/Then from the acceptance criteria should map to at least one test case. Test names should describe the expected behavior, not the implementation detail.

After writing each test file, run ONLY the tests you wrote:
```bash
<test-command> <path-to-test-file>
```

Confirm they FAIL as expected. Failures must be because the feature doesn't exist — not syntax errors or broken imports. If a test fails for the wrong reason, fix it before continuing.

### Verify RED

- [ ] Tests exist and are syntactically correct
- [ ] Tests FAIL (not pass, not error)
- [ ] Failures are because the feature doesn't exist
- [ ] Test names clearly describe expected behavior
- [ ] Only the current task's acceptance criteria are covered

**Hard gate:** All of the above must be true before moving to the BUILD step.

## Step 2: GREEN — Implement

Write the MINIMUM implementation code to make the current task's tests pass. Do not add features beyond what the tests require. Do not touch code related to other tasks.

After writing implementation code, run ONLY the current task's tests:
```bash
<test-command> <path-to-test-file>
```

Confirm ALL tests pass. Do NOT run lint or type checks — those run in Phase 4.

### Verify GREEN

- [ ] All current task's tests pass
- [ ] Implementation follows project patterns
- [ ] No features beyond what tests require
- [ ] Previously passing tests from earlier tasks still pass

## Step 3: REFACTOR & REVIEW

Once the current task's tests pass, clean up the code before presenting it to the user.

### 3a. Refactor

Review the current task's files for:
- Code smells and duplication
- Naming clarity
- Patterns that don't match project conventions
- Unnecessary complexity
- Security concerns

If issues are found, fix them. After each change, re-run the tests to confirm they still pass.

### 3b. Review with User

Present the current task's results:

- **What was done:** Brief summary of the task
- **Tests written:** List of test cases and what they verify
- **Code written:** Files created/modified
- **Refactor notes:** What was cleaned up (if anything)
- **Test results:** Passing confirmation

Then ask:

> "Task N is done — tests pass and code is cleaned up. Any feedback or adjustments before moving to the next task?"

**If the user has feedback:**
1. Apply the changes
2. Re-run the task's tests to confirm everything still passes
3. Present the updated results
4. Ask again if they're satisfied

**If the user approves:**
1. **Commit the task** — stage the test and implementation files for the current task and create a commit using the project's commit format (from CLAUDE.md). The commit message should reference the task (e.g., `feat(auth): add token validation - task 2/5`). Do NOT include workflow artifacts (`docs/workflow/`).
2. Move to the next task and repeat from Step 1.

## Task Progress Tracking

Keep the user oriented by showing progress at each step:

```
Task 2/5: Add validation logic
  ✓ Tests written (3 test cases)
  ✓ Implementation complete
  ✓ Refactored
  → Waiting for your review

Task 1/5: Create user model  ✓ Committed (a1b2c3d)
```

## Exit Criteria

- All tasks from the plan have been implemented
- Each task was reviewed, approved, and committed individually
- All tests pass
- Refactor done per task (not deferred to the end)
- Ready for Phase 4 (VERIFY)
