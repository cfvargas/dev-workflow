# Plan: Fix Timeout

> Branch: `feature/fix-timeout`
> Complexity: simple

## Architecture Decisions
- Raise the registry fetch timeout from 3s to 15s and surface a clear error message on expiry

## File Map
- Task 1: `src/registry.js`, `tests/registry.test.js`

## Tasks

### Task 1: Raise fetch timeout and improve the error
**Status:** pending
**Files:**
- Modify: `src/registry.js`
- Test: `tests/registry.test.js`

**Acceptance Criteria** (from the request):
- Given the registry takes 10s to respond, When the version check runs, Then it succeeds instead of timing out
- Given the registry never responds, When the timeout expires, Then the user sees "registry timed out after 15s" instead of a stack trace

**Steps:**
- [ ] Raise the timeout constant to 15s
- [ ] Wrap the timeout error with a readable message

## Testing Strategy
- Fake timers to simulate slow and unresponsive registry
