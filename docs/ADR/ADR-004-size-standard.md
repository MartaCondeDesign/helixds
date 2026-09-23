# ADR-004 - Size standard for Helix components

**Date:** 2026-08-19
**Status:** Accepted

## Context

Component sizes drift if every new component invents its own `s`, `m`, and `l` meaning.
We want `m` to mean the same physical size wherever a component exposes that size.

## Decision

Helix uses a shared size standard by default. The standard is expressed as **tokens**, not as a table of
raw px tied to prop names — the tokens exist independently of any single component's `size` prop and can be
reused by future components without redefining a ladder each time:

- `primitive.size.{50,75,100,125,150,175,200,225,250,300,350}` — a generic scale, agnostic of any component
  (same role as `primitive.spacing`, kept as its own scale because "a control's own dimension" and "the gap
  around it" are different concerns even where the numbers happen to coincide). Keys are percentages of the
  `100` rung, which anchors to `16px` (`1rem`) — the same anchor `primitive.spacing` uses.
- `semantic.size.{xs,s,m,l,xl}` — aliases `primitive.size.{100,150,200,250,300}` respectively. This
  is what the tables below actually mean by "Control scale".

### Control scale

| Size | Token | Primitive | Height |
|------|-------|-----------|--------|
| `xs` | `semantic.size.xs` | `primitive.size.100` | `16px` |
| `s`  | `semantic.size.s`  | `primitive.size.150` | `24px` |
| `m`  | `semantic.size.m`  | `primitive.size.200` | `32px` |
| `l`  | `semantic.size.l`  | `primitive.size.250` | `40px` |
| `xl` | `semantic.size.xl` | `primitive.size.300` | `48px` |

A clean `+8px` progression — `m` lands exactly on `primitive.size.200`, the scale's own anchor point (see
"Choosing `m`" below).

Use this scale for button-like components: `Button`.

### Field scale

| Size | Token | Primitive | Height |
|------|-------|-----------|--------|
| `s` | `semantic.size.s` | `primitive.size.150` | `24px` |
| `m` | `semantic.size.m` | `primitive.size.200` | `32px` |
| `l` | `semantic.size.l` | `primitive.size.250` | `40px` |

Use this scale for form fields such as `Input`, `Select`, and `Textarea`. Same tokens as the Control
scale's `s`/`m`/`l` — one shared source, two components' worth of exposed rungs.

### Compact/status components

`Badge` and `Chip` are documented exceptions — interactive pills are **not** on the Control scale (the old
wording contradicted the exceptions table below by listing `Chip` under Control scale too).

Default rule:
- components use the global scale unless their contract explicitly defines a local exception
- `m` is the reference size for the majority of components
- exceptions must state their local mapping in the contract and component docs

`Badge` and `Chip` use a local density model instead of the control ladder — but their values still come
from the shared `primitive.size.*` scale, just not through `semantic.size`:

| Component | `size` meaning | Local height mapping |
|-----------|----------------|----------------------|
| `Badge`   | padding density | `xs = primitive.size.125` (20px), `s = primitive.size.150` (24px) |
| `Chip`    | padding density | `s = primitive.size.175` (28px), `m = primitive.size.200` (32px) |

`size` changes horizontal density; some exceptions also map size to local height steps.
This is a component-level exception, not a new global scale — but it's still a real token, never a raw
px value with nothing behind it.

**`Badge.s` (24px) and `Chip.m` (32px) happen to land on the exact same px as `semantic.size.s`/`.m`** —
`primitive.size.150`/`.200` are shared rungs, so the numbers coincide. This is NOT a documented exception —
`.ai/maps/component-token-exceptions.md` correctly flags both 🚩 (an existing token already has this exact
value), same as any other coincidental match anywhere else in the audit. It's flagged, not silently hidden
as ✅, precisely because re-pointing them is a real, live option: pro is one less primitive-direct alias;
con is coupling those 2 rungs to the Control scale while `Badge.xs`/`Chip.s` (20px/28px, no `semantic.size`
match at all) would stay primitive-aliased — a mixed-sourcing ladder, some rungs tracking Control-scale
changes and some not. Left un-acted-on as of 2026-08-23 for that reason, but it's an open 🚩 to revisit, not
a closed decision — don't add it to `KNOWN_EXCEPTIONS` to make it go away.

**One exception to that exception, added 2026-08-23:** `Chip`'s internal icon/label `gap` is `6px` at every
size, and stays an unreferenced literal — `component.chip.gap.{s,m}`, no `primitive.*` alias. `6px` doesn't
land on the `primitive.spacing.*`/`primitive.size.*` grid (both step in 4px multiples: `4`, `8`, `12`...) and
isn't meant to — it's a deliberately tighter density than either neighboring rung (`4px` reads too cramped
next to Chip's `12`/`16px` horizontal padding, `8px` reads too loose for a compact pill), not an
approximation of one. Adding a one-off `primitive.spacing.37`/`primitive.size.87` rung just to give this a
name would break the grid's own 4px rhythm for every other consumer, for a value only Chip uses — worse than
the literal it would replace. Reviewed and kept as-is; `.ai/maps/component-token-exceptions.md`'s audit
records this in `KNOWN_EXCEPTIONS` (tag `ADR`, pointing here) rather than flagging it as a gap.

**FAB, added 2026-09-09:** ships a single size (48px, `semantic.size.xl` — the Control scale's own `xl`
rung, previously defined but unwired to any component). `FAB`'s revealed speed-dial actions
(`component.fab.action.height`) are their own documented local exception at `36px`
(`primitive.size.225`) — a size between Control's `m` (32px) and `l` (40px) that exists specifically
because a speed-dial action reads as "smaller than the trigger" without needing a whole second control
scale for one component's secondary elements. Same category as Badge/Chip's density model above: a real,
traceable primitive alias, not a magic number.

## Rules

- Use the global scale by default.
- Exceptions must be explicit in the contract and docs, and must still alias `primitive.size.*` — a
  component-local value is allowed, an unreferenced px literal is not, **except** `Chip.gap` above, the one
  documented case where forcing a primitive alias would cost more (a grid-breaking rung) than it buys.
- `m` remains the reference size for standard components.
- Prefer the Button size ladder as the reference for new interactive components.

### Choosing `m` for a new component

Every component that exposes 2+ sizes MUST map one of them to `m` — a size ladder without an `m` rung
isn't valid. `m` is the default size whenever the component doesn't specify otherwise.

When scaffolding a new component, ask the user which of its sizes is the default before writing the
contract — don't assume. Whatever they answer, label that rung `m`.

If it isn't obvious from that answer which of the component's own literal size values should be `m`: pick
whichever is numerically closest to `32px` (`primitive.size.200`, the scale's own anchor rung — the Control
scale's `m` sits exactly on it, by design). Example: a component with two sizes measuring `40px` and `48px`
— `40` is closer to `32` than `48` is, so `40` becomes `m`.

## Consequences

- `Button` stays visually aligned to its own scale; `Input`/`Select`/`Textarea` stay aligned to each other
  and share Button's `s`/`m`/`l` tokens.
- Compact status components (`Badge`, `Chip`) can remain compact without polluting the shared control
  scale, while still being real, traceable tokens instead of magic numbers.
- New components always get an unambiguous `m` without re-litigating the scale from scratch.
