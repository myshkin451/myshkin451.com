# Progress

Last updated: 2026-09-27
Last implementation update: 2026-09-27 (modern design deployed; account access management and backup safeguards added)

## Current Phase

The accepted modern visual baseline `2a7e304`, including Cursor's `e264d44`, and the account-management
release `766781a` are deployed at [myshkin451.vercel.app](https://myshkin451.vercel.app).
Both GitHub workflows passed; Vercel deployment `HbSMc5tpKHbeSD6NyGMiHW6H94UC` is Ready at the
account release. No design restart or backend replacement is needed.

Account management now has a scoped implementation: verified-account status, a paginated owner-only
user list, grant/revoke owner access, restrict/restore application writes, self/last-owner protections,
and private audit records. Migration `202609270001` has been applied to the existing production
project. The frontend release and its final browser evidence are recorded in
[cloud acceptance](docs/operations/CLOUD_ACCEPTANCE.md).

A fresh production SQL read on September 27 confirms **0 Auth accounts, 0 owners, 0 published entries,
0 drafts, 0 messages and 0 media objects**. No local fixtures or IndexedDB data were imported. This
means the public website is deployed, but no real owner or daily publishing has been accepted yet.

The owner reconfirmed on September 27 that there is no owned DNS/domain and domain work remains a
later step. Do not purchase or let that block independent implementation. Resend is only a candidate;
its sending-domain requirement is separate from the website brand. Custom SMTP is still disabled and
the dashboard currently requires it before editing hosted email templates. Email login, registration
and recovery remain closed until external confirmation/recovery delivery is verified. Local Chinese
mail templates are ready; no default administrator/password exists.

The owner asked the agent to choose backup storage. The selected private local directory is
`~/Library/Application Support/Myshkin451/Backups`, created with mode 700 on this Mac, whose
FileVault status was verified On. The recovery tools include account restrictions/audit and validate
bucket constraints. The owner explicitly authorized this project's credentials for local backup only.
The first production archive, `2026-09-27-production`, passed integrity verification: 11 tables,
one default-settings row, no accounts or media. Its actual isolated restore and restart passed
54 checks; a separate populated synthetic restore passed 107. Recovery evidence is recorded in the
[September 27 restore record](docs/operations/RELEASE_RESTORE_2026-09-27.md).
A weekly Sunday 21:00 backup-due check is active in the current Codex task; it does not assume a
maintenance window or run unattended exports. No new external storage or paid resource has been added.

Current product authority remains decisions 0010–0016. Existing Supabase/Vercel resources and the
accepted shared design are reused. Detailed current delivery evidence lives in cloud acceptance;
older sections below retain historical evidence only.

## Current Direction

- Serve personal creative expression, publishing, and future project presentation first.
- Support an empty starting site; the owner does not need to prepare a portfolio before implementation.
- Make routine publishing and edits possible in the management UI, with optional reusable layouts.
- Include public visitor accounts and messages with explicit separation from owner management.
- Refine the accepted modern direction through concrete browsing and publishing. Do not manufacture a
  distinctive personal identity or keep reopening the basic direction without new owner feedback.
- Use direct titles and functional labels. Avoid slogans, invented creator personas, decorative English,
  and repeated explanations. Keep design-process controls outside the proposed website.
- Give writing, projects, and images equal initial standing. Use visuals that preview the content and
  interactions that help browse, read, inspect images, or operate a real tool.
- Explore direct links to independent projects, photo series, and interactive pages alongside articles.
  Allow expressive individual works within a consistent site; playful details may also serve enjoyment.
- Do not constrain exploration with the old platform-console brief or platform-specific skill.
- Evaluate old engineering for reuse on its merits; it must not constrain the new publishing experience.
- Build home, writing, projects, and a compact about surface before expanding empty future modules.
- Use Supabase Free and Vercel Hobby for the initial personal, noncommercial site, with Singapore selected
  for the database and application. Keep costs at zero; paid upgrades and the final domain remain separate decisions.
- Keep Myshkin 451 and the GitHub repository name as working anchors; neither implies control of the old domain.

## Current Implementation

- [Decision 0014](docs/decisions/0014-single-author-notes.md) adds owner-only publishing of public notes.
  `/notes` shows text directly, grouped by month, with topic/search filters and stable entry links.
  `/studio/notes` supports title-free writing, automatic private drafts, publishing, private revisions and withdrawal.
  After a 1.2-second pause it saves privately and retains a refreshable edit URL; only explicit publication
  changes the public copy. Chinese composition, slow saves, failed saves and consecutive notes are covered.
  The homepage shows recent notes alongside longer work. The shared application now applies the modern
  sans-serif and cool-neutral presentation; deployed appearance remains separate from local source.
  [Usage and acceptance](docs/operations/NOTES_ACCEPTANCE.md) records the exact completed checks and limits.

- `site/` is the selected Next.js application and reuses the current Chinese page/editor components.
  It provides real paths, public server-rendered HTML, metadata, canonical URLs, sitemap, robots and `/health`.
  Only public keys are present in the website; service-role credentials are confined to maintenance.
- Supabase migrations implement verified email/password accounts, explicit owner grants, separate draft
  and published records, immutable private media, moderated comments/replies, ownership checks and rate limits.
  The editor uploads actual image bytes and retains canonical references. Published media signatures last
  60 seconds; withdrawing content blocks new signatures, not copies already downloaded.
- Public pages never seed demonstration content or expose the local preview dock. First owner access
  requires an explicit database grant after the real account is verified. Email features remain disabled
  in a new cloud deployment until custom SMTP and actual confirmation/recovery delivery are verified.
- Local backend acceptance uses `127.0.0.1:4325`, Supabase API `55421`, and a separate restore target
  on API `55521`. Synthetic accounts, content and media belong only to these isolated local projects.
  The existing owner design preview at `127.0.0.1:4323` remains untouched.
- Backup/restore scripts cover supported email/password identities, business data and complete media
  bytes with hashes. The actual separate-target restore recovered 18 rows and 2 media objects; 123
  identity, permission, content and restart assertions passed. The API/database binding guard also passed
  90 live assertions after restart, including wrong API, unavailable API, concurrent settings changes,
  nonce cleanup and a successful matching-target restore. Source and prior restore data were preserved.
  See [local acceptance](docs/operations/LOCAL_ACCEPTANCE.md), the [runbook](docs/operations/RUNBOOK.md)
  and [API contract](docs/operations/API_CONTRACT.md).

### Shared modern frontend and local review

- [Decision 0015](docs/decisions/0015-modern-public-direction.md) authorizes continued development in the
  Study 04 direction. `App`, `Home` and `Public` now use the modern presentation with the existing
  platform adapters. Root tokens also align notes, account forms and the workspace. Production renders
  the same source components; no additional frontend port or backend rewrite is required.
- The homepage selects actual published entries, respects featured work and favors owner content over
  optional samples. Empty content, one coverless article, notes alone and mixed UUID-based content are
  covered. The local crop fixture does not become a required project or seed production data.
- Search supports keywords, types, keyboard navigation and normal production links. Collections retain
  topic/search/view state when switching types and returning from details. Reading retains the existing
  body formats and adds active-section navigation, progress, size and link controls. Albums and attached
  images use the shared accessible viewer; the crop demonstration accepts local images and exports PNG.
- Publishing, private drafts, media upload/order, account gates, notes autosave, discussions and moderation
  retain their existing implementations. The new visual layer does not introduce a second content store.
- The connected review runs at `http://127.0.0.1:4333/index.html?preview=sample`. Its explicit preview
  parameter enables labeled samples only in Vite; the choice is saved to that origin's IndexedDB.
  Hiding samples preserves user entries. A fresh local origin without that parameter still starts with
  samples hidden. Local identities/messages remain simulations and do not send email.
- `study.html` remains an independent reference under `frontend/src/study/`, with no platform adapter or
  IndexedDB writes. Reusable image/tool components and the data-driven homepage are shared where useful.
  The live application remains the primary review surface. Neither entrypoint changes cloud state.
- Curated series, manual homepage ordering and a universal page builder remain outside this delivery.
  [Frontend documentation](frontend/README.md) explains the local, study and real-service boundaries.

### Historical application and design studies

- Public repository: `https://github.com/myshkin451/myshkin451.com`; local branch `main` tracks `origin/main`.
- Historical application stack: Next.js, Payload, PostgreSQL, Tailwind, pnpm, and Docker Compose.
- Article and project models support slugs, publication status/time, and cover media.
- Public routes exist for home, about, article/project lists and details, knowledge, and labs.
- Publication visibility requires `status: published` and `publishedAt <= now`.
- Phase 1 proved the local CMS/media/public-page loop. Phase 2 added themes, Chinese-first chrome,
  metadata, canonical URLs, robots, sitemap, shared UI copy, and public page patterns.
- Theme preference supports system/dark/light. Knowledge and Labs remain reserved route-level surfaces.
- RSS is a placeholder, not an implemented feed. No new collections or visitor/community features are active.
- The historical Next app still implements Phase 2; it is not the current frontend preview.
- [Design study 01](docs/design/studies/restart-01/README.md) now provides three distinct, working
  home-page directions: 页间 (editorial), 游乐室 (interactive work), and 线索 (connected content).
  The standalone HTML/CSS/JS includes phone preview, sample reading, a visible next-step plan,
  and browser-local feedback. It does not replace production routes or seed CMS data.
- [Design study 02](docs/design/studies/restart-02/README.md) is a historical preview: a dark,
  image-led home page, image viewer, interactive SVG torus, article page, and compact about page.
  A generated mockup and standalone image asset are preserved with prompts. Study 01 remains comparison
  material; none of its designs was accepted.
- [Design study 03](docs/design/studies/restart-03/README.md) is the preceding comparison: a mixed-content
  grid and a searchable index with selected-item previews. It includes shared article/project details,
  a two-image viewer, a working pointer/keyboard color sampler, and responsive layouts. Two generated
  mockups, two labeled AI image samples, and the full prompt set are preserved. Sample writing is labeled.
  A generated standalone `offline.html` includes both layouts, shared detail pages, images, and mockups.
  The source pages remain the editing surface; a dependency-free Python script rebuilds the portable copy.
  The agent currently recommends evaluating the grid as the home page; this is not owner acceptance.
  These previews do not yet connect to production publishing.
- Uploads still use local filesystem storage. Production media, migrations, environment validation,
  and runtime health behavior need work before launch.
- Public routes intentionally remain dynamic under decision 0008; choose launch caching from actual needs.
- Old-domain defaults and footer text remain in runtime code. Configure and verify the actual origin before launch.

## Next Steps

1. Retain the deployed account-management release and `2a7e304` as the accepted visual rollback baseline.
   Do not recreate backend resources or seed data. Domain work remains deferred by the owner.
2. When domain work resumes, select and verify a sending domain and SMTP,
   apply the versioned Chinese templates and precise redirects/rate limits, then prove external delivery.
   Keep email features closed until that succeeds; do not retry Brevo phone verification.
3. The owner creates and verifies their website account through secure screens, then the maintainer
   grants the verified UUID explicitly. Passwords and codes are never requested in chat. Prove real
   owner/visitor boundaries and owner-approved publishing, photos, moderation and redeploy persistence.
4. Maintain a weekly quiet-window backup plus a backup after important publishing. The first production
   archive has no real accounts/content/media; repeat recovery acceptance when those exist. An independent
   encrypted copy remains a separate storage choice; do not upload to a new destination implicitly.
5. Use real populated-site measurements before discussing paid capacity. Current website URL, working
   name, free hosting and owner-accepted visual design remain in place.

### Active local handoff

The September 27 account UI test server on `4326` and its browser sessions are closed. Its two explicitly
named synthetic accounts and their audit events were removed; the two prior local accounts remain.
The source Supabase stack (`myshkin451-production`, API `55421`) is stopped with volumes preserved.
The separate recovery environments and their cleanup state are recorded in the September 27 restore record.
The production project remains empty and was only changed by the reviewed account migration.

The connected review entry is `http://127.0.0.1:4333/index.html?preview=sample`; the independent
`http://127.0.0.1:4333/study.html` is an exploration reference. The Vite server is handed off for owner
review; restart with `pnpm frontend:dev --port 4333` if needed. This origin's local content and sample
preference are separate from `4323`, `localhost`, Supabase and production. Keep the same origin for
continued use and stop the review server when no longer needed. This earlier design preview is separate
from the now-deployed website and was not stopped or modified during account verification.

The last recorded September 22 daily-use handoff used managed worktree `notes-daily-use` on
`codex/notes-daily-use`. Its isolated `4327` browser-preview fixtures and `4328` sanitized email previews were used only for QA;
both servers and their browser tabs are closed. The source Supabase stack (`55421/55422`) is stopped
with data volumes preserved after the 186 API assertions and mail-template acceptance. Synthetic
mail-test accounts were removed; original local data was not changed by fixture cleanup.
Earlier `myshkin-notes` (`4326`) and original `4323` preview ports were not listening at the September 22
handoff check; their browser-local data was not touched. The prior restore stacks (`55521/55522` and
`55621/55622`) remain outside this work slice. Restart previews explicitly when needed, and never use
these local fixtures or identities as production seed data.

At that earlier handoff, temporary archives had been removed by a computer restart. The replacement
private recovery archive, binding verification script, JSON evidence and private target configurations
were recorded under
`/private/tmp/myshkin451-recovery-Qpm4GZ`. This temporary path is a restart aid, not long-term backup
storage. Do not print or commit its private contents; the preserved Docker volumes are the local data source.

## Open Decisions

- Any paid budget or upgrade beyond the selected free initial hosting combination.
- Final domain and any public identity change beyond the current working name.

The current modern visual version is accepted under 0015; production and real-account acceptance remain open.
The old AWS launch-timing decision is superseded by 0010 and removed. Resolve each remaining item
with a matching decision record and remove it here in the same change.

## Validation And Known Limits

- September 27 release: 89 frontend tests, 76 account-access assertions, 186 original API assertions,
  12 backup-tool tests, formatting/lint/types and both builds passed. Desktop and independent visitor
  sessions verified restriction/restoration and server rejection of unauthorized writes; the account
  page fits a 320px viewport. Production passed 16 HTTP routes and a 390px browser check. A separate
  synthetic source-to-target restore passed 107 checks, including accounts, private revisions, media,
  restrictions, audit and restart; the actual empty production archive passed 54 separate restore/restart
  checks. These checks do not establish external email or real-owner acceptance.

- Current modern integration: 83 frontend tests, lint, root/site type checks and both frontend/site builds
  passed. The new regression coverage checks real-content home selection, empty/notes-only states,
  server rendering without browser globals, private-content exclusion and type-filter preservation.
  Chromium checked 12 routes at 320/390/780/1440 widths (48 combinations), with no horizontal overflow
  or new runtime errors. Actual new/edit article screens were also checked at all four widths. Browser
  acceptance passed search/menu navigation, reading tools, gallery controls/focus, local-image crop and
  a decoded PNG export. An isolated `localhost:4333` UI check proved private draft → publish → refresh
  persistence → private revision isolation; its sole test entry was then deleted through the UI. Details
  and remaining limits are in [Study 04](docs/design/studies/restart-04/README.md). These are local checks,
  not production deployment, real-owner acceptance or an external email test.

- September 22 frontend redesign checks: format, lint, frontend type check and 75 frontend tests passed
  after the visual replacement. Playwright measured no horizontal overflow on ten routes at 320, 390 and
  1440px, and full-page desktop/mobile screenshots of home, archive, writing, notes and about were
  reviewed in both empty and sample-populated states. This historical design was subsequently rejected.
  Its results do not establish acceptance or deployment of the current modern source.

- September 22 daily-use checks: 75 frontend tests, 186 real API assertions, format, lint, root/site type checks and both builds passed. Browser checks
  cover automatic private drafts, focus, refresh recovery, separate new notes and the 320px editor.
  Both Chinese auth templates passed 21 local Auth/Mailpit assertions, including real verification links
  and new-password login; synthetic mail-test accounts were removed. External deliverability and real
  email-client rendering remain pending. Templates are not pushed to Hosted Auth by a Vercel deployment.

- September 21 notes acceptance: 68 frontend tests and 186 real API assertions passed, including anonymous
  and two-visitor publishing denial, private revisions, withdrawal and stable publication dates. Browser
  review covered the real local draft/publish/edit/withdraw loop, independent anonymous reads and 320px
  notes/editor layouts. The new migration is applied locally and in the empty cloud database.
  Ready deployment `dpl_7jC7Pw8t65qmYV4GN2ULaNTr32VK` passed eight public HTTP checks.
  Three repeated empty notes-page requests had a median first response of 1,423ms from the owner computer.
  The cloud database is about 10.6 MiB with no accounts/content/media; this does not justify a paid upgrade.
  Exact measurement scope, deployment evidence and pagination limits are in the notes acceptance document.

- September 21 real-backend checks: 155 API assertions passed against local Supabase, including anonymous,
  owner and two independent visitors, spoofed roles/authors, unverified users, draft/media visibility,
  reply targets, other-user mutations, moderation and concurrent message limits. Database lint passed.
- Next.js was upgraded to 16.3.5 before deployment, covering the official August 2026 security fixes.
  `site:build`, repository format/lint/types, all 51 frontend tests and the Vite build passed.
  Two browser sessions also passed publishing, draft isolation, moderation, account recovery and 320px
  layout checks. Actual restore/restart acceptance and 90 additional connection-binding assertions passed.
  Compatible transitive updates removed
  all audit findings on the Next, React, React DOM and Supabase dependency paths. The root production
  audit still reports 0 critical / 21 high / 25 moderate / 7 low findings. This is not a clean repository-wide audit; historical Payload and
  its dependency graph are retained for reference and are not deployed by `site/`.
- The first Vercel deployment is Ready. Sixteen public HTTP routes passed from the owner's computer,
  including database health, canonical URL, robots, sitemap and absent content/media 404s. In-app browser
  review verified the empty home and narrow layouts with no captured warnings/errors. SMTP activation,
  real delivery and authenticated production permissions remain unverified. Free Supabase may pause
  after one week of inactivity, provides no automatic backup, and has 500 MB DB / 1 GB storage limits.
  Vercel Hobby is for personal noncommercial use. No paid plan or new domain is required for the first run.
- Historical initial migration evidence (the notes migration later replaces `save_entry`): the SQL Editor reported success after the empty-project preflight. All
  17 function bodies/identity signatures match the local aggregate digest
  `3463defae96bcb42afa0fadcaa164d17`; all 7 application tables have RLS and the media bucket is private.
  Auth accounts and published entries remain zero. This checks migration consistency, not live email or full runtime acceptance.
- SQL Editor subsequently recorded migration version `202609210001`, name `platform`, with
  `statements = NULL` after checking that the history table was absent. The dashboard's option to enable
  RLS was selected for the history table. Existing application migration SQL was not rerun.
- [PR #1](https://github.com/myshkin451/myshkin451.com/pull/1) merged after Stable checks and Production
  platform CI passed at `ec002bb`. Merge `a8e5a45` is synchronized to the clean main checkout and deployed
  as `dpl_EtsRMcRCf74LNHHQDe4CG6VzoSRF`. Node 24.x and pnpm 10.33.2 built successfully on Vercel.
- Cloud Auth now uses the actual HTTPS origin, exact `/auth/callback` and `/recover` redirects, confirmed
  email and a 12-character minimum password. CLI re-read found no remaining declared managed difference;
  unrelated service settings were preserved. Registration/recovery UI remains disabled pending SMTP.

### Earlier preview and historical verification

- September 21: real-browser review covered empty home (desktop/390px), first article publishing on a
  separate QA origin, populated home/reading, and ten public routes at 320px without horizontal overflow
  or captured browser warnings/errors. Legacy root search clearing was checked to remain in `/archive`.
  Format, lint, root typecheck, 27 frontend tests, and frontend types/build passed.
  UI/publishing QA used `127.0.0.1:4324`; the owner review origin `127.0.0.1:4323` contains no QA article.

- Repository format/lint/type checks, production frontend build, 19 data-layer and 8 confirmation-flow
  tests passed on 2026-09-19. Browser verification covered reading, filtering/return state, image viewing/focus,
  actual CSS copying, IndexedDB draft/publish isolation, image upload/order, direct project entry, settings,
  login-return drafts, message/reply persistence, moderation, and cancel/Escape on unsaved changes.
  See `frontend/README.md` for exact limits.
- Browser writes were tested on `localhost:4323`; `127.0.0.1:4323` remains a clean review origin.
  Native leave confirmation blocked an IAB automation tab and was replaced with a page dialog.
  SVG download completion was not observable through the IAB download event; file delivery is unverified.
- Historical baseline checks passed on 2026-05-04 for format, lint, typecheck, webpack build,
  browser e2e, Payload/Postgres integration tests, and media-backed route rendering.
- CI runs format, lint, typecheck, integration tests, build, and browser e2e against PostgreSQL.
- The automated publishing fixture uses Payload Local API. Full admin-UI publishing was manually
  checked on 2026-05-04; it is not an automated end-to-end admin workflow.
- These historical results are not current runtime, security, cloud-compatibility, or deployment proof.
- Design study 01 passed scoped Prettier, ESLint, JavaScript syntax, and local-link checks on 2026-09-17.
  Real-browser checks covered desktop/phone presentation, all three directions at 320 and 1280 CSS pixels
  without horizontal page overflow, artwork flip, sample dialogs and Escape focus return, sculpture controls,
  topic selection, phone preview, plan disclosure, and feedback persistence. No browser warnings/errors were observed.
- A focused JSDOM execution verified reduced-motion handling, opt-in rotation, direction switching,
  hidden-tab suspension, and live motion-preference changes. This is not OS-level motion-preference testing.
- Study 02 passed scoped format/lint/syntax/link checks and real-browser desktop/mobile checks on 2026-09-17.
  Home page checks at 1280/390/320 CSS pixels and article/about at 320 pixels found no page overflow.
  Image viewing, navigation, pointer and keyboard interaction, controls, rotation, reset, and Escape/focus return
  were checked. JSDOM exercised 87 geometry states plus animation lifecycle and motion-preference changes.
- Study 03 passed scoped format/lint/syntax/local-link checks and real-browser checks on 2026-09-17.
  Both home layouts were inspected at 1280/390/320 CSS pixels; the index also at 800 pixels. Article large type,
  project/tool/about and the image viewer were checked at 320 pixels without page overflow. Filtering, search,
  empty-state recovery, keyboard selection, preview navigation, return state, reading size, image navigation,
  Escape/focus return, pixel sampling and clipboard copy were exercised. No browser warnings/errors observed.
  Reduced-motion CSS is present, without OS-level preference testing. Original PNGs need launch-time optimization.
- The standalone copy was checked on 2026-09-18: file-origin JSDOM navigation/filter/search/return-state
  checks and repeated mount/cleanup cycles passed. An isolated real-browser HTTP preview containing only
  the bundled file verified rendering, actual Canvas pixel sampling, copying, and the embedded mockup dialog.
  Direct `file://` real-browser verification was unavailable because Browser Use blocks that URL scheme.
- Historical application/CMS/database state and its full production build were not revalidated for this
  frontend slice. Vite is now an explicit dev dependency at the already locked version; production models,
  routes, environment files and deployment configuration remain unchanged.
- Source review on 2026-09-18 confirmed the sole auth collection is the admin identity. Draft reads and
  default content writes trust authenticated users without a visitor distinction. This is a prerequisite
  to resolve before adding visitor auth, not evidence of an already public registration service.
  These features remain absent from the old backend; browser-only versions exist in the new frontend.
- Accepted build workaround: `next build --webpack` remains in use after the historical Turbopack hang.
- Hosting comparisons were researched on 2026-09-16. No provider deployment, billing estimate based on
  measured usage, or owner-network access test has been performed.
- Local proof records, test media, and test-only users must not become production seed data.

## Historical Parked Review — 2026-07-11

Retained from the pre-existing local progress update. These statements describe that review, not
the current branch cleanliness or restart direction:

- No implementation, deployment, or cloud-resource changes were confirmed after the 2026-05-05 closeout.
- The repository was clean on `main` and tracked `origin/main` at that review.
- `progress.md`, `docs/ROADMAP.md`, and the deployment plan were identified as recovery anchors.
- Work was parked pending a concrete deployment-readiness or product deliverable; no active AWS launch was claimed.

## Handoff

- The September 27 modern/account release is deployed. Continue from current `main` and
  [production handoff](docs/operations/PRODUCTION_HANDOFF.md); the next personal step is the explicitly
  deferred sending-domain/email setup, followed by the first verified owner and real publishing.
  Do not recreate the backend, reopen design or treat local fixtures as real production acceptance.
- September 21: the owner requests a new task with very high/maximum reasoning to finish the platform,
  leaving primarily purchases, registrations, and unavoidable personal operations to them. The
  [production handoff](docs/operations/PRODUCTION_HANDOFF.md) defines execution and acceptance without
  selecting a provider or claiming a completed backend. Architecture decisions must follow evidence.
- The earlier September frontend slice used `127.0.0.1:4323` for delivery and
  `localhost:4323` for isolated QA writes. A design or backend task can use this board and `frontend/README.md`
  to recover the current boundary without inheriting the full design conversation.
- Current authority: README, this board, decisions 0010–0016, the runbook, and the restart design brief.
- Decisions 0006/0007 and `PUBLIC_SITE_EXPERIENCE.md` are historical visual context.
- Decision 0009 and the manual AWS runbook are historical, inactive deployment context.
- Reuse valid engineering and publishing behavior; revisit aesthetic rules instead of inheriting them by default.
- Current review entry: `frontend/index.html?preview=sample` on loopback port 4333, started with
  `pnpm frontend:dev --port 4333`. It needs no database or secrets. Keep the same origin to retain browser
  content. Port 4323 remains the default development command; it is a different local content origin.
- The earlier `restart-03` static preview (port 4321 in its delivered session) remains comparison material.
  `offline.html` is its portable snapshot; regenerate it with
  `python3 docs/design/studies/restart-03/build_offline.py` after source edits. Its embedded assets remove
  adjacent-file dependencies; clipboard access still depends on browser permissions and has a manual fallback.
- Keep detailed execution in commits and focused work artifacts, not a session diary here.
