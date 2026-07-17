# Spec: Add Dry Run Flag

## Purpose
Users installing the skill want to preview which files would be created or overwritten without touching the filesystem. A `--dry-run` flag on `install` prints the plan instead of executing it.

## Use Cases
- As a CLI user, I want to run `install --dry-run` so that I can see what would change before committing to it.

## Requirements
- [ ] `--dry-run` prints every file that would be created or overwritten, with its destination path
- [ ] No filesystem writes occur when the flag is present
- [ ] Exit code is 0 when the preview succeeds

## Edge Cases
- What happens when the destination already has a skill installed? (mark files as "overwrite")
- What happens when the destination directory doesn't exist? (mark as "create")

## Acceptance Criteria

Given a clean project directory
When the user runs `install --dry-run`
Then every file is listed as "create" and nothing is written to disk

Given a project with an existing installed skill
When the user runs `install --dry-run`
Then existing files are listed as "overwrite" and nothing is written to disk

## Won't Have (This Iteration)
- Dry-run support for the `update` command
- Diff output between existing and new file contents
