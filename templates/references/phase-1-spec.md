# Phase 1: SPEC — What, Not How

**Goal:** Define the feature functionally. Technology-agnostic. No implementation decisions.

**Input:** User's request or ticket description.

**Output:** `docs/workflow/<feature-name>/SPEC.md` + directory created

## Why a Separate Spec?

When functional requirements and technical decisions are mixed in the same document, the agent juggles two concerns simultaneously. Technical decisions create branching paths that compound ambiguity. A pure functional spec gives a clear objective without premature implementation choices. It also defines expected behavior for edge cases before anyone writes a line of code.

## Steps

### 1. Explore the Codebase

Investigate the domain area relevant to the task:
- Identify what already exists vs what's new
- Understand existing business rules and entities
- Check for related types, validations, and patterns
- Load relevant project-specific skills from `.claude/skills/`

### 2. Eliminate Ambiguity

Ask clarifying questions about things you cannot resolve by reading the code. Group questions together. Focus on the "silent decisions" that agents normally guess wrong:

- Authorization — who can do this?
- Idempotency — what happens if the action is repeated?
- Edge cases — empty states, errors, limits, concurrent access
- Scope — which specific system/component is involved?
- Existing behavior — does this replace or extend something?

### 3. Define Feature Name and Create Directory

Derive a short, descriptive kebab-case name from the task (e.g., `add-ssl-filters`, `fix-pagination-bug`). This name will be used for both the directory and the git branch in Phase 2.

```bash
mkdir -p docs/workflow/<feature-name>
```

### 4. Write the Spec

Save to `docs/workflow/<feature-name>/SPEC.md`:

```markdown
# Spec: <Feature Name>

## Purpose
One paragraph: what this feature does and why it exists.

## Use Cases
- As a [role], I want to [action] so that [benefit]

## Requirements
- [ ] Requirement 1
- [ ] Requirement 2
(functional requirements — not technical decisions)

## Edge Cases
- What happens when [scenario]?
- What happens if [error condition]?
(every edge case you can identify — this is where ambiguity hides)

## Acceptance Criteria

Given [precondition]
When [action]
Then [expected result]

Given [precondition]
When [action]
Then [expected result]

(one block per behavior — these drive the RED step in Phase 3's per-task loop)

## Out of Scope
- Things this feature explicitly does NOT do
```

### 5. Present for Review

Show the spec to the user. The spec is not ready until the user approves it.

Common review questions:
- Are there edge cases missing?
- Are the acceptance criteria complete?
- Is anything listed that should be out of scope (or vice versa)?

## Exit Criteria

- Feature name defined (e.g., `add-ssl-filters`)
- Directory created at `docs/workflow/<feature-name>/`
- `SPEC.md` written inside that directory
- User has reviewed and approved the spec
- The user can close this session and start Phase 2 in a new one
