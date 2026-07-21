# Spec: Add Caching

## Purpose
Every `status` invocation queries the npm registry for the latest version, adding seconds of latency and failing offline. Caching registry responses locally makes repeated checks fast and offline-tolerant.

## Use Cases
- As a CLI user, I want repeated `status` calls to reuse a recent registry response so that the command is fast and works offline.

## Requirements
- [ ] Registry responses are cached locally with a 1-hour TTL
- [ ] A fresh cache entry bypasses the network entirely
- [ ] The `update` command clears the cache after a successful update

## Edge Cases
- What happens when the cache file is corrupt? (ignore it, refetch, rewrite)
- What happens offline with an expired cache? (use the stale value, warn about staleness)

## Acceptance Criteria

Given a cache entry younger than 1 hour
When `status` runs
Then the cached version is shown and no network request is made

Given a corrupt cache file
When `status` runs
Then the registry is queried and the cache file is rewritten

Given no network and an expired cache
When `status` runs
Then the stale version is shown with a staleness warning

## Won't Have (This Iteration)
- Configurable TTL
- Caching of any endpoint other than the version lookup
