# Phase 4: VERIFY — Quality Gates + Delivery

**Goal:** Pass all quality checks and deliver the work.

**Input:** Code from Phase 3 with all tests passing.

**Output:** Committed code or pull request.

## Steps

### 1. Run Full Verification Suite

Run quality checks from CLAUDE.md. Only run commands that are actually configured in the project:

```bash
<test-command>                    # always run
<lint-command>                    # only if defined in CLAUDE.md
<type-check-command>              # only if defined in CLAUDE.md
```

If CLAUDE.md doesn't define a lint or type-check command, skip it — don't guess or use defaults. All configured checks must pass. If anything fails, fix it and re-run. Do not proceed with failures.

### 2. Present Summary

Show the user:
- What was implemented (link back to the spec's purpose)
- Files created and modified
- Test coverage added (which acceptance criteria are covered)
- Any decisions made during implementation that deviated from the plan

### 3. Deliver

Ask the user how to proceed:

1. **Commit and create PR** — stage source and test files, commit with conventional format, push and create PR
2. **Review changes first** — let the user inspect the diff before committing
3. **Make adjustments** — address any final feedback

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

**When committing:**
- NEVER include workflow artifacts (`docs/workflow/`)
- Only stage source code and test files
- Use the commit format from the project's CLAUDE.md

### 4. Release & Milestone

This step is not optional when the project has versioning or milestone conventions in CLAUDE.md — if the project defines them, you must follow through.

Check the project's `CLAUDE.md` for versioning, milestone, and release conventions:
- **Conventions exist:** Follow them. Always ask the user about version bump and milestone assignment.
- **No conventions defined** (or no `CLAUDE.md`): Ask the user: "Would you like to set up a milestone and release for this PR?"
- If the user explicitly declines, skip to the next step.

**Version bump (this is the only place where version gets bumped — not in Phase 3):**
- Bump the version in the appropriate file (e.g., `package.json`, `Cargo.toml`, `pyproject.toml`) according to the versioning scheme (semver: PATCH for fixes, MINOR for features, MAJOR for breaking changes).
- If the project has no versioning convention, ask the user what version to use.
- Commit the version bump separately (e.g., `chore: bump version to 1.4.0`).

**Milestone:**
- Check if open milestones exist in the repo.
- If one or more exist, show them to the user and ask: assign this PR to an existing milestone, or create a new one?
- If none exist, create a new milestone matching the version (e.g., `v1.2.0`) and assign the PR.

**After merge:**
- If the milestone has remaining open issues/PRs, do NOT create the release yet — the milestone is still in progress. Inform the user.
- If the milestone is now fully closed (all issues/PRs done), create a GitHub release with the version tag (e.g., `v1.2.0`). Write release notes summarizing everything in the milestone, not just this PR.

### 5. Clean Up Workflow Artifacts

Workflow artifacts (`docs/workflow/`) are local working documents that should never be committed to git. Delete them before creating the PR:

```bash
rm -rf docs/workflow/<feature-name>
rmdir docs/workflow 2>/dev/null
```

Since these files were never tracked by git, there is nothing to stage — just delete them locally. If for some reason they were accidentally committed earlier, stage the deletion with `git add` and include it in the PR.

## Exit Criteria

- All quality checks pass (tests, lint, types)
- Version bumped (if project uses versioning)
- Milestone assigned to PR (if project uses milestones)
- Workflow artifacts deleted
- Code is committed or PR is created
- Workflow complete
