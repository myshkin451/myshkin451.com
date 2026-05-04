# 0003: Phase 1 Platform Stack

Status: Accepted

Date: 2026-05-04

## Context

Myshkin 451 is not intended to be a small CMS demo or a throwaway blog rewrite. It should become a long-lived personal platform for public writing, projects, media-backed publishing, personal identity, knowledge entry points, tools, experiments, and possible future interactive features.

The first engineering phase needs a stack that can deliver the first platform loop without forcing the owner to rebuild common backend infrastructure such as admin screens, content CRUD, media upload, schema management, authentication basics, and publishing status from scratch.

The stack should also leave room for future modules that are not CMS-shaped, including AI demos, tools, background jobs, custom APIs, or separate services.

## Decision

Use a TypeScript-first full-stack JavaScript foundation for Phase 1:

- Next.js App Router as the web application framework.
- React for frontend UI.
- Tailwind CSS for the initial styling layer.
- Payload CMS as the content, admin, media, and schema-management foundation.
- PostgreSQL as the long-term primary database.
- Docker Compose for the local PostgreSQL development database.
- Local filesystem uploads for development media, with S3/R2-compatible object storage reserved for deployment.
- pnpm as the package manager.

Payload is the content and admin foundation, not the entire application architecture.

The platform should keep room for non-CMS modules under regular application/module boundaries. If a future capability is better served by a dedicated service, such as Python/FastAPI for AI workloads, Node/NestJS for a separate API boundary, or Go for infrastructure-heavy work, it can be added through a later decision record without discarding the Payload-backed content platform.

## Alternatives Considered

- Next.js plus a custom NestJS backend:
  - More explicit backend architecture, but too much first-phase work for admin, CRUD, media, auth, and publishing workflows.
- Next.js plus Python/FastAPI:
  - Useful for future AI or data services, but not the best first backend for content/admin management.
- Static-site-only stack:
  - Simpler deployment, but too restrictive for a long-lived platform with admin, media, and future interaction needs.
- Payload as the whole application architecture:
  - Rejected. Payload should own content/admin concerns, while the platform keeps independent module boundaries for future non-CMS features.
- SQLite for local development:
  - Simpler at first, but less representative of the intended production database and migration workflow.

## Non-Goals

- Do not build a separate backend service in Phase 1.
- Do not model every future platform feature as a Payload collection.
- Do not introduce microservices, queues, or complex auth before the first platform loop works.
- Do not connect real S3/R2 storage during local scaffold unless deployment work begins.
- Do not treat the scaffold as the final architecture; use real implementation pressure to refine the boundaries.

## Consequences

- The first platform loop can focus on real publishing behavior instead of custom admin plumbing.
- The project gets a serious database and migration path from the start.
- Docker becomes part of local development, but only as a database convenience.
- Payload adoption risk is mitigated by keeping clear boundaries: content/admin in Payload, broader platform modules in application code.
- Future backend services remain possible without throwing away the content platform.

