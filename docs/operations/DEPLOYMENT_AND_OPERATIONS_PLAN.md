# Deployment And Operations Plan

Status: Active planning
Last updated: 2026-05-05

This document is the first deployment and operations planning slice after the Phase 2 public-site
readiness review. It is intentionally a plan, not deployment automation.

## Scope

Plan the first production path for Myshkin 451 without changing the CMS model, adding deployment
automation, or choosing infrastructure before the tradeoffs are visible.

The next durable decisions should cover:

- AWS launch timing and readiness gate;
- production database ownership and migration approach;
- media storage ownership;
- environment and secret handling;
- cache and revalidation strategy for public CMS-backed routes;
- backup, rollback, health check, and monitoring expectations.

The production cloud target is AWS. Decision `0009` accepts an AWS-first deployment direction,
centered on Amazon ECS Express Mode over Fargate with manual ECS/Fargate as the fallback path.

The manual launch runbook and preflight checklist now live in
`docs/operations/MANUAL_AWS_LAUNCH_RUNBOOK.md`. Treat that document as the operating gate for the
first AWS launch; it is still a manual plan, not a resource creation script.

## Public Readiness Review

Phase 2 can close as a public-site experience baseline.

The current codebase now has:

- Chinese-first public chrome, homepage, footer, and route copy;
- public routes for home, about, articles, projects, knowledge, and labs;
- intentional reserved surfaces for Knowledge Paths and Labs without new CMS collections;
- metadata, canonical URL, robots, and sitemap coverage for public routes;
- published-content visibility guarded by both `status: published` and `publishedAt <= now`;
- theme support for `system`, `dark`, and `light`;
- CI coverage for formatting, linting, type checking, integration tests, production build, and browser
  e2e tests.

This does not mean the platform is production-deployed. It means the public experience is stable
enough that deployment planning can use real application needs instead of guesses.

## Local Content And Test Record Inventory

The local development database contains proof records from the Phase 1/2 work. They are useful for
local validation, but they are not production seed content.

Before any production or staging environment is created:

- Remove or replace the ad-hoc published article with slug `test`.
- Replace the `first-platform-loop-*` article and project with real first public records, or start
  production from a clean database and recreate content intentionally.
- Treat the first-loop cover image under local `media/` storage as local proof media only.
- Remove any `*.example.test` or test-only admin users from shared environments.
- Do not migrate the local development database as the production source of truth.

The test suite records are different. Keep the `platform-loop-*`, `platform-loop-int-*`, and
`dev@payloadcms.com` fixtures in tests because they are created and cleaned by test helpers. If a
failed local test run leaves fixture rows behind, clean them in the local database before judging
public content readiness.

Ignored local artifacts such as `media/`, `test-results/`, `output/playwright/`, `playwright-report/`,
and `.local/` are not tracked by Git and should stay local.

## First Deployment Planning Slice

Use this order for the deployment planning workstream:

1. Define the AWS launch runbook.
   Documented in `docs/operations/MANUAL_AWS_LAUNCH_RUNBOOK.md`. It starts with ECS Express Mode on
   Fargate as the intended compute path and keeps manual ECS/Fargate plus Application Load Balancer
   as the fallback if Express Mode does not fit during implementation.

2. Define production data ownership.
   Prefer a clean production database for the first launch. If any local content is imported, review
   it as public content first and document the import path.

3. Define media storage.
   Local filesystem uploads are only a development default. Production should use Amazon S3 for the
   first AWS launch.

4. Define environment and secret handling.
   Required production values include `DATABASE_URL`, `PAYLOAD_SECRET`, `NEXT_PUBLIC_SITE_URL`, and
   future media storage credentials. Keep real values out of Git and out of public docs.

5. Revisit public-route caching.
   Decision `0008` keeps public CMS-backed routes dynamic during Phase 2. Before production, choose
   whether to keep dynamic rendering for launch or move to ISR, tag-based revalidation, or
   Payload-triggered revalidation.

6. Keep the launch runbook manual until the target is stable.
   It should cover deploy, verify, rollback, database backup, media backup, and basic health checks
   before any CI/CD or infrastructure-as-code work begins.

## Manual AWS Launch Runbook

The second planning slice is documented in `docs/operations/MANUAL_AWS_LAUNCH_RUNBOOK.md`.

It covers:

- the preflight checklist that should block AWS resource creation until the launch prerequisites are
  ready;
- the preferred ECS Express Mode on Fargate path accepted by decision `0009`;
- the manual ECS/Fargate plus Application Load Balancer fallback path;
- the intended resource order for ECR, IAM, networking, RDS, S3, Secrets Manager or SSM Parameter
  Store, CloudWatch, ECS, Route 53, and ACM;
- the environment values that must be recorded before launch;
- verification and rollback steps for compute, data, media, DNS, and secrets;
- AWS SAA study points tied to the real platform launch.

Known launch blockers remain outside the runbook itself: production container image shape, Payload S3
media storage, a stable health-check endpoint, and the final cache or revalidation decision.

## AWS Target Architecture

The first AWS production shape should stay small but real:

- Container registry: Amazon ECR.
- Application runtime: Amazon ECS Express Mode on Fargate.
- Fallback runtime: manual Amazon ECS on Fargate behind an Application Load Balancer.
- Database: Amazon RDS for PostgreSQL.
- Media: Amazon S3 for Payload uploads; CloudFront can be added after first-launch behavior is
  understood.
- DNS and TLS: Route 53 plus AWS Certificate Manager when the domain is ready to point at AWS.
- Secrets and configuration: AWS Secrets Manager or SSM Parameter Store.
- Observability: CloudWatch logs, metrics, and a small alarm set.

This is feasible for the current app, but it requires later implementation slices before launch:

- add a production container build path;
- add or configure Payload S3 media storage;
- decide how database migrations/schema changes are applied;
- add a health-check endpoint or confirm a stable health-check path;
- decide whether launch keeps dynamic rendering or introduces ISR/revalidation;
- write a manual rollback and restore path.

## AWS SAA Learning Thread

This deployment path should double as a practical AWS SAA study map:

- VPC and security groups: how the app reaches RDS and how public traffic reaches the load balancer.
- IAM roles and policies: task execution, S3 media access, ECR image pulls, and secret reads.
- Compute: ECS, Fargate, containers, autoscaling, and load balancing.
- Storage: S3 object storage, optional CloudFront distribution, and media backup policy.
- Database: RDS PostgreSQL, backups, snapshots, maintenance windows, and Multi-AZ tradeoffs.
- DNS and TLS: Route 53 hosted zone records and ACM certificates.
- Observability: CloudWatch logs, metrics, alarms, and runbook evidence.

Keep the learning thread attached to real platform needs. Do not add AWS services only because they
are exam topics.

## Follow-Up Development Direction

After this first target decision, continue in these slices:

1. Production data and content policy.
2. S3 media storage implementation plan, then implementation.
3. Runtime health check and production environment validation.
4. Cache and revalidation decision before production traffic.
5. First manual AWS deployment using the runbook gate.
6. Only after the manual path is stable, consider CI/CD and infrastructure-as-code.

## Non-Goals For This Slice

- No new CMS collections or fields.
- No comments, messages, forum, or workflow engine.
- No deployment automation.
- No Terraform or infrastructure-as-code until the target is accepted.
- No production cache invalidation hooks until hosting and secret boundaries are clear.
