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
- [Design study 04](design/studies/restart-04/README.md): modern visual version accepted as the initial release baseline, shared-application integration, references and local verification; production and real-account acceptance remain separate.
- [Design study 01](design/studies/restart-01/README.md): three standalone interactive previews and feedback guidance.
- [Design study 02](design/studies/restart-02/README.md): historical image-led preview; its abstract imagery was not accepted.
- [Design study 03](design/studies/restart-03/README.md): preceding visual comparison with references, generated mockups, and functional details.
- `docs/design/PUBLIC_SITE_EXPERIENCE.md`: historical Phase 2 design; not the current visual target.
- [账号与权限指南](operations/ACCOUNT_GUIDE.md)：登录、验证、站主授权与账号写入限制。
- [Runbook](operations/RUNBOOK.md): current publishing, account setup, deployment, backup, restore, and rollback instructions.
- [Local acceptance](operations/LOCAL_ACCEPTANCE.md): actual separate-target account/media restore, restart and permission evidence, with remaining verification boundaries.
- [2026-09-27 备份恢复验收](operations/RELEASE_RESTORE_2026-09-27.md)：当前账号权限版本的隔离恢复证据及生产归档边界。
- [随记使用与验收](operations/NOTES_ACCEPTANCE.md)：单人短文字发布、验证范围与域名/邮件接续。
- [认证邮件接续](operations/EMAIL_SETUP.md)：中文模板、本机验证和最终域名确定后的 SMTP 操作。
- [Cloud acceptance](operations/CLOUD_ACCEPTANCE.md): actual Vercel deployment, cloud configuration and public checks, with pending email and owner acceptance.
- [API contract](operations/API_CONTRACT.md): Supabase tables, permissions, RPCs, media access, and integration checks.
- `docs/operations/DEPLOYMENT_AND_OPERATIONS_PLAN.md`: historical hosting comparison; current selection is decision 0013.
- [Production handoff](operations/PRODUCTION_HANDOFF.md): next-phase domain/email, live publishing, frontend and capacity plan, plus the original mandate and acceptance contract.
- `docs/operations/MANUAL_AWS_LAUNCH_RUNBOOK.md`: manual AWS launch runbook and preflight checklist
  for the historical ECS/Fargate path; inactive after the September 2026 restart.
- `docs/decisions/`: durable decision records for architecture and product-shaping choices.
- `docs/decisions/0010-creator-first-restart.md`: accepted restart, superseding the prior visual target
  and AWS-first deployment requirement.
- `docs/decisions/0011-zero-content-start-and-visitor-interaction.md`: accepted zero-content start,
  convenient owner publishing, and visitor account/message scope.
- `docs/decisions/0012-independent-frontend-and-rebuild-authority.md`: permission to rethink the old foundation and the current local frontend boundary.
- `docs/decisions/0013-production-supabase-and-next.md`: real backend and website architecture, hosted services, data ownership, and free-tier constraints.
- `docs/decisions/0014-single-author-notes.md`：单人发布、公开阅读的随记与增量迁移。
- `docs/decisions/0015-modern-public-direction.md`：沿第四轮现代视觉方向继续开发，在共享前端中保留真实内容、发布、权限与路由；不以刻意建立个人辨识度为目标。
- `docs/decisions/0016-account-access-management.md`：最小账号管理、有效站主保护和权限审计。
- `docs/decisions/_template.md`: template for new decision records.

## Documentation Rules

- Keep stable facts in durable docs.
- Keep current status in `progress.md`.
- Keep detailed task execution in commits, issues, pull requests, or future task-specific plans.
- Do not duplicate the same truth in multiple files unless there is a clear reader need.
- When implementation changes invalidate a doc, update the doc in the same change.
- If a document becomes a diary, compress it back into current state, decisions, risks, and next actions.
- When an Open Decision in `progress.md` is resolved, add or update the corresponding decision record and remove that open item from `progress.md`.
