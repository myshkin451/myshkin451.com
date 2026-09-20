# Documentation Map

This repository uses a small documentation system that should grow only when the project needs it.

## Core Files

- `README.md`: public identity, direction, and high-level engineering stance.
- `AGENTS.md`: required startup path and operating rules for future agents.
- `progress.md`: current state board and handoff surface.
- `docs/ROADMAP.md`: directional phase roadmap.
- `docs/HARNESS.md`: engineering harness, validation, and multi-agent workflow.
- `docs/design/RESTART_BRIEF.md`: current creative goals, design hypotheses, and prototype deliverable.
- [Current frontend](../frontend/README.md): connected public, publishing, and visitor preview; local persistence and verification.
- [Design study 01](design/studies/restart-01/README.md): three standalone interactive previews and feedback guidance.
- [Design study 02](design/studies/restart-02/README.md): historical image-led preview; its abstract imagery was not accepted.
- [Design study 03](design/studies/restart-03/README.md): preceding visual comparison with references, generated mockups, and functional details.
- `docs/design/PUBLIC_SITE_EXPERIENCE.md`: historical Phase 2 design; not the current visual target.
- [Runbook](operations/RUNBOOK.md): current publishing, account setup, deployment, backup, restore, and rollback instructions.
- [Local acceptance](operations/LOCAL_ACCEPTANCE.md): actual separate-target account/media restore, restart and permission evidence, with remaining verification boundaries.
- [Cloud acceptance](operations/CLOUD_ACCEPTANCE.md): actual Vercel deployment, cloud configuration and public checks, with pending email and owner acceptance.
- [API contract](operations/API_CONTRACT.md): Supabase tables, permissions, RPCs, media access, and integration checks.
- `docs/operations/DEPLOYMENT_AND_OPERATIONS_PLAN.md`: historical hosting comparison; current selection is decision 0013.
- [Production handoff](operations/PRODUCTION_HANDOFF.md): current mandate, staged implementation, acceptance, and owner-only steps for completing the platform.
- `docs/operations/MANUAL_AWS_LAUNCH_RUNBOOK.md`: manual AWS launch runbook and preflight checklist
  for the historical ECS/Fargate path; inactive after the September 2026 restart.
- `docs/decisions/`: durable decision records for architecture and product-shaping choices.
- `docs/decisions/0010-creator-first-restart.md`: accepted restart, superseding the prior visual target
  and AWS-first deployment requirement.
- `docs/decisions/0011-zero-content-start-and-visitor-interaction.md`: accepted zero-content start,
  convenient owner publishing, and visitor account/message scope.
- `docs/decisions/0012-independent-frontend-and-rebuild-authority.md`: permission to rethink the old foundation and the current local frontend boundary.
- `docs/decisions/0013-production-supabase-and-next.md`: real backend and website architecture, hosted services, data ownership, and free-tier constraints.
- `docs/decisions/_template.md`: template for new decision records.

## Documentation Rules

- Keep stable facts in durable docs.
- Keep current status in `progress.md`.
- Keep detailed task execution in commits, issues, pull requests, or future task-specific plans.
- Do not duplicate the same truth in multiple files unless there is a clear reader need.
- When implementation changes invalidate a doc, update the doc in the same change.
- If a document becomes a diary, compress it back into current state, decisions, risks, and next actions.
- When an Open Decision in `progress.md` is resolved, add or update the corresponding decision record and remove that open item from `progress.md`.
