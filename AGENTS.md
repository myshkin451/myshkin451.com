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

- The harness defines engineering responsibility, not fixed low-level implementation steps.
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
- Prefer small, reviewable commits.
- Use Conventional Commits for commit messages, such as `docs: define first platform loop`, `chore: add validation scripts`, or `feat: scaffold platform shell`.
- An agent may commit and push completed work without asking when the scope is clear, the diff contains only intended changes, and relevant checks have been run or explicitly marked unavailable.
- Ask the user before destructive operations, repository visibility changes, remote settings changes, deployment changes, secret handling, major dependency changes, or broad rewrites.
- When resolving an item from `progress.md` Open Decisions, include a matching decision record in `docs/decisions/` and remove the item from Open Decisions in the same change.
- Agents may challenge or improve the harness when it blocks better engineering. Record the reason, proposed replacement, and accepted outcome in `docs/HARNESS.md`, `progress.md`, or a decision record as appropriate.

## Session Handoff

Do not write a session diary after every conversation.

Before ending meaningful work, decide whether the repository state changed in a way a new agent must know. Update `progress.md` only when there is a durable change:

- phase or roadmap movement
- completed capability or failed/accepted risk
- changed next-step guidance
- added or resolved open decision
- new validation evidence that changes confidence
- handoff detail that would otherwise be lost outside chat

Use commits, pull requests, issues, or future task plans for detailed execution history. Keep `progress.md` as the current state board.

When a meaningful work slice is complete and the next task would be cleaner in a fresh context, tell the user directly that starting a new session is preferable to continuing through context compaction. Include a short handoff prompt only when it will make the restart easier.

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
