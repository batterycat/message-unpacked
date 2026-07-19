# Security Policy

Message, Unpacked. is a static educational application. It intentionally has
no student accounts, message uploads, analytics, database, or application
backend in the MVP.

## Supported version

Before the first stable release, security fixes are applied to the current
`main` branch only. Published demonstration builds should be updated from a
reviewed main-branch revision.

## Reporting a vulnerability

Use the repository's private vulnerability-reporting or Security Advisory
channel when it becomes available. Do not open a public issue containing an
active exploit, malicious URL, student information, credentials, or other
sensitive data.

The repository owner must configure and document a private contact before a
broad public launch. Until then, non-sensitive hardening suggestions may use a
regular issue; sensitive reports should wait for the private channel rather
than being disclosed publicly.

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
- A future classroom synchronization service, account system, message-analysis
  feature, or analytics integration requires a new threat model and privacy
  review; it is outside the current security boundary.
