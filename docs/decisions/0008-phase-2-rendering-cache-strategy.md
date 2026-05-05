# 0008: Phase 2 Rendering Cache Strategy

Status: Accepted

Date: 2026-05-05

## Context

The public frontend routes currently render CMS-backed content for the homepage, article routes,
project routes, and sitemap. These routes use dynamic rendering while Phase 2 is still shaping the
public experience, publication semantics, and deployment plan.

For a low-frequency publishing platform, static generation or ISR will probably be useful later.
However, the project does not yet have a production host, cache invalidation path, webhook boundary,
or Payload `afterChange` revalidation strategy.

## Decision

Keep public CMS-backed routes dynamic during Phase 2.

This is a pre-deployment implementation choice, not the final production performance strategy. It
prioritizes correctness and direct reflection of CMS state while the public site, content models, and
publishing rules are still changing.

Before production deployment, revisit caching and decide whether to move public routes to ISR,
tag-based revalidation, or explicit `revalidatePath` calls from Payload hooks.

## Alternatives Considered

- Static generation:
  - Good for simple public pages, but premature before deployment and cache invalidation are defined.
- ISR with timed revalidation:
  - Likely useful later, but it can leave newly published or unpublished content stale without a
    revalidation strategy.
- Payload hook-triggered revalidation:
  - Best long-term candidate for published content, but it should be designed with deployment,
    secrets, and hosting constraints rather than improvised locally.

## Non-Goals

- Do not add production cache invalidation hooks in this decision.
- Do not choose the deployment platform here.
- Do not optimize for CDN behavior before the operational plan exists.

## Consequences

- Positive: Public routes always reflect current CMS visibility rules in Phase 2.
- Positive: The dynamic rendering choice is now intentional and visible to future agents.
- Negative: Public routes may do more database work than necessary until deployment caching is
  designed.
- Follow-up: Revisit this before the deployment decision or when public traffic/performance becomes a
  concrete constraint.
