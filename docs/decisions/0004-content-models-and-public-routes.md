# 0004: Content Models And Public Routes

Status: Accepted

Date: 2026-05-04

## Context

Phase 1 needs the first durable publishing loop: create or update writing and project records in Payload, publish them with stable slugs and media, and render them on public routes.

The project should avoid a throwaway MVP shape, but it should also avoid binding future taxonomy, comments, search, or SEO workflow decisions before real content exists.

## Decision

Add two first-class Payload collections:

- `articles` for essays, notes, and long-form public writing.
- `projects` for portfolio records, artifacts, demos, retrospectives, and maintained work.

Both collections use the same public lifecycle fields:

- `slug`
- `status`
- `publishedAt`
- `coverImage`

Published public routes read only records with `status = published` and `publishedAt` in the past.

Use these initial public routes:

- `/articles`
- `/articles/[slug]`
- `/projects`
- `/projects/[slug]`

## Non-Goals

- Do not add comments, messages, discussion, or community behavior in this decision.
- Do not add a full taxonomy, tagging system, search system, or editorial workflow yet.
- Do not treat every future platform module as a Payload collection.
- Do not lock final visual design in this decision.

## Consequences

- The platform now has a real content contract for the first platform loop.
- Future article and project UI can evolve without changing the initial route structure.
- Richer taxonomy, SEO metadata, comments, and deployment behavior remain later decisions once real content pressure exists.
