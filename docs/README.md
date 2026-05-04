# Documentation Map

This repository uses a small documentation system that should grow only when the project needs it.

## Core Files

- `README.md`: public identity, direction, and high-level engineering stance.
- `AGENTS.md`: required startup path and operating rules for future agents.
- `progress.md`: current state board and handoff surface.
- `docs/ROADMAP.md`: directional phase roadmap.
- `docs/HARNESS.md`: engineering harness, validation, and multi-agent workflow.
- `docs/decisions/`: durable decision records for architecture and product-shaping choices.
- `docs/decisions/_template.md`: template for new decision records.

## Documentation Rules

- Keep stable facts in durable docs.
- Keep current status in `progress.md`.
- Keep detailed task execution in commits, issues, pull requests, or future task-specific plans.
- Do not duplicate the same truth in multiple files unless there is a clear reader need.
- When implementation changes invalidate a doc, update the doc in the same change.
- If a document becomes a diary, compress it back into current state, decisions, risks, and next actions.
- When an Open Decision in `progress.md` is resolved, add or update the corresponding decision record and remove that open item from `progress.md`.
