# Error Handling

When a subagent fails, returns incomplete results, or violates its phase protocol (e.g., a Phase 3 summary reporting zero tests written in a project with a test runner), the orchestrator follows this protocol to recover gracefully.

## Procedure

1. **Report to user** -- Show what the subagent reported: error message, partial results, files that may have been modified.
2. **Offer options:**
   - **Retry** -- Dispatch a new subagent with the same inputs PLUS a listing of the files the failed attempt left on disk and their state (per the dispatch template's Task Definition guidance), so it repairs rather than recreates.
   - **Retry with guidance** -- User provides additional context or constraints, and a new subagent is dispatched with this guidance.
   - **Skip** (Phase 3 tasks only) -- Mark the task as skipped and move to the next one. Record it in PLAN.md (`Status: skipped — <reason>`) so the decision survives the session; a skipped task counts as resolved for phase completion, but always surface it to the user again at the Phase 3 → 4 transition.
   - **Abort** -- Use the Abort Protocol (see `abort-protocol.md`).
3. **Escalate after repeated failures** -- If the same phase or task has failed twice, stop offering plain Retry. Present your analysis of the root cause and recommend retry-with-guidance, a scope change (e.g., splitting the task), skip, or abort.
4. **Context overflow** -- Subagents are instructed (dispatch template, instruction 4) to stop at a safe point and return `Status: partial` with exact next steps when running low on context. On a `partial` result, dispatch a continuation subagent with the partial state and those next steps as its starting point.
