import * as React from 'react';
import { cn } from '../../lib/utils';
import type {
  TableProps,
  TableSectionProps,
  TableRowProps,
  TableHeaderCellProps,
  TableCellProps,
} from './Table.types';

const Table = ({ children, className }: TableProps) => (
  <table data-helix-part="table" className={cn(className)}>
    {children}
  </table>
);
Table.displayName = 'Table';

const TableHead = ({ children, className }: TableSectionProps) => (
  <thead data-helix-part="table-head" className={cn(className)}>
    {children}
  </thead>
);
TableHead.displayName = 'TableHead';

const TableBody = ({ children, className }: TableSectionProps) => (
  <tbody data-helix-part="table-body" className={cn(className)}>
    {children}
  </tbody>
);
TableBody.displayName = 'TableBody';

const TableRow = ({ children, className }: TableRowProps) => (
  <tr data-helix-part="table-row" className={cn(className)}>
    {children}
  </tr>
);
TableRow.displayName = 'TableRow';

const TableHeaderCell = ({ children, className }: TableHeaderCellProps) => (
  <th data-helix-part="table-header-cell" className={cn(className)}>
    {children}
  </th>
);
TableHeaderCell.displayName = 'TableHeaderCell';

const TableCell = ({ children, className }: TableCellProps) => (
  <td data-helix-part="table-cell" className={cn(className)}>
    {children}
  </td>
);
TableCell.displayName = 'TableCell';

export { Table, TableHead, TableBody, TableRow, TableHeaderCell, TableCell };
