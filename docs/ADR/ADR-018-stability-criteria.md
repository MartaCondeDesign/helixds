# ADR-018 — Component status is computed: draft → beta → stable

**Date:** 2026-09-24
**Status:** Accepted
**Deciders:** Helix DS team

## Context

`status` in each contract was hand-set and had no written definition. In practice "stable" had come to
mean "modeled in Figma" — all 17 stable components were in Figma, 11 of the 13 drafts weren't — while
nothing checked accessibility, dark-mode contrast, keyboard behavior, or reduced motion. The first
automated run found real gaps in components marked stable (dark-mode contrast failures in 10 of them,
no keyboard tests anywhere).

## Decision

**Three statuses, computed by `pnpm verify:stable` — never hand-edited:**

| Status | Meaning |
|---|---|
| `draft` | The component exists and works, but at least one of criteria 1–8 fails. |
| `beta` | Criteria 1–8 all pass: built, in Storybook, tokens applied, accessible, tested. Not in Figma yet. |
| `stable` | Beta **and** modeled in Figma (`contracts/figma-sync.json` → `inFigma: true`). |

(`deprecated` is the one status still set by hand, and the script leaves it alone.)

**The 8 automatic criteria** — all created as part of building a component, all checked by the script:

| # | Criterion | Checked by |
|---|---|---|
| 1 | **Contract complete** — a11y role/WCAG filled, no manifest drift | `contracts/manifest.json` |
| 2 | **Code matches contract** — every contract prop in `{Name}.types.ts` | `verify:types` |
| 3 | **Tokens resolved** — no 🆕/🚩 row for the component | `component-token-exceptions.md` |
| 4 | **Stories + a11y** — every variant/size value and authored state appears in its stories; axe (WCAG 2.2 AA) finds no violations in a real browser | test-runner + axe |
| 5 | **Keyboard tested** — every key in `a11y.keyboardNav` is exercised by a story `play` test, and all pass | test-runner |
| 6 | **Contrast AA** — no contrast violation in any story, in light **and** dark theme | test-runner + axe, both themes |
| 7 | **Reduced motion** — any Motion (JS) animation beyond `whileTap` press feedback sits inside `<MotionConfig reducedMotion="user">`; CSS motion is neutralized globally in `globals.css` | static check |
| 8 | **Eval** — a passing `evals/prompts/*.md` imports the component and checks its usage | `eval-lib` |

**Figma (9) is manual, on request** — never part of the automatic run. Once a component is in Figma and
`figma-sync.json` records it, the next `verify:stable` promotes it from beta to stable on its own.

**How it runs:** `pnpm verify:stable` needs Storybook running (`pnpm sb`, or `--url`). It runs the
Storybook test-runner (`apps/storybook/.storybook/test-runner.ts`: every story's `play`, then axe in light
and dark), evaluates the 8 criteria per component, writes `contracts/stability.json`, rewrites each
contract's `status`, and regenerates the manifest. `--details` lists what each failing criterion is
missing; `--dry-run` writes nothing; `--skip-browser` reuses the last browser results. It's too slow for
the pre-commit hook — run it after any component change, before calling the change done.

**Creating a component includes creating what the criteria check:** a story per variant, size and
authored state; a keyboard `play` test per key in the contract's `keyboardNav` (using `userEvent` from
`@storybook/test`, e.g. `userEvent.keyboard('{Enter}')`, `userEvent.tab()`); `MotionConfig` around any
Motion animation; and an eval prompt. See CLAUDE.md rule 6.

**Keyboard tests match keys by these snippets** (so a play test is found for each entry):
`{Enter}`, `[Space]`, `{Escape}`, `userEvent.tab(`, `{ArrowUp}`/`{ArrowDown}`/`{ArrowLeft}`/`{ArrowRight}`,
`{Home}`, `{End}`. A `keyboardNav` entry naming no key (e.g. Menu's "handled by the consumer's trigger")
needs no test.

## Consequences

- **Positive:** status means the same thing for everyone and can't drift from reality — a component that
  regresses (a dark-mode contrast break, a failing keyboard test) drops back to draft on the next run.
- **Positive:** accessibility is measured, in both themes, in a real browser — not assumed.
- **Negative:** on adoption almost every component dropped to draft (29 of 30), mostly for missing
  keyboard tests and evals; those are real gaps being closed, not a regression.
- **Negative:** needs a running Storybook and a Playwright Chromium (`npx playwright install chromium`),
  so it can't run in the pre-commit hook.
