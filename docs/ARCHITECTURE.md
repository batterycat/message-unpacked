# Architecture

Message, Unpacked. is a static-first application with a data-driven case
library. The architecture keeps educational content, domain contracts,
interactive presentation, and optional classroom transport separate.

## System shape

```text
content/cases/*.yaml
        |
        v
Zod case contract + editorial validator ----> generated JSON Schema
        |
        v
Astro content adapter
        |
        +--> static pages and locale catalogs
        |
        +--> React scenario feature
                  |
                  +--> XState question/debrief lifecycle
                  +--> in-memory multi-case session reducer
                  +--> message, decision, debrief, impact, help, results views

Teacher configurator
        |
        v
versioned activity URL (topic ID + case IDs + content versions) + local QR

Optional live classroom:
classroom protocol port ---> Durable Objects reference adapter
```

## Source boundaries

```text
src/domain/cases        Case schema, stable IDs, shared editorial defaults
src/domain/activity     Teacher selection and versioned share-link contract
src/domain/scenario     One-case question/debrief state machine
src/domain/session      Multi-case progress and score summary
src/domain/resources    Localized official-resource registry contract
src/i18n                Complete typed interface catalogs
src/features/scenario   Focused post-debrief impact and help presentation
src/domain/room         Versioned role projections, scoring, and room lifecycle
src/features/classroom  Host/clicker UI and reconnecting transport client
src/components          Astro page composition and broad React islands
src/pages               Locale route entry points
workers                 Optional Cloudflare Durable Objects transport adapter
```

Domain modules do not import React or Astro. YAML is validated at the content
boundary; UI code receives typed cases and resources.

## Case and topic identity

- `id` identifies one localized case document.
- `translationGroupId` links translations of the same conceptual case.
- `contentVersion` changes when a materially different case is published.
- `topicId` is a stable locale-neutral filter value.
- `learning.topic` remains translated display copy.

Teacher links carry case IDs and their content versions. A missing, retired, or
version-mismatched case produces a recovery screen instead of silently changing
the activity.

## Interaction state

XState owns the lifecycle of one case:

```text
question --ANSWER--> debrief --RESTART--> question
```

The session reducer owns the ordered case position, attempts, completion, and
restart. This is deliberately not a branching-scenario graph. A future branch
engine must define a new versioned contract rather than overloading the current
choice array.

## Official-resource policy

The case schema owns the default action IDs
`anti-fraud.online-report` and `anti-fraud.consult`. Locale registries own the
official names, destinations, organizations, guidance, verification dates, and
retirement state. Individual cases contain scenario-specific safer actions but
do not duplicate official URLs.

The help panel is revealed after the debrief and does not automatically move
keyboard focus or scroll position.

## Static and optional live deployment

1. GitHub Pages serves the complete static experience.
2. A separately configured public demonstration service may add ephemeral room
   synchronization through Cloudflare Durable Objects.
3. Schools may deploy their own compatible backend and choose their own room
   limits; alternate adapters are outside this task and release.

The static learning core does not import the transport. Classroom messages use
the versioned protocol in `src/domain/room/`; the Worker emits role-specific
projections so student clients cannot receive teacher-only content or tallies
before reveal.

## Quality gates

The Quality workflow owns formatting, linting, strict type checks, schema drift,
content/editorial validation, unit tests, license policy, static builds,
Playwright flows, accessibility automation, and project-subpath checks. GitHub
Pages deployment runs only after this workflow succeeds on `main`.

Behavioral E2E tests use stable case and choice IDs. Exact editorial wording is
tested only where the wording itself is the contract.

## Decision records

- [ADR-001: Static-first core](adr/001-static-first-core.md)
- [ADR-002: First-stage single-turn cases](adr/002-single-turn-cases.md)
- [ADR-003: Locale resource defaults](adr/003-locale-resource-defaults.md)
