# Roadmap

Updated: 2026-09-18

The current sequence follows [decision 0010](decisions/0010-creator-first-restart.md): establish a
creative direction, make a small site useful, then give it durable hosting. There is no traffic
threshold, AWS course, or old-domain recovery requirement for starting.
[Decision 0011](decisions/0011-zero-content-start-and-visitor-interaction.md) adds an empty-content
start, convenient owner editing, and visitor accounts/messages to the first usable release scope.

## Completed Foundation

- Phase 0: public repository, project identity, agent workflow, and engineering harness.
- Phase 1: local CMS publishing loop for articles, projects, media, and stable public routes.
- Phase 2: public page baseline, themes, metadata, publication visibility, and CI.

These are historical implementation milestones. Phase 2's public design is reopened; its closeout
does not establish the final visual identity or prove a current production deployment.

## Step 1: Design Exploration

Status: Active. B was only relatively better than the other initial studies; no palette or abstract
visual identity was accepted. The owner wants meaningful content/interaction and equal coexistence
of writing, projects, and imagery. A third study offers two layouts based on reference research
and generated mockups. The owner received this third round positively and wants to build on it with
varied content, richer details, and publishing that can begin without any existing work.

Goal: find a visual and interactive direction the owner wants to inhabit and keep using.

Deliverable:

- One small, public-safe content pack shared by distinct high-fidelity design studies.
- Desktop and phone layouts, with one representative working interaction per study.
- A short comparison of what each study expresses and its tradeoffs.
- Owner feedback translated into concrete design choices rather than generic style adjectives.

Exit signal: one principal direction is chosen using visible, interactive evidence. Revisit the
studies if none is convincing. Do not silently turn an agent's preference into the final identity.

Review [design study 03](design/studies/restart-03/README.md), guided by [the updated design brief](design/RESTART_BRIEF.md).
The first two studies remain available for historical comparison.

## Step 2: A Small Usable Website

Status: Connected local frontend implemented in [frontend/](../frontend/README.md). Real backend
publishing, media storage, visitor accounts, and permission checks remain the next implementation slice.

Goal: make the design useful from an empty start through everyday publishing and visitor participation.

Scope:

- Home, article/photo/project browsing and detail surfaces, and a compact about surface.
- Shared typography, layout, navigation, media handling, and selected interaction details.
- Convenient drafts, preview, media upload, link-based projects, topic assignment, and basic home editing
  with separate content and presentation boundaries. Decision 0012 permits reusing or replacing the
  old foundation according to the actual needs of these flows.
- Zero-, one-, and many-item layouts; development samples do not become required public content.
- Visitor registration/sign-in and messages/replies; a guestbook and optional content comments are the
  recommended initial placement. Explicit owner/visitor permissions, recovery, and moderation are required.

Exit signal: the owner can start with no content, then publish/update writing, photos, and projects
without code edits. Visitors can register, log in, and participate without access to management or
drafts. Verify desktop/phone behavior, persistence, and permissions with the relevant checks.

## Step 3: A Small Hosted Launch

Status: Later; provider research available, vendor and budget undecided.

Goal: make the working site accessible with little day-to-day infrastructure effort.

Scope:

- Evaluate the shortlisted host against the actual app and the owner's access network.
- Select the full app/database/media combination and monthly cost boundary.
- Use a provider URL for initial verification; select a custom domain when the identity is ready.
- Configure durable uploads, production migrations, backups, secrets, and a small rollback procedure.
- Test admin publishing, visitor accounts/messages, email delivery/recovery, public media, cold access,
  and canonical URLs on the actual host.

Exit signal: the empty or owner-populated site works, private validation fixtures are not published,
content and messages survive redeployment, account recovery works, and restore/rollback are understood.
The owner can publish without learning cloud infrastructure first.

Use [the deployment plan](operations/DEPLOYMENT_AND_OPERATIONS_PLAN.md). The AWS runbook is historical.

## Step 4: Grow Through Use

Status: Deferred until the core site is being used.

Possible additions include richer topic paths, new kinds of interactive work, or feeds as concrete
content warrants them. Basic visitor messages belong to Step 2; a forum, private messaging, or a
social graph is not implied by that scope. Keep experiments bounded without a speculative plugin platform.

## Roadmap Rules

- Keep this file directional; `progress.md` owns current implementation state.
- Record decisions that affect identity, hosting, data ownership, or module boundaries.
- Research real constraints early, but do not make a later phase block every earlier deliverable.
- Stop each work slice at a usable, reviewable result.
