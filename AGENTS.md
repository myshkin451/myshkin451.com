# Agent Operating Guide

This repository is a long-lived personal digital platform. Treat it as a public product codebase from the first commit, not as a disposable blog rewrite.

## Startup Path

Before making non-trivial changes, read these files in order:

1. `README.md` for product identity and long-term direction.
2. `progress.md` for the current project state, next steps, risks, and open decisions.
3. `docs/README.md` for the documentation map.
4. `docs/HARNESS.md` for engineering, validation, and multi-agent workflow rules.
5. Relevant records in `docs/decisions/` when changing architecture, stack, deployment, data models, or module boundaries.

Read task-specific code and docs after this startup path. Do not sweep the whole repository when the task has a narrow scope.

## Project Posture

- Build a modular monolith first.
- Keep public presentation, CMS/admin, content models, and infrastructure concerns separated.
- Prefer durable, boring engineering for the core platform.
- Leave room for playful experiments in clearly bounded areas such as labs, demos, or tools.
- Do not migrate old blog architecture into this project.
- Do not build a full forum, complex permission system, workflow engine, or plugin platform before the first content/project loop works.

## Agent Workflow

- State what you are about to change before editing files.
- Keep changes scoped to the active task.
- Preserve user or other-agent edits that are unrelated to your task.
- Update `progress.md` only for durable state changes, risks, decisions, or handoff notes. Do not turn it into a session diary.
- Add or update a decision record when a choice affects future architecture, deployment, data ownership, module boundaries, or public contract.
- Prefer small, reviewable commits with clear messages.

## Parallel Work

Parallel agents are welcome, but they must have disjoint ownership.

- Give each agent a clear responsibility and file/module ownership.
- Avoid two agents editing the same file family at the same time.
- Exploratory agents should return findings, paths, risks, and recommended next actions.
- Implementation agents should list changed files and validation results.
- One lead agent should integrate, resolve conflicts, and run the final checks.

## Validation Expectations

The repository does not have an application scaffold yet. Once the stack is initialized, every meaningful change should use the available checks, expected to include:

- format
- lint
- typecheck
- unit tests
- build
- browser or screenshot verification for user-facing UI changes

If a check cannot be run, explain why and record the residual risk in the final handoff.

