# Engineering Harness

The harness exists to make Myshkin 451 safe for long-term, multi-agent, multi-session development.

It should help future agents answer four questions quickly:

1. What is this project trying to become?
2. What is the current state?
3. What commands prove a change works?
4. Which files or decisions must not be changed casually?

## Harness Layers

### 1. Governance Harness

Current layer.

- `AGENTS.md` defines how agents enter and operate in the repository.
- `progress.md` records durable current state.
- `docs/README.md` explains where knowledge belongs.
- `docs/decisions/` records architecture and product-shaping decisions.

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

