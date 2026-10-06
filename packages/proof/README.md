# Proof

**See what the agents actually built.** Turns saved coding-agent answers into one shareable
`proof.html`: every answer rendered for real, screenshotted, checked for accessibility and laid out per
context level and rep next to its score — so an answer that scores 100 and renders nothing is visible
as such.

- **No agent runs, no tokens.** It only reads answers already on disk.
- **One file.** Data and screenshots are inlined — open it, email it, put it on any static host.
- **Design-system agnostic.** Nothing here knows about Helix; everything system-specific lives in
  `proof.config.mjs`. Helix's own config is at the repo root as a worked example.
- **Accessibility on what rendered.** axe (WCAG 2.2 A/AA) runs on every answer that renders.

Inspired by the UI gallery in
[open-design-system-bench](https://github.com/christophhdesign/open-design-system-bench) v1.3.

## Run it

```bash
pnpm proof                                 # in Helix — writes evals/proof/proof.html
pnpm proof --serve                         # …then opens it at http://localhost:6007
pnpm proof:serve                           # open the last one, no rebuild (--port to change it)

## Run evals from the page

Served (`--serve`), the page gets a **Run evals** button when the config has a `runner`: pick levels,
the task in view or all of them, and runs; it shows the answer count and estimated tokens from the
`plan` command, runs only when you confirm, streams the log, runs `after`, rebuilds and reloads. Proof
never knows how answers are generated — that's your `runner`:

```js
runner: {
  plan: ['my-evals', '--dry-run', '--json', '--levels', '{levels}', '--tasks', '{tasks}', '--runs', '{runs}'],
  run:  ['my-evals', '--levels', '{levels}', '--tasks', '{tasks}', '--runs', '{runs}'],
  after: [['my-report']],     // optional
  defaultRuns: 1,
},
```

`plan` prints JSON: `{ "answers": 12, "estTokens": 340000, "complete": true }` (`estTokens` null when
unknown). An answer with a `round` field belongs to a measurement round: per task × level only the latest
round is shown, so a new round replaces the old one on the page.
npx tsx src/cli.ts --config <path>         # anywhere else
  --task a,b                               # only these tasks
  --no-screenshots                         # scores and code only, no browser (seconds)
```

Needs Node ≥ 20 and Chromium for Playwright (`npx playwright install chromium`) — or an installed
Google Chrome, used as a fallback.

## Answer format

One JSON file per answer in the `outputs` folder. Only these fields are read:

| Field | Type | Meaning |
|---|---|---|
| `promptId` | string | The task — one picker entry in the gallery |
| `variant` | string | The context level (`bare`, `agents-md`, `skill`, `mcp`…) — one row per value. Answers without it are skipped |
| `rep` | number | Repetition number — one card per rep |
| `score` | number | 0–1 or 0–100 |
| `passed` | boolean | PASS / FAIL tag |
| `generatedCode` | string | The TSX module the agent wrote. Its default export, or its first capitalized function export, is rendered with no props |
| `model` | string? | Shown in the detail view |
| `usage.totalTokens` | number? | Tokens the answer cost — shown per card, per row and in total |

Whatever produces your answers — your own eval script, open-design-system-bench, a CI job — only needs
to write this shape.

## Config

`proof.config.mjs` (paths relative to it):

```js
export default {
  name: 'Acme',                                  // gallery title
  outputs: 'evals/outputs',                      // the answers
  out: 'evals/proof',                            // proof.html goes here
  app: 'apps/docs',                              // a folder that already renders your system: its
                                                 // node_modules has react, react-dom and your packages
  css: ['@acme/tokens/tokens.css', '@acme/ui/styles.css'],
  imports: ['react', 'react-dom', '@acme/ui', '@acme/icons'],   // anything else = build failed
  tasks: ['button-basic', 'card-basic'],         // optional: list every task, run or not
  defaultTask: 'button-basic',                   // optional: the task the page opens on
  vite: async ({ importFromApp }) => ({          // optional: plugins your CSS needs, aliases to source
    plugins: [(await importFromApp('@tailwindcss/vite')).default()],
  }),
  htmlAttributes: { 'data-theme': 'light' },     // optional, set on <html>
  variants: {                                    // optional: rows to show, in order (others are left out)
    bare: { label: 'bare', detail: 'No guidance' },
    'agents-md': { label: 'agents-md', detail: 'AGENTS.md only', command: 'my-evals --level agents-md --task {task}' },
  },                                             // command: shown on a row with no answers yet
  viewport: { width: 800, height: 520 },         // optional
};
```

## How it works

1. Reads every answer. One importing a package not in `imports` (an agent inventing
   `@acme/react`) is recorded as **Build failed** without compiling it.
2. Writes the rest into a throwaway Vite app inside `app/.proof/`, so their imports resolve
   exactly like in a real consumer, and serves it.
3. Opens each answer in headless Chromium, records **Render failed** (a missing import, a crash, nothing
   exported), runs axe on what rendered, crops the screenshot to what was painted, and deletes the
   throwaway app.
4. Writes `proof.html`: a task picker, a pass/fail filter, a size slider; click a card for the full
   screenshot and the code.

axe runs WCAG 2.2 A/AA rules on the rendered component; page-level rules (`region`, `landmark-one-main`,
`page-has-heading-one`, `bypass`) are off, since an answer is a component, not a page. Each card shows
its issue count, each row how many rendered answers are clean, the detail view the rules that failed.

Answers are rendered with **no props**. When a component that declares props crashes without them, it was
written to receive data from a parent — that's shown muted as **Needs props**, not as a failure. A crash
in a component that takes no props is a real **Render failed**. To avoid Needs props altogether, ask for a
ready-to-render component in the task prompt (e.g. "export a component that renders with no props,
including its example data").
