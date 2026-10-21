<div align="center">

# ⚡ Helix DS

**The design system an AI agent can use without guessing.**

Explicit per-component contracts, script-verified tokens, and a canonical prop vocabulary — built so humans *and* agents generate the same consistent UI on the first try.

<!-- helix:badge-components:start -->
![Components](https://img.shields.io/badge/components-33-6366f1)
<!-- helix:badge-components:end -->
![Node](https://img.shields.io/badge/node-%3E%3D20-339933?logo=node.js&logoColor=white)
![React](https://img.shields.io/badge/react-19-61DAFB?logo=react&logoColor=white)
![Tailwind](https://img.shields.io/badge/tailwind-v4-38BDF8?logo=tailwindcss&logoColor=white)
![TypeScript](https://img.shields.io/badge/typescript-strict-3178C6?logo=typescript&logoColor=white)
![AI-ready](https://img.shields.io/badge/AI--ready-contracts%20%2B%20evals-000000)
[![License: MIT](https://img.shields.io/badge/license-MIT-yellow.svg)](LICENSE)

<br>

<img src="docs/assets/dashboard-hero.png" alt="A dashboard built entirely from Helix components — StatCard, Table, Badge, Switch" width="820">

<sub>Everything in this screenshot is Helix: <code>AppShell</code>, <code>SideNav</code>, <code>StatCard</code>, <code>Table</code>, <code>Badge</code>, <code>Switch</code> — zero hand-written layout <code>&lt;div&gt;</code>s.</sub>

<br><br>

**[Storybook](https://martacondedesign.github.io/helixds/)** · **[Figma](https://www.figma.com/community/file/1694774234251657372/ai-ready-design-system-helix)** · **[Getting started](docs/getting-started.md)** · **[Contributing](CONTRIBUTING.md)**

</div>

---

## What this is

Helix is a design system built directly on **native HTML elements** — no primitive kit underneath — plus Tailwind CSS v4 and Tabler Icons. [Why, in ADR-001](docs/ADR/ADR-001-primitive-foundation.md). Every component ships with:

- A **contract** (`contracts/components/{Name}.json`) that defines props, variants, and rules before a single line of implementation exists.
- **Tokens** in DTCG format (`--helix-*`), automatically checked against WCAG AA contrast and semantic naming.
- **Evals**: real code-generation prompts run against an LLM, to verify the system itself is interpretable by an agent — not just by a person reading Storybook.

## Getting started

Requires React 19 and Tailwind CSS v4 in your app.

```bash
npm install @helixds/react @helixds/tokens @tabler/icons-react
```

```css
/* the CSS file Tailwind processes — replaces @import "tailwindcss"; */
@import "@helixds/react/globals.css";
```

```tsx
import { Button } from '@helixds/react';

<Button variant="primary" onClick={save}>Save</Button>
```

Dark mode follows the operating system, or set `data-theme="dark"` / `"light"` on `<html>`. The full guide —
setup, dark mode, lint — is [docs/getting-started.md](docs/getting-started.md); every component is in the
[Storybook](https://martacondedesign.github.io/helixds/).

### Using it with an AI agent

Copy `node_modules/@helixds/react/AGENTS.md` to your project root, and connect the Helix MCP server so the
agent reads contracts and validates its code instead of guessing props:

```json
{ "mcpServers": { "helix": { "command": "npx", "args": ["-y", "@helixds/mcp"] } } }
```

For the full guardrails (hooks that make the agent read a contract before writing, lint after writing and ask
before patching Helix), run `pnpm setup:ai <path-to-your-app>` from a clone of this repo. Claude Code, Cursor,
Codex and Gemini CLI are supported — details in [AGENTS.md](AGENTS.md).

### Working on Helix itself

```bash
git clone https://github.com/MartaCondeDesign/helixds.git
cd helixds
pnpm install
pnpm sb          # Storybook → http://localhost:6006
```

Then read [CONTRIBUTING.md](CONTRIBUTING.md).

## Everything it includes

| | |
|---|---|
| 🧩 **<!--helix:count-->33<!--/helix:count--> components** | <!--helix:core-count-->29<!--/helix:core-count--> content components (Button, Input, Select, Badge, Checkbox, Chip, RadioGroup, Switch, Textarea, Card, Avatar, IconButton, Table...) + <!--helix:layout-count-->4<!--/helix:layout-count--> layout components (AppShell, PageHeader, SideNav, TopBar) |
| 🎨 **DTCG tokens** | `tokens.json` → CSS variables + TS constants, with documented, audited exceptions (`pnpm docs:token-exceptions`) |
| 📐 **No-`<div>` layout** | Every page composition goes through a layout component — never hand-written `display:flex` |
| 📄 **Contract before code** | Every new component starts as a `.json` in `contracts/`; Figma is reference only, the contract wins |
| ♿ **Verified contrast** | Every text/icon-on-fill color pair is checked against WCAG 2.2 AA, in both light and dark |
| 🤖 **AI-ready by default** | `AGENTS.md`, `llms.txt`, contracts, and `.ai/maps/` — an agent can generate correct UI without exploring the codebase first |
| ✅ **Script-verified, not eyeballed** | `verify:contract`, `verify:props`, `verify:tokens`, `verify:icons` run locally before anything is considered done |

## Component status

<div align="center">

<img src="docs/assets/status-page.png" alt="Storybook's Status page — a doneness matrix for every component, generated from contracts/manifest.json" width="820">

</div>

<sub>This table is Storybook's <code>Status</code> page (`pnpm sb`), rendered straight from `contracts/manifest.json`. Every ✓ is a real check — contract exists, exported, documented, typed, has a story, a11y complete, modeled in Figma — not someone's opinion of "done."</sub>

## Commands (for working on Helix itself)

```bash
pnpm install
pnpm sb                    # Storybook → http://localhost:6006
pnpm contract <Name>        # scaffold a new component contract
pnpm verify:contract        # validate contracts vs implementation
pnpm verify:props           # prop names vs .ai/maps/prop-map.md
pnpm verify:tokens          # token naming
pnpm verify:icons           # every Tabler icon goes through the Icon component
pnpm token:add              # add a new token
pnpm docs:manifest          # regenerate contracts/manifest.json
pnpm docs:changelog         # regenerate the changelog shown in Storybook
pnpm eval:run               # LLM code-generation evals
```

## Repo structure

- **`packages/tokens`** — DTCG tokens compiled to CSS and TS. [ADR-002](docs/ADR/ADR-002-token-strategy.md)
- **`packages/core`** — the <!--helix:count-->33<!--/helix:count--> React components.
- **`packages/storybook-addon-tokens`** — Storybook addon for inspecting tokens.
- **`apps/storybook`** — stories per component and per pattern.
- **`contracts/`** — one `.json` per component; `manifest.json` is the generated index of all of them.
- **`.ai/`** — prop vocabulary, design patterns, and skills for agents (Figma, tokens, icons).
- **`docs/ADR/`** — architecture decisions.
- **`evals/`** — prompts and outputs from automated evaluation.
- **`llms.txt`** — index for an LLM to load system context quickly.

## Critical rules (summary)

1. Never `<div>` for layout — use the components in `packages/core/src/layout/`.
2. Never render a Tabler icon directly — always go through the `Icon` component.
3. Color and border-radius: always a `--helix-*` token, no exceptions.
4. New UI with no native HTML equivalent → needs an ADR before implementation.
5. Canonical prop vocabulary lives in `.ai/maps/prop-map.md`; synonyms aren't allowed.
6. New component → contract first, at `contracts/components/{Name}.json`, then the code.

Full detail in [CLAUDE.md](CLAUDE.md).

## Contributing

Issues and pull requests are welcome — start with [CONTRIBUTING.md](CONTRIBUTING.md) (proposals for tokens and components go through an issue first). Agents working on Helix itself read [contributor-ai/CONTRIBUTOR.md](contributor-ai/CONTRIBUTOR.md). Everyone follows the [Code of Conduct](CODE_OF_CONDUCT.md).

## Security

Found a vulnerability? Please don't open a public issue — see [SECURITY.md](SECURITY.md) for how to report it privately.

## License

MIT — see [LICENSE](LICENSE) for details.

---

<div align="center">

Built by **[Marta Conde](https://martaconde.com)** — [LinkedIn](https://www.linkedin.com/in/martacondedesign/) · [YouTube](https://www.youtube.com/@martacondedesign) · [martaconde.com](https://martaconde.com)

</div>

<!-- Component counts above (marked with helix:* comments) are generated by `pnpm docs:readme` from contracts/manifest.json — don't hand-edit the numbers, edit the surrounding prose freely. -->

