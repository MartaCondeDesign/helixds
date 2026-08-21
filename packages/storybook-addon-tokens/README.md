# Helix Storybook Tokens Addon

This addon reads `parameters.helixTokens` from the active story and renders the Tokens panel.

When adding a new component, use this shared contract:

```ts
{
  part: string;
  label: string;
  token?: string;
  value?: string;
  kind?: 'color' | 'typography' | 'space' | 'radius' | 'shadow' | 'other';
  variant?: string;
  meta?: string;
}
```

Guidelines:

- `color` tokens can be filtered by the active story `args.variant` when present.
- `typography` tokens show the text-style label in the Token column.
- `space` tokens do not show a preview.
- `radius` tokens use the element column to show the affected part.
- `shadow` appears only when present and is ordered last.
- Only show tabs for token kinds that exist in the current story.
- For `space`, keep one token per visual relationship and name the gap, for example `gap.icon.text` or `gap.label.field`.
- For `typography`, use one token per text role and name it like `label`, `value.s`, or `description`.
- Use `value` for hardcoded values; the Token column shows the literal value.
