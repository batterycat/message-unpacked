# MVP Status

Updated: 2026-07-20

## Implemented

- Static Astro application with separate Traditional Chinese and English
  interface routes.
- Seventy-two Traditional Chinese published cases: four documented real-event
  adaptations, forty-nine classic patterns, and nineteen teaching-fiction
  cases. The six current topics have 10–14 cases each. The set covers all five
  learning stages (`1-2`, `3-4`, `5-6`, `7-9`, and `10-12`), while the largest
  reviewed baseline remains grades 7–9.
- The reviewed classification balance is approximately 6:2:2 fraud,
  insufficient-evidence, and trustworthy cases; every topic includes at least
  one trustworthy case.
- SMS, chat, and email presentation; trustworthy, fraudulent, and
  insufficient-evidence outcomes.
- Per-question reasoning feedback, scores, final activity results, and replay.
- Documented-case provenance, qualified impact, source links, and review dates.
- A fixed post-debrief verification pair resolved by locale: official online
  reporting/query information and consultation guidance.
- Account-free teacher mode landing with separate static and live setup routes,
  shared duration-based recommendations, editable case selection, v2 activity
  URLs with stable topic IDs and per-case content versions, locally generated
  QR codes, and distinct student/projector behavior.
- Static-root and project-subpath builds with automated path-integrity checks.
- Content schema validation, license policy, unit/component tests, end-to-end
  tests, responsive checks, and automated accessibility scans.
- CI editorial guards for score bands, red-flag classification, controlled
  sensitive-content vocabulary, trusted-adult flags, high-school legal content,
  fixed response-resource IDs, classification balance, and per-topic coverage.
- Public GitBook teacher guide with quick setup, facilitation scripts, mode
  guidance, local response resources, and a first-use testing checklist.
- Topic and learning-stage coverage inventory in
  `docs/CONTENT_COVERAGE.md`, with a test guard for the current topic minimum.
- Optional live-classroom mode with separate teacher and student routes,
  stage/topic case selection, QR and room-code joining, aggregate reveal,
  summary scoring, and reconnecting WebSocket transport.
- Cloudflare Durable Objects reference service with teacher and participant
  credentials, one-time socket tickets, exact-origin policy, configurable
  limits, answer erasure on reveal, and room-lifetime cleanup.
- Local Miniflare integration coverage for credential handling, ticket replay,
  hidden/revealed answers, WebSocket hibernation, and alarm deletion.
- Public product, architecture, decision, scope, and privacy documentation.

## Intentionally deferred

- English case translations. The English interface reports their absence
  honestly and links to the Chinese cases.
- Accounts, rosters, individual student history, ranking, gradebooks, and
  identity-based classroom analytics.
- Production-grade operations for the public classroom demonstration,
  including abuse monitoring, incident response, and capacity monitoring. The
  initial maintainer demo is deployed, but remote updates remain a deliberate
  operator action and the service has no availability commitment.
- Alternate school-operated room-service adapters.
- Uploading or automatically judging real messages.
- Multi-step branching conversations and evidence inventories.
- A CMS or unmoderated public content submission flow.

## External decisions or review still needed

- Enable GitHub private vulnerability reporting; the current CLI token and
  available browser session do not have repository-settings access.
- Add the public demo, description, and topics to GitHub About and disable the
  unused Wiki from an administrator session.
- Protect `main` with the `verify` status check while allowing the sole
  maintainer an emergency bypass.
- Keep a second educator review pass scheduled when the age-level balance or
  sensitive-content vocabulary changes, especially for `1-2`, `3-4`, and `5-6`
  cases.
- Complete VoiceOver and NVDA smoke tests on representative school devices.
- Decide when English case translation should begin and who will review it.
- Optionally choose a branded GitBook custom domain; the first guide is
  published at the connected workspace URL.
- Configure the GitBook privacy-policy URL and decide whether its AI assistant
  and page-rating features should remain enabled.
