# Progress

Last updated: 2026-09-21
Last implementation update: 2026-09-21 (visitor-facing home, typography, and empty-content review)

## Current Phase

Active restart: the local frontend is ready as the starting point for a new task completing real
publishing, visitor interaction, and deployment. The owner delegates technical execution, retaining
account, payment, and other unavoidable personal steps. No production capability is claimed yet.

[Decision 0010](docs/decisions/0010-creator-first-restart.md) accepts the new order and creator-first
goals. AWS study and old-domain recovery are no longer prerequisites. Public visual direction is
reopened. B was only relatively better than the other first studies, not an accepted palette or
identity. The second study's layout improved, but its abstract ring imagery had no meaningful link
to the owner's content. Writing, projects, and images should coexist without a preferred medium.
A third study provides two content-led layouts, built after reference research and generated mockups.
The owner finds this round substantially better and wants to explore modern minimal design with richer
details, varied personal work, and useful classification. The specific layout and extension proposal remain open.
No final visual direction or production deployment is claimed.

[Decision 0011](docs/decisions/0011-zero-content-start-and-visitor-interaction.md) accepts starting
without existing work, convenient future publishing/editing, and visitor accounts/messages. The old
deferral of comments is superseded. These flows now have a local frontend implementation; real
visitor authentication and shared persistence remain pending.

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
- Favor simple hosted operations appropriate to low traffic. Provider, budget, and final domain are open.
- Keep Myshkin 451 and the GitHub repository name as working anchors; neither implies control of the old domain.

## Current Implementation

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
- Six optional labeled samples and two existing AI-generated images show populated layouts. Hiding samples
  retains custom entries and allows a true empty start. No owner work or fake visitor conversations are seeded.
- Visitor identities and messages are local simulations. They do not collect passwords or send email.
  The workspace is intentionally available in this preview, not protected by a real admin permission boundary.
- Real authentication, account recovery, durable server media, cross-device publishing, curated series,
  manual homepage ordering, and production URLs remain unfinished. `frontend/README.md` owns exact limits.

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

1. Continue in a new task using the [production handoff](docs/operations/PRODUCTION_HANDOFF.md).
   Research current hosting constraints, prove one viable integration, and document the chosen backend
   and reuse/replacement boundary. Current pages remain the starting point, not final visual acceptance.
2. Connect real content/media persistence, authenticated owner publishing, and stable public routes.
   Verify draft isolation, convenient editing, empty-content layouts, and independent-session visibility.
3. Complete real visitor registration/sign-in, recovery, messages/replies and moderation. Keep owner and
   visitor permissions separate; resolve Payload's broad authenticated-user rules first if it is reused.
4. Finish deployment, backup/restore, browser and permission verification, owner-network access checks,
   and a short operating guide. Batch concrete signup/payment/authorization steps for the owner after
   completing independent work. Visitor interaction remains in this delivery, not silently deferred.

The owner asks the agent to handle the remaining technical work and deployment. No paid plan, budget,
domain purchase, or provider account is authorized by implication; prepare those choices concretely.

## Open Decisions

- Final visual/interaction direction after prototype feedback.
- Production frontend/backend integration and reuse or replacement of the historical stack.
- Production hosting combination, monthly budget, region, and launch acceptance after the usable slice.
- Final domain and any public identity change beyond the current working name.

The old AWS launch-timing decision is superseded by 0010 and removed. Resolve each remaining item
with a matching decision record and remove it here in the same change.

## Validation And Known Limits

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
- Current authority: README, this board, decisions 0010–0012, and the restart design brief.
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
