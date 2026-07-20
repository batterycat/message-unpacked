# ADR-003: Locale resource defaults

- Status: accepted
- Date: 2026-07-20

## Decision

Published cases resolve a fixed pair of response-resource IDs:
`anti-fraud.online-report` and `anti-fraud.consult`. The case schema supplies
the defaults; locale registries supply official regional destinations.

## Consequences

Case YAML does not repeat global URLs or resource policy. Scenario-specific
safe actions remain in each debrief. Changing the global pair requires a
constitution, registry, documentation, and validation review.
