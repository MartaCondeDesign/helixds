import type * as React from 'react';

export interface TopBarProps {
  /** Leading slot content — typically a search Input. */
  start?: React.ReactNode;
  /** Trailing slot content — typically IconButtons (notifications, help, quick actions). */
  end?: React.ReactNode;
  /** Additional className for the root. */
  className?: string;
}
