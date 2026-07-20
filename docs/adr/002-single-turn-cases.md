# ADR-002: First-stage single-turn cases

- Status: accepted
- Date: 2026-07-20

## Decision

The first-stage case contract is a single-turn message assessment with optional
clue review, one combined classification/action choice, scoring, and debrief.
Multi-step branching and evidence inventories are deferred.

## Consequences

Current cases stay approachable to contributors and deterministic to test.
XState models only the question/debrief lifecycle. A future branch engine needs
a new versioned schema rather than undocumented fields in the current format.
