# 0015: Continue the Modern Public Design in the Shared Application

Status: Accepted direction, implementation scope and current visual release baseline

Date: 2026-09-27

## Context

The owner rejected the previous layouts and the warm-paper, serif, vermilion editorial direction.
Study 04 moved toward the visual clarity and interaction quality of modern technology-company sites,
without copying their brand fonts or palettes. The owner says this version is closer to expectations
and authorizes continued development and refinement. Deliberately pursuing a unique personal visual
identity is not a requirement.

After the integrated refinement, the owner confirmed on September 27 that the current version is
acceptable and asked to proceed toward real launch and account setup. The current visual version is
therefore the initial release baseline; this does not imply production rollout or real-account acceptance.

## Decision

1. Continue Study 04's modern sans-serif typography, cool-neutral surfaces, content scale and restrained
   interface. Prioritize coherent presentation and useful interaction over an invented signature style.
   The owner has accepted the current integrated version for launch. Further visual changes should
   respond to concrete use, rather than reopening basic style exploration as a launch prerequisite.
2. Apply this direction to the shared `frontend/src/` application used by both Vite and Next.js `site/`.
   Retain the existing publishing, drafts, account, moderation, permission and public-route contracts.
   A second backend, a new CMS and a separate production frontend are not required.
3. Drive the homepage from published entries and site settings. Support empty content, a single work,
   notes alone and mixed content without depending on sample IDs or fabricated author copy. Respect
   featured entries and real content before optional local samples.
4. Keep `study.html` as an exploration reference. The connected `index.html` application is the primary
   local review surface. Clearly labeled samples remain local opt-in content; production never seeds them.
   The crop tool may demonstrate interaction using samples or a user-selected local image, without
   uploading files, changing the source image or automatically creating published work.
5. Keep final identity/domain and cloud launch acceptance separate. This implementation changes no
   provider configuration, database permissions, mail activation or production data, and is not deployed
   merely by being built locally.

## Alternatives Considered

- Keep iterating on independent samples only: this would leave the accepted direction disconnected from
  routine publishing and real content.
- Replace the platform with the study entrypoint: this would discard existing routing, SSR, drafts,
  permissions and discussion behavior without a product need.
- Return to the editorial theme or create a more distinctive persona: this contradicts current feedback.

## Consequences

- Public design changes now improve the actual publishing application and its Next.js rendering path.
- Existing regression tests remain relevant; real-content selection, SSR and navigation also need coverage.
- Aesthetic refinement and owner feedback continue within this direction. Real owner publishing, external
  email delivery, cloud permissions and durable backups retain their separate acceptance gates.

See [current progress](../../progress.md), the [design brief](../design/RESTART_BRIEF.md) and
[Study 04](../design/studies/restart-04/README.md) for implementation and review evidence.
