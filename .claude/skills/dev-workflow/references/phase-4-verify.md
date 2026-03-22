# Phase 4: VERIFY — Quality Gates + Delivery

**Goal:** Pass all quality checks and deliver the work.

**Input:** Code from Phase 3 with all tests passing.

**Output:** Committed code or pull request.

## Steps

### 1. Run Full Verification Suite

Run all quality checks sequentially:

```bash
<test-command> && <lint-command> && <type-check-command>
```

All must pass. If anything fails, fix it and re-run. Do not proceed with failures.

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

**When committing:**
- NEVER include workflow artifacts (`docs/workflow/`)
- Only stage source code and test files
- Use the commit format from the project's CLAUDE.md

### 4. Release & Milestone (if project uses them)

Check the project's `CLAUDE.md` for versioning, milestone, and release conventions. If defined:

**Version bump:**
- Bump the version in the appropriate file (e.g., `package.json`, `Cargo.toml`, `pyproject.toml`) according to the versioning scheme (semver: PATCH for fixes, MINOR for features, MAJOR for breaking changes).
- This should already be part of the PR from Phase 3. If not, add it now.

**Milestone:**
- Check if open milestones exist in the repo.
- If one or more exist, show them to the user and ask: assign this PR to an existing milestone, or create a new one?
- If none exist, create a new milestone matching the version (e.g., `v1.2.0`) and assign the PR.

**After merge:**
- If the milestone has remaining open issues/PRs, do NOT create the release yet — the milestone is still in progress. Inform the user.
- If the milestone is now fully closed (all issues/PRs done), create a GitHub release with the version tag (e.g., `v1.2.0`). Write release notes summarizing everything in the milestone, not just this PR.

If `CLAUDE.md` does not define versioning/release conventions, skip this step entirely.

### 5. Clean Up Workflow Artifacts

After the code is committed/PR is created, offer to clean up the workflow directory:

```bash
rm -rf docs/workflow/<feature-name>
```

If `docs/workflow/` is now empty, remove it too:
```bash
rmdir docs/workflow 2>/dev/null
```

The user may choose to keep artifacts for reference — ask before deleting. If kept, they should NOT be committed (they're already in `.gitignore` or excluded via the "NEVER include workflow artifacts" rule).

## Exit Criteria

- All quality checks pass (tests, lint, types)
- Code is committed or PR is created
- Workflow artifacts cleaned up (or user chose to keep them)
- Workflow complete
