# Plan: Add Webhooks

> Spec: [SPEC.md](./SPEC.md)
> Branch: `feature/add-webhooks`
> Complexity: standard

## Architecture Decisions
- Webhook config read from `.dev-workflow.json` at the project root
- Delivery via `fetch` with a 5s timeout; failures downgrade to warnings

## File Map
- Task 1: `src/config.js`, `tests/config.test.js`
- Task 2: `src/webhook.js`, `tests/webhook.test.js`
- Task 3: `src/init.js`, `tests/init.test.js`
- Task 4: `src/update.js`, `tests/update.test.js`

## Tasks

### Task 1: Read webhook config
**Status:** committed 1a2b3c4
**Files:**
- Create: `src/config.js`
- Test: `tests/config.test.js`

**Acceptance Criteria** (from spec):
- Given a `.dev-workflow.json` with a webhook URL, When config is loaded, Then the URL is returned; absent config returns null

**Steps:**
- [x] Load and validate config file

### Task 2: Webhook delivery module
**Status:** committed 5d6e7f8
**Files:**
- Create: `src/webhook.js`
- Test: `tests/webhook.test.js`

**Acceptance Criteria** (from spec):
- Given an unreachable endpoint, When an event is sent, Then a warning is returned and no exception escapes

**Steps:**
- [x] POST payload with timeout
- [x] Downgrade failures to warnings

### Task 3: Emit install event
**Status:** committed 9a8b7c6
**Files:**
- Modify: `src/init.js`
- Test: `tests/init.test.js`

**Acceptance Criteria** (from spec):
- Given a configured webhook, When install completes, Then an `install` event is POSTed

**Steps:**
- [x] Wire webhook call into init completion

### Task 4: Emit update event
**Status:** committed d4c3b2a
**Files:**
- Modify: `src/update.js`
- Test: `tests/update.test.js`

**Acceptance Criteria** (from spec):
- Given a configured webhook, When update completes, Then an `update` event is POSTed

**Steps:**
- [x] Wire webhook call into update completion

## Testing Strategy
- Mock fetch; assert payloads and warning behavior per acceptance criteria
