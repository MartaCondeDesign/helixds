# ADR-022 — Prop names follow what agents already reach for

**Date:** 2026-10-06
**Status:** Accepted — supersedes the `onPress` and `loading` canonical names in `prop-map.md`

## Context

The `bare` level of the eval context ladder (`evals/ladder.json`) asks an agent to build with Helix while
giving it nothing about Helix: no guide, no files, no tools. What it writes is what a model expects a
design system's API to look like. Across 35 `bare` answers, two Helix names lost clearly to the model's
default:

| Model's default | Helix name (before) | Model / Helix |
|---|---|---|
| `onClick` | `onPress` | 12 / 3 |
| `isLoading` | `loading` | 6 / 2 |

Other near-misses did not hold up: `type` and `name` were mostly the native HTML attributes Helix already
passes through, and `invalid`, `variant` and `label` were used more often than their synonyms.

`onPress` came from React Aria's vocabulary; Helix's buttons are native `<button>` elements, whose own
handler is `onClick`. Every answer that used `onClick` had the right intent and the wrong name.

## Decision

- **`onClick` is the canonical action handler** on Button, IconButton, Chip and FAB (and FAB's `actions`).
  `onPress`, `onTap` and `onAction` are anti-synonyms.
- **`isLoading` is the canonical loading prop** on Button, IconButton and Input. `loading`, `pending`,
  `isPending` and `busy` are anti-synonyms. The authored *state* keeps its name, "loading" — it describes
  the situation, not the code.
- Direct change, no alias period: Helix is not published, so nothing outside this repo depends on the old
  names. The lint rule `helix/prop-vocabulary` reports the old names and auto-fixes them.

Going forward, when a new prop has no strong reason to differ, prefer the name a `bare` agent writes —
`bare` eval answers are the evidence, and a name agents already use is one less thing every guide has to
correct.

## Consequences

- Contracts (Button, IconButton, Chip, FAB, Input → 2.0.0), types, implementations, docs, stories, the
  prop map, the lint plugin, the MCP, eval prompts and the global `on-press` check move together.
- Earlier eval answers are rescored with the new criteria: `onClick` now counts as correct, `onPress` as
  the anti-synonym.
- Figma: Button, IconButton and Input expose the loading state as a property — rename it to `isLoading`
  there (event handlers have no Figma property).
