# Helix DS — Agent Contract

Helix is an AI-ready design system built on native HTML elements, Tailwind CSS v4, and Tabler Icons.
Scope: `@helixds`. Token prefix: `--helix-`. Data prefix: `data-helix-`.

## Stack

| Layer     | Choice                              |
|-----------|-------------------------------------|
| Base      | Native HTML elements + hand-written WAI-ARIA (see [ADR-001](docs/ADR/ADR-001-primitive-foundation.md)) |
| Styling   | Tailwind CSS v4 — config in CSS     |
| Icons     | @tabler/icons-react                 |
| Tokens    | DTCG JSON → CSS vars + Tailwind @theme |
| Runtime   | React 19, TypeScript strict         |
| Monorepo  | pnpm workspaces                     |

## Critical rules

1. **Never add `<div>` for layout** — use the layout components in `packages/core/src/layout/`.
2. **Never render a Tabler icon directly — always go through the `Icon` component**
   (`packages/core/src/components/Icon/`, contract: `contracts/components/Icon.json`).
   `<IconPlus size={16} stroke={1.5} />` re-implements sizing/stroke/color/aria at every call site and
   drifts (that's exactly what happened before this rule existed — several components silently
   diverged from the contract's own "always 16px" wording). Every component that renders an icon —
   new or existing — must go through it instead: `<Icon icon={IconPlus} size={16} />`.
   - Component `icon`/`iconEnd` props take the Tabler icon **component reference**, not a
     pre-instantiated element: `icon?: TablerIcon`, not `icon?: React.ReactElement`. Consumers pass
     `icon={IconPlus}`, never `icon={<IconPlus size={16} />}`.
   - **Never pass `stroke` to change how heavy an icon looks** — `Icon` derives it from `size` via
     the stroke rule ([ADR-017](docs/ADR/ADR-017-icon-stroke-rule.md), `Icon/iconStroke.ts`). To
     re-weight icons, edit `ICON_STROKE_PX_BY_SIZE` (real on-screen px per size), not call sites.
   - `pnpm verify:icons` scans `packages/**/*.tsx` for a raw `<IconXxx>` JSX tag outside
     `packages/core/src/components/Icon/` (the one legitimate place it renders one) and reports any
     violation — run it after adding or touching a component with an icon.
3. **Token policy — not a blanket rule, has real exceptions:**
   - **Color:** always a `--helix-*` token. No exceptions. Also must pass WCAG AA contrast against its
     paired fill — see rule 9 below.
   - **Border-radius:** always a `--helix-*` token. No exceptions.
   - **Spacing/padding:** always a token, **except** values above `128px` (`primitive.spacing.32`,
     the top of the scale) — those have no token and are legitimately hardcoded px.
     **An off-scale distance (6px, 10px…) is never hardcoded:** split it into scale tokens across nested
     boxes — e.g. Badge's 6px side padding = 4px on the root (`spacing-2xs`) + 2px on an inner
     `badge-content` wrapper (`spacing-3xs`); Chip's 6px icon gap = 4px gap + 2px padding on `chip-icon`.
     Same structure in Figma: a nested auto-layout with each part bound to its spacing variable.
   - **Groups:** elements of the same kind one after another (buttons, icon buttons, chips, badges) are
     `var(--helix-spacing-2xs)` (4px) apart — wider only between different groups. See
     `.ai/maps/patterns/group-spacing.md`.
   - **Component height:** driven by the shared size scale (see ADR-004) — but documented
     per-component exceptions exist (`Badge`, `Chip` use a local density model, not the control ladder).
   - **min-width / max-width / min-height / max-height:** variable, not tokenized — a per-component
     characteristic decided by the consumer, the component, or the pattern in use (e.g. Modal's
     `min-height: 400px`). There is no system token for this — a hardcoded px value here is correct,
     not a violation (see `Button.json`'s `sizing.width` note).
   - **Shadow:** reserved for surfaces that visually float above other content — Dialog, Tooltip,
     Popover, Menu (see [ADR-005](docs/ADR/ADR-005-elevation-policy.md)). Never use shadow on inline
     content groupings like `Card` (and anything composed from it, e.g. the StatCard metric-card
     pattern) — Helix is a flat design; a `box-shadow` there reads as
     "this floats" when it doesn't. `component.input.shadow.focus` is a different concept (a focus-ring
     glow) and isn't covered by this rule.

   - **Show/hide parts:** an optional part that only appears/disappears (icon, iconEnd, dismiss ×…) is a
     boolean prop that carries its own spacing — toggling it never changes the container's paddings — and a
     BOOLEAN property in Figma, not a VARIANT (`.ai/maps/patterns/show-hide-parts.md`).
   - **Border always:** a component with a border has it in every variant and state, same width — states
     change only its color (`.ai/maps/patterns/border-always.md`), in code and in Figma.

   Token names live in `.ai/maps/prop-map.md`.
4. **Component hierarchy** — Helix core wraps a native HTML element directly (`<button>`, `<select>`, `<input>`, ...) and adds ARIA by hand where the native element doesn't already cover it. Components with **no native equivalent** (Dialog, Popover, Menu, Combobox, Tooltip, ...) need their own ADR and an explicit primitive choice before implementation — see [ADR-001](docs/ADR/ADR-001-primitive-foundation.md).
5. **Prop vocabulary** — canonical names in `.ai/maps/prop-map.md`. Anti-synonyms are invalid.
6. **New component requires a contract** — create `contracts/components/{Name}.json` first, then the
   implementation, then run `pnpm docs:manifest` (see below) so `contracts/manifest.json` picks it up.
   Building it also means creating everything the stability criteria check ([ADR-018](docs/ADR/ADR-018-stability-criteria.md)):
   a story per variant, size and authored state; a keyboard `play` test per key in `a11y.keyboardNav`;
   `<MotionConfig reducedMotion="user">` around any Motion animation; an eval prompt. Then run
   `pnpm verify:stable` (Storybook running).
6b. **Status is computed, never hand-edited** ([ADR-018](docs/ADR/ADR-018-stability-criteria.md)) —
   `pnpm verify:stable` sets it: **draft** = the component exists and works, but one of the 8 automatic
   criteria fails · **beta** = all 8 pass (contract, types, tokens, stories + axe, keyboard tests, AA
   contrast in light and dark, reduced motion, eval), not in Figma yet or out of date there · **stable** =
   beta + in Figma **and aligned with code**. Figma is the one manual step, done only when asked;
   `contracts/figma-sync.json` records it — set the entry's `syncedCommit` to the commit you synced against.
   The Figma column is three-state: ✓ aligned · ⚠ in Figma but tokens/CSS/props/anatomy changed since
   (`scripts/figma-drift.ts`) · ✗ not in Figma. Changing a stable component drops it to beta until Figma is updated.
   ✓ also requires a passing **Figma audit** recorded in `figma-sync.json` (`scripts/figma/audit-component.js`:
   every state, colors bound and matching code in light/dark, spacing bound, no spacer nodes, border always) —
   see `.ai/skills/components-to-figma.md` → "Non-negotiable rules" and Phase 6.
7. **Read the contract before touching a component** — the contract defines what the component IS.
8. **Figma is reference only** — Helix contracts always win over Figma output.
9. **Every new or edited text/icon color token must pass WCAG 2.2 AA color contrast** — 4.5:1 for normal
   text, 3:1 for large text (≥18px, or ≥14px bold) and non-text UI components (icons, focus rings, borders
   that convey meaning). This is not optional and not covered by "trust the semantic scale" — two roles at
   the same named step (e.g. `danger` vs `success`/`warning`/`info` all at primitive `.700`, `danger` at
   `.600`) can diverge in actual luminance. Check the specific text/fill (or icon/fill) pair you're adding,
   not just that both sides are tokens. Storybook's a11y addon has `color-contrast` enabled
   (`apps/storybook/.storybook/preview.ts`) and will catch this in the Accessibility panel — but don't rely
   on noticing it there after the fact; compute or verify contrast before considering a color-token change
   done, the same way `pnpm verify:tokens`/`pnpm docs:token-exceptions` are run before considering a token
   change done. This applies to **both** light and dark mode independently — a pair fixed in one theme is
   not guaranteed to pass in the other (dark mode's `darkOverrides` map in `packages/tokens/src/build.ts`
   picks its own values per token; check each theme's actual resolved pair, don't assume symmetry).
10. **Status icons use `--helix-color-icon-*`, never `--helix-color-text-*`** — the two diverge in dark
   mode on purpose: `text-{info,success,warning,danger}` is a pale tone tuned for text on a colored tint
   (Badge, Chip), `icon-*` is the saturated tone for an icon on the plain page/surface (Toast, Status,
   trend arrows, validation icons). Coloring an icon with `text-danger` makes it read washed-out pink next
   to every other dark-mode error icon. Exception: an icon sitting *on a colored tint* matches its label's
   `text-*` tone (Badge's `badge-icon-*`, Chip's CSS).
11. **Alphabetical component order — Storybook and Figma match.** Components are listed alphabetically
   (English, case-insensitive) in Storybook's Components and Layout sections (`storySort` in
   `apps/storybook/.storybook/preview.tsx`) **and** as Figma pages: `Cover · - · Icons · - ·` every core
   component A→Z `· - ·` every layout component A→Z. A new component's Figma page is inserted at its
   alphabetical position, never appended at the end. Stories inside one component keep their file order.
