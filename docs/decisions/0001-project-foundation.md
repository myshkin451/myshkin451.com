# 0001: Project Foundation

Status: Accepted

Date: 2026-04-30

## Context

Myshkin 451 is being built from scratch as a long-term personal digital platform. It replaces the direction of an older student-era blog project, but it should not inherit the old architecture.

The first phase should support public writing, project pages, a homepage/profile surface, media-backed content management, and future expansion paths. The project may later include knowledge entry points, comments, discussions, small tools, AI demos, and experimental pages.

The repository is public and is expected to be developed over many sessions by agents and, potentially, parallel sub-agents.

## Decision

Start with a modular monolith.

Use a small governance kernel before application scaffolding:

- `AGENTS.md` for agent operating rules.
- `progress.md` for current state and handoff.
- `docs/HARNESS.md` for engineering and multi-agent workflow.
- `docs/decisions/` for durable architecture decisions.

Keep Next.js, Payload CMS, PostgreSQL, and S3/R2-compatible object storage as the planned stack unless a later decision record replaces that choice.

## Non-Goals

- Do not begin with microservices.
- Do not begin with a full community/forum system.
- Do not begin with a complex role or workflow engine.
- Do not create a large documentation tree before the application scaffold provides real commands and constraints.
- Do not migrate the old blog architecture into this repository.

## Consequences

- Future agents have a clear entry path before code exists.
- The project can add stronger harness layers after scaffold without rewriting the documentation model.
- Architecture-changing choices need decision records instead of being buried in chat history.
- `progress.md` must stay concise, or it will stop being useful for handoff.

