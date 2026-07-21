# Message, Unpacked.

[繁體中文](README.zh-TW.md) · English

**Message, Unpacked.（訊息拆解所）** is a static-first, open-source learning
site for practising how to evaluate suspicious or uncertain messages before
acting. Teachers can create a focused activity link or QR code without an
account, roster, backend, or student-data collection.

[Try the public site](https://batterycat.github.io/message-unpacked/) ·
[Open the English teacher guide](https://batterycat.gitbook.io/message-unpacked-docs/en/) ·
[Set up a class](https://batterycat.github.io/message-unpacked/en/teacher/)

![Message, Unpacked. learning experience](public/assets/hero-message-check.png)

## What is included

- 72 reviewed Traditional Chinese cases across Taiwan's five learning stages.
- A reviewed English demo for grades 10–12 with US-localized official
  references.
- SMS, chat, and email presentations with trustworthy, fraud, and
  insufficient-evidence exercises.
- Student self-paced and teacher projector-led static modes.
- Separate teacher entry paths with shared 10/20/30-minute recommendations and
  an editable case list before starting either mode.
- Optional live-classroom clicker mode with an ephemeral Durable Objects
  reference backend; student phones show only the question number and choices.
- Versioned activity links and browser-generated QR codes.
- Score explanations, final learning summaries, real-case provenance, and
  qualified impact information.
- Localized official verification resources after each debrief.
- Complete Traditional Chinese and English interface catalogs; the reviewed
  grades 10–12 English demo is available and can expand independently.

The current product contract is in [PRODUCT_SPEC.md](docs/PRODUCT_SPEC.md). The
code and data boundaries are in [ARCHITECTURE.md](docs/ARCHITECTURE.md).

## Run locally

Requirements: Node.js 22.12 or newer and pnpm 11.

```bash
pnpm install --frozen-lockfile
pnpm dev
```

Before opening a pull request:

```bash
pnpm format:check
pnpm lint
pnpm typecheck
pnpm worker:typecheck
pnpm schema:check
pnpm validate:content
pnpm test
pnpm test:worker
pnpm license:check
pnpm build
pnpm test:e2e
pnpm build:subpath
pnpm check:subpath
```

## How Codex and GPT-5.6 were used

This project was built with OpenAI Codex as the development harness, using
GPT-5.6 in three roles:

- **GPT-5.6 sol** — ideation and architecture. Framing the teaching problem,
  deciding the static-first split between the offline learning core and the
  optional live classroom service, and shaping the case schema.
- **GPT-5.6 terra** and **GPT-5.6 luna** — implementation against those
  decisions. Components, schemas, tests, documentation, localization checks,
  and repeated code review.

The division was deliberate. Educational principles, security boundaries,
content policy, age-appropriateness, and every published case were decided and
reviewed by a human. The models accelerated implementation and surfaced
inconsistencies; they did not decide what the project should teach, which
scenarios are appropriate for which age group, or whether a cited source
supports the claim made from it.

Automated editorial rules in `pnpm validate:content` exist for the same reason
— they encode review decisions so that neither a contributor nor a model can
quietly drift away from them. See
[CONTENT_AUTHORING.md](docs/CONTENT_AUTHORING.md) for the rules and the
reasoning behind each one.

## Contribute

Start with [CONTRIBUTING.md](CONTRIBUTING.md) and the project
[constitution](CONSTITUTION.md). Case authors should use
[`content/cases/_template.yaml`](content/cases/_template.yaml),
[CONTENT_AUTHORING.md](docs/CONTENT_AUTHORING.md), and the
[case-review checklist](docs/CASE_REVIEW_CHECKLIST.md).

Every dependency, source, quotation, dataset, workflow Action, or media asset
must be reviewed in [THIRD_PARTY_RESOURCES.md](docs/THIRD_PARTY_RESOURCES.md).
Security reports follow [SECURITY.md](SECURITY.md), and community participation
follows [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md).

## Deployment and scope

The complete static experience deploys to GitHub Pages. An optional
Cloudflare Durable Objects reference adapter adds short-lived classroom rooms
without becoming a dependency of the static learning core. Its public service
is demonstration-only, and schools may deploy a compatible backend with their
own limits. See [how to connect or replace the backend](docs/DEPLOYMENT.md#connect-a-compatible-classroom-backend),
the full [deployment guide](docs/DEPLOYMENT.md), and
[USAGE_AND_PRIVACY.md](docs/USAGE_AND_PRIVACY.md).

## License

- Source code: [Apache-2.0](LICENSE)
- Original educational content: [CC BY-SA 4.0](CONTENT-LICENSE.md)
- External resources: their own terms, recorded in the third-party register
