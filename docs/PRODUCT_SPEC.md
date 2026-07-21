# Product specification

This document describes the public, testable product contract for the current
release of **Message, Unpacked.** Internal planning notes are not the
source of truth for contributors.

## Purpose and audience

Message, Unpacked. helps students practise how to evaluate suspicious or
uncertain SMS, chat, and email messages. It teaches a repeatable habit: inspect
the request, identify evidence, choose a lower-risk action, and verify through a
trusted channel.

The Traditional Chinese case library supports Taiwan's five learning stages:
grades 1–2, 3–4, 5–6, 7–9, and 10–12. The grades 7–9 collection remains the
deepest baseline. An initial English pilot provides separately reviewed,
US-localized cases and response resources. Teachers are the primary facilitator
audience; students may also complete a teacher-generated activity independently.

## Current release

- Static Astro site deployable to GitHub Pages or another static host.
- Traditional Chinese and English interface catalogs, with a complete
  Traditional Chinese library and an initial reviewed English pilot set.
- At least 70 reviewed cases across SMS, chat, and email.
- Five learning stages and six stable topic categories.
- Three judgments: trustworthy, fraud, and insufficient evidence.
- Student self-paced mode and teacher projector-led reveal mode.
- Optional live-classroom mode in which the teacher projects the complete case
  and student phones display only question number and choices.
- A teacher mode landing with separate static/live setup routes; both recommend
  2/4/6 cases for 10/20/30 minutes and let the teacher edit the selection.
- Versioned share links and browser-generated QR codes without accounts.
- Per-question score feedback and a final session summary.
- Post-debrief provenance, source, impact, and official help information.

## First-stage learning loop

Each case is intentionally a single-turn exercise:

1. Read one or more messages.
2. Optionally reveal the prepared clues.
3. Choose one combined judgment and action.
4. Review the score, reasoning, safer actions, and available case evidence.
5. Use the official verification and consultation resources when help is
   needed.
6. Continue until the activity summary appears.

Scores explain the relative safety of a choice. They are not a measure of a
student's intelligence, character, or worth.

## Content policy

- Cases are data files validated at build time, not hard-coded UI flows.
- Every published topic has at least ten cases and includes trustworthy
  examples.
- The editorial target is approximately 60% fraud, 20% insufficient evidence,
  and 20% trustworthy.
- Documented and composite cases require reviewable sources and qualified
  impact claims. Missing public data remains unknown, never zero.
- Published cases use the locale registry's fixed verification pair:
  `anti-fraud.online-report` and `anti-fraud.consult`.
- Sensitive-content and trusted-adult metadata are mandatory parts of editorial
  review.

See [CONTENT_AUTHORING.md](CONTENT_AUTHORING.md),
[CASE_REVIEW_CHECKLIST.md](CASE_REVIEW_CHECKLIST.md), and the project
[constitution](../CONSTITUTION.md).

## Privacy and safety boundary

The static modes do not require sign-in, names, rosters, analytics, or remote
answer storage. The optional live mode uses short-lived pseudonymous tokens and
current-question answers only; it does not request names or create individual
histories, rankings, or grades. No mode accepts or analyses a learner's real
messages. Scenario links are inert or use reserved example domains.

See [USAGE_AND_PRIVACY.md](USAGE_AND_PRIVACY.md) for the complete scope notice.

## Deferred work

- Alternate self-hosted room-service implementations.
- Durable answer history, gradebooks, rosters, or identity-based analytics.
- Multi-step branching conversations, evidence inventories, or adaptive paths.
- Accounts, learning histories, cloud analytics, or a public unmoderated CMS.
- Automatic verdicts for real messages or AI-generated case publication.

These are separate phases and must enter through the adapter boundaries in
[ARCHITECTURE.md](ARCHITECTURE.md); they must not make the static learning core
depend on a backend.
