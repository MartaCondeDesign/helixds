# Helix DS — Trace Dataset Infrastructure

This directory (`evals/traces/`) collects real-world interaction and error traces from developer & AI agent executions, both from local runs and consumer application CI pipelines.

## Live hook traces (`hooks/`)

Besides the curated traces below, every time a Claude Code hook stops an agent — a lint block, a contract
denial, an owner-gate ask — `scripts/hook-trace.mjs` appends one line to `hooks/<YYYY-MM>.jsonl`, and a
`resolved` line when the agent's next write of a blocked file is clean. It records the hook, decision,
project, file, rule or component and session — never the code. Git-ignored (it stays on the machine);
`HELIX_TRACES=off` turns it off. Summarize with `pnpm eval:traces [--since YYYY-MM-DD] [--project <name>]`;
promote a pattern worth keeping to a curated `trace-*.json` here.

## Trace Schema

Each trace file (`trace-<id>.json`) follows this structure:

```json
{
  "id": "trace-unique-id",
  "timestamp": "ISO-8601 string",
  "source": "consumer-ci-failure | agent-execution | developer-interactive",
  "appName": "optional app name",
  "prompt": "The prompt or user task",
  "generatedCode": "Code written by the agent/developer",
  "errorDetails": ["List of lint, token, or contract errors"],
  "governanceAnalysis": {
    "canIt": true | false,
    "shouldIt": true | false,
    "mayIt": true | false,
    "violationCategory": "primitive-bypass | missing-custom-annotation | prop-map-anti-synonym | contract-mutation",
    "recommendedFix": "Clear fix recommendation"
  }
}
```

## Logging Traces Automatically

When a CI pipeline or local build fails in a consumer application:

```bash
pnpm eval:trace --prompt "Task description" --code "path/to/component.tsx" --error "Error message"
```

Traces are automatically saved to `evals/traces/` and evaluated during `pnpm eval:review --judge` to continuously improve Helix DS contracts and agent instructions (`AGENTS.md`).
