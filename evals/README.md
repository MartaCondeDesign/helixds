# Helix DS — Vibe Tests / Evals

Measures whether an AI agent can use Helix DS correctly.

## What we test

1. **Component selection** — does the agent pick the correct Helix component?
2. **Prop vocabulary** — does the agent use canonical prop names?
3. **Token usage** — does the agent use `--helix-*` tokens, not hardcoded values?
4. **No invention** — does the agent hallucinate components or props that don't exist?
5. **Real screens** — `screen-*` prompts describe a product screen ("make sure nobody deletes their account
   by accident") and never name a component, prop or Helix detail: the agent has to find its way through
   the design system, as in [open-design-system-bench](bench/README.md).

Every answer, whatever the prompt, is also type-checked against Helix's real source and linted
(`scripts/eval-mechanical.ts`) — stored as the `doesnt-compile` and `invented-prop` global checks.

6. **Design quality** — what no parser can grade (hierarchy, copy, states): `screen-*` prompts carry a hidden
   `# Judge rubric`, and `pnpm eval:judge` has a separate model judge saved answers against it, blind to who
   wrote them (`scripts/eval-judge.ts`, haiku by default, one call per answer). It's an opinion, so it's
   calibrated too: `pnpm eval:calibrate --judge` — references must pass, deliberately badly designed answers
   (they compile and lint clean) must fail the items their flaw breaks.

## The eval loop

Built on the loop from Teresa Torres' *AI Evals: A Hands-On Guide for Product Teams*: an LLM doesn't give the
same answer twice, so one passing answer proves nothing — we measure **how often** the agent gets it right,
read what it got wrong, change one thing, and compare against a baseline.

| Step | Command |
|------|---------|
| 0. Check the evals themselves | `pnpm eval:run` — every prompt's reference answer must score 100%; `pnpm eval:calibrate` — every grader must catch a set of planted mistakes and flag no reference answer (both run in pre-commit) |
| 1. Collect a baseline | `pnpm eval:generate --runs 5` (variant `baseline` by default) |
| 2. Error analysis | `pnpm eval:review --variant baseline` → write it up in `evals/error-analysis.md` |
| 3. See error rates | `pnpm eval:report --variant baseline` |
| 4. Run an experiment | change one thing (prop-map, a contract, AGENTS.md…), then `pnpm eval:generate --runs 5 --variant <id> --note "<what changed>"` |
| 5. Compare | `pnpm eval:report --compare baseline <id>` |

No paid API, no billing setup: `eval:generate` shells out to the `claude` CLI you already have
(`claude -p`), under your Claude Code plan. It's real usage of that plan, though — each generation is a
full agent turn. 32 prompts × 5 runs = 160 turns. Use `--prompt a,b,c` to rerun only what you're working on.

### `eval:ladder` — the context ladder

`evals/ladder.json` lists the context levels every task is run at: bare, llms.txt, AGENTS.md, MCP,
lint loop — each the agent's *only* source of Helix knowledge, never stacked, so each one's effect is
measured alone — and the full repo, everything together. Every answer records the tokens it cost (`usage`).

**Measuring is manual.** Each measurement is a *round*: fresh answers for the levels and tasks you pick,
recorded in `evals/rounds.json` with date and commit. Start one from Proof's **Run evals** button (`eg`) —
it shows the answer count and estimated tokens before running — or from the terminal:

```bash
pnpm eval:ladder --round                                  # free dry run: answers and est. tokens
pnpm eval:ladder --round --prompt button-basic --runs 1 --yes   # one task, every level
pnpm eval:ladder --round --runs 1 --yes                   # every task, every level
pnpm eval:ladder                                          # without --round: only fill what's missing
```

A round is what you compare: Storybook → Data → Metrics → *Agent Context Ladder* charts pass rate per
level, round after round (after `pnpm quality snapshot`, which the button runs for you). Proof and
Storybook → Data → Eval Gallery show each task × level's latest round.

### `eval:generate`

```bash
pnpm eval:generate                                   # every prompt once, variant "baseline"
pnpm eval:generate --runs 5                          # each prompt 5 times → a pass RATE per prompt
pnpm eval:generate --prompt toast-basic,chip-basic --runs 5
pnpm eval:generate --runs 5 --variant toast-docs --note "Toast mount rule moved to the top of AGENTS.md" \
                   --hypothesis "agents miss <Toast /> because the rule is buried"
pnpm eval:generate --model sonnet                    # change the model (another experiment lever)
pnpm eval:generate --context none --isolated         # no Helix guide and no access to this repo
pnpm eval:generate --context llms.txt --isolated     # only llms.txt as the guide
pnpm eval:generate --concurrency 5                   # parallel generations (default 3)
```

- `--variant` names the experiment. A new name must come with `--note`; it's recorded in
  `evals/experiments.json` with the git commit, so you can always see what each variant tested.
- `--context` picks the guide the agent gets as its system prompt (default `AGENTS.md`).
- `--isolated` runs `claude` from an empty temp dir so it can't read CLAUDE.md, contracts or `.ai/` from
  this repo. Without it (the default, how every earlier run was made) the agent can also browse the repo.
- Mutating tools (`Edit`, `Write`, `NotebookEdit`, `Bash`, `Agent`, `Artifact`) are disallowed on the
  sub-invocation, so it can only answer with code.
- Every generation is saved to `evals/outputs/` (gitignored) with its variant, model, commit, context,
  repetition and the code itself; the code also goes to `evals/outputs/candidates/<runId>/<prompt>-<rep>.tsx`.

### `eval:report`

```bash
pnpm eval:report                          # one line per variant: generations, pass rate, avg score
pnpm eval:report --variant baseline       # per-prompt pass rates, errors by category, global checks
pnpm eval:report --compare baseline toast-docs   # per prompt, per error category, per global check
pnpm eval:report --stored                 # use the score saved at run time instead of re-scoring
```

- **Self-tests are excluded.** They check the eval, not the design system; the report prints them as a
  single "Eval health" line.
- **Every run is re-scored from its stored code with the current criteria.** That way, fixing a badly
  phrased criterion also fixes old runs. When the old and new scoring differ, the overview says so.
- **Runs from before this existed** show up as variant `legacy` (`eval:generate`) and `legacy-manual`
  (`eval:run --input`). Their commit is inferred from the date, and they have 1 run per prompt.
- **Errors by category** groups every failed criterion (anti-synonym, invented-or-bypassed,
  hardcoded-value, wrong-import, wrong-slot-or-composition…) and counts how often each happened.
- **Global checks** are code assertions run on every generation, taken from AGENTS.md's "don't" rules:
  hardcoded colors/px, inline `style`, raw `<IconXxx>`, `icon={<…/>}`, `onClick`, `<div>`, native
  controls. They're reported as their own rates and never change a prompt's score. Add one in
  `GLOBAL_CHECKS` (`scripts/eval-lib.ts`).

### `eval:review`

```bash
pnpm eval:review --variant baseline                  # every failing generation + the code it wrote
pnpm eval:review --variant baseline --prompt toast-basic --no-code
```

This is the error-analysis step: read the answers before fixing anything, and log what you see in
`evals/error-analysis.md` (annotate → categorize → prioritize → experiments).

### `eval:run` — scoring by hand

```bash
pnpm eval:run                          # self-check every prompt's reference answer (not saved; --save to keep)
pnpm eval:run --prompt button-basic --input path/to/code.tsx [--variant cursor]
```

Use `--input` to score an answer you got from another tool or a manual chat: copy the `# Prompt` text,
save the agent's answer to a file, and score it. It's saved under `--variant` (default `manual`), so it
counts in `eval:report`.

### Guided vs unguided prompts

Most prompts say "using Helix DS" and many name the component. `*-unguided` prompts (category
`component-selection-unguided`) share their `*-basic` twin's criteria but describe only the need, the way
a real user would. Comparing the two pass rates shows how much the agent depends on being told which
component to use.

## Prompt format

Each prompt in `evals/prompts/*.md` has:
- `# Prompt` — the task to give the agent
- `# Success criteria` — a checklist of what the output must contain to pass
- `# Escape hatches (partial credit)` — legitimate but non-ideal outputs, informational only
- `# Invalid patterns (auto-fail)` — patterns that fail the run regardless of the rest
- `# Expected output shape` — reference code, scored by default when no `--input` is given

## How scoring works

Scoring is pattern-based: each checklist line's backtick-quoted code spans (e.g. `` `variant="primary"` ``)
are checked for presence/absence in the code being scored. `(not `x`)` and `Does NOT ... — uses `y` instead`
phrasing are parsed as "forbidden" vs. "required" spans. Any invalid pattern triggering forces the
run's score to 0.

**Limitations:**
- A line with no backtick-quoted code span can't be checked mechanically. It's reported as
  `➖` (unchecked) and excluded from the score — it needs manual review.
- Bare-identifier spans (`label`, `error`) are matched as whole words, so they won't false-positive
  on a substring of an unrelated identifier (`errorMessage`). But a bare identifier still matches
  *any* whole-word usage, not specifically "used as a prop" — if you mean the latter, write the
  span as `propName=` (see `form-layout.md`'s `` `isLoading=` `` for the pattern to follow) rather
  than a bare `` `propName` ``.

Run `pnpm eval:run` after adding or editing a prompt — if its own reference code doesn't score
100%, the criteria are phrased ambiguously and need fixing before trusting it against real output.

**Authoring gotcha:** only wrap a span in backticks if you want its presence/absence checked. A line
like `` `hasError` — anti-synonym for `invalid` `` puts *two* spans in play with no negation cue the
parser recognizes, so `invalid` — the correct prop, which will legitimately appear in the reference
code — gets treated as another forbidden pattern and false-fails. Either wrap the negation in
`(not `x`)`, or leave the correct/canonical name out of backticks entirely.

## Interpreting results

A prompt passes 2/5 → `eval:review` it → log the pattern in `evals/error-analysis.md` → form a hypothesis
→ change one thing → rerun it as a new `--variant` → `eval:report --compare`. Keep the change only if it
helps without making other prompts worse. Then add the lesson to `.ai/memory/agnostic-lessons.md`.

The vibe-test score is a leading indicator of DS quality: if agents can't use it correctly,
developers probably can't either.
