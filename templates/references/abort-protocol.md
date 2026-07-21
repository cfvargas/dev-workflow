# Abort Protocol

If the user wants to abandon a workflow at any point, the orchestrator (not a subagent) handles the abort directly.

## Procedure

1. **Ask for confirmation** -- "Are you sure you want to abort? I can also just pause if you want to come back later."
2. **Offer options:**
   - **Pause** (default) -- Stop here. Artifacts and branch persist. Phase Detection picks up later.
   - **Abort, keep branch** -- Remove workflow artifacts (`rm -rf docs/workflow/<feature-name>`) but keep the branch (useful if there's salvageable code).
   - **Full abort** -- Remove everything:
     ```bash
     git checkout <base-branch>
     git branch -D feature/<feature-name>
     rm -rf docs/workflow/<feature-name>
     ```
3. **Environment caveats for full abort:**
   - **Dirty working tree** (mid-task abort): `git checkout` will refuse. List the uncommitted changes, confirm with the user that they are disposable, then `git reset --hard` before the checkout. Never discard changes without this explicit confirmation.
   - **Worktree environments:** the base branch usually cannot be checked out (it is checked out in the main worktree) and the worktree's own branch cannot be deleted while checked out. Only remove `docs/workflow/<feature-name>` and tell the user to discard the worktree itself; do not improvise destructive git commands.
4. **Confirm cleanup** -- List exactly what was removed so the user knows the state is clean.
5. If `docs/workflow/` is now empty, remove it too: `rmdir docs/workflow 2>/dev/null`
