import type * as React from 'react';

export interface TableProps {
  /** Table content — typically a TableHead and a TableBody. */
  children: React.ReactNode;
  /** Additional className for the root <table>. */
  className?: string;
}

export interface TableSectionProps {
  children: React.ReactNode;
  className?: string;
}

export interface TableRowProps {
  children: React.ReactNode;
  className?: string;
}

export interface TableHeaderCellProps {
  children: React.ReactNode;
  className?: string;
}

export interface TableCellProps {
  children?: React.ReactNode;
  className?: string;
}
