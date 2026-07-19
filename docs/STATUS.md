# MVP Status

Updated: 2026-07-19

## Implemented

- Static Astro application with separate Traditional Chinese and English
  interface routes.
- Twenty Traditional Chinese starter cases: four documented real-event
  adaptations, nine classic patterns, and seven teaching-fiction cases. The
  initial set now has content for all five learning stages (`1-2`, `3-4`,
  `5-6`, `7-9`, and `10-12`), while the largest reviewed baseline remains
  grades 7–9.
- SMS, chat, and email presentation; trustworthy, fraudulent, and
  insufficient-evidence outcomes.
- Per-question reasoning feedback, scores, final activity results, and replay.
- Documented-case provenance, qualified impact, source links, and review dates.
- Contextual Taiwan response guidance, including 165 consultation and official
  query/reporting destinations.
- Account-free teacher configuration, shareable activity URLs, locally
  generated QR codes, and distinct student/projector behavior.
- Static-root and project-subpath builds with automated path-integrity checks.
- Content schema validation, license policy, unit/component tests, end-to-end
  tests, responsive checks, and automated accessibility scans.
- Public GitBook teacher guide with quick setup, facilitation scripts, mode
  guidance, local response resources, and a first-use testing checklist.
- Phase 2 Cloudflare Durable Objects room protocol and Worker deployment
  skeleton, kept optional so the static site remains independently deployable.

## Intentionally deferred

- English case translations. The English interface reports their absence
  honestly and links to the Chinese cases.
- Accounts, student history, analytics, classroom codes, and cross-device live
  aggregation.
- Public classroom synchronization authorization, abuse controls, and durable
  room history; the current Worker is an unauthenticated ephemeral prototype.
- Uploading or automatically judging real messages.
- A CMS or unmoderated public content submission flow.

## External decisions or review still needed

- Enable GitHub private vulnerability reporting or publish another private
  security contact before broad promotion.
- Complete an educator editorial review of the twenty starter cases, with a
  primary-school reviewer for the new `1-2`, `3-4`, and `5-6` cases.
- Complete VoiceOver and NVDA smoke tests on representative school devices.
- Decide when English case translation should begin and who will review it.
- Optionally choose a branded GitBook custom domain; the first guide is
  published at the connected workspace URL.
