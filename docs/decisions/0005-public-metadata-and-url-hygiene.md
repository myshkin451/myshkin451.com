# 0005: Public Metadata And URL Hygiene

Status: Accepted

Date: 2026-05-04

## Context

Phase 2 starts after the first platform loop is complete. The public site now has real homepage,
article list/detail, and project list/detail surfaces backed by published Payload records.

Before a stronger visual system or deployment target is locked, the public routes need predictable
metadata and crawl behavior so future design work does not have to rediscover URL hygiene basics.

## Decision

Use a shared site metadata helper for public routes.

Set `NEXT_PUBLIC_SITE_URL` as the canonical site origin, defaulting to `https://www.myshkin451.com`
when the environment does not provide one. Local development can override it with
`http://localhost:3000`.

Add canonical metadata, Open Graph metadata, and Twitter card metadata for:

- `/`
- `/articles`
- `/articles/[slug]`
- `/projects`
- `/projects/[slug]`

Add public crawler entry points:

- `/robots.txt`
- `/sitemap.xml`

The sitemap includes the homepage, article index, project index, and currently published article and
project detail routes.

## Non-Goals

- Do not add a full SEO content workflow or CMS-owned metadata fields yet.
- Do not add schema.org structured data before real content shape stabilizes.
- Do not decide deployment hosting or DNS behavior in this decision.
- Do not lock the final visual direction.

## Consequences

- Public routes have stable canonical URL behavior before deployment.
- Shared metadata keeps route-level SEO updates from becoming scattered.
- The sitemap depends on published Payload content, so route tests should continue to cover seeded
  article and project records.
- Future SEO fields can be added to the content models through a later decision record if real
  publishing pressure appears.
