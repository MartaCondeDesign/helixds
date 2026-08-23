import type * as React from 'react';

export type CardPadding = 'none' | 'default';

export interface CardProps {
  /** Optional header content (title + trailing actions), rendered above the body with a divider. */
  header?: React.ReactNode;
  /** Card body content. */
  children: React.ReactNode;
  /** 'none' removes the body's internal padding — use when content manages its own edge-to-edge spacing. Default: 'default' */
  padding?: CardPadding;
  /** Additional className for the root. */
  className?: string;
}
