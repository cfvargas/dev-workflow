# Plan: Add Caching

> Spec: [SPEC.md](./SPEC.md)
> Branch: `feature/add-caching`
> Complexity: standard

## Architecture Decisions
- Cache npm registry lookups in `~/.cache/dev-workflow/registry.json` with a 1-hour TTL

## File Map
- Task 1: `src/registry.js`, `tests/registry.test.js`
- Task 2: `src/utils.js`, `tests/utils.test.js`

## Tasks

### Task 1: Cache registry responses
**Status:** pending
**Files:**
- Modify: `src/registry.js`
- Test: `tests/registry.test.js`

**Acceptance Criteria** (from spec):
- Given a cached response younger than 1 hour, When the registry is queried, Then no network request is made

**Steps:**
- [ ] Read/write cache file with timestamp
- [ ] Bypass network on fresh cache

### Task 2: Cache invalidation on update
**Status:** pending
**Files:**
- Modify: `src/utils.js`
- Test: `tests/utils.test.js`

**Acceptance Criteria** (from spec):
- Given the update command runs, When it completes, Then the registry cache is cleared

**Steps:**
- [ ] Clear cache after successful update

## Testing Strategy
- Mock the network layer; assert call counts against cache state
