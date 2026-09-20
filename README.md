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
- Reuse or replace the old foundation according to the publishing experience; prior code and design skills are not constraints.
- Make the site usable with no published work and make routine writing, photo, and project updates easy.
- Include visitor accounts and a small message/comment experience, with owner management kept separate.
- Prefer low-maintenance hosting suited to a small personal site. AWS study is no longer a launch requirement.
- Keep Myshkin 451 as a working name. The expired domain is not a dependency; the final domain is open.

The restart is accepted in [decision 0010](docs/decisions/0010-creator-first-restart.md).
The zero-content start and visitor interaction scope are recorded in
[decision 0011](docs/decisions/0011-zero-content-start-and-visitor-interaction.md). A complete local
frontend is now in [frontend/](frontend/README.md); shared accounts and publishing still need a backend.
[Decision 0012](docs/decisions/0012-independent-frontend-and-rebuild-authority.md) records the owner's
permission to rethink the foundation and the independent frontend boundary.
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

Start the new frontend without a database or environment secrets:

```bash
pnpm install --frozen-lockfile
pnpm frontend:dev
```

Open `http://127.0.0.1:4323/`. The frontend includes public pages, a content workspace, and clearly
labeled local visitor/message simulations. Its [README](frontend/README.md) explains persistence,
commands, verification, and limits. `pnpm frontend:build` checks types and builds this frontend.

The historical application scaffold uses Next.js, Payload, and local PostgreSQL through Docker Compose:

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
The owner finds this third round substantially better and wants to explore varied personal work,
classification, and richer details within a modern minimal design. The specific layout remains open;
B's earlier relative preference did not establish a dark or abstract visual identity.
No database is required for these previews. A
[single-file offline copy](docs/design/studies/restart-03/offline.html) includes both layouts and their assets;
use the local preview server while iterating, and rebuild the offline copy for portable review.

The current [frontend](frontend/README.md) extends this work into a connected page set: mixed browsing,
reading, albums, projects, topics, a small color tool, visitor pages, and an owner workspace. Content
can be drafted, previewed, and published into the current browser using IndexedDB. Local demo identities
and comments do not represent a real account service. Old production routes remain unchanged.

The next task connects the current frontend experience to durable content/media and real,
permission-isolated owner/visitor accounts, including recovery and moderation, then completes deployment.
The [production handoff](docs/operations/PRODUCTION_HANDOFF.md) defines that scope, acceptance, and the
account/payment steps that need the owner. Deployment research informs implementation; cloud setup
follows a verified working slice and a concrete provider/cost choice. The current visual design remains
open to feedback. The studies have not replaced the existing public routes; no production deployment is claimed.
