# Engineering Harness

The harness exists to make Myshkin 451 safe for long-term, multi-agent, multi-session development.

It should help future agents answer four questions quickly:

1. What is this project trying to become?
2. What is the current state?
3. What commands prove a change works?
4. Which files or decisions must not be changed casually?

## Method

Harness engineering in this repository means turning agent work into a repeatable system, not adding ceremony for its own sake.

- Understand context before changing code.
- Make every completed step executable or verifiable.
- When something does not run, investigate the cause instead of treating failure as a footnote.
- Record durable problems where the next agent will find them.
- Preserve deferred work as explicit open decisions, issues, or handoff notes.
- Review at phase boundaries and leave reports or summaries that can guide the next phase.
- Keep document lifecycle visible: create, update, compress, archive, or delete stale docs.
- Optimize for restart: a new session should recover the project state from the repo in minutes.
- Keep code clear enough to change and docs clear enough to trust.
- Prefer lightweight enforcement over heavy process; add scripts and checks when repeated drift appears.

## First Platform Loop

The first platform loop is the primary phase gate for the initial product.

It is complete when an operator can:

1. Create or update an article or project in the CMS/admin surface.
2. Add a stable slug, publication status, and cover or media asset.
3. See the published item render on the public site at a stable route.
4. Run the baseline checks for the repository, including type checks and production build.

Until this loop works, discussion systems, complex permissions, forums, advanced workflows, and broad plugin architecture remain out of scope.

## Harness Layers

### 1. Governance Harness

Current layer.

- `AGENTS.md` defines how agents enter and operate in the repository.
- `progress.md` records durable current state.
- `docs/README.md` explains where knowledge belongs.
- `docs/decisions/` records architecture and product-shaping decisions.
- `CLAUDE.md` points Claude Code agents back to the shared `AGENTS.md` rules.

### 2. Development Harness

To be added with the application scaffold.

- Reproducible install command.
- Local development command.
- Environment variable template.
- Local database setup path.
- Seed or fixture strategy when the first CMS models exist.

### 3. Quality Harness

To be added when the stack exists.

- Formatting.
- Linting.
- Type checking.
- Unit or integration tests.
- Production build.
- UI verification for public pages and CMS-driven rendering.

### 4. Operational Harness

To be added closer to deployment.

- Hosting target.
- Environment ownership.
- Database migration strategy.
- Media storage configuration.
- Backup and rollback expectations.
- Monitoring and health checks.

## Multi-Agent Protocol

Use parallel agents only when the work can be split cleanly.

- Assign explicit ownership by module, file family, or question.
- Avoid overlapping write sets.
- Explorers should not edit files unless explicitly asked.
- Workers should edit only their owned area and list changed files.
- The lead agent integrates, reviews the combined diff, and runs final checks.
- If two changes compete, preserve the user-visible product direction first, then the simpler architecture.
- When parallel work becomes frequent, add an ownership manifest or worktree convention instead of relying on chat coordination.

## Phase Reviews

At meaningful phase boundaries, an agent should review the repository by directory or module and produce a concise report covering:

- what changed
- what currently runs
- what is unverified
- risks and known issues
- stale or missing documentation
- recommended next actions

Do not create recurring review reports before there is enough implementation to review.

## Decision Records

Create a decision record when a choice affects:

- framework or major library selection
- module boundaries
- data ownership
- CMS collections and public contracts
- deployment architecture
- authentication or permissions
- storage, caching, or migration strategy
- public URL structure or SEO behavior

Decision records should be short. Prefer a useful current explanation over a perfect historical essay.

Use `docs/decisions/_template.md` for new records. When an Open Decision in `progress.md` is resolved, add or update the related decision record and remove the item from `progress.md` in the same change.

## Future Check Commands

The exact commands will be filled in after the app scaffold exists. Expected categories:

```txt
install
dev
format
lint
typecheck
test
build
```

Every final handoff should say which checks ran and what remains unverified.
