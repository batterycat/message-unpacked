# Security Policy

Message, Unpacked. is a static-first educational application. Static activities
have no student accounts, message uploads, analytics, database, or application
backend. An optional short-lived classroom synchronization adapter is a separate
security boundary and does not turn the project into an identity or gradebook
system.

## Supported version

Before the first stable release, security fixes are applied to the current
`main` branch only. Published demonstration builds should be updated from a
reviewed main-branch revision.

## Reporting a vulnerability

Private vulnerability reporting is a launch requirement but is not yet enabled
for this repository. Do not open a public issue containing an active exploit,
malicious URL, student information, credentials, threats, or other sensitive
data.

Non-sensitive hardening suggestions may use a regular issue. For a sensitive
report, open only a brief issue asking the maintainer to confirm a private
contact; do not include the vulnerability itself. This section will link the
GitHub private-report form after an administrator enables it.

A useful report includes:

- affected route, case, or build configuration;
- security or privacy impact;
- minimal reproduction using reserved data and `example.com` destinations;
- browser and deployment environment;
- suggested mitigation, if known.

## Security boundaries

- Case files are untrusted authoring input and must pass build-time validation.
- Suspicious destinations in teaching cases must remain inert or use reserved
  domains.
- Official external links and phone actions require an explicit learner action.
- Activity configuration is stored in the URL and is not a secret or an
  authorization mechanism.
- Live-room teacher secrets and participant tokens stay in `sessionStorage` and
  are never placed in activity or room links. The backend stores only credential
  digests; short-lived, single-use tickets authorize WebSocket upgrades.
- Browser Origin checks are cross-site request controls, not authentication.
  Every room action still requires the appropriate room credential.
- Edge rate-limiting bindings provide permissive abuse buffering for room
  creation and ticket attempts. They are eventually consistent and do not
  replace credential checks or atomic room capacity enforcement.
- Student role projections contain only question number and choice labels.
  Teacher-only case content and unrevealed aggregate answers must not be sent to
  student clients.
- Current per-participant answers are erased when a question is revealed.
  Explicit closure or room expiry removes active room state. Provider logs and
  recovery copies remain governed by the hosting provider's policies.
- The reference room service is not designed for examinations, attendance,
  adversarial identity verification, individual assessment, or permanent
  records.
- GitHub Pages and GitBook are external hosting services with their own privacy
  policies; see [`docs/USAGE_AND_PRIVACY.md`](./docs/USAGE_AND_PRIVACY.md).
- An account system, message-analysis feature, analytics integration, roster,
  gradebook, or persistent answer history requires a new threat model and
  privacy review; it is outside the current security boundary.
