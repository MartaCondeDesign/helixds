import type * as React from 'react';

export type PageHeaderLevel = 1 | 2;

export interface PageHeaderProps {
  /** The page or section title text. */
  label: string;
  /** Supporting one-line description shown below the title. */
  description?: string;
  /** Heading level of the title — 1 for a page, 2 for a major in-page section. Default: 1 */
  level?: PageHeaderLevel;
  /** Trailing content — typically a Button and/or Badge. */
  actions?: React.ReactNode;
  /** Additional className for the root. */
  className?: string;
}
