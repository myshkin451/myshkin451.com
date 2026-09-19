# 0012: Independent Frontend and Rebuild Authority

Status: Accepted implementation slice; visual acceptance and production architecture remain open

Date: 2026-09-18

## Context

The owner explicitly permits replacing the old engineering files, prior design ideas, and old
design-skill constraints. They ask the agent to finish the next set of frontend pages in this task,
using subagents where useful. This supersedes the requirement in 0010/0011 to retain the old stack.
It does not require deleting useful code or historical studies before a replacement is usable.

## Decision

1. Build the next frontend in `frontend/`, separately from the historical Next/Payload application.
   Use React with the Vite version already resolved in this repository. Make Vite an explicit dev
   dependency and keep a reproducible build. This is a frontend implementation boundary, not a
   production hosting or backend selection.
2. Treat the positively received third study as evidence, not a fixed template. Implement mixed
   content browsing, a searchable index, writing, photo series, direct project entry, an actual
   small interactive tool, an about page, visitor flows, and an owner workspace as one experience.
3. Use one typed platform interface with an IndexedDB implementation for this review slice. Saves
   resolve after durable writes; drafts and published copies remain separate. Incomplete work can
   be saved. Published entries have stable ids independent of their titles.
4. Local preview controls distinguish labeled samples from the owner's content. Hiding samples
   does not delete owner entries. Sample text and generated images never become claimed owner work.
5. Visitor identity, messages, and moderation are explicitly local simulations. Do not collect real
   credentials or claim real registration, email, owner authorization, shared comments, or public
   publication. The visible owner workspace is not an access-control boundary.
6. Keep prior source and studies available. Any future backend choice must serve convenient
   publishing, durable media, independent owner/visitor permissions, recovery, and low maintenance.
   Evaluate reuse on its merits; neither preserving Payload nor replacing it is a launch requirement.

## Consequences and Follow-up

- The owner can inspect complete pages and try creating content without preparing a portfolio,
  running PostgreSQL, learning AWS, or selecting a provider.
- Browser storage is origin-specific. It is not backup, cross-device storage, an offline single-file
  distribution, or a production CMS. Changes to host/port create a different local data namespace.
- The next backend slice must replace the local adapter with a real service and verify permissions
  through APIs. If the existing Payload application is reused, fix its broad authenticated-user
  rules before adding visitors. Hash preview routes are not final public SEO URLs.
- Source-level design flexibility remains available; this slice does not provide a universal
  no-code page builder, arbitrary executable embeds, curated series, or manual homepage ordering.
- Old visual prescriptions and stack-retention rules are superseded. Creator-first purpose,
  accessibility, honest sample provenance, and owner authority over final taste remain intact.

See [frontend README](../../frontend/README.md) for commands, scope, checks, and current limits.
