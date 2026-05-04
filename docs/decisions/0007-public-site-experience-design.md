# 0007: Public Site Experience Design

Status: Accepted

Date: 2026-05-04

## Context

Phase 2 has enough working surface area to move from an initial visual baseline toward a durable
public-site design direction.

The owner prefers the platform-entry direction: Myshkin 451 should preserve room for writing,
projects, knowledge paths, labs, and future features. The public UI should primarily face Chinese
readers, while repository documentation can remain English. Future English UI and content translation
should remain possible, but should not force a full i18n implementation before the public experience
has real content.

The current accepted visual baseline in `0006-initial-visual-system.md` is useful but too conservative
for the desired final experience. The site should feel more technically capable and more designed,
while avoiding generic AI-startup gradients, SaaS marketing templates, and purely decorative
showmanship.

## Decision

Adopt the design direction documented in `docs/design/PUBLIC_SITE_EXPERIENCE.md`.

The public site should become a Chinese-first technical atlas and public workshop:

- a platform entrance rather than a pure blog, portfolio, knowledge base, or lab;
- Chinese-first in navigation, page chrome, and primary UI copy;
- dark-forward but not dark-only;
- more interface-led and technically expressive than the initial archive/notebook baseline;
- still comfortable for long-form Chinese reading;
- structured around four public surfaces: writing, projects, knowledge paths, and labs.

Use a dual-theme strategy. Dark mode is the signature environment for the homepage, projects, labs,
and system-navigation surfaces. Light mode remains first-class for long-form reading and accessibility.

Keep public URLs in stable English paths for now. Leave room for future i18n with centralized UI copy,
theme/language affordance placement, and translation-ready layout decisions, but do not add full
locale routing, automatic translation, or bilingual CMS fields yet.

This decision supersedes `0006-initial-visual-system.md` where the two conflict. Decision 0006 remains
the historical first visual baseline.

## Alternatives Considered

- Keep the restrained editorial archive baseline:
  - Useful as a first scaffold, but too conservative for the desired public identity.
- Make the entire public site dark:
  - Stronger at first glance, but worse for long Chinese reading and accessibility.
- Build a full bilingual/i18n platform immediately:
  - Directionally useful, but premature before real publishing pressure exists.
- Use a pure technology/product-site style:
  - More polished, but risks making a personal platform feel like a SaaS landing page.
- Use a pure digital garden style:
  - Honest and knowledge-rich, but too sparse and under-directed for a public platform entrance.

## Non-Goals

- Do not add new Payload collections for knowledge paths or labs yet.
- Do not implement full i18n, locale routing, or automatic translation in this decision.
- Do not finalize a logo, illustration system, mascot, or heavy brand metaphor.
- Do not redesign the Payload admin surface.
- Do not add comments, messages, or community behavior as part of the visual design pass.

## Consequences

- Positive: Future frontend work has a stronger target than "make it look better."
- Positive: Chinese-first public UX is now an explicit platform requirement.
- Positive: Dark mode can carry the modern technical feel without sacrificing light-mode reading.
- Negative: A dual-theme token system is more work than a single fixed palette.
- Negative: The homepage needs real content and careful copy to avoid feeling like a decorative shell.
- Follow-up: Implement the design in small slices, starting with theme tokens, Chinese-first homepage
  copy, the four-surface map, and an `/about` surface.
