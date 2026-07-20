# Message, Unpacked.

[繁體中文](README.zh-TW.md) · English

**Message, Unpacked.（訊息拆解所）** is a static-first, open-source learning
site for practising how to evaluate suspicious or uncertain messages before
acting. Teachers can create a focused activity link or QR code without an
account, roster, backend, or student-data collection.

[Try the public site](https://batterycat.github.io/message-unpacked/) ·
[Open the teacher guide](https://batterycat.gitbook.io/message-unpacked-docs/) ·
[Set up a class](https://batterycat.github.io/message-unpacked/zh-TW/teacher/)

![Message, Unpacked. learning experience](public/assets/hero-message-check.png)

## What is included

- 72 reviewed Traditional Chinese cases across Taiwan's five learning stages.
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
- Complete Traditional Chinese and English interface catalogs; reviewed English
  case translations are deferred.

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
own limits. See [DEPLOYMENT.md](docs/DEPLOYMENT.md) and
[USAGE_AND_PRIVACY.md](docs/USAGE_AND_PRIVACY.md).

## License

- Source code: [Apache-2.0](LICENSE)
- Original educational content: [CC BY-SA 4.0](LICENSE-CONTENT.md)
- External resources: their own terms, recorded in the third-party register
