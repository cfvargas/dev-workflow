# dev-workflow

CLI tool that installs the Spec Driven Development (SDD) workflow skill into Claude Code projects.

## Commands

```bash
npm test          # Run tests (vitest)
```

## Conventions

| Setting | Value |
|---------|-------|
| Base branch | `main` |
| Test command | `npm test` |
| Test runner | `vitest` |
| Commit format | conventional (`feat:`, `fix:`, `chore:`, etc.) |
| Node version | >= 18 |

## Versioning

- **Semver**: `MAJOR.MINOR.PATCH` in `package.json`
- Bump version in the feature PR (not after merge)
- **PATCH** for bugfixes, **MINOR** for new features, **MAJOR** for breaking changes

## Releases

- Create a GitHub release after merging the PR
- Tag matches version: `v1.2.0`
- Release notes summarize what changed (not a commit log)

## Milestones

- One milestone per upcoming version (e.g., `v1.2.0`)
- Assign PRs to their target milestone
- Milestone closes automatically when all issues/PRs are closed
