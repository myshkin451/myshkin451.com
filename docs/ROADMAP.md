# Roadmap

This roadmap is directional. It should help future sessions understand the project arc without pretending that every detail is already designed.

## Phase 0: Foundation And Governance

Status: Closed

Goal: create the public repository, establish the project identity, and define a lightweight governance kernel for long-running agent work.

Completion signals:

- GitHub repository exists and tracks `main`.
- `README.md`, `AGENTS.md`, `CLAUDE.md`, `progress.md`, `docs/HARNESS.md`, and decision records exist.
- Agent workflow, evidence expectations, and decision lifecycle are documented.

## Phase 1: First Platform Loop

Status: Closed

Goal: make the platform genuinely usable for the first publishing workflow.

Completion signals:

- Payload admin can create or update articles and projects.
- Articles and projects support stable slugs, publication status, and media.
- Public routes render published content from Payload.
- Baseline checks pass for format, lint, typecheck, build, and relevant integration tests.

Non-goals:

- Full forum or community system.
- Complex permissions or workflow engine.
- Polished final visual design.
- Production deployment.

## Phase 2: Public Site Experience

Status: Closed

Goal: turn the scaffold into a coherent public website experience.

Completed scope:

- Homepage structure and navigation.
- Article list and detail experience.
- Project list and detail experience.
- About/profile surface.
- SEO metadata and public URL hygiene.
- Initial visual direction and reusable UI patterns.

## Deployment And Operations Planning

Status: Active

Goal: prepare the first production path without jumping straight into deployment automation.

Likely scope:

- Public content and test-record cleanup policy.
- First deployment target comparison.
- Production database ownership and migration approach.
- S3/R2-compatible media storage direction.
- Environment and secret handling.
- Cache and revalidation strategy before production.
- Manual launch, rollback, backup, and health-check runbook.

Non-goals:

- New CMS models.
- Deployment automation.
- Infrastructure-as-code before the deployment target is accepted.

Planning document:

- `docs/operations/DEPLOYMENT_AND_OPERATIONS_PLAN.md`

## Phase 3: Platform Expansion

Status: Planned

Goal: add platform capabilities that go beyond basic publishing once the core loop is stable.

Possible scope:

- Knowledge entry points.
- Labs or experiments area.
- Small tools.
- AI demos or service integrations.
- Comments, messages, or discussion boundaries.
- Module-level ownership docs if parallel work becomes common.

## Phase 4: Deployment And Operations

Status: Planned

Goal: make the platform durable outside the local development machine after the deployment plan is
accepted.

Likely scope:

- Cloud deployment target.
- Managed PostgreSQL or migration strategy.
- S3/R2-compatible media storage.
- Environment and secret management.
- Infrastructure-as-code direction when the deployment target is stable enough.
- Backups, rollback, health checks, and monitoring.
- GitHub Actions and deployment checks.

Entry signal:

- Deployment and operations planning has an accepted target, data policy, media-storage direction,
  cache strategy, and manual launch runbook.

## Roadmap Rules

- Keep this file short and directional.
- Record major architecture choices in `docs/decisions/`.
- Keep current state in `progress.md`.
- Split detailed phase plans into `docs/plans/` only when real implementation detail exists.
