# Scope, privacy, and external services

This notice explains what Message, Unpacked. does and does not do. It is not
formal legal advice.

## Educational scope

Message, Unpacked. teaches general verification habits through prepared
examples. It does not determine whether a learner's real message is genuine and
does not replace police, legal, financial, counselling, or school professional
judgment.

Cases, impact figures, official resources, and procedures can change. Check the
source and review date shown with a case, and use the official destination for
current guidance.

## Do not submit real messages or personal data

The static site does not ask for student names, accounts, phone numbers,
rosters, or real conversations. Do not paste or upload real messages, suspicious
URLs, credentials, payment details, or another person's information into an
issue, case file, classroom screen, or future project form.

In self-paced and static projector activities, answers and progress are held
only in the current browser page. These modes have no project-operated answer
database or classroom analytics service.

## Optional live-classroom mode

When a deployment explicitly enables the classroom service, the teacher can
open a short-lived room and students can submit choices from their phones. This
is a separate mode; the static activities continue to work without it.

The application does not request a name, email address, school account, roster,
or student identifier. A student tab receives a random participant token in
`sessionStorage`. The backend keeps only its digest and the current question's
answer. While a question is open, the teacher sees joined and answered counts,
not individual answers. On reveal, the room calculates an aggregate
distribution and removes the per-participant answers. It does not create
cross-question student histories, rankings, or grades.

Closing a room or reaching its configured lifetime deletes the active Durable
Object storage. Network and hosting providers may still process IP addresses,
browser metadata, service logs, abuse signals, and backup or recovery data
under their own policies. Active-state deletion is therefore not a promise of
immediate physical erasure from every provider backup.

## Hosting and documentation services

The demonstration site is hosted by GitHub Pages and the teacher guide is
published with GitBook. These providers may process basic technical data such
as IP address, browser information, requested pages, referring pages, and
service logs under their own policies:

- [GitHub Privacy Statement](https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement)
- [GitBook Privacy Statement](https://gitbook.com/docs/policies/privacy-and-security/statement)
- [GitBook cookie information](https://gitbook.com/docs/policies/privacy-and-security/statement/cookies)

GitBook search, an AI assistant, or page-rating features may additionally send
the query, prompt, or rating entered by a reader to GitBook. Do not enter real
messages, personal data, credentials, or suspicious links into those controls.
The project recommends leaving optional AI-assistant and page-rating features
disabled unless their classroom purpose and privacy notice have been reviewed.

The optional reference classroom service runs on Cloudflare Workers and Durable
Objects. Cloudflare may process basic network and service metadata under its
own policies:

- [Cloudflare Privacy Policy](https://www.cloudflare.com/privacypolicy/)
- [Cloudflare Durable Objects documentation](https://developers.cloudflare.com/durable-objects/)

The reference deployment also uses Cloudflare's Rate Limiting binding with a
transient network-source key to reduce automated room creation and join abuse.
The project does not write that key to room storage or application logs;
Cloudflare remains the processor of network and rate-limit metadata under its
policies.

The project does not receive a student answer history from GitHub Pages or
GitBook. A future analytics integration, real-message analysis feature, account
system, gradebook, or roster requires a separate privacy review and an updated
notice before release.

## External links and urgent situations

Official links are provided for verification and help. Linking to a service
does not guarantee its availability and does not endorse unrelated content on
that site. Check the organization name and destination before leaving the
learning site.

If money, an account, personal safety, or a possible offence is involved, stop
the requested action, preserve available evidence, tell a trusted adult, and
use the appropriate current official channel. Do not rely on the exercise as an
emergency service or case-specific legal determination.

## Updates

This notice was reviewed on 2026-07-21. Material changes to hosting, data flow,
classroom synchronization, or third-party services require an update to this
notice, the project constitution, and the third-party resource register.
