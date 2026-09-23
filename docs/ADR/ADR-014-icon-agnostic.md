# ADR-014 — Icon component accepts any icon set, not only Tabler

**Date:** 2026-09-14
**Status:** Accepted
**Deciders:** Helix DS team

## Context

`Icon` (`packages/core/src/components/Icon/`) is the single, mandatory wrapper every component
renders an icon through (root `CLAUDE.md` rule 2, `pnpm verify:icons`). Its prop was typed
`icon: TablerIcon`, imported directly from `@tabler/icons-react` — not just in `Icon.types.ts`,
but duplicated independently in every consumer's own type file: `Input`, `Chip`, `FAB`, `Button`,
`IconButton`, `NavItem`, `Badge` (both `Badge.types.ts` and `Badge.tsx`'s
`BADGE_ICON_BY_VARIANT`), and `Toast.tsx`'s `ICON_BY_VARIANT` — 10 files total referencing the
Tabler-specific type.

This works fine as long as every Helix consumer is happy shipping Tabler icons. It stops working
the moment a consumer's product already has its own icon set (brand-specific glyphs, a different
open-source set already in use elsewhere in their stack) — today there is no way to pass one
through `icon`/`iconEnd` without it satisfying Tabler's exact component shape, and no documented
path for sets that don't.

`Icon.tsx` itself was never actually Tabler-specific in behavior — it only ever reads `size`,
`stroke`, `color`, and `className` off whatever component reference it receives and forwards them
to the rendered element. The Tabler coupling lived entirely in the *type*, not the implementation.

## Decision

**`Icon`'s `icon`/`iconEnd` props are typed structurally, not by importing Tabler's type.** A new
`HelixIconComponent` type (`Icon.types.ts`) describes exactly the prop shape `Icon.tsx` consumes —
`size?`, `stroke?`, `color?`, plus standard `React.SVGProps<SVGSVGElement>` passthrough — with no
import from `@tabler/icons-react`. Every Tabler icon already satisfies this shape as-is, so no
existing usage changes. Tabler remains the **documented default set** (Storybook, `Icon.doc.ts`,
`contracts/components/Icon.json`'s `iconStyle`) — this is not a removal of Tabler, only a removal
of the hard type dependency on it.

**Sites that duplicated `TablerIcon` now import `HelixIconComponent` from `../Icon` instead.** All
10 files listed in Context were updated the same way: the import source changes, the field type
changes, nothing else. This also collapses what was 10 independent copies of the same constraint
into one canonical definition.

**A small adapter, `createIconAdapter`, covers icon sets with an incompatible prop dialect.**
Not every set speaks `size`/`stroke`/`color` — Lucide uses `strokeWidth`, some filled/solid sets
have no stroke concept at all. `Icon/createIconAdapter.ts` wraps a foreign icon component into
`HelixIconComponent` shape via a small prop-name mapping (`strokeProp`/`sizeProp`/`colorProp`,
`strokeProp: false` when the set has no stroke). A set that already matches the shape (most
outline icon libraries) needs no adapter at all — it's an escape hatch, not the primary path.

## Consequences

- **Positive:** a consumer can pass their own icon set through every Helix component's
  `icon`/`iconEnd` prop without forking `Icon.tsx` or any component that renders one.
- **Positive:** the Tabler-specific type constraint that used to live in 10 separate files now
  lives in exactly one (`Icon.types.ts`) — future icon-shape changes are a one-file edit, not a
  10-file hunt.
- **Neutral:** `pnpm verify:icons` is unaffected — it enforces that every icon renders *through*
  `Icon`, not what icon set is passed to it; that check already applied equally to any icon set.
- **Negative:** `createIconAdapter` only maps prop *names*, not deeper rendering differences (e.g.
  a set that renders multi-color icons, or one whose `size` prop expects a string like `'1em'`
  instead of a number) — those remain genuinely out of scope and would need a purpose-built
  wrapper, not this adapter.

## Contracts affected

Amended: `contracts/components/Icon.json` (`props[0].icon` description, new `interop` note).
