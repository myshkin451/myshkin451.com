# Myshkin 451

Myshkin 451 is a personal creative space for writing, making, and sharing work.

The first audience is its creator. Success means wanting to publish another piece, revisit the site,
and share a project. Audience growth and a large feature set are not prerequisites. The platform can
grow into essays, project notes, visual work, small tools, and experiments as real work appears.

This repository intentionally does not continue an older blog architecture. The old site can be used as a feature reference, but this project should grow from a cleaner foundation.

## Current Direction

- Restart with design exploration, then build a small usable site, then deploy it.
- Make the site personal, visually intentional, and enjoyable to explore and use.
- Discover the visual direction through working examples; the previous console design is historical.
- Start with home, writing, projects, and a small about surface. Let actual content justify expansion.
- Keep the existing publishing foundation while redesigning the public experience.
- Prefer low-maintenance hosting suited to a small personal site. AWS study is no longer a launch requirement.
- Keep Myshkin 451 as a working name. The expired domain is not a dependency; the final domain is open.

The restart is accepted in [decision 0010](docs/decisions/0010-creator-first-restart.md).
The owner-facing [design brief](docs/design/RESTART_BRIEF.md) separates confirmed goals from design
hypotheses. Older platform-specific skills and references are context, not a fixed aesthetic brief.

## Engineering Stance

- Build a modular monolith first, not microservices.
- Keep content, admin, and public presentation boundaries clear.
- Prefer durable foundations over throwaway demos.
- Make every important development step reproducible by future agents.
- Keep checks, setup commands, and operational assumptions explicit.
- Avoid hidden state, undocumented conventions, and secret-dependent local behavior.
- Do not overbuild community, workflow, or permission systems before the first platform loop works.

## Existing Foundation

- Next.js for the public site and application shell.
- Payload CMS for content models, admin UI, permissions, and media management.
- PostgreSQL as the primary database.
- Local filesystem media in development; durable hosted media storage still needs implementation.
- GitHub as the public source-of-truth for the platform code.
- Hosting provider and final domain are undecided. See the [current deployment plan](docs/operations/DEPLOYMENT_AND_OPERATIONS_PLAN.md).

## Local Development

The application scaffold uses pnpm, Next.js, Payload, and a local PostgreSQL database through Docker Compose.

```bash
pnpm install
pnpm db:up
cp .env.example .env
pnpm dev
```

Then open:

- `http://localhost:3000` for the public site
- `http://localhost:3000/admin` for the Payload admin

Baseline checks:

```bash
pnpm lint
pnpm typecheck
pnpm build
```

## Current Status

Phase 1 publishing and Phase 2 public routes have a previously validated local baseline. The
September 2026 restart reopens public design; the existing UI is not the accepted final experience.

For agent workflow and long-term handoff, see `AGENTS.md`, `progress.md`, and `docs/HARNESS.md`.

The first product gate was the platform loop: create or update an article or project in the CMS/admin surface, publish it with media and a stable route, render it on the public site, and prove it with baseline checks.

The current [design study](docs/design/studies/restart-03/README.md) compares two content-led layouts:
[side-by-side browsing](docs/design/studies/restart-03/index.html) and an
[index with previews](docs/design/studies/restart-03/catalog.html). Writing, projects, and images
share the same six-item sample set, without a preferred medium. Both were implemented after reference
research and generated mockups, with reading, image viewing, and a working color-sampling tool.
The owner has not accepted an earlier direction; B's relative preference did not establish a dark or
abstract visual identity. No database is required for these previews.

The next deliverable is one accepted home/article/project direction shaped by feedback on this preview.
Deployment research can inform implementation, but provider selection and cloud setup come after that
working slice. The studies have not replaced the existing public routes; no production deployment is claimed.
