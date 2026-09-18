# 0010: Creator-First Restart

Status: Accepted

Scope update: [0011](0011-zero-content-start-and-visitor-interaction.md) supersedes this record's
deferral of visitor accounts/comments after the owner's explicit request on 2026-09-18.

Date: 2026-09-16

## Context

The owner wants to resume the site primarily for personal creative expression and future project
presentation. Initial traffic is not a success requirement. The old domain may be replaced, AWS
study is paused, and the existing public design has not met the owner's expectations.

The owner wants help discovering a visual direction through concrete examples and explicitly does
not want the earlier platform-specific skill to limit exploration. Existing publishing code is
useful, but the prior public-site closeout does not mean aesthetic acceptance.

## Decision

1. Make creative use, publishing satisfaction, and presentation of real work the first product goals.
2. Restart in this order: design studies, one working public/content slice, then a small hosted launch.
   Research deployment constraints now; select and provision a provider after the working slice.
3. Reopen public visual identity and interaction design. Use the current design brief, genuine
   content or explicit samples, and owner feedback on high-fidelity working examples.
4. Retain Next.js, Payload, PostgreSQL, the publishing models, and stable route paths for now.
   Change these only for a demonstrated product or hosting need through a later decision.
5. Remove the AWS-first requirement and AWS learning dependency. Favor low operating effort and
   appropriate total cost; no provider is accepted by this decision.
6. Keep Myshkin 451 as a working identity and the repository name unchanged. The final domain is open.
   A domain purchase, recovery, transfer, or DNS change is not part of this restart slice.
7. Give the agent responsibility for research, design proposals, implementation, verification, and
   GitHub synchronization. Keep aesthetic choices, paid plans, account ownership, and the concrete
   production launch scope with the owner when those decisions become actionable.

This decision supersedes 0006/0007 as visual prescriptions and 0009 as a hosting requirement.
Chinese reading, accessibility, publication visibility, content routes, and reusable engineering
remain foundations. A light or dark theme, editorial metaphor, and four-module homepage are not
fixed requirements of the new design. Historical documents remain available with superseded labels.

The old Open Decision "AWS launch timing and production readiness gate" is replaced by a later
provider/budget/domain decision and a provider-neutral launch gate. Comments and community remain
deferred until actual use creates a need.

## Alternatives Considered

- Resume AWS provisioning first: no longer serves the owner's immediate goals.
- Tune the existing console design: does not address the unresolved aesthetic direction.
- Rewrite the entire stack or buy a new domain immediately: adds work before establishing a useful site.
- Choose a template solely for a free hosting tier: treats hosting constraints as the creative brief.

## Non-Goals

- No final visual identity, hosting vendor, monthly budget, or domain is selected here.
- No cloud resources, production data migration, paid subscription, or dependency changes.
- No new community system, user accounts for visitors, or speculative CMS collections.

## Consequences

- The project can resume without completing a cloud course or recovering an expired domain.
- The next evidence of progress is a convincing interactive design study, then a working content loop.
- Provider research is provisional; actual compatibility, cost, and access still need launch-stage proof.
- The existing UI remains the old baseline until the redesign is implemented and verified.
- Follow the [design brief](../design/RESTART_BRIEF.md), [roadmap](../ROADMAP.md), and
  [deployment plan](../operations/DEPLOYMENT_AND_OPERATIONS_PLAN.md).
