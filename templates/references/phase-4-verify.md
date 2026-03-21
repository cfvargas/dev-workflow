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

### 4. Clean Up Workflow Artifacts

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
