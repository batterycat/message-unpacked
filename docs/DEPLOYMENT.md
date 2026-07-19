# Static Deployment

Message, Unpacked. produces static HTML, CSS, JavaScript, and image files in
`dist/`. The site does not require an application server, database, account
system, analytics service, or runtime environment variables.

## Deployment settings

Two build-time variables control public URLs:

| Variable    | Example                     | Purpose                                               |
| ----------- | --------------------------- | ----------------------------------------------------- |
| `SITE_URL`  | `https://learn.example.org` | Public origin used for canonical metadata             |
| `SITE_BASE` | `/message-unpacked/`        | Optional path prefix for project-style static hosting |

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

The repository includes `.github/workflows/deploy-pages.yml`. Every push to
`main` (and a manual workflow dispatch) builds and publishes `dist/` as a
GitHub Pages project site. For this repository the initial URL is:

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

## Phase 2: ephemeral classroom rooms

The optional second-stage service lives under `workers/` and uses Cloudflare
Durable Objects. Each room name maps to one `ClassroomRoom` instance; the Worker
relays teacher phase changes and anonymous answer tallies over WebSockets.

The static site remains the source of the case content and continues to work
without this service. The room Worker must not be treated as an account system
or a place to store student history. Before a public classroom launch, add
short-lived teacher authorization, rate limits, connection expiry, abuse
monitoring, and a privacy review.

See [`workers/README.md`](../workers/README.md) for the Wrangler commands and
the current protocol boundary. Configure `ALLOWED_ORIGIN` to the exact public
origin before deployment; leaving it unset is only suitable for local testing.
