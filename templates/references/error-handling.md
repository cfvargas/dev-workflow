# Error Handling

When a subagent fails or returns incomplete results, the orchestrator follows this protocol to recover gracefully.

## Procedure

1. **Report to user** -- Show what the subagent reported: error message, partial results, files that may have been modified.
2. **Offer options:**
   - **Retry** -- Dispatch a new subagent with the same inputs. The new subagent will find any partial file writes from the failed attempt on disk and must handle that state.
   - **Retry with guidance** -- User provides additional context or constraints, and a new subagent is dispatched with this guidance.
   - **Skip** (Phase 3 tasks only) -- Mark the task as skipped and move to the next one. The user can come back to it later.
   - **Abort** -- Use the Abort Protocol (see `abort-protocol.md`).
3. **Context overflow** -- If a subagent signals it is running low on context (returns partial results with a note), the orchestrator dispatches a continuation subagent with the partial state and instructions to pick up where the previous one left off.
