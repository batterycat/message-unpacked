# Message, Unpacked.

[繁體中文](README.zh-TW.md) · English

**Message, Unpacked.（訊息拆解所）** is a static-first, open-source learning
site for practising how to evaluate suspicious or uncertain messages before
acting. Teachers can create a focused activity link or QR code without an
account, roster, backend, or student-data collection.

[Try the public site](https://batterycat.github.io/message-unpacked/) ·
[Open the English teacher guide](https://batterycat.gitbook.io/message-unpacked-docs/en/) ·
[Set up a class](https://batterycat.github.io/message-unpacked/en/teacher/)

> Built with OpenAI Codex and GPT-5.6 sol/terra for architecture,
> implementation, testing, localization, and review.
> [See how AI was used responsibly](#how-codex-and-gpt-56-were-used).

![Message, Unpacked. learning experience](public/assets/hero-message-check.png)

## What is included

- **97 reviewed cases** — 72 Traditional Chinese across Taiwan's five learning
  stages, plus a 25-case English demo for grades 10–12 with US-localized
  official references. Broader English use still needs local educator review.
- **Three verdicts per case** — trustworthy, fraud, and insufficient-evidence,
  presented as SMS, chat, or email. The third is the point: students practise
  recognizing when they cannot yet tell, instead of labelling everything a scam.
- **Two teaching modes** — static student and projector-led activities that
  need no backend, plus an optional live-classroom clicker mode where student
  phones show only the question number and choices.
- **Teacher control before starting** — learning stage, topic, 10/20/30-minute
  length, and an editable case list, shared by both modes.
- **Versioned activity links and browser-generated QR codes**, with no account,
  roster, or student-data collection.
- **Debriefs with provenance** — score explanations, red-flag breakdowns,
  qualified real-case impact figures, and localized official verification
  resources.

Product contract: [PRODUCT_SPEC.md](docs/PRODUCT_SPEC.md). Code and data
boundaries: [ARCHITECTURE.md](docs/ARCHITECTURE.md).

## Run locally

Requirements: Node.js 22.12 or newer and pnpm 11.

```bash
pnpm install --frozen-lockfile
pnpm dev
```

The static learning experience is complete without a backend. To test the
optional live-classroom mode locally, start the room service in one terminal:

```bash
pnpm worker:dev --port 8787 \
  --var LIVE_ROOMS_ENABLED:true \
  --var ALLOWED_ORIGINS:http://127.0.0.1:4321
```

Then start the site in another terminal:

```bash
PUBLIC_ROOM_SERVICE_URL=http://127.0.0.1:8787 pnpm dev
```

**No sample data or seeding is required.** The full case library ships in the
repository as YAML under `content/cases/` and is validated and bundled at build
time. There is no database, no API key, and no account to create.

## How to test it

```bash
pnpm check     # everything below, in one command
```

Individually, the checks that matter most here:

| Command                 | What it proves                                                                                                                                                   |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm validate:content` | Every case parses, and passes the editorial rules — score bands, classification consistency, coverage, sensitive-content flags, and required response resources. |
| `pnpm test`             | Unit and component behaviour, including the scoring and activity-link contracts.                                                                                 |
| `pnpm test:worker`      | The live-room protocol against a real Workers runtime — role separation, ticket validation, and room expiry.                                                     |
| `pnpm test:e2e`         | Full flows in a browser. Needs `pnpm exec playwright install` first, so it is excluded from `pnpm check`.                                                        |
| `pnpm test:a11y`        | Automated accessibility checks on representative pages.                                                                                                          |

`pnpm validate:content` is the unusual one. Content correctness is the main
risk in this project, so editorial decisions are enforced in CI rather than
left to review memory — see
[CONTENT_AUTHORING.md](docs/CONTENT_AUTHORING.md).

## How Codex and GPT-5.6 were used

**No model runs in the product.** This is a static site with no inference, no
API key, and no AI dependency at runtime. Codex and GPT-5.6 were the
development environment, used in two roles:

- **GPT-5.6 sol** — ideation and architecture. Framing the teaching problem,
  deciding the static-first split between the backend-free learning core and
  the optional live classroom service, and shaping the case schema.
- **GPT-5.6 terra** — implementation against those decisions: components,
  schemas, tests, documentation, localization checks, and repeated code review.

### Where Codex accelerated the work

Most of the speedup was in work that is mechanical but easy to get wrong at
scale — generating the JSON Schema from the Zod contract, keeping two locale
catalogs in sync, writing the Durable Object tests, and sweeping 97 YAML files
for a rule change. A calibration pass that retuned score bands across the
whole library took an afternoon instead of a week.

It was also useful as an adversarial reader. Asking it to argue against a case
surfaced problems a single author misses: options that punished a correct
verdict, "trustworthy" signals a scammer could copy verbatim, and one bulk
find-and-replace that silently corrupted a cited police headline.

### Where the human decided

Every call that determines what a student learns was made and reviewed by a
person, and the reasoning is written down rather than asserted:

- what counts as a decisive red flag, and when a case is genuinely ambiguous —
  [CONTENT_AUTHORING.md](docs/CONTENT_AUTHORING.md)
- what each score band means, so partial disclosure never outscores caution
- which scenarios suit which age group, and which need a trusted adult present
- whether a cited source actually supports the claim made from it; each
  documented case was re-opened at its URL and checked line by line
- what not to build — no accounts, no rankings, no behavioural profiles, no
  persistent classroom history

The editorial rules in `pnpm validate:content` exist to hold those decisions in
place, so that neither a future contributor nor a model can quietly drift away
from them.

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
