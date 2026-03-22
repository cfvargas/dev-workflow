# Phase 4: VERIFY — Quality Gates + Delivery

## Subagent Context

You are a subagent executing Phase 4 (VERIFY) of the SDD workflow. Your job is to run quality checks, clean up workflow artifacts, create a PR, and return a structured summary with recommendations to the orchestrator. You do NOT interact with the user directly — all user communication goes through the orchestrator that dispatched you.

**What you received from the orchestrator:**
- Feature name and branch name
- Project root path
- Paths to SPEC.md and PLAN.md
- Project settings from CLAUDE.md (test command, lint command, type-check command, commit format, versioning scheme, milestone conventions, release conventions)
- Base branch name

**Before you begin:** Read the project's `CLAUDE.md` (or `AGENTS.md`) for conventions, especially quality check commands, versioning, milestones, and release practices.

---

**Goal:** Pass all quality checks and deliver the work.

**Input:** Code from Phase 3 with all tests passing.

**Output:** Verification results, PR (if applicable), and recommendations for the orchestrator.

## Steps

### 1. Run Full Verification Suite

Run quality checks from CLAUDE.md. Only run commands that are actually configured in the project:

```bash
<test-command>                    # always run
<lint-command>                    # only if defined in CLAUDE.md
<type-check-command>              # only if defined in CLAUDE.md
```

If CLAUDE.md doesn't define a lint or type-check command, skip it — don't guess or use defaults. All configured checks must pass. If anything fails, fix it and re-run. Do not proceed with failures.

### 2. Prepare Summary

Compile a summary of:
- What was implemented (link back to the spec's purpose)
- Files created and modified
- Test coverage added (which acceptance criteria are covered)
- Any decisions made during implementation that deviated from the plan

### 3. Clean Up Workflow Artifacts

Workflow artifacts (`docs/workflow/`) are local working documents that should never be committed to git. Delete them before creating the PR:

```bash
rm -rf docs/workflow/<feature-name>
rmdir docs/workflow 2>/dev/null
```

Since these files were never tracked by git, there is nothing to stage — just delete them locally. If for some reason they were accidentally committed earlier, stage the deletion with `git add` and include it in the PR.

### 4. Deliver

Create the PR. Stage source and test files, commit with conventional format, push and create the PR.

**When committing:**
- NEVER include workflow artifacts (`docs/workflow/`)
- Only stage source code and test files
- Use the commit format from the project's CLAUDE.md

**PR body template:**
```markdown
## Summary
<1-3 sentences: what this PR does and why, derived from the spec's Purpose section>

## Changes
- <bullet list of key changes>

## Test plan
- <how acceptance criteria were verified>
```

**After creating the PR**, check if CI passes. If CI fails:
1. Read the failure logs
2. Fix the issue locally
3. Push the fix — do NOT force-push, just add a new commit
4. Confirm CI passes before moving on

### 5. Assess Release & Milestone

Check the project's `CLAUDE.md` for versioning, milestone, and release conventions. Do NOT execute version bumps, milestone assignments, or releases directly. Instead, return **recommendations** to the orchestrator, which will handle user interaction.

**Version bump recommendation:**
- If the project has versioning conventions: recommend the appropriate bump (PATCH for fixes, MINOR for features, MAJOR for breaking changes) and identify the file to update (e.g., `package.json`, `Cargo.toml`, `pyproject.toml`).
- If the project has no versioning convention: note this and recommend asking the user.

**Milestone recommendation:**
- Check if open milestones exist in the repo.
- If milestones exist: list them and recommend which one to assign (or recommend creating a new one).
- If no milestones exist: recommend creating one matching the version.

**Release recommendation:**
- Note whether a release should be created after merge (based on project conventions).
- If the milestone has remaining open issues/PRs, recommend NOT creating the release yet.
- If the milestone would be fully closed, recommend creating a GitHub release with a version tag.

## Exit Criteria

- All quality checks pass (tests, lint, types)
- Workflow artifacts deleted
- PR created (if applicable)
- Release and milestone recommendations prepared for the orchestrator

## Return Summary

When you are done, return a structured summary to the orchestrator in this format:

- **Status:** pass | fail (include reason if fail)
- **Verification results:**
  - Tests: pass/fail
  - Lint: pass/fail/skipped (not configured)
  - Type check: pass/fail/skipped (not configured)
  - Fixes applied: list any issues that were fixed during verification
- **PR:** URL (if created) | not created (include reason)
- **CI status:** pass/fail/pending (if PR was created)
- **Files summary:** files created, modified, and deleted across the feature
- **Version bump recommendation:** what to bump, which file, what version (or "no versioning configured")
- **Milestone recommendation:** assign to existing (name), create new (name), or "no milestone conventions"
- **Release recommendation:** create release after merge (yes/no), release notes summary (if yes), or "milestone still has open items"
- **Issues or concerns:** anything the orchestrator should know
