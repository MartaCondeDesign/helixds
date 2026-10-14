# Error analysis log

Step 1 of the eval loop: **look at what the agent actually wrote** before fixing anything.
Fill this from `pnpm eval:review --variant <id>` — and from `pnpm eval:traces`, what the Claude Code hooks
caught in real sessions (here and in apps set up with `pnpm setup:ai`). Annotate first, then categorize, then prioritize —
don't fix while annotating, or you'll fix minor errors before finding the big ones.

## 1. Annotate — one line per failing generation

| Variant | Prompt | Run | What went wrong (in your own words) |
|---------|--------|-----|-------------------------------------|
| baseline | chip-basic | #2, #3 | Picked `ChipGroup` (AGENTS.md says it's for "applied filters") and invented `dismissible`/`onDismiss` inside `options` — ChipGroupOption has neither |
| baseline | chip-basic | #1, #4, #5 | Passed, but laid the chips out with `<div style={{display:'flex'}}>` — there's no Helix layout primitive to use instead |
| baseline | select-unguided | #4, #5 | Chose `RadioGroup` for 3 countries — a valid choice; the eval wrongly demanded `Select` (fixed: now accepts either) |
| baseline | select-unguided | #2 | Used Select but built its own error text instead of `invalid` + `errorMessage` |
| baseline | toast-basic | #3 | Called `toast.success()` without mounting `<Toast />` — nothing would appear |
| agents-isolated | select-basic, chip-basic | all | Without repo access, invented Select's error props and Chip's dismiss props — AGENTS.md doesn't list per-component props |
| no-context | all | all | Without the guide, doesn't know the package name, uses `onClick` (34%), invents everything |

## 2. Categorize — group the annotations

| Category | Count | Example | Already measured by a criterion / global check? |
|----------|-------|---------|-------------------------------------------------|
| **Eval bug** — the criterion was wrong, not the agent | 2 | select-unguided + RadioGroup | Fixed (`(any of …)` syntax in the scorer) |
| **DS contradiction** — the guide points to a component that can't do the job | 2 | AGENTS.md: ChipGroup for "applied filters", but it can't remove chips | Now an invalid pattern in chip-basic |
| **DS gap** — no Helix way to do it | 3 | Row of chips needs a `<div>` | `raw-div` global check |
| **Missing docs outside the repo** — props only exist in contracts/ | 10 | Select `invalid`/`errorMessage` | anti-synonym criteria (agents-isolated) |
| **Real agent error** | 2 | Toast not mounted | toast-basic criterion |

An error that isn't measured yet needs an eval: prefer a **code assertion** (a backtick span in the prompt's
criteria, or a new entry in `GLOBAL_CHECKS` in `scripts/eval-lib.ts`). Only reach for an LLM judge when
spotting the error truly needs judgment.

## 3. Prioritize — which errors matter for someone building with Helix?

1. **Per-component props aren't reachable outside the repo.** agents-isolated drops to 57% (vs 80% in the repo). Anyone
   using Helix in their own app is in the isolated situation. Next experiment: add each component's props to AGENTS.md /
   llms.txt and rerun `--isolated`.
2. **Decide ChipGroup vs removable filters** — either ChipGroup gains dismissible options, or AGENTS.md stops
   recommending it for applied filters.
3. **No layout primitive** — consumers can't follow "never `<div>` for layout" (rule 1 in CLAUDE.md applies to Helix's
   own code; consumers have nothing to use instead).

## 4. Experiments

| Variant | Hypothesis | What changed (files) | Result vs baseline |
|---------|------------|----------------------|--------------------|
| agents-isolated | Repo access hides gaps in AGENTS.md | `--isolated` | 80% → 57%: Select 0/5, Chip 0/5 — confirmed |
| no-context | The guide is what makes it work | `--context none --isolated` | 57% → 0%: AGENTS.md is essential |
| chip-rule | "selectable label" in AGENTS.md causes `checked=` | AGENTS.md copy with Chip rule | 85% → 90% on 4 prompts; chip still 3/5 — hypothesis wrong, the real cause is ChipGroup (see above). Not applied. |
| guided vs unguided | Agents depend on being told the component | `*-unguided` prompts in baseline | Button 5/5 = 5/5, Select 4/5 = 4/5 — no dependence found |
