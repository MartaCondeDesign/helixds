---
applyTo: "packages/core/src/components/**"
paths: ["packages/core/src/components"]
---

# Component Implementation Rules — Helix DS

Loaded automatically when working in `packages/core/src/components/`.

## Mandatory pre-implementation checklist

Before writing any component file:

- [ ] Contract file exists: `contracts/components/{Name}.json`
- [ ] `pnpm verify:contract` is passing on the current baseline
- [ ] Prop names verified against `.ai/maps/prop-map.md`
- [ ] shadcn/ui primitive identified (if applicable) and installed with `pnpm dlx shadcn@latest add`

## File structure (required)

```
{Name}/
  {Name}.tsx         ← implementation (forwardRef, data-* anatomy)
  {Name}.types.ts    ← TypeScript interfaces only, no JSX
  {Name}.doc.ts      ← ComponentDoc (machine-readable)
  {Name}.stories.tsx ← Storybook stories
  index.ts           ← barrel: export { Name } from './{Name}'
```

## Implementation template

```tsx
// {Name}.tsx
import * as React from 'react';
import { cn } from '../../lib/utils';
import type { {Name}Props } from './{Name}.types';

const {Name} = React.forwardRef<HTML{Element}Element, {Name}Props>(
  ({ variant = 'primary', size = 'm', ...props }, ref) => {
    return (
      <element
        ref={ref}
        data-helix-part="{name}"
        data-variant={variant}
        data-size={size}
        className={cn('{name}', props.className)}
        {...props}
      />
    );
  }
);

{Name}.displayName = '{Name}';
export { {Name} };
```

## Styling rules

- All CSS goes in `packages/core/src/globals.css` under `@layer components`
- Target via `[data-helix-part="{name}"]` selectors
- Variants via `[data-helix-part="{name}"][data-variant="primary"]`
- NO class-based variants (no `.button--primary`)
- Every CSS property references a `--helix-*` token

## HARD FAIL CONDITIONS (same as component-builder.agent.md)

❌ Anti-synonym prop names · ❌ Hardcoded colors/sizes · ❌ Direct Radix imports
❌ React.FC · ❌ Missing data-helix-part · ❌ No contract · ❌ Not exported from index.ts
