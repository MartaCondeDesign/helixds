import type * as React from 'react';

export interface TopBarProps {
  /** Leading slot content — typically a search Input. */
  start?: React.ReactNode;
  /** Trailing slot content — typically icon Buttons and an Avatar. */
  end?: React.ReactNode;
  /** Additional className for the root. */
  className?: string;
}