12. **A Figma component page shows the component once.** The doc frame (title + description) has no fill
   (transparent) and is wide enough that its text is never clipped; the Propstar table holds only the real
   COMPONENT_SET — boolean properties are toggled in the properties panel, never expanded into columns of
   instance copies (they read as extra variants). Details: `.ai/skills/components-to-figma.md`, rules 6 and 9.
13. **Fixing a component never uses a hand-typed value — and the token is the owner's choice.** A fix only
   ever swaps in tokens that already exist in `tokens.json`. Before changing anything, present the candidate
   tokens (2–3 when there are), what each one does, and why one is the better option than the other — then
   wait for the design-system owner to pick. Never pick a token yourself, never write a raw px/hex/weight, and
   never create a new token without asking first. Enforced: `scripts/claude-owner-gate-hook.mjs` makes Claude Code
   ask the owner before any change to `tokens.json`, a contract or `prop-map.md` — when it asks, the options
   and your recommendation must already be in the conversation, so the owner approves a choice, not a surprise.
14. **Human review never counts in any score.** `a11y.humanReview` (and any other review by a person) is
   recorded and shown, but never averaged into a component's score, the Accessibility score, Design System
   Health or the stability status. Only automatic checks are scored.
15. **A new or changed component must pass every accessibility check (`pnpm a11y all {Name}`) before it's
   done.** If anything fails — when creating it, or when it's attached/published — say so plainly: which check,
   which story and element, why it fails (WCAG criterion), and the options to make it pass (per rule 13, with
   the tokens to choose from). Don't publish it silently as if it passed.

