# Contributing to Helix DS — AI Context

> This directory is for people building Helix itself.
> If you're using Helix in your app, read `AGENTS.md` instead.

## Before starting any work

1. Read `CLAUDE.md` (root)
2. Read the ADR that governs what you're touching: `docs/ADR/`
3. Run `pnpm verify:contract && pnpm verify:props && pnpm typecheck` — baseline must be clean

## The explore → report → decide → build pipeline

```
explore   Read the codebase. Understand what exists. Don't change anything.
report    Summarize what you found. Propose a plan.
decide    Create or update an ADR in docs/ADR/ if the decision is structural.
build     Implement. Reference the ADR. Run CI.
```

Never go straight from `explore` to `build`.

## Component contribution workflow

Use the `component-builder` agent: `helix-component-builder <ComponentName>`.
Or follow the `ds-component-creator` skill manually: `.ai/skills/ds-component-creator.md`.

## Token contribution

1. Edit `packages/tokens/src/tokens.json` (DTCG format)
2. Run `pnpm --filter @helixds/tokens build` → regenerates `dist/helix.css` and `dist/index.ts`
3. Semantic alias tokens (color.fill.*) must reference primitive tokens, not raw values
4. Update `packages/tokens/CLAUDE.md` if a new token category is introduced

## Figma sync

Figma is **output from code**, never input to it.
After component implementation, run Figma Code Connect to sync.
Never paste Figma properties into a component contract — Figma prop names
must be translated to the Helix prop vocabulary first.

## CI gates (all must pass before PR)

```bash
pnpm verify:contract   # contract correctness
pnpm verify:props      # no anti-synonym prop names
pnpm typecheck         # TypeScript strict
pnpm lint              # ESLint
pnpm lint:ai           # .ai/ directory integrity
```

## What the agent should NOT do

- Create files outside the package they're contributing to without an ADR
- Add a dependency without noting it in the relevant package's CLAUDE.md
- Merge two files that are intentionally separate (e.g. component.schema.json and react-binding.schema.json)
- Change the token prefix (`--helix-`) — only via ds.config.json + a migration ADR
