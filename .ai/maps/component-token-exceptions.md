# Helix DS — Component Token Exceptions

Every `component.*` token should alias `semantic.*` where a semantic role exists for it (per
`packages/tokens/CLAUDE.md` → "Token layers"). This file lists every token that does **not** — it aliases
`primitive.*` directly, or has no alias at all (a raw literal) — plus why.

**This is not automatically a violation.** Some of these are legitimate: the category has no semantic layer
at all (typography, duration), or the component is a documented ADR-004 density exception (Badge, Chip).
Others are real gaps — a semantic token exists and simply isn't wired up yet. The "Kind" column tells you
which is which. Treat `Gap` rows as a backlog, not as acceptable precedent for new tokens.

**Maintenance rule — this table must be updated in the same change as:**
- Adding a new component (`pnpm contract <Name>` + implementation) — audit every new `component.*` token
  against this table before the contract is considered done.
- Modifying an existing component's tokens — if the edit adds, removes, or re-aliases a token, re-check
  whether it now belongs in (or should be removed from) this table.

Regenerate the raw list with this script if you want to re-audit from scratch (finds every `component.*`
leaf whose `$value` is a raw literal, or an alias into `primitive.*`):

```bash
python3 -c "
import json, re
data = json.load(open('packages/tokens/src/tokens.json'))
def walk(node, path):
    out = []
    for k, v in node.items():
        if k.startswith('\$'): continue
        if '\$value' in v: out.append((path + [k], v['\$value']))
        else: out.extend(walk(v, path + [k]))
    return out
alias_re = re.compile(r'^\{(.+)\}\$')
for path, value in walk(data['component'], []):
    m = alias_re.match(value) if isinstance(value, str) else None
    if m and m.group(1).startswith('primitive.'):
        print('PRIMITIVE_DIRECT', '.'.join(path), '->', m.group(1))
    elif not m:
        print('RAW', '.'.join(path), '=', value)
"
```

---

## Primitive-direct (no semantic layer exists for the category)

