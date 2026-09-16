# Roadmap

Updated: 2026-09-17

The current sequence follows [decision 0010](decisions/0010-creator-first-restart.md): establish a
creative direction, make a small site useful, then give it durable hosting. There is no traffic
threshold, AWS course, or old-domain recovery requirement for starting.

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
and generated mockups, ready for evaluation.

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

Status: Next, after direction selection.

Goal: carry the selected design through real reading, project viewing, and publishing.

Scope:

- Home, article list/detail, project list/detail, and a compact about surface.
- Shared typography, layout, navigation, media handling, and selected interaction details.
- Existing Payload publishing and stable routes; no speculative new content models.
- Real or clearly labeled sample content; empty future modules need not dominate navigation.

Exit signal: the owner can publish/update an article and a project, inspect both on desktop and
phone, and feels the site is worth using. Run the relevant code, content-loop, and browser checks.

## Step 3: A Small Hosted Launch

Status: Later; provider research available, vendor and budget undecided.

Goal: make the working site accessible with little day-to-day infrastructure effort.

Scope:

- Evaluate the shortlisted host against the actual app and the owner's access network.
- Select the full app/database/media combination and monthly cost boundary.
- Use a provider URL for initial verification; select a custom domain when the identity is ready.
- Configure durable uploads, production migrations, backups, secrets, and a small rollback procedure.
- Test admin publishing, public media, cold access, and canonical URLs on the actual host.

Exit signal: one reviewed article and project are live, updates survive redeployment, restore and
rollback are understood, and the owner can publish without learning cloud infrastructure first.

Use [the deployment plan](operations/DEPLOYMENT_AND_OPERATIONS_PLAN.md). The AWS runbook is historical.

## Step 4: Grow Through Use

Status: Deferred until the core site is being used.

Possible additions include topic paths, small tools, interactive work, feeds, or comments. Add them
when concrete content or usage warrants the work. Keep experiments bounded without prebuilding an
entire lab registry, community system, or plugin platform.

## Roadmap Rules

- Keep this file directional; `progress.md` owns current implementation state.
- Record decisions that affect identity, hosting, data ownership, or module boundaries.
- Research real constraints early, but do not make a later phase block every earlier deliverable.
- Stop each work slice at a usable, reviewable result.
