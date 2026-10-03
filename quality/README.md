# Quality improvement ledger

`changes.json` is a small, reviewable link between an observed problem and the change made to Helix.
Do not add raw agent conversations, customer data, or generated source code here. Summarise and anonymise
the evidence instead.

Create an entry with:

```bash
pnpm quality record --area Table --summary "Agents compress evidence tables" \
  --change "Added a full-width table pattern" --metric "table-layout failures" \
  --evidence "7 anonymised review observations" --status proposed
```

Then inspect the current evidence with `pnpm quality summary`, the weekly view with `pnpm quality weekly`,
or export a shareable report with `pnpm quality export`.

Refresh Storybook's **Data Analytics** page after new evals or quality changes:

```bash
pnpm quality snapshot
```

## Use from another design system

The report model is deliberately not tied to Helix. Export aggregate metrics from another repository into
the portable contract in `snapshot.schema.json`, then use this reporter with that file:

```bash
pnpm quality summary --input path/to/quality-snapshot.json
pnpm quality export --input path/to/quality-snapshot.json --output quality-report.html
```

The imported snapshot contains only totals, rates, check names and anonymised improvement records. The
other repository decides how to gather them: its own contracts, token linter, visual regression tests,
Figma integration or agent eval harness.
