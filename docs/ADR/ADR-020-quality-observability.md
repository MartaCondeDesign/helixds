# ADR-020 — Quality observability is a derived, evidence-linked report

**Date:** 2026-10-03  
**Status:** Accepted

## Context

Helix already produces several useful quality signals: agent eval runs, component stability, contracts,
token validation, and Figma-sync records. They live in separate files and commands, so a contributor
cannot readily answer what changed, what evidence motivated it, or whether the intended failure rate fell.

## Decision

Add a dependency-free `pnpm quality` CLI that derives a single snapshot from existing sources. Helix is an
**adapter**, not the internal data model: the portable snapshot contract lives at
`quality/snapshot.schema.json`, and any design system can supply a conforming JSON snapshot with
`--input`. It has four
responsibilities:

- report component stability, Figma alignment, token inventory, and agent-eval reliability;
- show a weekly (rolling 7-day) subset rather than inventing historical data;
- store human-authored improvement records in `quality/changes.json`, each linked to an area, evidence,
  change, expected metric, and status;
- export the same snapshot as JSON or a self-contained HTML report for sharing.

The CLI does not alter system rules or accept an LLM recommendation automatically. Conversation-derived
observations must be anonymised, recorded as evidence by a human, and reviewed before becoming a rule,
token, contract, component, or deterministic check.

`quality/reports/` is generated and ignored. `quality/changes.json` is reviewed source data: it records
decisions, not raw agent conversations or generated code.

## Consequences

- The report can show only evidence that has been recorded. Missing eval runs or feedback are reported as
  unavailable, never converted into a misleading score.
- The dashboard/UI can be built later against the portable snapshot contract; it does not need to duplicate
  aggregation logic or know Helix's directory structure.
- Existing validation scripts remain their own source of truth. This command aggregates them; it does not
  replace CI gates.
