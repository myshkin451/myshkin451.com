# 0006: Initial Visual System

Status: Partially Superseded

Date: 2026-05-04

Superseded by: `0007-public-site-experience-design.md` where the two records conflict. This record
remains useful as the historical first visual baseline and for early token/context decisions that
0007 does not replace.

## Context

Phase 2 needs the public site to become coherent without pretending the final brand system is
finished. The first public surfaces are the homepage, article list/detail, and project list/detail
routes. They need a small reusable baseline before more pages and richer content make styling drift
harder to unwind.

## Decision

Adopt an initial visual direction of a restrained editorial archive with a research-notebook edge.

Use typography, spacing, calm borders, and a grounded neutral palette as the main signature. Keep
the palette broader than a single beige or monochrome system by pairing warm paper neutrals with
ink, muted clay, and moss accents.

Define the first reusable CSS tokens in the frontend stylesheet:

- type families
- container widths
- color roles
- border and panel surfaces
- recurring spacing and focus states

Homepage information architecture should show the platform as four public-facing surfaces:

- Writing
- Projects
- Knowledge paths
- Labs

Only Writing and Projects need routes now. Knowledge paths and Labs remain visible as reserved
platform directions, not new CMS models or active modules.

## Non-Goals

- Do not introduce a component library yet.
- Do not add new Payload collections for notes, labs, or knowledge paths.
- Do not finalize a logo, illustration system, or strong visual metaphor.
- Do not redesign the Payload admin surface.
- Do not make discussion/community features part of Phase 2.

## Consequences

- Public UI changes should reuse the CSS tokens before adding new hardcoded values.
- Future homepage work can deepen the four-surface structure without changing the Phase 1 content
  model.
- The visual system can keep evolving, but major changes to the public identity should get a later
  decision record.
