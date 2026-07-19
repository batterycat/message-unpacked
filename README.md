# Message, Unpacked.

**訊息拆解所** is an open-source, static-first anti-fraud learning experience
for teachers and students. The first content release focuses on grades 7–9 in
Taiwan and uses realistic SMS, chat, and email scenarios to practise checking
evidence before acting.

The interface is architected for Traditional Chinese and English. Initial cases
are Traditional Chinese; English case translation will follow.

The current MVP includes 12 reviewed cases, account-free teacher activity
links, student and projector modes, locally generated QR codes, qualified
real-case impact, and contextual Taiwan response guidance. See
[docs/STATUS.md](./docs/STATUS.md) for the current delivery boundary.

## Teacher guide

The public [Teacher Guide on GitBook](https://loomtype.gitbook.io/loomtype-docs/)
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

## Licensing

- Source code: [Apache-2.0](./LICENSE)
- Original educational content: [CC BY-SA 4.0](./LICENSE-CONTENT.md)
- External resources: their respective terms, recorded in the third-party
  register
