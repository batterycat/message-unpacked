# ADR-001: Static-first core

- Status: accepted
- Date: 2026-07-20

## Decision

The complete learning, teacher setup, sharing, scoring, and debrief experience
must work as static files without accounts or a required application server.
Future classroom synchronization is an optional adapter.

## Consequences

GitHub Pages remains a valid first deployment. Live rooms must not introduce a
runtime dependency into the static routes, case schema, or session reducer.