`fontSize`, `fontWeight`, and `duration` have no semantic role layer in code at all (see
`packages/tokens/CLAUDE.md` — typography stays primitive-only outside the `fontSize.mobile`/`lineHeight`
breakpoint pair; there's likewise no `semantic.duration`). Every component token in this category has
nothing to route through — aliasing `primitive.*` directly is correct, not a gap.

| Component | Token | Aliases | Why |
|-----------|-------|---------|-----|
| Badge | `fontSize` | `primitive.fontSize.xs` | No `semantic.fontSize` role layer |
| Badge | `fontWeight` | `primitive.fontWeight.semibold` | No `semantic.fontWeight` role layer |
| Button | `fontSize.xs` | `primitive.fontSize.xs` | No `semantic.fontSize` role layer |
| Button | `fontSize.s` | `primitive.fontSize.s` | No `semantic.fontSize` role layer |
| Button | `fontSize.m` | `primitive.fontSize.s` | No `semantic.fontSize` role layer (also note: `m` aliases the `s` rung, a pre-existing quirk in the ladder, unrelated to this table) |
| Button | `fontSize.l` | `primitive.fontSize.m` | No `semantic.fontSize` role layer |
| Button | `fontSize.xl` | `primitive.fontSize.l` | No `semantic.fontSize` role layer |
| Button | `transition` | `primitive.duration.base` | No `semantic.duration` layer exists |
| Chip | `fontWeight` | `primitive.fontWeight.medium` | No `semantic.fontWeight` role layer |

## Primitive-direct (ADR-004 density exception — Badge/Chip height)

Badge and Chip use a local density model instead of the shared `semantic.size` ladder, per
[ADR-004](../../docs/ADR/ADR-004-size-standard.md) → "Compact/status components". Their height values
correctly alias `primitive.size.*` directly — going through `semantic.size` would put them on the
shared control ladder, which is the one thing ADR-004 says not to do here.

| Component | Token | Aliases | Why |
|-----------|-------|---------|-----|
| Badge | `height-xs` | `primitive.size.125` (20px) | ADR-004 density exception, not the control ladder |
| Badge | `height-s` | `primitive.size.150` (24px) | ADR-004 density exception |
| Chip | `height-s` | `primitive.size.175` (28px) | ADR-004 density exception |
| Chip | `height-m` | `primitive.size.200` (32px) | ADR-004 density exception |

## Gap — `semantic.spacing` exists but isn't wired up

`semantic.spacing.{xs,s,m,l,xl}` is a real, live token (t-shirt scale, see `packages/tokens/CLAUDE.md`) —
these component tokens alias `primitive.spacing.*` directly instead, even though a matching semantic rung
exists for every one of them. Not an ADR-documented exception — just never rewired after `semantic.spacing`
was added. Fair game to fix; low risk (same resolved value either way, only the alias chain changes).

| Component | Token | Currently aliases | Matching `semantic.spacing` rung |
|-----------|-------|--------------------|-----------------------------------|
| Button | `padding.x-xs` | `primitive.spacing.50` (8px) | `semantic.spacing.xs` |
| Button | `padding.x-s` | `primitive.spacing.75` (12px) | `semantic.spacing.s` |
| Button | `padding.x-m` | `primitive.spacing.100` (16px) | `semantic.spacing.m` |
| Button | `padding.x-l` | `primitive.spacing.125` (20px) | *(no matching rung — `semantic.spacing` has no `125`/20px step; would need a new rung or stay primitive-direct)* |
| Button | `padding.x-xl` | `primitive.spacing.150` (24px) | `semantic.spacing.l` |
| Card | `padding` | `primitive.spacing.150` (24px) | `semantic.spacing.l` |
| Dialog | `padding` | `primitive.spacing.150` (24px) | `semantic.spacing.l` |
| Input | `gap.label` | `primitive.spacing.25` (4px) | *(no matching rung — smaller than `semantic.spacing.xs`)* |
| Input | `gap.description` | `primitive.spacing.25` (4px) | *(no matching rung)* |

## Raw literal — no alias at all

These have no `{...}` reference in `tokens.json` — not even to a primitive. Two sub-cases:

**Standalone dimension, no shared scale to belong to** — `checkbox.size`/`radio.size` (both 16px) and every
`switch.*` dimension are single component-specific measurements with no t-shirt ladder or spacing rung they
conceptually belong to (a checkbox isn't "a size in the control ladder", it's just 16×16). Legitimate as
standalone tokens per the project's token policy — but note some of these values numerically match an
existing primitive (`checkbox.size` = 16px = `primitive.size.100`) and could be aliased instead of
duplicated as a literal, same category as the spacing gap above.

| Component | Token | Value | Note |
|-----------|-------|-------|------|
| Checkbox | `size` | `16px` | Matches `primitive.size.100` — could alias instead of duplicating |
| Radio | `size` | `16px` | Matches `primitive.size.100` — could alias instead of duplicating |
| Switch | `width.s` | `28px` | Matches `primitive.size.175` — could alias |
| Switch | `width.m` | `36px` | Matches `primitive.size.225` — could alias |
| Switch | `height.s` | `16px` | Matches `primitive.size.100` — could alias |
| Switch | `height.m` | `20px` | Matches `primitive.size.125` — could alias |
| Switch | `thumb-size.s` | `12px` | Matches `primitive.size.75` — could alias |
| Switch | `thumb-size.m` | `16px` | Matches `primitive.size.100` — could alias |

**Chip's own ADR-004 density values, not yet tokenized as aliases** — `chip.border-width`,
`chip.padding-x.{s,m}`, `chip.gap.{s,m}`, `chip.fontSize.{s,m}` are literals. `padding-x`/`fontSize` match
existing primitives (see below) and are the same category of gap as the spacing table above; `border-width`
and `gap` don't currently have a matching primitive rung.

| Component | Token | Value | Note |
|-----------|-------|-------|------|
| Chip | `border-width` | `1px` | No matching primitive scale (not a spacing/size value) |
| Chip | `padding-x.s` | `12px` | Matches `primitive.spacing.75` — could alias |
| Chip | `padding-x.m` | `16px` | Matches `primitive.spacing.100` — could alias |
| Chip | `gap.s` | `6px` | No exact primitive match |
| Chip | `gap.m` | `6px` | No exact primitive match |
| Chip | `fontSize.s` | `13px` | No exact `primitive.fontSize` match (scale has no 13 rung after the fontSize rework) |
| Chip | `fontSize.m` | `13px` | Same as above |

**One-off color, not a reusable role** — `dialog.overlay` is `rgba(15,23,42,0.6)`, a modal-backdrop color
with baked-in opacity. Not aliased to `semantic.color.*` because no semantic role represents "gray-900 at
60% opacity" — it's specific to this one use. Legitimate as a standalone value; flag for review only if a
second component ever needs the same overlay treatment (at that point it earns a semantic token).

| Component | Token | Value | Why |
|-----------|-------|-------|-----|
| Dialog | `overlay` | `rgba(15,23,42,0.6)` | One-off backdrop color, no reusable semantic role exists for it |
