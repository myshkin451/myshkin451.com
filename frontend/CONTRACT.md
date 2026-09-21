# Shared frontend contract

The React pages have two adapters behind `PlatformProvider` and `usePlatform(): Platform`:

- Default: independent Vite preview with IndexedDB and explicit local demo identities.
- `remote={url, key, emailEnabled, githubEnabled}`: Supabase Auth, database RPC/RLS and private Storage,
  composed by [`site/app/client.tsx`](../site/app/client.tsx). Optional `initialState` contains only public
  server-rendered data; it never establishes visitor or owner authority.

The original Vite preview remains usable at `127.0.0.1:4323`; the Next application defaults to `4325`.
Do not migrate local samples, IndexedDB records or test identities into shared production data implicitly.
The old root `src/` Payload application is preserved and is not the production entrypoint for this mode.
See [decision 0013](../docs/decisions/0013-production-supabase-and-next.md) and the
[operations guide](../docs/operations/RUNBOOK.md). Implementation does not imply completed cloud deployment.

## Data and adapter boundaries

[`src/types.ts`](src/types.ts) owns the shared types. `entries` contains the current public copies;
local sample mode additionally merges sample records. Public pages filter `status === 'published'`.
`drafts` contains separate working copies: saving a draft must not change a public copy. Publishing
replaces the public copy and removes its draft. Unpublishing preserves an existing edited draft.

The local store resolves writes after IndexedDB commits, reports quota/unavailable errors, and preserves
previous state. Empty mode hides samples while retaining user-created local records. Local demo login
collects no real password and sends no email.

Remote `ready` describes initial data completion; `authReady` describes completed identity resolution.
`remote`, `isOwner`, `auth`, and `refresh` are optional so local consumers remain compatible. The
`auth` interface handles email registration/login/recovery, password updates, optional GitHub login,
and profile updates. Initial private fields are discarded; only verified Auth and role-table results
establish the displayed identity. Role metadata is never authorization.

A failed network refresh must retain previously verified identity, drafts and the mounted editor.
Confirmed missing/rejected sessions, identity changes, explicit sign-out and confirmed owner revocation
clear the relevant private state. An error must remain visible. These presentation rules never replace
server authorization: every write is still checked by the database. Never display an empty-site success
when a remote load failed. Lists use deterministic ID ordering and paginated reads, not a single
PostgREST response that silently truncates data.

The remote adapter only requests drafts after a successful owner-role lookup. Messages carry optional
`pending / approved / hidden` status alongside the local `hidden` flag. Visitors can manage their own
nonpublic messages; public visibility and moderation authority are enforced by RLS and RPC. Deleted
messages with replies can remain anonymous tombstones and cannot be new reply targets.

All remote writes use the RPC names and parameters in the [API contract](../docs/operations/API_CONTRACT.md).
The browser receives only a public project URL and publishable/anon key. Never add service-role keys,
private database credentials, SMTP secrets or permissions derived from client state to frontend code.

## Media

The shared editor reads supported uploads as temporary data URLs. In remote mode, save/publish uploads
new immutable UUID objects to the private `media` bucket. Store only `/media/<UUID>.png|jpg|webp|avif`
references in Entry JSON; do not persist data URLs, external download URLs or signed URLs.

Draft preview photos can carry `Photo.storagePath` while `src` is an expiring signed URL. The adapter
strips this presentation field and restores canonical references before saving, including the cover.
The public `/media/…` route belongs to `site/`. A new upload cannot overwrite a published object.
The editor limits each image to 10 MiB and each entry to 20 images; server validation is authoritative.

## Routes and page contracts

[`src/navigation.tsx`](src/navigation.tsx) exports `NavigationProvider`, `SiteLink`, `useRoute`,
`currentRoute`, `go` and `replaceRoute`. Vite uses hash links; the Next wrapper uses normal paths:

```text
/ /archive /writing /photos /projects /entry/:id /topics/:topic
/play/color /about /guestbook /login /register /recover /account /auth/callback
/studio /studio/new?kind=writing|photo|project /studio/edit/:id
/studio/settings /studio/comments
```

Use `SiteLink` for internal page links and navigation helpers for programmatic moves. Do not introduce
production `#/` URLs or hard-code `window.location.hash` into shared production flows. Internal heading
anchors remain normal document anchors. Full-document navigation must respect unsaved-editor guards.
Returning from an entry restores this tab's sanitized collection route and filters from sessionStorage;
SSR uses a safe deterministic initial return link. Stored or query-provided return values must never
allow external destinations.

Studio exports `StudioPage({path, params})`; Community exports `CommunityPage({path, params})` and
`Discussion({targetId})`. The shared guestbook target is `guestbook`; an entry discussion targets its UUID.
The production App gates Studio on verified owner state, and the remote adapter also checks the owner
before publishing actions; the server remains the actual permission boundary. Account nickname fields
must populate when identity loads asynchronously, without overwriting a nickname the visitor is editing.

## Presentation

Public layout uses a 1200px maximum width. App renders the site header/footer and main; pages own inner
content. Studio owns its minimal header/nav. Page CSS is imported by the corresponding page module.
Shared classes include `button`, `button.secondary`, `button.quiet`, `button.danger`, `field`,
`field-label`, `muted`, `eyebrow`, `page-heading`, `page-lead`, `empty-state`, `form-error`,
`form-notice` and `sr-only`. Follow current styles and owner feedback rather than treating historical
palette values or old design studies as fixed requirements.

Keep local demo notices and preview/sample controls out of remote mode. Never seed fake conversations,
owner works or invented biography. Email success notices report only the action performed, not delivery;
production email entrypoints stay disabled until external SMTP and delivery are verified.

## Validation

Run proportionate format, lint, frontend types, tests and build for changes. Current frontend tests
include 28 data/confirmation cases, 13 remote-adapter cases, 10 collection-return cases,
2 async-profile nickname cases and 22 notes cases, including automatic private draft saving. Mocked adapter tests cover lifecycle and request construction, not actual
RLS, SMTP delivery, cloud persistence or deployment. Real API and independent-browser verification are
separate acceptance steps recorded in the [current project state](../progress.md).
