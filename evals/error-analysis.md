# Error analysis log

Step 1 of the eval loop: **look at what the agent actually wrote** before fixing anything.
Fill this from `pnpm eval:review --variant <id>`. Annotate first, then categorize, then prioritize —
don't fix while annotating, or you'll fix minor errors before finding the big ones.

## 1. Annotate — one line per failing generation

| Variant | Prompt | Run | What went wrong (in your own words) |
|---------|--------|-----|-------------------------------------|
|         |        |     |                                     |

## 2. Categorize — group the annotations

| Category | Count | Example | Already measured by a criterion / global check? |
|----------|-------|---------|-------------------------------------------------|
|          |       |         |                                                 |

An error that isn't measured yet needs an eval: prefer a **code assertion** (a backtick span in the prompt's
criteria, or a new entry in `GLOBAL_CHECKS` in `scripts/eval-lib.ts`). Only reach for an LLM judge when
spotting the error truly needs judgment.

## 3. Prioritize — which errors matter for someone building with Helix?

1.
2.
3.

## 4. Experiments

| Variant | Hypothesis | What changed (files) | Result vs baseline |
|---------|------------|----------------------|--------------------|
|         |            |                      |                    |
