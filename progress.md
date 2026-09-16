# Progress

Last updated: 2026-09-17
Last implementation update: 2026-09-17 (design studies; production UI remains at its previous baseline)

## Current Phase

Active restart: design exploration before a small usable website and later hosted launch.

[Decision 0010](docs/decisions/0010-creator-first-restart.md) accepts the new order and creator-first
goals. AWS study and old-domain recovery are no longer prerequisites. Public visual direction is
reopened. Three interactive design studies are ready for owner feedback; no final visual direction
or production deployment is claimed.

## Current Direction

- Serve personal creative expression, publishing, and future project presentation first.
- Find a distinctive visual and interactive direction through concrete working examples.
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
- Uploads still use local filesystem storage. Production media, migrations, environment validation,
  and runtime health behavior need work before launch.
- Public routes intentionally remain dynamic under decision 0008; choose launch caching from actual needs.
- Old-domain defaults and footer text remain in runtime code. Configure and verify the actual origin before launch.

## Next Steps

1. Review [the working studies](docs/design/studies/restart-01/index.html). Use specific reactions to
   composition, typography, reading, and interaction to identify what to retain or reject; no design vocabulary is required.
2. Translate owner feedback into one principal visual direction; prove it with article and project detail pages.
   Revise the candidates if none feels right. The studies are evidence for this choice, not an accepted identity.
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
- Open the standalone study files directly, or serve only `docs/design/studies/restart-01` with a loopback
  static server. The study needs no database or external assets. Its README explains interactions and feedback.
- Keep detailed execution in commits and focused work artifacts, not a session diary here.
