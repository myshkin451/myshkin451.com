# Progress

Last updated: 2026-09-21
Last implementation update: 2026-09-21 (single-author notes and publication acceptance)

## Current Phase

The owner explicitly deferred domain purchase on September 21 and asked to finish the remaining feature
work first. Do not reopen domain shopping or treat the earlier `.com` selection as a current purchase
authorization. Resend sending-domain activation remains pending alongside the domain.

Stage handoff: the real backend, website and single-author notes are implemented and deployed.
Notes PR #2 passed both CI workflows and merged as `b0dae87`; the production notes page was verified.
Local browser and restore acceptance passed.
The website is deployed at [myshkin451.vercel.app](https://myshkin451.vercel.app), with public browsing
and database health verified. Email registration/recovery and the first real owner remain pending.
The owner delegates technical execution and deployment, retaining account, payment, and unavoidable
personal steps. Supabase and Vercel accounts are registered; the initial migration has been applied to
the free Supabase project in Singapore. Migration versions `202609210001` and `202609210002` are recorded;
the latter adds title-free notes without changing existing data or owner grants.
Brevo registration and Free selection are complete, but repeated phone-code rejection blocks activation.
Do not continue the previous Brevo credential-helper flow. An owned domain plus Resend is the recommended
next candidate, not an activated replacement or an approved purchase. The official Vercel GitHub app is authorized for
`myshkin451/myshkin451.com` only. The Vercel Hobby project is connected to this repository and deploys
`main` with Production-only variables; Preview is disabled. Real external email delivery is not verified.

[Decision 0010](docs/decisions/0010-creator-first-restart.md) accepts the new order and creator-first
goals. AWS study and old-domain recovery are no longer prerequisites. Public visual direction is
reopened. B was only relatively better than the other first studies, not an accepted palette or
identity. The second study's layout improved, but its abstract ring imagery had no meaningful link
to the owner's content. Writing, projects, and images should coexist without a preferred medium.
A third study provides two content-led layouts, built after reference research and generated mockups.
The owner finds this round substantially better and wants to explore modern minimal design with richer
details, varied personal work, and useful classification. The specific layout and extension proposal remain open.
The deployed layout remains open to further owner feedback; final visual direction is not claimed.

[Decision 0011](docs/decisions/0011-zero-content-start-and-visitor-interaction.md) accepts starting
without existing work, convenient future publishing/editing, and visitor accounts/messages. The old
deferral of comments is superseded. These flows now have both the original local preview and a real
Supabase implementation under [decision 0013](docs/decisions/0013-production-supabase-and-next.md).

[Decision 0012](docs/decisions/0012-independent-frontend-and-rebuild-authority.md) records the owner's
explicit permission to rethink old engineering/design/skills and the independent `frontend/` boundary.
Retaining the old Next/Payload stack is no longer a requirement. Prior code remains available for
selective reuse and comparison; the new frontend does not claim production acceptance.

## Current Direction

- Serve personal creative expression, publishing, and future project presentation first.
- Support an empty starting site; the owner does not need to prepare a portfolio before implementation.
- Make routine publishing and edits possible in the management UI, with optional reusable layouts.
- Include public visitor accounts and messages with explicit separation from owner management.
- Find a distinctive visual and interactive direction through concrete working examples.
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
  `/studio/notes` supports title-free writing, private drafts, publishing, private revisions and withdrawal.
  The homepage shows the latest note alongside longer work. The light background, serif type and blue
  detail continue the current site design; owner visual feedback is still welcome.
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

### Independent local design preview

- September 21 visual revision: the owner rejected the generic M mark, repeated oversized name,
  unnecessary copy, and template-like composition. The new home uses a compact wordmark, brief greeting,
  direct type navigation, and at most three featured/recent entries. Zero content has no empty cards,
  search controls, or zero counters. The layout is implemented for review, not accepted final branding.
- A fresh browser starts with samples hidden; existing preferences/content are preserved. The preview
  controls now expand from a corner. Search and layout selection live in the content index; legacy root
  filter URLs remain usable. Text entries no longer get automatic duplicate title covers; photos keep
  natural proportions. About and community copy addresses visitors without editor instructions.
- The owner explicitly says the old personal-platform design skill is no longer important. Do not apply
  its aesthetic assumptions to further iterations. Current feedback and actual browser results take priority.

- [New frontend](frontend/README.md): React/Vite page suite with mixed browsing and an index, search,
  type/topic filtering, article/album/project details, an actual gradient tool, about, guestbook,
  local visitor pages, and an owner workspace. Start with `pnpm frontend:dev` on `127.0.0.1:4323`.
- IndexedDB saves resolve after committed writes. Drafts remain separate from the public version;
  partial drafts, preview, publish/update/unpublish, image upload/order, project links, settings,
  featured items, and per-item discussion toggles work locally. Clearing browser data loses this content.
- Ten optional labeled samples, including four notes, and two existing AI-generated images show populated layouts. Hiding samples
  retains custom entries and allows a true empty start. No owner work or fake visitor conversations are seeded.
- Visitor identities and messages are local simulations. They do not collect passwords or send email.
  The workspace is intentionally available in this preview, not protected by a real admin permission boundary.
- The Vite preview intentionally keeps simulated accounts and browser persistence. The real implementation
  lives in `site/` with the remote platform adapter. Curated series and manual homepage ordering remain
  outside this delivery. `frontend/README.md` explains the two modes.

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

1. Review the working notes feature and iterate on concrete owner feedback. The notes scope is implemented;
   do not rebuild a second microblog service. Public code and cloud state should be checked against the
   [notes acceptance](docs/operations/NOTES_ACCEPTANCE.md) before continuing.
2. Domain purchase is deferred by the owner. When they resume it, recheck availability/prices; then configure
   DNS, HTTPS, canonical origin, Auth redirects and Resend SMTP. Do not repeat Brevo phone verification.
   The prior research is a dated reference, not a purchase or an activated mail service.
3. Verify actual confirmation/recovery delivery before enabling registration. Configure cloud mail rate
   limits through the dashboard or Management API, not CLI config push. The verified real account then
   needs an explicit owner grant. Complete the owner's first real note/article/photo and moderation loop.
4. Verify real content persistence across redeployment and arrange durable private backups. Existing local
   restore tests remain evidence for the supported email/password identities, not a real owner's cloud
   acceptance. Do not add OAuth casually without addressing its identity/restore boundary.
5. Measure actual populated pages, image bytes, request timing and service usage before changing hosting
   or paying for capacity. Empty-site measurements cannot establish mainland-carrier performance or
   a paid-upgrade need. Current providers remain Supabase Free and Vercel Hobby.

The owner asks the agent to handle the remaining technical work and deployment. No paid plan, budget,
domain purchase, or provider account is authorized by implication; prepare those choices concretely.

### Active local handoff

The notes slice uses managed worktree `myshkin-notes` on branch `codex/notes`. Its isolated design
preview is `http://127.0.0.1:4326/#/notes`; optional samples are enabled for review there only.
The original `4323` origin and its stored content were not modified. Browser QA against the real local
backend used a synthetic owner and note in the retained `myshkin451-production` stack (API/DB
`55421/55422`). Those task-owned fixtures are removed at handoff; retained prior data is preserved.
The real website test server on `4325` and source Supabase stack are stopped after acceptance, keeping
Docker volumes. The prior restore stacks `myshkin451-restore` (`55521/55522`) and `myshkin451-binding`
(`55621/55622`) remain stopped with volumes preserved. The `4326` design preview is explicitly handed
back for owner review; it is browser-local and is not the production publishing interface.

Earlier temporary archives were removed by the computer restart. A fresh private recovery archive,
binding verification script, JSON evidence and private target configurations are under
`/private/tmp/myshkin451-recovery-Qpm4GZ`. This temporary path is a restart aid, not long-term backup
storage. Do not print or commit its private contents; the preserved Docker volumes are the local data source.

## Open Decisions

- Final visual/interaction direction after prototype feedback.
- Any paid budget or upgrade beyond the selected free initial hosting combination.
- Final domain and any public identity change beyond the current working name.

The old AWS launch-timing decision is superseded by 0010 and removed. Resolve each remaining item
with a matching decision record and remove it here in the same change.

## Validation And Known Limits

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

- September 21: the owner requests a new task with very high/maximum reasoning to finish the platform,
  leaving primarily purchases, registrations, and unavoidable personal operations to them. The
  [production handoff](docs/operations/PRODUCTION_HANDOFF.md) defines execution and acceptance without
  selecting a provider or claiming a completed backend. Architecture decisions must follow evidence.
- The resumed frontend slice passed final checks. Clean delivery origin is `127.0.0.1:4323`;
  QA writes are isolated at `localhost:4323`. A design or backend task can use this board and `frontend/README.md`
  to recover the current boundary without inheriting the full design conversation.
- Current authority: README, this board, decisions 0010–0013, the runbook, and the restart design brief.
- Decisions 0006/0007 and `PUBLIC_SITE_EXPERIENCE.md` are historical visual context.
- Decision 0009 and the manual AWS runbook are historical, inactive deployment context.
- Reuse valid engineering and publishing behavior; revisit aesthetic rules instead of inheriting them by default.
- Current review entry: `frontend/`, served by `pnpm frontend:dev` on loopback port 4323. It needs no
  database or secrets. Keep the same origin to retain browser content. Stop its process when review ends.
- The earlier `restart-03` static preview (port 4321 in its delivered session) remains comparison material.
  `offline.html` is its portable snapshot; regenerate it with
  `python3 docs/design/studies/restart-03/build_offline.py` after source edits. Its embedded assets remove
  adjacent-file dependencies; clipboard access still depends on browser permissions and has a manual fallback.
- Keep detailed execution in commits and focused work artifacts, not a session diary here.
