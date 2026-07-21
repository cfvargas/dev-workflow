# Spec: Add Webhooks

## Purpose
Teams want automated notifications when a skill is installed or updated in a shared project, so tooling can react (e.g., refresh docs, ping a channel). The CLI gains an optional webhook URL that receives lifecycle events.

## Use Cases
- As a platform engineer, I want install/update events POSTed to a webhook so that our tooling stays in sync.

## Requirements
- [ ] A webhook URL can be configured per project
- [ ] `install` and `update` POST an event payload (event name, version, timestamp) to the configured URL
- [ ] Failures to deliver are reported as warnings and never block the command

## Edge Cases
- What happens when the webhook endpoint is unreachable? (warn, exit 0)
- What happens when no webhook is configured? (no request, no warning)

## Acceptance Criteria

Given a configured webhook URL
When `install` completes successfully
Then a POST with the event payload is sent and the command exits 0

Given an unreachable webhook URL
When `update` completes
Then a warning is printed and the command still exits 0

## Won't Have (This Iteration)
- Retry queues or delivery guarantees
- Payload signing
