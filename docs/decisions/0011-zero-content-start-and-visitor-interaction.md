# 0011: Zero-Content Start and Visitor Interaction

Status: Accepted (local frontend implemented; production backend pending)

Implementation update: [0012](0012-independent-frontend-and-rebuild-authority.md) records the local
frontend and supersedes the stack-retention requirement below. Real visitor accounts and shared
messages remain pending; the inspected historical backend has not been modified.

Date: 2026-09-18

## Context

The owner currently has no articles, photos, or projects to publish. The site should be usable
before a portfolio exists, make future publishing easy, and accommodate later edits. The owner
also explicitly wants visitors to register, log in, leave messages, and interact.

Decision 0010 deferred visitor accounts and comments until a concrete need appeared. That need
is now expressed by the owner. The current visual studies remain prototypes; positive feedback
on study 03 does not select a final layout or establish a working publishing/visitor system.

## Decision

1. Real content is not a prerequisite to building or launching the site. Design zero-, one-, and
   many-item states. Use clearly identified samples for development and preview only, with no
   automatic publication of fixtures or invented owner work.
2. Treat convenient publishing as part of the first usable release. The owner should be able to
   write, upload photos, publish a link-based project, categorize, preview, edit, and unpublish
   through the management surface without editing source code for routine work.
3. Support composition from a small set of reusable content layouts and homepage choices.
   Entirely new interactions or layouts remain development work; do not promise an unrestricted
   no-code site builder. Preserve stable content links when changing titles or visual arrangements.
4. Include visitor registration, sign-in, and messages/comments in the first usable release scope.
   Public reading remains available without an account. A standalone guestbook plus optional
   per-content discussion is the recommended placement, to be validated in the interface.
5. Keep owner management and visitor participation separate. Visitors must not gain access to
   the admin panel, drafts, publishing operations, media management, or other visitors' private
   account data. Define and test API permissions before exposing public registration.
6. Keep interaction small: a public nickname, messages, replies, management of one's own messages,
   and owner moderation. Include account recovery/verification and basic abuse controls in the
   implementation plan. Choose and validate a sign-in method before public launch; no external
   identity or email provider is selected by this record.
7. Build and test the flows locally first, then use the previously agreed hosting decision process.
   Shared visitor accounts and messages need a running backend and shared persistent storage.
   The offline HTML remains a design-review artifact, not a shared account or comment system.

This supersedes only the deferral of visitor accounts/comments in 0010 and the assumption that
reviewed owner articles and projects are required for launch. It retains the existing stack,
hosting deferral, creator-first purpose, and owner authority over the final visual direction.

## Implementation Evidence and Gaps

Read-only source review on 2026-09-18 found:

- `Users` is the sole auth collection and the configured Payload admin identity.
- Articles/projects contain basic publication status, rich text, cover media, and project links.
- Media supports upload but is not a publishable photo-series surface.
- `publishedOrAuthenticated` currently permits any authenticated request to read drafts; collection
  writes generally rely on Payload's default authenticated-user access. These rules must be replaced
  with explicit owner/visitor boundaries before visitor auth is added, including a separate auth
  collection if that approach is chosen. Blocking admin UI access alone would not secure the APIs.
- There are no visitor/comment collections, photo-series publishing, topic management, automatic
  draft versions, or configurable home composition in the inspected collection configuration.

Payload has documented support for [versions and drafts](https://payloadcms.com/docs/versions/overview),
[blocks](https://payloadcms.com/docs/fields/blocks), [separate admin/end-user identities](https://payloadcms.com/docs/admin/overview),
and [operation-level access rules](https://payloadcms.com/docs/access-control/overview). These are
implementation options, not features already enabled by this decision.

## Acceptance and Follow-up

- Start from an empty content database and use the site without broken layouts or a required sample seed.
- As owner, save a partial draft, preview it, publish a post/photo series/link project, edit it, and
  remove it from public display. Verify that unpublished edits do not unexpectedly change live content.
- As visitor, register/sign in, post and reply, manage one's own message, and sign out; verify recovery
  and any email flow on the chosen runtime before opening public registration.
- As owner, moderate messages and close discussion for an individual item when needed.
- Test unauthenticated, visitor, and owner permissions through the APIs as well as the interface,
  including attempts to access drafts, modify content, impersonate authors, or edit others' messages.
- Validate persistence across app restarts locally and redeployments/backups on the eventual host.

No runtime, database, credentials, provider accounts, or production settings were changed in this
decision slice. Public registration and comments are requirements, not delivered capabilities.

## Non-Goals

A general forum, private messaging, following/follower system, visitor content publishing, user
uploads, arbitrary executable content blocks, or a universal visual page builder.
