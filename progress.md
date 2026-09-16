# Progress

Last updated: 2026-09-17
Last implementation update: 2026-09-17 (design studies; production UI remains at its previous baseline)

## Current Phase

Active restart: design exploration before a small usable website and later hosted launch.

[Decision 0010](docs/decisions/0010-creator-first-restart.md) accepts the new order and creator-first
goals. AWS study and old-domain recovery are no longer prerequisites. Public visual direction is
reopened. B was only relatively better than the other first studies, not an accepted palette or
identity. The second study's layout improved, but its abstract ring imagery had no meaningful link
to the owner's content. Writing, projects, and images should coexist without a preferred medium.
A third study provides two content-led layouts, built after reference research and generated mockups.
No final visual direction or production deployment is claimed.

## Current Direction

- Serve personal creative expression, publishing, and future project presentation first.
- Find a distinctive visual and interactive direction through concrete working examples.
- Use direct titles and functional labels. Avoid slogans, invented creator personas, decorative English,
  and repeated explanations. Keep design-process controls outside the proposed website.
- Give writing, projects, and images equal initial standing. Use visuals that preview the content and
  interactions that help browse, read, inspect images, or operate a real tool.
- Do not constrain exploration with the old platform-console brief or platform-specific skill.
- Retain the Next.js/Payload/PostgreSQL foundation while rebuilding the public experience.
- Build home, writing, projects, and a compact about surface before expanding empty future modules.
- Favor simple hosted operations appropriate to low traffic. Provider, budget, and final domain are open.
- Keep Myshkin 451 and the GitHub repository name as working anchors; neither implies control of the old domain.

## Current Implementation

- Public repository: `https://github.com/myshkin451/myshkin451.com`; local branch `main` tracks `origin/main`.
- Stack: Next.js, Payload, PostgreSQL, Tailwind, pnpm, and Docker Compose for local PostgreSQL.
- Article and project models support slugs, publication status/time, and cover media.
- Public routes exist for home, about, article/project lists and details, knowledge, and labs.
- Publication visibility requires `status: published` and `publishedAt <= now`.
- Phase 1 proved the local CMS/media/public-page loop. Phase 2 added themes, Chinese-first chrome,
  metadata, canonical URLs, robots, sitemap, shared UI copy, and public page patterns.
- Theme preference supports system/dark/light. Knowledge and Labs remain reserved route-level surfaces.
- RSS is a placeholder, not an implemented feed. No new collections or visitor/community features are active.
- The current UI still implements the superseded Phase 2 design; aesthetic acceptance remains outstanding.
- [Design study 01](docs/design/studies/restart-01/README.md) now provides three distinct, working
  home-page directions: 页间 (editorial), 游乐室 (interactive work), and 线索 (connected content).
  The standalone HTML/CSS/JS includes phone preview, sample reading, a visible next-step plan,
  and browser-local feedback. It does not replace production routes or seed CMS data.
- [Design study 02](docs/design/studies/restart-02/README.md) is a historical preview: a dark,
  image-led home page, image viewer, interactive SVG torus, article page, and compact about page.
  A generated mockup and standalone image asset are preserved with prompts. Study 01 remains comparison
  material; none of its designs was accepted.
- [Design study 03](docs/design/studies/restart-03/README.md) is the current comparison: a mixed-content
  grid and a searchable index with selected-item previews. It includes shared article/project details,
  a two-image viewer, a working pointer/keyboard color sampler, and responsive layouts. Two generated
  mockups, two labeled AI image samples, and the full prompt set are preserved. Sample writing is labeled.
  The agent currently recommends evaluating the grid as the home page; this is not owner acceptance.
  These previews do not yet connect to production publishing.
- Uploads still use local filesystem storage. Production media, migrations, environment validation,
  and runtime health behavior need work before launch.
- Public routes intentionally remain dynamic under decision 0008; choose launch caching from actual needs.
- Old-domain defaults and footer text remain in runtime code. Configure and verify the actual origin before launch.

## Next Steps

1. Compare [the grid](docs/design/studies/restart-03/index.html) and
   [the preview index](docs/design/studies/restart-03/catalog.html), including actual reading/viewing interactions.
   Establish whether content-led composition and direct copy address the owner's concerns.
2. Refine the home, article, and project surfaces using feedback. Do not infer dark/abstract preferences
   from B or record any proposal as accepted without owner confirmation. Replace labeled samples with
   confirmed public content when moving toward the usable site.
3. Implement that direction with the existing CMS and verify a comfortable publish/update/read/view loop.
4. Validate one hosting candidate from [the deployment plan](docs/operations/DEPLOYMENT_AND_OPERATIONS_PLAN.md),
   then decide provider, budget, media, backups, and domain for a small launch.

Parallel product-direction work still requires owner approval under `AGENTS.md`. Do not turn this
roadmap into cloud provisioning before the provider, budget, and launch scope are concrete.

## Open Decisions

- Final visual/interaction direction after prototype feedback.
- Production hosting combination, monthly budget, region, and launch acceptance after the usable slice.
- Final domain and any public identity change beyond the current working name.
- Whether comments/messages become useful in a later expansion; deferred during restart.

The old AWS launch-timing decision is superseded by 0010 and removed. Resolve each remaining item
with a matching decision record and remove it here in the same change.

## Validation And Known Limits

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
- Application/CMS/database state and the full production build have not been revalidated during this isolated
  study. No production dependencies, models, routes, or deployment configuration changed.
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

- Current authority: README, this board, decision 0010, and the restart design brief.
- Decisions 0006/0007 and `PUBLIC_SITE_EXPERIENCE.md` are historical visual context.
- Decision 0009 and the manual AWS runbook are historical, inactive deployment context.
- Reuse valid engineering and publishing behavior; revisit aesthetic rules instead of inheriting them by default.
- Serve only `docs/design/studies/restart-03` on a loopback static server (port 4321 in the delivered session).
  The preview needs no database or external assets. Its README includes references, prompts, and validation.
  Direct file opening can restrict Canvas/clipboard behavior; use the local HTTP preview for the working tool.
- Keep detailed execution in commits and focused work artifacts, not a session diary here.
