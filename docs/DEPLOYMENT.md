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

## Connect a compatible classroom backend

`PUBLIC_ROOM_SERVICE_URL` is the only frontend setting needed to replace the
optional live-classroom backend. It is a public build-time base URL, not an API
token or browser credential. The service must implement the versioned contract
listed in [`workers/README.md`](../workers/README.md#http-and-websocket-boundary),
including `GET /v1/capabilities`, and allow the exact public frontend origin.

For GitHub Pages:

1. Obtain the HTTPS base URL of a compatible service, without an API path or
   trailing slash; for example, `https://rooms.example.org`.
2. Open the repository's **Settings → Secrets and variables → Actions →
   Variables** page.
3. Create or update the repository variable `PUBLIC_ROOM_SERVICE_URL` with that
   base URL. Use a variable, not a secret: the value is embedded in public
   browser JavaScript.
4. Rerun **Deploy GitHub Pages** or push a new `main` revision. Changing the
   variable does not alter an already published build until Pages rebuilds it.
5. Open the teacher's live-classroom setup page and confirm that its service
   check succeeds. The static activity path must remain usable if the service
   check fails.

For another static host, provide the same value while building:

```bash
PUBLIC_ROOM_SERVICE_URL=https://rooms.example.org \
SITE_URL=https://learn.example.org \
pnpm build
```

Omit the variable to build without live rooms. The canonical
`batterycat/message-unpacked` workflow has an explicit demo fallback; forks do
not. A fork replaces that fallback simply by setting its own repository
variable. No Cloudflare token belongs in the static-site settings.

GitHub's official documentation explains how repository variables work:
[Store information in variables](https://docs.github.com/en/actions/how-tos/write-workflows/choose-what-workflows-do/use-variables).

## Release smoke check

After deployment, verify:

1. `/`, both localized home and activity pages, both teacher pages, and both
   classroom host/join pages load under the configured base path.
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

This repository documents only its adapter-specific configuration and safety
boundary. Cloudflare account setup and general Worker deployment belong to
Cloudflare's maintained
[Workers getting-started guide](https://developers.cloudflare.com/workers/get-started/guide/).
After an operator obtains a public service URL, use
[Connect a compatible classroom backend](#connect-a-compatible-classroom-backend)
to replace the frontend setting.

See [`workers/README.md`](../workers/README.md) for the project-specific
protocol, credentials, privacy boundary, tests, configuration table, and the
single adapter deployment command.
