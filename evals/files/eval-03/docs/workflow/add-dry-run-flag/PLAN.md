# Plan: Add Dry Run Flag

> Spec: [SPEC.md](./SPEC.md)
> Branch: `feature/add-dry-run-flag`
> Complexity: standard

## Architecture Decisions
- Add a `dryRun` option to `copyTemplates` in `src/utils.js` — collect actions instead of executing them
- Flag parsing lives in `bin/dev-workflow.js`, following the existing `--global` flag pattern

## File Map
- Task 1: `src/utils.js`, `tests/utils.test.js`
- Task 2: `src/init.js`, `tests/init.test.js`
- Task 3: `bin/dev-workflow.js`, `tests/cli.test.js`

## Tasks

### Task 1: Collect planned actions in copyTemplates
**Status:** committed a1b2c3d
**Files:**
- Modify: `src/utils.js`
- Test: `tests/utils.test.js`

**Acceptance Criteria** (from spec):
- Given dryRun is true, When copyTemplates runs, Then it returns the action list and writes nothing

**Steps:**
- [x] Add dryRun parameter and action collection
- [x] Return actions without writing when dryRun

### Task 2: Thread dry-run through init
**Status:** committed e4f5a6b
**Files:**
- Modify: `src/init.js`
- Test: `tests/init.test.js`

**Acceptance Criteria** (from spec):
- Given dryRun is true, When init runs against an existing install, Then files are labeled "overwrite" and none are written

**Steps:**
- [x] Pass dryRun from init options to copyTemplates
- [x] Label create vs overwrite per destination state

### Task 3: Add --dry-run flag to the CLI
**Status:** pending
**Files:**
- Modify: `bin/dev-workflow.js`
- Test: `tests/cli.test.js`

**Acceptance Criteria** (from spec):
- Given the install command, When --dry-run is passed, Then the planned actions print and exit code is 0

**Steps:**
- [ ] Parse the --dry-run flag
- [ ] Print the action list in a readable format
- [ ] Exit 0 on success

## Testing Strategy
- Unit tests per task file; CLI test spawns the bin with --dry-run and asserts no writes via a temp dir
