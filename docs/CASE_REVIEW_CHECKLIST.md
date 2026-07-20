# Case Review Checklist

Use this checklist before changing a case from `draft` to `published`. A case
can pass structural validation and still need factual, educational, or safety
revision.

## Provenance and facts

- [ ] The provenance kind matches what the case actually claims.
- [ ] Documented/composite facts are supported by the listed sources.
- [ ] Sources are authoritative enough for the claim and were accessed
      recently.
- [ ] Article wording, screenshots, photographs, logos, and original messages
      were not copied without compatible permission.
- [ ] Every number has a qualifier, source reference, and enough context to
      avoid exaggeration.
- [ ] Missing loss or victim information is left unknown, never represented as
      zero.
- [ ] The source and licensing review is registered in
      `docs/THIRD_PARTY_RESOURCES.md` when required.

## Student safety and language

- [ ] Names, accounts, phone numbers, URLs, and identifiers are fictional,
      removed, or reserved examples.
- [ ] The scenario does not send students to a live suspicious destination.
- [ ] Feedback explains safer behavior without shaming a wrong answer or a
      victim.
- [ ] Sensitive consequences are necessary, proportionate, and suitable for
      every declared learning stage.
- [ ] A trusted adult is recommended when the situation involves money,
      account compromise, threats, or safety.
- [ ] The schema-owned verification pair is not duplicated in case YAML, and
      the debrief does not present it as proof that every message is fraud or
      must be reported.

## Learning quality

- [ ] The safest answer requires reasoning rather than simply choosing
      “fraud.”
- [ ] Distractors are plausible but do not teach unsafe behavior as acceptable.
- [ ] Clues cover both message content and an independent verification action.
- [ ] The debrief explains persuasion techniques, consequences, and concrete
      next steps.
- [ ] `learning.topicId` is a supported stable ID, `learning.topic` is the
      localized display label, and detailed situations remain in
      `learning.contexts`.
- [ ] The reading load and vocabulary are suitable for the declared stage.
- [ ] The scenario does not assume access to a personal account, payment
      method, or independent legal/financial decision-making when the declared
      stage is `1-2`, `3-4`, or `5-6`.

## Technical review

- [ ] The editor reports no `content/case.schema.json` errors.
- [ ] `pnpm validate:content` passes with a useful case-specific path.
- [ ] Reserved links remain inert in the interface.
- [ ] The case renders in its declared SMS, chat, or email channel.
- [ ] Keyboard use and narrow-screen layout remain understandable.
- [ ] `lastReviewedAt`, maintenance status, and content version are current.

For a documented or composite case, prefer a second reviewer for factual
claims before publication. Record unresolved questions in the pull request; do
not publish first and verify later.
