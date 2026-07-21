# Optional Cloudflare classroom service

This directory contains the optional live-classroom adapter for Message,
Unpacked. One Cloudflare Durable Object represents one short-lived classroom
room. The static site remains fully usable when this service is absent or over
quota.

The public project service is a best-effort demonstration, not a required
dependency. Schools and other operators may deploy their own compatible
backend and choose limits that fit their environment.

## Classroom flow

1. The teacher filters cases and creates a room.
2. The service returns a room code and a teacher secret. The secret stays in
   the teacher tab's `sessionStorage` and is never placed in the room URL.
3. Students join with the room code and receive a pseudonymous participant
   token. No name, roster, email address, or student account is requested.
4. The teacher projection shows the complete message. Student phones receive
   only the question number and choice labels.
5. While a question is open, the teacher sees only joined and answered counts.
6. On reveal, the room broadcasts an aggregate distribution and erases the
   current per-participant answers. It does not build a cross-question student
   history or ranking.
7. Explicit room closure or the room lifetime alarm deletes active room
   storage.

The shared wire contract and scoring rules live in `src/domain/room/`. UI and
Worker code must not redefine them independently.

## Local development

Install the repository dependencies, then start the Worker locally:

```bash
pnpm worker:dev --port 8787 \
  --var LIVE_ROOMS_ENABLED:true \
  --var ALLOWED_ORIGINS:http://127.0.0.1:4321
```

In a second terminal, start the static site with the adapter enabled:

```bash
PUBLIC_ROOM_SERVICE_URL=http://127.0.0.1:8787 pnpm dev
```

These commands use Wrangler's local runtime. They do not require a Cloudflare
login, create remote resources, or change a Cloudflare billing plan.

## Configuration

The service fails closed. Live rooms are disabled unless both
`LIVE_ROOMS_ENABLED` and a valid exact-origin allowlist are configured.

| Variable               | Default | Meaning                                    |
| ---------------------- | ------- | ------------------------------------------ |
| `LIVE_ROOMS_ENABLED`   | `false` | Must be exactly `true` to enable room APIs |
| `ALLOWED_ORIGINS`      | none    | Comma-separated exact browser origins      |
| `MAX_PARTICIPANTS`     | `60`    | Maximum joined student tokens per room     |
| `MAX_CASES`            | `10`    | Maximum cases in one room manifest         |
| `ROOM_TTL_MINUTES`     | `120`   | Maximum room lifetime                      |
| `MAX_CHOICES_PER_CASE` | `6`     | Maximum public choices in one question     |
| `MAX_MESSAGE_BYTES`    | `4096`  | Maximum inbound WebSocket message size     |

Limits are deployment policy, not hard-coded product promises. Self-hosting
operators may change them without forking the protocol.

`workers/wrangler.toml` also defines two permissive Cloudflare Rate Limiting
bindings for the public edge: five room creates per source per minute and 120
ticket attempts per source/room per minute. These are abuse buffers, not exact
accounting or identity checks; Cloudflare documents that the counters are
eventually consistent and local to a Cloudflare location. Operators may edit
the limits and must choose namespace IDs that do not collide with other rate
limiting bindings in the same account. The transient source key is not written
to project storage or application logs.

The browser build uses one additional variable:

| Variable                  | Meaning                               |
| ------------------------- | ------------------------------------- |
| `PUBLIC_ROOM_SERVICE_URL` | Base URL of a compatible room service |

When it is absent, the classroom entry explains that live rooms are not
configured. Static self-paced activities and teacher projector activities
continue to work.

Changing `LIVE_ROOMS_ENABLED` to `false` rejects capabilities, room creation,
new tickets, and new WebSocket upgrades. Already accepted WebSockets continue
until the room ends, expires, disconnects, or the deployment restarts. With the
default policy, operators should therefore allow up to two hours for rooms to
drain. Static activities are unaffected.

## HTTP and WebSocket boundary

- `GET /v1/capabilities` returns the protocol version and effective public
  room limits. Disabled services reject the request with a typed error.
- `POST /v1/rooms` creates a room and returns its teacher secret once.
- `POST /v1/rooms/{code}/tickets` exchanges a teacher secret or participant
  token for a single-use, 30-second WebSocket ticket.
- `GET /v1/rooms/{code}/socket?ticket=…` upgrades the ticket to a WebSocket.

The Worker stores only digests of long-lived room credentials. Browser Origin
checking limits cross-site access but is not authentication; possession of the
appropriate secret or token remains required. The short-lived ticket appears
in the WebSocket URL because browser WebSocket APIs cannot set an Authorization
header.

## Verification

```bash
pnpm worker:typecheck
pnpm test:worker
```

The Worker suite runs through Cloudflare's official Vitest pool and local
Miniflare runtime. It covers origin enforcement, credential handling, ticket
replay, answer visibility and erasure, WebSocket hibernation, and alarm cleanup.

## Remote deployment and billing boundary

Remote deployment is deliberately manual. This repository contains no
workflow that deploys the Worker, upgrades a Cloudflare plan, creates a payment
subscription, or enables Workers Paid.

Before any remote deployment, the operator must:

1. create or select their own Cloudflare account;
2. confirm that Workers remains on the Free plan if zero billing is required;
3. configure an exact HTTPS origin and suitable limits;
4. review Cloudflare's current
   [Durable Objects pricing and limits](https://developers.cloudflare.com/durable-objects/platform/pricing/);
5. review the current
   [Workers Rate Limiting binding](https://developers.cloudflare.com/workers/runtime-apis/bindings/rate-limit/)
   configuration and namespace IDs;
6. deploy manually from an authenticated operator session.

For a first deployment, the checked-in migration creates only the
SQLite-backed `ClassroomRoomV2` namespace. Do not add a legacy `new_classes`
migration: Cloudflare no longer permits new KV-backed Durable Object
namespaces, and doing so also prevents a Workers Free deployment.

Example deployment for a GitHub Pages project owned by `example`:

```bash
pnpm exec wrangler deploy --config workers/wrangler.toml \
  --var LIVE_ROOMS_ENABLED:true \
  --var ALLOWED_ORIGINS:https://example.github.io
```

The frontend's `PUBLIC_ROOM_SERVICE_URL` is a public build-time URL, not a
secret. Store it as a GitHub Actions repository variable. The canonical
repository falls back to the maintainer demo URL, while forks remain
unconfigured until their operator sets this variable. Cloudflare API tokens
are required only for an operator-controlled automated Worker deployment and
must never be exposed to the browser build.

On the Free plan, exhausted free allocation can make room operations fail until
the applicable limit resets. It must not be worked around by automatic paid
upgrade. The static learning site remains available independently.

Cloudflare may still process network metadata and retain service data according
to its platform terms, logs, backups, and recovery mechanisms. Application
deletion means the active room state is removed from the Durable Object; it is
not a promise of immediate physical erasure from every provider backup. See
[`docs/USAGE_AND_PRIVACY.md`](../docs/USAGE_AND_PRIVACY.md).
