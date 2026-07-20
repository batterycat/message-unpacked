# Message, Unpacked.

**訊息拆解所** is an open-source, static-first anti-fraud learning experience
for teachers and students. The first content release covers Taiwan's five
learning stages, with its most extensive reviewed baseline in grades 7–9, and
uses realistic SMS, chat, and email scenarios to practise checking evidence
before acting.

The interface is architected for Traditional Chinese and English. Initial cases
are Traditional Chinese; English case translation will follow.

The current content baseline includes 72 published Traditional Chinese cases
across five learning stages, account-free teacher activity links, selectable
learning stages, student and projector modes, locally generated QR codes,
qualified real-case impact, and contextual Taiwan response guidance. See
[docs/STATUS.md](./docs/STATUS.md) for the current delivery boundary.

### Content decisions behind the case library

The library is deliberately not a collection of “spot the scam” trick
questions. Each topic includes trustworthy examples, ambiguous
`insufficient-evidence` examples, and clear fraud examples so students practise
choosing a safe next step rather than distrusting every message. The reviewed
baseline aims for roughly a 6:2:2 fraud / insufficient-evidence / trustworthy
balance, with at least one trustworthy case in every teacher-facing topic.

- A fraud classification requires a concrete red flag: a secret or financial
  credential request, a demand to hide the conversation from an adult, remote
  control or screen sharing, blocking an official channel, or a guaranteed
  reward tied to an up-front payment.
- Scores use fixed action bands (`0`, `15`, `20`, `40`, `60`, `100`) so clicking,
  partial disclosure, and handing over a secret do not accidentally receive the
  same feedback.
- Reading load and decision complexity are declared by learning stage. Lower
  primary cases use shorter messages and trusted-adult support; high-school
  cases can add a `law` dimension covering account-lending, evidence, reporting,
  employment procedure, and juvenile responsibility without pretending to give
  legal advice.
- Sensitive cases are marked with controlled tags such as `要求對大人保密`,
  `人身安全疑慮`, and `兒少受詐`. Teachers see these warnings before class and
  can decide whether a student needs a gentler introduction or private follow-up.

These editorial rules are checked in CI by `pnpm validate:content`: score bands,
top-choice classification, red-flag thresholds, sensitive vocabulary,
trusted-adult flags, legal debrief content, resource IDs, classification balance,
and per-topic trustworthy coverage.

## Teacher guide

The public [Teacher Guide on GitBook](https://batterycat.gitbook.io/message-unpacked-docs/)
covers quick setup, classroom facilitation, projector and self-paced modes,
case debriefs, Taiwan response resources, and a first-use testing checklist.
The repository remains the source of truth for code, case data, governance, and
licensing; GitBook is the teacher-facing publishing surface.

## Development

Requirements: Node.js 22 or newer and pnpm 11.

```bash
pnpm install
pnpm dev
```

Quality checks:

```bash
pnpm lint
pnpm typecheck
pnpm schema:check
pnpm validate:content
pnpm test
pnpm test:e2e
pnpm test:a11y
pnpm build
pnpm license:check
```

Static deployment supports both a root domain and a project subpath. See
[docs/DEPLOYMENT.md](./docs/DEPLOYMENT.md) for the build variables, host
requirements, and release smoke check. Accessibility evidence and remaining
assistive-technology review are recorded in
[docs/ACCESSIBILITY_REVIEW.md](./docs/ACCESSIBILITY_REVIEW.md).

## Project Rules

Read [CONSTITUTION.md](./CONSTITUTION.md) before contributing. External software,
sources, and media must be reviewed in
[docs/THIRD_PARTY_RESOURCES.md](./docs/THIRD_PARTY_RESOURCES.md).
Potential vulnerabilities follow [SECURITY.md](./SECURITY.md); never place
student data or active malicious links in a public report.
The recurring review and release process is documented in
[docs/MAINTENANCE.md](./docs/MAINTENANCE.md).

## Licensing

- Source code: [Apache-2.0](./LICENSE)
- Original educational content: [CC BY-SA 4.0](./LICENSE-CONTENT.md)
- External resources: their respective terms, recorded in the third-party
  register