## Workflow commands

```
pnpm contract <Name>        scaffold a new component contract
pnpm verify:contract        validate a contract's own structure against component.schema.json + prop-map
                            (schema/naming only — does NOT read the implementation; see verify:types for that)
pnpm generate:types <Name>  scaffold {Name}.types.ts from an approved, props-filled contract
                            (--dry-run prints instead of writing; refuses to overwrite an existing file)
pnpm verify:stable          compute every component's status (draft/beta/stable) from the 8 criteria in
                            ADR-018 — needs Storybook running; --details lists what's missing
pnpm lint                   @helixds/eslint-plugin over apps/ — wrong import path, anti-synonym props/values,
                            raw colors, raw spacing, native controls (also live in the editor via eslint.config.mjs).
                            After editing prop-map.md, a contract, tokens.json or core's index.ts, run
                            `pnpm --filter @helixds/eslint-plugin build:data` (its tests fail while stale).
                            Claude Code runs it on every file it edits (.claude/settings.json →
                            scripts/claude-lint-hook.mjs) and gets the problems back to fix in the same turn
pnpm test:lint-hook         test that Claude Code lint hook
                            Before that, scripts/claude-contract-hook.mjs (PreToolUse) denies writing a file that
                            imports @helixds/react until every Helix component the change touches has had its contract read
                            this session (helix_get_contract, the contract/.types file, or `pnpm helix component`)
pnpm test:contract-hook     test that Claude Code contract hook
                            scripts/claude-owner-gate-hook.mjs (PreToolUse) stops any edit to tokens.json, a contract
                            or prop-map.md — by Edit/Write, `pnpm token:add`, `pnpm contract`, or a shell write — and
                            asks the design-system owner to approve it (rule 13 as a gate, not just a sentence)
pnpm test:owner-gate-hook   test that Claude Code owner-gate hook
pnpm setup:ai <app>         install Helix's agent context in an app: AGENTS.md, plus the MCP server (.mcp.json) and
                            the three hooks above (.claude/settings.json), run from this clone (${HELIX_DS_DIR:-path}).
                            In an app, the owner gate guards node_modules/@helixds and patches/ instead of tokens.json
pnpm test:setup-ai          test it end to end on throwaway apps
pnpm helix:mcp              @helixds/mcp — MCP server (stdio, registered in .mcp.json): helix_get_contract,
                            helix_search_tokens, helix_validate_snippet, helix_list_components,
                            helix_get_pattern. Same data as `pnpm helix` (scripts/helix-query-lib.ts)
pnpm helix tokens <concept> find tokens by what they're for ("danger background") — same search as the MCP tool
pnpm helix dashboard        AI-readiness view: health score, the 5 signals behind it (readiness, Figma,
                            eval pass rate, rule compliance, governance coverage), gaps and data freshness —
                            read-only; `pnpm quality snapshot` records it for Storybook's Metrics page
pnpm verify:types           check every contract's props are present in its {Name}.types.ts
                            (the actual contract-vs-implementation check, for prop types specifically)
pnpm verify:props           check prop names against prop-map
pnpm verify:icons           check every Tabler icon renders through the Icon component
pnpm helix scaffold:custom <Name> --reason "<why>" [--dir <path>]
                            scaffold a local [CUSTOM] component for a consuming app (governance header,
                            semantic tokens, accessible base, story with a play test) — refuses Helix names and overwrites
pnpm docs:token-exceptions  regenerate .ai/maps/component-token-exceptions.md from tokens.json
pnpm docs:figma-map         regenerate .ai/maps/figma-map.md — prop → Figma property map for every component (auto-runs in pre-commit)
pnpm docs:manifest          regenerate contracts/manifest.json — the single index of every component
pnpm docs:changelog         regenerate .ai/maps/changelog.json (git-ignored) from `git log`, shown in Storybook's Changelog page
pnpm docs:readme            sync component counts in README.md + the component lists in AGENTS.md and llms.txt
                            with contracts/manifest.json (auto-runs in pre-commit)
pnpm report:paints          CSS paint audit report
pnpm lint:ai                validate .ai/ directory structure
```

