# Deployment And Operations Plan

Status: Active planning
Last updated: 2026-05-05

This document is the first deployment and operations planning slice after the Phase 2 public-site
readiness review. It is intentionally a plan, not deployment automation.

## Scope

Plan the first production path for Myshkin 451 without changing the CMS model, adding deployment
automation, or choosing infrastructure before the tradeoffs are visible.

The next durable decisions should cover:

- deployment target and timing;
- production database ownership and migration approach;
- media storage ownership;
- environment and secret handling;
- cache and revalidation strategy for public CMS-backed routes;
- backup, rollback, health check, and monitoring expectations.

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

Use this order for the next workstream:

1. Choose the first production target.
   Compare a managed platform path against a VPS/container path. Record the accepted choice in a
   decision record before implementation.

2. Define production data ownership.
   Prefer a clean production database for the first launch. If any local content is imported, review
   it as public content first and document the import path.

3. Define media storage.
   Local filesystem uploads are only a development default. Production should use an S3/R2-compatible
   object store or a hosting-native durable media path before public launch.

4. Define environment and secret handling.
   Required production values include `DATABASE_URL`, `PAYLOAD_SECRET`, `NEXT_PUBLIC_SITE_URL`, and
   future media storage credentials. Keep real values out of Git and out of public docs.

5. Revisit public-route caching.
   Decision `0008` keeps public CMS-backed routes dynamic during Phase 2. Before production, choose
   whether to keep dynamic rendering for launch or move to ISR, tag-based revalidation, or
   Payload-triggered revalidation.

6. Define the launch runbook.
   The first runbook should cover deploy, verify, rollback, database backup, media backup, and basic
   health checks. It can stay manual until the target is stable.

## Non-Goals For This Slice

- No new CMS collections or fields.
- No comments, messages, forum, or workflow engine.
- No deployment automation.
- No Terraform or infrastructure-as-code until the target is accepted.
- No production cache invalidation hooks until hosting and secret boundaries are clear.
