# Codebase Analysis Protocol

This protocol defines how to explore a codebase before writing a spec. It produces a lightweight artifact (`ANALYSIS.md`) that Phase 1 uses to write the spec and Phase 2 uses to plan implementation.

**Goal:** Understand the affected area of the codebase consistently, regardless of project size or complexity.

**Output:** `docs/workflow/<feature-name>/ANALYSIS.md` (~50 lines max)

---

## Exploration Order

Follow these steps in order. Each step narrows the focus for the next.

### 1. Scope the Area

Extract entities and keywords from the user's request. Use them to locate the relevant code:

```
Glob("**/*{keyword}*")          → find files by name
Grep("{entity}")                → find references in code
Grep("import.*{module}")        → trace dependency chains
```

**Stop rule:** If a search returns more than 20 files, narrow the keywords. If fewer than 3, broaden them. The goal is to identify 3–10 files that form the core of the affected area.

### 2. Understand Project Structure

Before reading specific files, understand where the affected area sits in the project:

- Identify the top-level directory layout (layers, modules, packages)
- Locate the affected area within that structure
- Note the architectural style (MVC, layered, microservice, monolith, flat)

This step should take 1–2 Glob/ls calls, not a deep read.

### 3. Deep-Read the Affected Area

Read the files identified in Step 1. For each file, capture:

- **What it does** (purpose, not line-by-line)
- **Entry points** — what calls into this code (imports, routes, event handlers)
- **Downstream** — what this code calls out to (other modules, APIs, databases)
- **Business rules** — validations, conditions, transformations
- **Error handling** — how failures are handled (throw, return error, silent)

### 4. Shallow-Read Adjacent Areas

Identify modules/files that are *connected to* the affected area but are NOT part of the change. Read only their interfaces (exports, function signatures, types) — not their internals.

The purpose is to understand:
- What depends on the affected area (callers that might break)
- What the affected area depends on (contracts that constrain the change)

### 5. Identify Patterns

Look for conventions that the project follows in the affected area:

- **Naming:** How are similar things named? (functions, files, variables)
- **Error handling:** Is there a pattern? (error types, error wrapping, error codes)
- **Validation:** Where and how is input validated? (middleware, model layer, inline)
- **Structure:** How are similar features organized? (folder per feature, layer per feature)

Find one existing feature similar to the one being built and use it as the reference pattern.

### 6. Check Configuration

Look for configuration that affects the affected area:

- Environment variables referenced in the affected files
- Config files (`.env`, `config/`, feature flags)
- Build/deploy configuration relevant to the area

Only document what's relevant. Skip this step entirely if the area has no configuration dependencies.

## Depth Control

The analysis should be proportional to the task:

| Project size | Affected files | Max files to read | Max time |
|---|---|---|---|
| Small (<20 files) | 1–5 | Read all affected + 3 adjacent | ~2 min |
| Medium (20–200 files) | 3–10 | Read all affected + 5 adjacent | ~3 min |
| Large (200+ files) | 5–15 | Read all affected + interfaces only for adjacent | ~5 min |

**When to stop:** If you've read 15+ files and the picture isn't clear, stop and document what you know. The spec phase will surface remaining unknowns as clarifying questions.

## Output: ANALYSIS.md

Write the analysis to `docs/workflow/<feature-name>/ANALYSIS.md`. Keep it under ~50 lines. This is a map, not a book.

```markdown
# Analysis: <Feature Name>

## Affected Area
- **Files:** [list of files that will likely need changes]
- **Entry points:** [what calls into this area — routes, handlers, imports]
- **Downstream:** [what this area calls — other modules, APIs, DB]

## Current Behavior
[2–3 sentences: what the system does TODAY in this area. Be specific — name functions, describe the flow.]

## Patterns Observed
- **Error handling:** [how the area handles errors — e.g., "throws ValidationError with HTTP 422"]
- **Validation:** [where and how input is validated — e.g., "Zod schemas in middleware"]
- **Structure:** [how similar features are organized — e.g., "route → controller → service → model"]
- **Reference feature:** [name of a similar existing feature to use as pattern]

## Configuration
- [relevant env vars, feature flags, config files — or "None" if N/A]

## Boundaries
- **Adjacent but out of scope:** [modules/files that are connected but should NOT change]
- **Callers that could be affected:** [upstream code that depends on the area being changed]

## Constraints
- [anything discovered that limits implementation options — e.g., "no ORM, raw SQL only" or "must support Node 18"]
```

### ANALYSIS.md Rules

- **Be specific.** Name files, functions, and patterns — not abstractions.
- **Be brief.** If a section has nothing relevant, write "None" or omit it.
- **No recommendations.** This is observation, not prescription. Phase 1 decides requirements, Phase 2 decides architecture.
- **No implementation decisions.** Don't suggest how to build it — document what exists.
