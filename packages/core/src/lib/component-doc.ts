/** Canonical shape for every component's machine-readable documentation (`*.doc.ts`). */
export interface ComponentDoc {
  name: string;
  purpose: string;
  contract: string;
  a11y: string[];
  variants: { name: string; description: string }[];
  sizes: string[];
  tokens: {
    part: string;
    label: string;
    token?: string;
    value?: string;
    kind?: 'color' | 'typography' | 'space' | 'radius' | 'shadow' | 'style' | 'other';
    colorRole?: 'background' | 'text' | 'border' | 'icon' | 'asset';
    padding?: 'all' | 'top' | 'right' | 'bottom' | 'left' | string;
    paddingSides?: ('top' | 'end' | 'bottom' | 'start')[];
    relationship?: string;
    variant?: string;
    size?: string;
    state?: 'hover' | 'press' | 'disabled' | 'focus';
    axis?: 'horizontal' | 'vertical';
    meta?: string;
  }[];
  features: string[];
  examples: { label: string; code: string }[];
}
