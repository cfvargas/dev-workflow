# Phase 1: SPEC — What, Not How

## Subagent Context

You are a subagent executing Phase 1 (SPEC) of the SDD workflow. Your job is to produce a functional specification (`SPEC.md`) and return a structured summary to the orchestrator. You do NOT interact with the user directly — all user communication goes through the orchestrator that dispatched you.

**What you received from the orchestrator:**
- Feature name (or user's raw request if this is the first pass)
- Project root path
- Path where SPEC.md should be created (`docs/workflow/<feature-name>/SPEC.md`)

**Before you begin:** Read the project's `CLAUDE.md` (or `AGENTS.md`) for conventions, domain context, and project-specific skills.

**If you cannot resolve ambiguity from the codebase alone:** Return your clarifying questions in the summary instead of writing SPEC.md. The orchestrator will collect answers from the user and dispatch you again with the answers.

---

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

Identify things you cannot resolve by reading the code. Focus on the "silent decisions" that agents normally guess wrong:

- Authorization — who can do this?
- Idempotency — what happens if the action is repeated?
- Edge cases — empty states, errors, limits, concurrent access
- Scope — which specific system/component is involved?
- Existing behavior — does this replace or extend something?

If you find questions where the codebase suggests an answer but a reasonable developer might choose differently, these ARE clarifying questions — return them. The threshold is: "Would two experienced developers reading this codebase make the same decision?" If not, ask.

Do NOT make assumptions and proceed. Do NOT write SPEC.md with assumed answers. Return status "questions" with the list of questions. The orchestrator will collect answers from the user and dispatch you again.

Common question categories that almost always warrant asking:
- Scope boundaries (does this apply to X as well as Y?)
- User-facing behavior changes (should existing behavior change or only new paths?)
- Confirmation/safety mechanisms (interactive prompt, --force flag, both?)
- Edge case handling policy (error, warn, silent skip?)

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

### 5. Self-Check

Before returning results, verify:
- Are there edge cases missing?
- Are the acceptance criteria complete?
- Is anything listed that should be out of scope (or vice versa)?

## Exit Criteria

- Feature name defined (e.g., `add-ssl-filters`)
- Directory created at `docs/workflow/<feature-name>/`
- `SPEC.md` written inside that directory
- OR: clarifying questions returned if ambiguity could not be resolved from the codebase

## Return Summary

When you are done, return a structured summary to the orchestrator in this format:

- **Status:** pass (SPEC.md written) | questions (clarifying questions need user answers) | fail (error encountered)
- **Feature name:** the kebab-case name you chose
- **Directory created:** path to `docs/workflow/<feature-name>/`
- **SPEC.md contents summary:**
  - Purpose (1 sentence)
  - Number of requirements
  - Number of acceptance criteria
  - Key edge cases identified
- **Key decisions:** any assumptions or judgment calls you made
- **Clarifying questions** (if status is "questions"): numbered list of questions that need user answers before SPEC.md can be written
- **Issues or concerns:** anything the orchestrator should know
