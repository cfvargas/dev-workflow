# Phase 4: VERIFY — Quality Gates + Delivery

Phase 4 runs in **two stages**, each dispatched as its own subagent:

1. **Verification stage** — run quality checks, commit any pending Phase 3 tasks, prepare the summary and PR draft. Nothing outward-facing happens here: no artifact deletion, no push, no PR.
2. **Delivery stage** — dispatched only AFTER the user approves the verification results at the review gate. Executes the approved recommendations and delivers.

This split exists so the user approves before anything leaves the machine, and so `docs/workflow/` artifacts survive until the results are accepted (a change request re-dispatches verification with the artifacts still on disk).

## Subagent Context (both stages)

You are a subagent executing Phase 4 (VERIFY) of the SDD workflow. You do NOT interact with the user directly — all user communication goes through the orchestrator that dispatched you. Your dispatch prompt states which stage you are executing; if no stage is stated, default to the verification stage — never assume delivery.

**What you received from the orchestrator:**
- Feature name and branch name
- Project root path
- Paths to SPEC.md and PLAN.md (SPEC.md is "N/A — simple flow" when Phase 1 was skipped)
- Project settings (test command, lint command, type-check command, commit format, versioning scheme, milestone conventions, release conventions) — values provided here are authoritative and override CLAUDE.md
- Base branch name
- Uncommitted tasks from Phase 3, if any (task list with intended commit messages)
- Skipped tasks, if any (with reasons)
- Delivery stage only: the user's approved decisions (version bump yes/no, milestone, release) and the complete PR body draft from Stage 1 (use it verbatim)

**Before you begin:** Read the project's `CLAUDE.md` (or `AGENTS.md`) for conventions not already provided.

---

## Stage 1: Verification

**Goal:** Prove the work passes every configured quality gate and package the results for user review.

### 1. Commit Pending Tasks

If the orchestrator reported uncommitted tasks from Phase 3 (e.g., a sandbox blocked commits earlier), try to commit them now: one commit per task, in task order, using each task's intended message. Never include `docs/workflow/` artifacts. If committing is still impossible, continue with verification and report `commit-restricted` in the Pending-task commits field — with all checks passing this is still `Status: pass`; the orchestrator warns the user.

### 2. Run Full Verification Suite

Run quality checks from your dispatch context. Only run commands that are actually configured:

```bash
<test-command>                    # if configured
<lint-command>                    # only if configured
<type-check-command>              # only if configured
```

If a lint or type-check command is not configured, skip it — don't guess or use defaults. All configured checks must pass. If anything fails, fix it and re-run — then commit the fixes you made (one commit, per the project's commit format, never including `docs/workflow/`) so the delivery push carries them. Do not proceed with failures.

**No test infrastructure:** If the test command is "none", skip the automated run and instead verify each task's acceptance criteria manually (run the app, check outputs), documenting what was verified and how. Recommend adding a test setup, but do not require it.

### 3. Prepare Summary and PR Draft

Compile:
- What was implemented (link back to the spec's purpose — or, in the simple flow, the request and the PLAN.md acceptance criteria)
- Files created and modified
- Test coverage added (which acceptance criteria are covered)
- Skipped tasks, listed explicitly with their unimplemented acceptance criteria (a "Not included" section in the PR body) — the PR must never overstate what was delivered
- Any decisions made during implementation that deviated from the plan
- A complete PR body draft (see the template below), derived from `SPEC.md` (especially Purpose) — or from PLAN.md in the simple flow

Prepare the full PR body NOW: the delivery stage deletes `docs/workflow/` before creating the PR and must not need to re-read it.

### 4. Assess Release & Milestone

Do NOT execute version bumps, milestone assignments, or releases. Return **recommendations** for the user to approve:

- **Version bump:** If the project has versioning conventions, recommend the bump (PATCH fixes / MINOR features / MAJOR breaking) and the file to update (e.g., `package.json`, `pyproject.toml`). If none, say "no versioning configured".
- **Milestone:** Only if the project's conventions mention milestones — check open milestones and recommend which to assign or whether to create one. Otherwise return "no milestone conventions" and make no recommendation.
- **Release:** Only if conventions mention releases — recommend whether to create one after merge (not yet, if the milestone still has open items). Otherwise "no release conventions".

### Stage 1 Exit Criteria

- All configured quality checks pass (or acceptance criteria manually verified when no test infrastructure exists)
- Pending Phase 3 tasks committed (or `commit-restricted` reported)
- PR body draft complete and self-contained
- Recommendations prepared — nothing pushed, nothing deleted, no PR created

## Stage 2: Delivery (only after user approval)

**Goal:** Execute the approved decisions and deliver the work.

0. **Guard: no uncommitted work leaves Phase 3 behind.** If the dispatch lists uncommitted tasks, commit them first (one commit per task, intended messages). If committing is still impossible, STOP — return `Status: fail` with reason `commit-restricted`. Never push or delete workflow artifacts while task work is uncommitted.
1. **Apply the approved version bump** (if the user accepted one): edit the version file, commit it per the project's commit format.
2. **Deliver** — If a remote and PR tooling exist: push the branch and create the PR using the Stage 1 draft verbatim. If there is no remote or no PR tooling, make sure everything is committed locally and report `PR: not created (no remote/tooling)` — this is a valid outcome, not a failure.

   *Accidentally committed artifacts:* if `docs/workflow/` was ever committed, delete it and stage the deletion BEFORE pushing, so the PR excludes it.

   **PR body template:**
   ```markdown
   ## Summary
   <from the Stage 1 draft>

   ## Changes
   - <bullet list of key changes>

   ## Test plan
   - <how acceptance criteria were verified>
   ```
3. **Clean up workflow artifacts** — only after the push/PR (or the local-delivery outcome) succeeded, so a delivery failure never destroys the resumable state:
   ```bash
   rm -rf docs/workflow/<feature-name>
   rmdir docs/workflow 2>/dev/null
   ```
   These files were never tracked by git, so there is nothing to stage.
4. **CI** — After creating the PR, check whether CI passes. If it fails: read the logs, fix locally, push a new commit (never force-push), and confirm CI passes.
5. **Milestone / release** — Apply only what the user approved: assign the milestone and/or note the release decision.

### Stage 2 Exit Criteria

- Approved version bump applied and committed (if any)
- Workflow artifacts deleted
- PR created, or the no-remote outcome reported
- Approved milestone/release decisions applied

## Return Summary

Return a structured summary to the orchestrator in this format (fields marked *S2* only apply to the delivery stage):

- **Status:** pass | partial (ran low on context — include exact next steps) | fail (include the reason; in the delivery stage, blocked commits are `fail` with reason `commit-restricted`)
- **Stage:** verification | delivery
- **Verification results:**
  - Tests: pass/fail/manual (no test infrastructure — list what was verified)
  - Lint: pass/fail/skipped (not configured)
  - Type check: pass/fail/skipped (not configured)
  - Fixes applied: issues fixed during verification
- **Pending-task commits:** committed (hashes) | none | commit-restricted
- **PR body draft:** the complete draft (verification stage)
- **PR:** *S2* URL | not created (reason)
- **CI status:** *S2* pass/fail/pending
- **Files summary:** files created, modified, and deleted across the feature
- **Version bump recommendation:** what to bump, which file, what version (or "no versioning configured") — *S2*: what was applied
- **Milestone recommendation:** assign to existing (name), create new (name), or "no milestone conventions" — *S2*: what was applied
- **Release recommendation:** create after merge (yes/no + notes summary) or "no release conventions" — *S2*: what was decided
- **Issues or concerns:** anything the orchestrator should know
