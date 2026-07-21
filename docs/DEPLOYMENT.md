# Static Deployment

Message, Unpacked. produces static HTML, CSS, JavaScript, and image files in
`dist/`. The core learning experience does not require an application server,
database, account system, analytics service, or runtime environment variables.
An optional live-classroom adapter can be enabled at build time without making
the static routes depend on it.

## Deployment settings

Three build-time variables control public URLs and optional classroom support:

| Variable                  | Example                     | Purpose                                               |
| ------------------------- | --------------------------- | ----------------------------------------------------- |
| `SITE_URL`                | `https://learn.example.org` | Public origin used for canonical metadata             |
| `SITE_BASE`               | `/message-unpacked/`        | Optional path prefix for project-style static hosting |
| `PUBLIC_ROOM_SERVICE_URL` | `https://rooms.example.org` | Optional compatible live-classroom service            |

`SITE_BASE` defaults to `/`. Keep both the leading and trailing slash when a
subpath is used.

### Root-domain deployment

```bash
SITE_URL=https://learn.example.org pnpm build
```

Publish the contents of `dist/` as the host's document root.

### Project-subpath deployment

For a site such as `https://example.github.io/message-unpacked/`:

```bash
SITE_URL=https://example.github.io \
SITE_BASE=/message-unpacked/ \
pnpm build
```

The repository includes a deterministic smoke build for this shape:

```bash
pnpm build:subpath
pnpm check:subpath
```

The check scans all generated HTML entry points and fails if a local asset,
localized route, or hydrated component escapes the configured base path.

## Host requirements

- Serve directory indexes, so `/zh-TW/activity/` resolves to
  `zh-TW/activity/index.html`.
- Preserve query strings and fragments. Teacher activity links store their
  versioned configuration in the URL only.
- Serve UTF-8 content and HTTPS in public environments.
- Do not add analytics, form capture, advertising, or student identifiers
  without a separate privacy and governance review.
- Configure a conservative Content Security Policy at the host when practical.
  Official support links intentionally leave the static site only after an
  explicit user action.

## GitHub Pages

The repository includes `.github/workflows/deploy-pages.yml`. A `main` revision
is built and published only after the `Quality` workflow succeeds; an explicit
manual dispatch remains available for recovery. The deployment checks out the
exact revision that passed Quality. For this repository the initial URL is:

`https://batterycat.github.io/message-unpacked/`

The workflow sets `SITE_BASE` to the repository name so localized routes and
assets work under the project path. If the repository is renamed or moved to a
custom domain, update the workflow's `SITE_BASE` and `SITE_URL` values together
and rerun `pnpm check:subpath` with the new path.

## Release smoke check

After deployment, verify:

1. `/`, `/zh-TW/`, `/zh-TW/teacher/`, `/zh-TW/activity/`, `/en/`,
   `/en/teacher/`, and `/en/activity/` load.
2. The hero illustration and interactive components load without console
   errors.
3. A teacher can generate, copy, scan, and open one activity URL.
4. Student and projector modes lead to different reveal behavior.
5. A documented case shows its source and qualified impact after answering.
6. The 320 px layout has no horizontal overflow.

## Optional live-classroom rooms

The reference service under `workers/` uses Cloudflare Workers and SQLite-backed
Durable Objects. Each room code maps to one short-lived object. Teachers control
the projected question, students send pseudonymous answers, and only aggregate
distributions are revealed.

The static site remains the source of the case content and continues to work
without this service or when its free allocation is exhausted. The Worker is
not an account system, gradebook, attendance system, or place to store student
history.

### Local verification without a Cloudflare account

```bash
pnpm worker:dev --port 8787 \
  --var LIVE_ROOMS_ENABLED:true \
  --var ALLOWED_ORIGINS:http://127.0.0.1:4321
```

In another terminal:

```bash
PUBLIC_ROOM_SERVICE_URL=http://127.0.0.1:8787 pnpm dev
```

This uses Wrangler's local runtime only. It neither deploys remote resources
nor changes an account plan.

### Operator-controlled limits

The deployment must set `LIVE_ROOMS_ENABLED=true` and an exact
`ALLOWED_ORIGINS` allowlist. `MAX_PARTICIPANTS`, `MAX_CASES`,
`ROOM_TTL_MINUTES`, `MAX_CHOICES_PER_CASE`, and `MAX_MESSAGE_BYTES` are
configurable policy limits. Conservative defaults are documented in the Worker
README; schools operating their own backend may choose different values.

The Wrangler file also configures soft edge abuse limits for room creation and
ticket attempts. A school operator can edit these rate-limiting bindings and
must use namespace IDs that do not collide with other bindings in the same
Cloudflare account. Durable Object capacity checks remain the authoritative
hard limits.

The first remote deployment provisions only the SQLite-backed
`ClassroomRoomV2` namespace. Do not restore the prototype `new_classes`
migration: Cloudflare no longer permits newly created KV-backed Durable Object
namespaces, and that migration prevents deployment on Workers Free.

Setting `LIVE_ROOMS_ENABLED=false` stops capabilities, room creation, new
ticket exchange, and new WebSocket upgrades. WebSockets that were already
accepted continue until their room ends, expires, disconnects, or the Worker
deployment is restarted; use the two-hour default room lifetime as the maximum
drain window. The switch does not affect static activities.

### Remote deployment and zero-billing rule

Remote Worker deployment is a separate, explicit operator action. The
repository has no CI workflow or application code that deploys this Worker,
enables Workers Paid, upgrades a plan, or creates a payment subscription.

The maintainer's best-effort demo currently uses
`https://message-unpacked-room.batterycat.workers.dev`. Other operators should
deploy their own compatible service and point their frontend build at that URL;
they should not depend on the maintainer endpoint for classroom availability.

An operator who requires zero billing must keep the selected Cloudflare account
on the Workers Free plan and confirm current Cloudflare limits before every
deployment. If free allocation is exhausted, live-classroom operations may fail
until the applicable reset; the static site continues to work. The application
must not automatically switch to paid capacity.

Cloudflare's current Durable Objects documentation states that Free-plan
operations fail after a free-tier limit is exceeded and daily limits reset at
00:00 UTC. The repository cannot protect an operator who has independently
placed the account on Workers Paid; that account's own paid-plan billing rules
would apply. The zero-billing guarantee therefore means: this project never
enables or upgrades to Workers Paid, and the operator verifies the account stays
on Workers Free.

For GitHub Pages, set `PUBLIC_ROOM_SERVICE_URL` as a repository variable and
let the Pages workflow embed that public service base URL at build time. The
canonical `batterycat/message-unpacked` repository has an explicit fallback to
the maintainer demo; forks default to no room service unless their operator
sets the variable. The URL is not a credential. A Cloudflare API token is
needed only if the operator later adds a separate automated Worker deployment
workflow; it must not be passed to the static-site build.

See [`workers/README.md`](../workers/README.md) for the Wrangler commands and
the protocol, credentials, privacy boundary, tests, and full configuration
table.
