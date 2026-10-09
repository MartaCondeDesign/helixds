# External benchmark: open-design-system-bench

Results from [open-design-system-bench](https://github.com/christophhdesign/open-design-system-bench), an
outside tool, kept here so they survive. They are **not** Helix's own evals (`pnpm eval:*`) and do not
feed Storybook → Data → Metrics (that page reads `quality/dashboard.json`).

`systems.config.json` is the config the bench ran with (paths replaced by placeholders).

## Static audit (`audit/`) — free, no LLM

| | AI-Readiness | Notes |
|---|---|---|
| `2026-10-09-1-before.txt` | 62.6 (Invested) | `helix-lint-dashboard-charts` @ `c6907d2` |
| `2026-10-09-2-after.txt` | 71.3 (AI-native) | + CHANGELOG.md, var() token chains, `.agents/skills` (`88d9ef3`) |

## Agent runs (`runs/`) — Claude Code headless, Haiku, `skill` context, 1 rep, no judge

| Run | confirm-account-deletion | form-validation-errors | Cost (API-equivalent) |
|---|---|---|---|
| `20261009-121727-helix-haiku-2tasks` (before `use-helix`) | 48 · fail | 86 · fail | $0.24 |
| `20261009-122923-helix-haiku-2tasks-use-helix` | 100 · pass | 84 · fail | $0.21 |

Before: the agent never opened a component's props and guessed (`<Button label>`, `<Select>` with
`<option>` children, `PageHeader title`, no `label` on `Input`, raw `padding: '2rem'`). After adding the
`use-helix` skill and the rule at the top of `AGENTS.md`, it loaded the skill in both tasks and invented no
props; the one remaining failure was `style` on `Card` (Helix components take no `style`), since added to
the skill.

Per cell: `grades.json` (scores and every finding), `diff.patch` and `files/src` (the code the agent
wrote), `transcript.jsonl` (every tool call). `report.html` is the bench's own report. The generated
workspaces (copies of Helix docs and skills) were not kept.

Small sample — 2 tasks, 1 rep, the smallest model: a direction, not a score to quote.
