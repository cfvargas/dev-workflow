# Inline Execution Fallback

The Agent tool may not be available in all environments (e.g., sandboxed worktrees, restricted tool sets). When the Agent tool is unavailable, the orchestrator executes phase work inline instead of dispatching subagents. This document describes how inline execution works.

## When to Use

Use inline execution when the Agent tool is not available. Before dispatching the first phase, check if the Agent tool is available. If not, switch to inline execution mode for the entire workflow.

## Procedure

1. **Detect early** -- Before dispatching the first phase, check if the Agent tool is available. If not, switch to inline execution mode for the entire workflow.
2. **Follow the same phase references** -- Read and follow the phase reference file (`references/phase-N-*.md`) exactly as a subagent would. The phase instructions, exit criteria, and return summary format still apply.
3. **Maintain the orchestrator/executor boundary mentally** -- Even when executing inline, separate the "orchestrator" concerns (phase detection, review gates, commits, user interaction) from the "executor" concerns (codebase exploration, file creation, test execution). Complete all executor work first, then switch to orchestrator mode to present results.
4. **Review gates still apply** -- After completing phase work inline, present results to the user in the same format as if a subagent had returned them. Do not skip the review gate just because execution was inline.
5. **Log the fallback** -- Note in your output that the Agent tool was unavailable and execution was performed inline.

**Inline execution does NOT mean collapsing phases.** The most common mistake is treating inline mode as permission to execute the entire workflow in a single pass. This defeats the purpose of the review gates -- the user loses control over each phase's output.

## Inline Execution Rules

- **One phase at a time.** Execute only the current phase. Do not look ahead or begin the next phase until the user approves the review gate.
- **Stop at the review gate.** After finishing executor work for a phase, present the review gate and wait for the user's response. Do not simulate approval or assume the user is satisfied.
- **Never self-answer clarifying questions.** If Phase 1 identifies ambiguity, return the questions to the user through the review gate. Do not fill in "reasonable defaults" yourself -- surfacing design decisions is the point of Phase 1, not minimizing round trips.
- **Create artifacts on disk.** Inline execution must still produce the same files a subagent would (SPEC.md, PLAN.md, workflow directory). If file writes are restricted, report what you would have created and present the content in the review gate.
