# Plan: Fix Logging

> Branch: `feature/fix-logging`
> Complexity: simple

## Architecture Decisions
- Route all CLI output through a single `log` helper in `src/logger.js` so verbosity can be controlled centrally

## File Map
- Task 1: `src/logger.js`, `tests/fix-logging.test.js`
- Task 2: `bin/dev-workflow.js`

## Tasks

### Task 1: Central logger with levels
**Status:** pending
**Files:**
- Create: `src/logger.js`
- Test: `tests/fix-logging.test.js`

**Acceptance Criteria** (from the request):
- Given level "quiet", When log.info is called, Then nothing is printed
- Given level "normal", When log.info is called, Then the message prints to stdout

**Steps:**
- [ ] Implement logger with quiet/normal levels
- [ ] Make existing tests pass

### Task 2: Route CLI output through the logger
**Status:** pending
**Files:**
- Modify: `bin/dev-workflow.js`

**Acceptance Criteria** (from the request):
- Given any command, When it prints, Then output goes through the logger helper

**Steps:**
- [ ] Replace direct console.log calls in the bin entry

## Testing Strategy
- Unit tests capture stdout; task 1's test file exists but currently fails to import the not-yet-created logger module
