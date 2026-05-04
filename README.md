# Myshkin 451

Myshkin 451 is a personal digital platform built from scratch.

It starts with writing, projects, and a public homepage, but it is not meant to remain a simple blog. The long-term shape is a modular personal platform for essays, project notes, portfolio work, knowledge entry points, discussions, small tools, and experimental pages.

This repository intentionally does not continue an older blog architecture. The old site can be used as a feature reference, but this project should grow from a cleaner foundation.

## Direction

- Public writing: articles, essays, notes, and long-form work.
- Project space: portfolio entries, retrospectives, demos, links, and screenshots.
- Personal presence: homepage, profile, timeline, and public identity.
- Knowledge entry points: curated paths into notes or research areas.
- Future interaction: comments, messages, or discussion spaces when the core platform is stable.
- Experiments: small tools, AI demos, and exploratory pages without polluting the core content model.

## Engineering Stance

- Build a modular monolith first, not microservices.
- Keep content, admin, and public presentation boundaries clear.
- Prefer durable foundations over throwaway demos.
- Make every important development step reproducible by future agents.
- Keep checks, setup commands, and operational assumptions explicit.
- Avoid hidden state, undocumented conventions, and secret-dependent local behavior.
- Do not overbuild community, workflow, or permission systems before the first platform loop works.

## Planned Stack

- Next.js for the public site and application shell.
- Payload CMS for content models, admin UI, permissions, and media management.
- PostgreSQL as the primary database.
- S3/R2-compatible object storage for media.
- GitHub as the public source-of-truth for the platform code.

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

The repository has completed the Phase 1 first platform loop locally.

For agent workflow and long-term handoff, see `AGENTS.md`, `progress.md`, and `docs/HARNESS.md`.

The first product gate was the platform loop: create or update an article or project in the CMS/admin surface, publish it with media and a stable route, render it on the public site, and prove it with baseline checks.
