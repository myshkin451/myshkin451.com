# Progress

Last updated: 2026-05-04

## Current Phase

Phase 2: public site experience.

## Current State

- Public GitHub repository exists at `https://github.com/myshkin451/myshkin451.com`.
- Local repository is on `main` and tracks `origin/main`.
- Initial `README.md` and `.gitignore` are committed.
- Application scaffold is in place with Next.js, Payload, PostgreSQL, Tailwind, pnpm, and Docker Compose.
- Governance kernel is established.
- Agent workflow uses Conventional Commits and allows autonomous commit/push for completed, verified, scoped work.
- Harness operating model is defined as stable engineering responsibility plus adaptive implementation details.
- Phase 1 platform stack is accepted in `docs/decisions/0003-phase-1-platform-stack.md`.
- Initial article/project content models and public routes are accepted in `docs/decisions/0004-content-models-and-public-routes.md`.
- Payload now has `articles` and `projects` collections with shared slug, publication status, publication time, and cover image fields.
- Public routes exist for `/articles`, `/articles/[slug]`, `/projects`, and `/projects/[slug]`, filtering to published content only.
- The Phase 1 first platform loop is complete: a local operator can upload media in Payload admin, publish an article and a project with that media, and see homepage, list, and detail routes render the published records.
- Browser e2e coverage now seeds media-backed published article/project records and verifies homepage, list, detail, and image loading behavior.
- Phase 2 now has a public metadata and URL hygiene baseline: shared site metadata config, canonical metadata, Open Graph/Twitter metadata, robots.txt, and sitemap.xml for published public routes.
- Phase 2 now has an accepted public-site experience design: Chinese-first UI, a dark-forward dual-theme strategy, and a four-surface platform map for Writing, Projects, Knowledge paths, and Labs.
- Directional phase roadmap lives in `docs/ROADMAP.md`.
- Local PostgreSQL starts successfully through `pnpm db:up`.
- Baseline checks passed in local validation on 2026-05-04 for format, lint, typecheck, webpack production build, browser e2e, Payload/Postgres integration tests, and media-backed public route rendering.
- Local dev server has been verified for the homepage, admin route, public media API route, and article/project index routes.
- The first Phase 2 public-site implementation slice is in place: dual light/dark theme tokens, Chinese-first public chrome and homepage copy, a stronger four-surface index, and a new `/about` surface.
- The writing and project public routes now extend the Phase 2 experience baseline: `/articles` uses a Chinese-first archive ledger, `/articles/[slug]` uses a reading rail and comfortable long-form measure, `/projects` uses project dossier/ledger patterns, and `/projects/[slug]` presents project metadata as a public case file.

## Active Direction

Build Myshkin 451 as a personal digital platform, starting with public writing, project pages, profile/homepage, and media-backed content management. Keep the first implementation as a modular monolith, with room for future discussions, knowledge entry points, tools, AI demos, and experiments.

## First Platform Loop

Phase 1 is complete. The verified loop is: create or update an article and project in the CMS/admin surface, set slug/publication status/media, see both render on public stable routes, and run the baseline repository checks successfully.

## Next Steps

1. Add basic GitHub Actions for the stable local checks.
2. Add the public theme toggle and small UI copy dictionary before broader public-surface expansion.
3. Add an admin UI publishing e2e only if Payload admin selectors and the operator flow stay stable enough to justify the maintenance cost.
4. Continue toward deployment planning after the public site experience has a stronger baseline.

## Open Decisions

- Deployment target and timing.
- Whether comments/messages ship in an early expansion phase or remain a reserved boundary.

When any Open Decision is resolved, add or update a decision record under `docs/decisions/` and remove the item from this list in the same change.

## Accepted Risks

- Next.js 16 Turbopack production build hung locally during scaffold validation. The `build` script uses `next build --webpack` until this is revisited after framework upgrades or CI validation.

## Handoff Notes

- Keep this file as a high-signal state board, not a chronological log.
- Do not update this file for every session; update it only for durable state changes needed by future agents.
- Prefer Git commits and task-specific execution plans for detailed process history.
- Record architecture-changing choices in `docs/decisions/`.
- Phase 0 and Phase 1 are closed; next work should improve the public site experience on top of the verified article/project publishing loop.
- SEO/public URL hygiene is accepted in `docs/decisions/0005-public-metadata-and-url-hygiene.md`.
- Public site experience design is accepted in `docs/decisions/0007-public-site-experience-design.md` and detailed in `docs/design/PUBLIC_SITE_EXPERIENCE.md`; use it as the target for future public UI work.
- The first public-site experience slice has shipped locally; future frontend work should reuse `src/app/(frontend)/styles.css` theme tokens and `SurfaceIndex`/platform surface copy instead of reintroducing one-off visual systems.
- The repeatable browser fixture intentionally seeds via Payload Local API and verifies public rendering. The full admin UI publishing loop was manually verified locally on 2026-05-04 and is not automated yet.
- Future harness changes should preserve implementation freedom while improving evidence, handoff, or decision quality.
