# Helix DS — Vibe Tests / Evals

Measures whether an AI agent can use Helix DS correctly.

## What we test

1. **Component selection** — does the agent pick the correct Helix component?
2. **Prop vocabulary** — does the agent use canonical prop names?
3. **Token usage** — does the agent use `--helix-*` tokens, not hardcoded values?
4. **No invention** — does the agent hallucinate components or props that don't exist?

## Running evals

No paid API, no billing setup — nothing here costs money beyond usage you already have:

```bash
pnpm eval:run                          # score every prompt's own reference code (harness self-check)
pnpm eval:run --prompt button-basic    # just one prompt
pnpm eval:run --prompt button-basic --input path/to/code.tsx   # score code you generated
                                                                 # elsewhere (another tool, a manual
                                                                 # chat session) against that prompt
pnpm eval:generate                     # auto: ask the Claude Code CLI (`claude -p`) to solve each
                                        # prompt, then score the answer — see below
pnpm eval:generate --prompt button-basic --model sonnet
pnpm eval:report                       # summarize past runs from evals/outputs/
```

Results go to `evals/outputs/` (gitignored) as one JSON file per run.

### `eval:generate` — automatic, no separate API key

Shells out to the `claude` CLI already installed on your machine (`claude -p "<prompt>"`), so it runs
under your existing Claude Code session/plan — not a pay-per-token API key. Mutating tools (`Edit`,
`Write`, `NotebookEdit`, `Bash`, `Agent`, `Artifact`) are disallowed on that sub-invocation, so it can
only answer with code, never touch files in this repo. The candidate code is saved to
`evals/outputs/candidates/<id>.tsx` and scored the same way as everything else here.

This is real usage of your Claude Code plan, not literally free — each prompt is a full agent turn,
same cost as asking me directly. `eval:run --input` (manual copy-paste) has zero marginal cost;
`eval:generate` trades that for not having to copy-paste yourself.

To actually test whether an agent uses Helix correctly by hand: open `evals/prompts/button-basic.md`,
copy the `# Prompt` text into a chat with the agent you want to check, save its answer to a file,
then run `pnpm eval:run --prompt button-basic --input <that file>`.

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

A prompt scores low → check which criteria failed → add a memory entry to
`.ai/memory/agnostic-lessons.md` with the correction → re-run.

The vibe-test score is a leading indicator of DS quality: if agents can't use it correctly,
developers probably can't either.
