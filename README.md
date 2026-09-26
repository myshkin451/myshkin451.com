# Myshkin 451

Myshkin 451 is a personal creative space for writing, making, and sharing work.

The first audience is its creator. Success means wanting to publish another piece, revisit the site,
and share a project. Audience growth and a large feature set are not prerequisites. The platform can
grow into essays, project notes, visual work, small tools, and experiments as real work appears.

This repository intentionally does not continue an older blog architecture. The old site can be used as a feature reference, but this project should grow from a cleaner foundation.

## Current Direction

- Develop the modern direction accepted for continued refinement in Study 04 on the existing platform.
- Make the site coherent, visually intentional, and enjoyable to use; a distinctive personal visual identity is not required.
- Refine through working examples and real publishing; the previous console and editorial designs are historical.
- Start with home, writing, projects, and a small about surface. Let actual content justify expansion.
- Reuse or replace the old foundation according to the publishing experience; prior code and design skills are not constraints.
- Make the site usable with no published work and make routine writing, photo, and project updates easy.
- Keep immediate thoughts alongside longer work: public notes, published only by the owner.
- Include visitor accounts and a small message/comment experience, with owner management kept separate.
- Prefer low-maintenance hosting suited to a small personal site. AWS study is no longer a launch requirement.
- Keep Myshkin 451 as a working name. The expired domain is not a dependency; the final domain is open.

The restart is accepted in [decision 0010](docs/decisions/0010-creator-first-restart.md).
The zero-content start and visitor interaction scope are recorded in
[decision 0011](docs/decisions/0011-zero-content-start-and-visitor-interaction.md). The pages in
[frontend/](frontend/README.md) now support both an independent local preview and a real Supabase backend.
[Decision 0012](docs/decisions/0012-independent-frontend-and-rebuild-authority.md) records the owner's
permission to rethink the foundation and the independent frontend boundary.
The owner-facing [design brief](docs/design/RESTART_BRIEF.md) separates confirmed goals from design
hypotheses. Older platform-specific skills and references are context, not a fixed aesthetic brief.
[Decision 0015](docs/decisions/0015-modern-public-direction.md) records the owner's authorization to
continue the modern direction in the shared application. On September 27 the owner accepted the
current version as the initial release baseline; production and real-account acceptance remain separate.

[Decision 0014](docs/decisions/0014-single-author-notes.md) adds the public notes timeline and a title-free
owner editor. See [notes usage and acceptance](docs/operations/NOTES_ACCEPTANCE.md). The owner has deferred
domain purchase; the existing Vercel address remains the deployment target.

## Engineering Stance

- Build a modular monolith first, not microservices.
- Keep content, admin, and public presentation boundaries clear.
- Prefer durable foundations over throwaway demos.
- Make every important development step reproducible by future agents.
- Keep checks, setup commands, and operational assumptions explicit.
- Avoid hidden state, undocumented conventions, and secret-dependent local behavior.
- Do not overbuild community, workflow, or permission systems before the first platform loop works.

## Current Foundation

- `site/`: Next.js public HTML, stable routes, metadata, and the existing Chinese publishing interface.
- Supabase: PostgreSQL, verified visitor accounts, explicit owner permissions, private media, and moderated messages.
- Separate draft and published records; browser clients cannot grant themselves owner access.
- Vercel Hobby and Supabase Free are the selected initial hosting combination; no standalone server is needed.
- GitHub as the public source-of-truth for the platform code.

[Decision 0013](docs/decisions/0013-production-supabase-and-next.md) records the architecture and free-tier
limits. Cloud activation, email delivery, and launch acceptance remain separate from local implementation;
see [progress.md](progress.md) for actual status and the [runbook](docs/operations/RUNBOOK.md) for operations.
The historical Next/Payload application remains in the repository and is not the selected deployment.

## Local Development

Start the new frontend without a database or environment secrets:

```bash
pnpm install --frozen-lockfile
pnpm frontend:dev
```

Open `http://127.0.0.1:4323/`. The frontend includes public pages, a content workspace, and clearly
labeled local visitor/message simulations. Its [README](frontend/README.md) explains persistence,
commands, verification, and limits. `pnpm frontend:build` checks types and builds this frontend.

The current connected design review runs on port `4333`:

```bash
pnpm frontend:dev --port 4333
```

Open [the full platform preview](http://127.0.0.1:4333/index.html?preview=sample). This explicit local
preview URL enables labeled samples; the workspace still saves only to this browser's IndexedDB.
The separate [study entry](http://127.0.0.1:4333/study.html) remains an exploration reference.

To run the real backend locally, start Docker and use:

```bash
pnpm site:db:start
pnpm site:local:configure
pnpm site:dev
```

Open `http://127.0.0.1:4325/`. Its accounts, media, and data belong to an isolated local Supabase project,
not the cloud project or the IndexedDB preview. The setup helper creates local public configuration only;
it refuses to overwrite an existing `site/.env.local`. See the runbook for first owner authorization.

Relevant checks are `pnpm frontend:test`, `pnpm site:test:api`, `pnpm site:build`, plus formatting,
lint and types. Local confirmation/recovery emails go to the local test inbox, not real recipients.

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

The publishing backend and public routes are implemented. The modern public design is now integrated
into the shared application used by Vite and `site/`, including a data-driven homepage, search, reading,
image viewing, accounts and the owner workspace. The owner has authorized this direction for continued
development and has now accepted the current visual version for launch. This redesign is local and has
not been deployed; the next stage is production rollout and real-account activation.

For agent workflow and long-term handoff, see `AGENTS.md`, `progress.md`, and `docs/HARNESS.md`.

The first product gate was the platform loop: create or update an article or project in the CMS/admin surface, publish it with media and a stable route, render it on the public site, and prove it with baseline checks.

[Study 04](docs/design/studies/restart-04/README.md) records the references, accepted continuation and
integration boundary. Its design now uses actual published entries and settings, while preserving
draft isolation, stable routes, moderation and server-rendered public HTML. The local crop demonstration
also supports selecting an image from the device and exporting a PNG without uploading it.

The [frontend](frontend/README.md) includes browsing, reading, albums, projects, topics, tools, visitor
pages and an owner workspace. In Vite, content is drafted, previewed and published into the current
browser using IndexedDB; local identities and comments are simulations. In `site/`, the same application
uses the existing Supabase implementation. Historical studies remain available for comparison.

The [production handoff](docs/operations/PRODUCTION_HANDOFF.md) defines the active delivery scope and
acceptance. Real account, publishing, recovery, media, and moderation code is implemented under decision
0013; current verification and cloud blockers are recorded in `progress.md`. The accepted visual baseline
can evolve through daily use. No public deployment should be inferred from a successful local build.
