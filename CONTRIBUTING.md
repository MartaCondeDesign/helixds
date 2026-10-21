# Contributing to Helix DS

Thanks for wanting to help. Helix is a small, opinionated design system with a single maintainer, so
the process below is mostly about not wasting your time: agree on the *what* in an issue, then build
the *how* in a pull request.

> Working with an AI agent? Point it at [`CLAUDE.md`](CLAUDE.md) (for building Helix) or
> [`AGENTS.md`](AGENTS.md) (for using Helix in an app). [`contributor-ai/`](contributor-ai/) has the
> agent-side version of this guide.

## Before you write code

| You want to… | Start with |
|---|---|
| Fix a bug | A [bug report](../../issues/new?template=bug.yml), unless it's a one-line obvious fix |
| Add or change a token | A [token proposal](../../issues/new?template=token.yml) |
| Add a component | A [component proposal](../../issues/new?template=component.yml) |
| Change how something works across the system | An issue first; it may need an ADR in [`docs/ADR/`](docs/ADR/) |
| Fix a typo or docs | Go straight to a pull request |

**Tokens, contracts and the prop vocabulary are decided by the maintainer.** `packages/tokens/src/tokens.json`,
`contracts/` and `.ai/maps/prop-map.md` define what Helix *is*, so a change there is a design
decision, not a code change. A proposal that lists the options it considered (with their contrast in
light and dark, for colors) and recommends one gets decided fastest. [`CODEOWNERS`](.github/CODEOWNERS)
asks for that review automatically.

## Setup

Node ≥ 20 and pnpm 9 (`corepack enable` picks the version from `package.json`).

```bash
pnpm install
pnpm sb          # Storybook at http://localhost:6006
```

`pnpm install` also installs the git hooks (husky). The pre-commit hook runs the same checks as CI
and regenerates the derived files (token exceptions, Figma map, README counts…), so commit through it.

## The rules that matter most

Read [`CLAUDE.md`](CLAUDE.md) → "Critical rules" before your first change. The short version:

- **Contract first.** A component is defined by `contracts/components/{Name}.json`. Read it before
  touching the component; a new component starts with `pnpm contract <Name>`.
- **Tokens only.** Colors, radii and spacing are always `--helix-*` tokens. An off-scale distance is
  split into scale tokens across nested boxes, never hardcoded.
- **Native HTML + hand-written ARIA.** No primitive library underneath ([ADR-001](docs/ADR/ADR-001-primitive-foundation.md)).
- **Icons go through `<Icon>`**, never a raw `<IconXxx>` tag.
- **WCAG 2.2 AA in light *and* dark.** `pnpm a11y all <Name>` must pass for a new or changed component.
- **No layout `<div>`s** in app code: use the layout components.

`pnpm lint` and the `verify:*` scripts catch most of this; the Storybook Accessibility panel catches
the rest.

## Pull requests

1. Branch from `main`.
2. Keep it to one concern. A component fix and a token change are two PRs.
3. If the change reaches a published `@helixds/*` package, add a changeset: `pnpm changeset`
   ([`.changeset/README.md`](.changeset/README.md)). Stories, docs, scripts and CI need none.
4. Fill in the pull request template. Screenshots in light and dark help for anything visual.
5. CI ([`.github/workflows/ci.yml`](.github/workflows/ci.yml)) must be green.

## Releasing (maintainer)

Merging changesets into `main` opens a **Version Packages** pull request; merging that one publishes to
npm through Trusted Publishing, with provenance ([`.github/workflows/release.yml`](.github/workflows/release.yml),
[`scripts/release-publish.mjs`](scripts/release-publish.mjs)). All `@helixds/*` packages share one
version and stay `0.x` until the API is stable. `pnpm release:dry` shows what would be published.
The first release has its own steps: [`docs/launch-checklist.md`](docs/launch-checklist.md).

## Figma

The Figma library is generated **from** code and kept in sync by the maintainer
([`.ai/skills/components-to-figma.md`](.ai/skills/components-to-figma.md)). A contributor never needs
to touch Figma: a component reaches `beta` without it, and the maintainer takes it to `stable`
([ADR-018](docs/ADR/ADR-018-stability-criteria.md)).

The public file on [Figma Community](https://www.figma.com/community/file/1694774234251657372/ai-ready-design-system-helix)
is a published **copy** of the working file, not the file the sync scripts edit (both are in
`contracts/figma-sync.json`). After every Figma sync, the maintainer copies the changed pages to it and
publishes an update on Community, so the public file never falls behind the code.

## Conduct and security

Everyone taking part follows the [Code of Conduct](CODE_OF_CONDUCT.md). Security issues go through
[`SECURITY.md`](SECURITY.md), never a public issue.

By contributing you agree that your contribution is licensed under the project's [MIT License](LICENSE).