**Run `pnpm docs:token-exceptions` after every token or component change** — any time a token is added/edited
(`pnpm token:add` or a manual `tokens.json` edit) or a component's `component.*` tokens change, even if the
edit looks like it wouldn't affect the table. It's a generated file (see its own "do not hand-edit" section);
running the command is how it stays true, not an optional cleanup step. See `packages/tokens/CLAUDE.md` →
"Adding a token" step 8 for what counts as a real ✅ exception vs. a gap the table should keep surfacing.

**Run `pnpm docs:manifest` after adding/removing a component, contract, export, or story** —
`contracts/manifest.json` is the single consolidated index of every component (name, category, status,
contract/implementation/story paths, and what's actually exported from `packages/core/src/index.ts`),
generated from `contracts/components/*.json` cross-checked against the real index.ts exports and the
Storybook story files — never hand-edit it. Reach for it instead of globbing 20 contract files when you
need "what components exist and what state are they in" — it's also how a component/token/story change gets
checked for drift: a contract with no matching export, an export with no story, a missing `{Name}Props`
type, etc. all print as a `drift` entry the command surfaces directly, not something you have to notice
later in Storybook or a failed import. Treat a non-empty `drift` array the same way as a 🚩/🆕 row in
`component-token-exceptions.md` — a real gap to close, not a report to ignore.

`pnpm docs:readme` runs automatically in `.husky/pre-commit` (after `docs:token-exceptions`), so
README.md's component counts can't go stale in a commit — it only rewrites text wrapped in
`<!--helix:*-->` markers, never the surrounding prose. If it looks wrong after adding/removing a
component, run `pnpm docs:manifest` first — the README script trusts `contracts/manifest.json` as-is.

## Per-package context (load when working in that territory)

- `packages/tokens/CLAUDE.md`  — token pipeline, DTCG format, build steps
- `packages/core/CLAUDE.md`    — component anatomy, variant system, data-attributes, the `Icon` wrapper pattern
- `apps/storybook/CLAUDE.md`   — every story's title+description header rule, token-driven story pattern, Foundation structure

## Context files (read when task requires it)

- `.ai/maps/prop-map.md`               — canonical prop vocabulary + anti-synonyms
- `.ai/maps/patterns/`                 — design patterns (read the relevant .md before building that UI)
- `.ai/maps/component-token-exceptions.md` — every `component.*` token that skips `semantic.*` (primitive-direct
  or raw literal) + why. Update it whenever you add or edit a component token — see the file's own
  "Maintenance rule".
- `contracts/manifest.json`             — single generated index of every component (status, paths, real
  exports) — check here first when you need "what components exist" instead of globbing contracts.
- `.ai/maps/changelog.json`             — every commit, grouped by day, generated from `git log`, each
  tagged `major`/`minor`/`patch`/`other` by a **keyword heuristic** on the commit subject (this repo
  doesn't use conventional-commit prefixes, so there's no real semver signal to parse — treat the tag as a
  rough read, not authoritative; nothing here is published, so no real version number depends on it
  anyway). Rendered in Storybook's own "Changelog" page (`apps/storybook/stories/Changelog.stories.tsx`) —
  no separate CHANGELOG.md, no manual curation. **Not tracked by git** (it's derived from `git log`):
  rebuilt on `pnpm install`, when Storybook starts or builds, and by `.husky/post-commit` after every
  commit — which only rewrites the file, never commits. Never re-add a hook that commits it: that's what
  produced a "Regenerate changelog" commit after every real one (108 of the first 273).
- `contracts/component.schema.json`    — JSON schema for component contracts
- `contracts/token-naming.schema.json` — JSON schema for the semantic token key grammar
  (`{role}[-interactive][-modifier][-state]`) — validates key structure/vocabulary only, not the
  relative light/dark-vs-siblings judgment call that `scripts/verify-token-naming.ts` still owns
- `docs/ADR/`                          — architecture decisions (read the ADR governing what you're touching).
  **`docs/ADR/*.md` is the only home for ADRs — never surface them in Storybook** (no `Decisions/*.mdx`
  page, no sidebar entry). This was tried once and reverted per explicit direction; don't reintroduce it.
- `docs/ADR/ADR-004-size-standard.md`   — canonical size scale for interactive controls and fields
- `.ai/memory/agnostic-lessons.md`     — lessons from previous sessions
- `.ai/skills/components-to-figma.md`, `.ai/skills/tokens-to-figma.md`, `.ai/skills/icons-to-figma.md` —
  **read all three, in full, before touching Figma for any component work.** They're the actual process
  contract: variable collections must exist first (`tokens-to-figma`), then icons (`icons-to-figma`), then
  the component (`components-to-figma` — mandatory `combineAsVariants` into one COMPONENT_SET, anatomy layer
  names matching `data-helix-part`, Phase 2.5 auto-layout rules). Skipping this produced loose unfused
  components, clipped doc text, and broken text alignment across 10 components in one session before it was
  caught — see `contracts/figma-sync.json`'s `contractDiscoveredLate2026-08-24` note for the full story.

## Storybook

Stories live co-located with components in `packages/core/src/components/`. Pattern stories in `apps/storybook/stories/`.
Dev server: `pnpm --filter @helixds/storybook dev` (http://localhost:6006).

## What NOT to do

- Don't define colors in `:root` — tokens are defined in `packages/tokens/src/tokens.json`
- Don't import from `@helixds/tokens` using `..` relative paths from inside packages/core
- Don't write hover styles as JS props — use `data-*` attributes and CSS
- Don't list yourself as co-author on commits (no Co-Authored-By trailers)
