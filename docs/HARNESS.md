# Engineering Harness

The harness exists to make Myshkin 451 safe for long-term, multi-agent, multi-session development.

It should help future agents answer four questions quickly:

1. What is this project trying to become?
2. What is the current state?
3. What commands prove a change works?
4. Which files or decisions must not be changed casually?

## Philosophy

The harness is an engineering operating model, not a cage for future models.

As models improve, this repository should not depend on brittle instructions for every low-level move. The stable harness should define intent, ownership, evidence, boundaries, and decision lifecycle. The adaptive harness should be free to change as tools, models, frameworks, and project needs evolve.

Good harness rules should:

- preserve product intent
- make state recoverable across sessions
- make quality observable through checks and evidence
- keep important decisions out of transient chat
- expose risks and deferred work
- keep documents trustworthy over time
- leave implementation space for better agents to make better choices

Bad harness rules should be removed or rewritten when they only preserve ceremony, duplicate stale facts, block better architecture, or encode outdated tool behavior.

## Human and Agent Roles

The human owner should retain final authority over:

- product intent
- taste and experience quality
- priority tradeoffs
- public identity and positioning
- risk acceptance
- major architecture direction

Agents should own as much execution as possible:

- technical exploration
- architecture proposals
- implementation
- tests and validation
- documentation updates
- issue diagnosis
- review reports
- refactors and migration work

An agent may autonomously execute, commit, and push scoped work when the repository rules allow it. The owner should be pulled in when a choice changes product direction, public posture, deployment risk, data ownership, security posture, or long-term architecture.

## Stable and Adaptive Layers

The stable layer should change slowly:

- project identity and non-goals
- module and ownership boundaries
- phase gates such as the first platform loop
- decision record requirements
- validation and evidence expectations
- document lifecycle rules
- open decision and handoff mechanisms
- agent autonomy and escalation boundaries

The adaptive layer should change whenever the project or tools need it:

- package manager and exact commands
- framework versions
- test runners and CI details
- folder structure details
- review report format
- multi-agent ownership mechanics
- local development and deployment scripts
- automation and lint rules

When a stable-layer change is accepted, record it in a decision record or the core governance docs. When an adaptive-layer detail changes, update the concrete command, script, or local doc that future agents will actually use.

## Security Posture

This is a public repository.

- Do not commit credentials, tokens, cookies, private keys, production URLs with secrets, or personal data.
- Use placeholders in examples and keep real values in local environment files or managed secret stores.
- Agents must not print, summarize, or exfiltrate environment variable values or local secret files.
- Fixtures and screenshots must not contain private user data, private notes, or internal-only references unless the owner explicitly approves publication.
- Security, privacy, data ownership, and deployment-risk changes require owner escalation.

## Method

Harness engineering in this repository means turning agent work into a repeatable system, not adding ceremony for its own sake.

- Understand context before changing code.
- Make every completed step executable or verifiable.
- When something does not run, investigate the cause instead of treating failure as a footnote.
- Record durable problems where the next agent will find them.
- Preserve deferred work as explicit open decisions, issues, or handoff notes.
- Review at phase boundaries and leave reports or summaries that can guide the next phase.
- Keep document lifecycle visible: create, update, compress, archive, or delete stale docs.
- When a current-state doc changes, update connected status markers such as dates, next steps, and superseded decision records in the same work slice.
- Optimize for restart: a new session should recover the project state from the repo in minutes.
- Keep code clear enough to change and docs clear enough to trust.
- Prefer lightweight enforcement over heavy process; add scripts and checks when repeated drift appears.
- Let agents challenge the harness, but require the challenge to produce a clearer rule, a better check, or an explicit decision.

## Evidence Shapes

Evidence should be proportional to the change. Future agents should choose the lightest proof that makes the result trustworthy.

Acceptable evidence includes:

- command results for format, lint, typecheck, test, build, or migration checks
- CI run links or summaries when CI exists
- browser, screenshot, or visual notes for user-facing changes
- API responses, database checks, or logs for integration behavior
- phase review reports for larger milestones
- explicit residual-risk notes when a check cannot run

Final handoffs should name what was verified, what was not verified, and why.

## Changing the Harness

The harness may evolve.

- Stable-layer changes should use a decision record or a clearly explained update to the core governance docs.
- Adaptive-layer changes may directly update the concrete command, script, or local doc that future agents use.
- Harness changes should explain the reason in the commit body, decision record, or nearby documentation.
- If a rule blocks better engineering, replace it with a clearer rule, a better check, or an explicit decision.

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

Current layer.

- Reproducible install through `pnpm install`.
- Local development through `pnpm dev`.
- Local PostgreSQL through `pnpm db:up` and `pnpm db:down`.
- Environment defaults documented in `.env.example`.
- Content-loop fixtures seed records through Payload Local API for integration and browser tests.

### 3. Quality Harness

Current layer.

- Formatting.
- Linting.
- Type checking.
- Integration tests against Payload and PostgreSQL.
- Production build.
- Browser verification for public pages and CMS-driven rendering.
- GitHub Actions runs the stable checks on pull requests and pushes to `main`.

### 4. Operational Harness

To be added closer to deployment.

- Focused deployment and operations plan before automation.
- Hosting target.
- Environment ownership.
- Database migration strategy.
- Media storage configuration.
- Infrastructure-as-code boundary if cloud resources become durable project infrastructure.
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

## Check Commands

Current scaffold commands:

| Purpose | Command |
| --- | --- |
| Install dependencies | `pnpm install` |
| Start local PostgreSQL | `pnpm db:up` |
| Stop local PostgreSQL | `pnpm db:down` |
| Start local app | `pnpm dev` |
| Format files | `pnpm format` |
| Check formatting | `pnpm format:check` |
| Lint | `pnpm lint` |
| Typecheck | `pnpm typecheck` |
| Run integration tests | `pnpm test:int` |
| Run browser tests | `pnpm test:e2e` |
| Run all tests | `pnpm test` |
| Production build | `pnpm build` |

Use the lightest relevant proof for the change. Do not turn every small documentation or configuration change into a full phase review.

Every final handoff should say which checks ran and what remains unverified.

## Continuous Integration

Basic CI lives in `.github/workflows/ci.yml`.

It runs on pull requests and pushes to `main` with:

- Node 22.
- pnpm 10.33.2.
- PostgreSQL 16 as a service container.
- `pnpm format:check`.
- `pnpm lint`.
- `pnpm typecheck`.
- `pnpm test:int`.
- `pnpm build`.
- `pnpm test:e2e`.

The workflow sets local-only CI environment values for `DATABASE_URL`, `PAYLOAD_SECRET`, `NEXT_PUBLIC_SITE_URL`, and `BASE_URL`. Browser tests run against the production server because the CI job builds before running Playwright. Failed browser runs upload Playwright reports and test results for debugging.
