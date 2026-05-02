# 0002: Harness Operating Model

Status: Accepted

Date: 2026-05-02

## Context

Myshkin 451 is intended to become both a personal digital platform and a serious experiment in agent-driven software development.

The repository should support long-running work across multiple sessions, multiple agents, and future model generations. A harness that over-specifies every action can become stale and limit stronger models. A harness that only states loose principles will not preserve quality, decisions, or handoff state.

The project needs a reusable operating model that feels closer to senior software engineering governance than prompt-level control.

## Decision

Treat the harness as an engineering operating model.

The stable layer defines durable responsibility:

- product intent and non-goals
- phase gates
- decision lifecycle
- validation and evidence expectations
- document lifecycle
- open decision and handoff mechanisms
- agent autonomy and escalation boundaries

The adaptive layer remains flexible:

- exact commands
- framework and tool versions
- CI and test details
- folder structure details
- review formats
- multi-agent ownership mechanics
- automation scripts

Agents may challenge the harness when it blocks better engineering, but accepted changes must be recorded in the appropriate durable location.

## Alternatives Considered

- Highly prescriptive harness: rejected because it would encode current model and tool limitations too strongly.
- Loose principle-only harness: rejected because it would not reliably support handoff, evidence, or decision memory.
- Large upfront enterprise process: rejected because the project needs real code pressure before adding heavier enforcement.

## Non-Goals

- Do not define every future document now.
- Do not freeze low-level implementation steps.
- Do not add heavy process before repeated drift or real implementation pressure justifies it.
- Do not make agents passive executors when they can propose better architecture or workflow.

## Consequences

- The harness can survive model and tooling changes.
- Future agents have permission to improve the system instead of only obeying stale rules.
- Important changes still leave durable evidence in docs, decision records, checks, or handoff notes.
- The project can become a reusable method for future agent-driven development work.

