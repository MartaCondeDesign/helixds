/** Machine-readable component documentation for the Helix Table family. */
import type { ComponentDoc } from '../../lib/component-doc';

export const doc: ComponentDoc = {
  name: 'Table',
  purpose: 'Displays tabular data edge-to-edge — rows and columns of related records.',
  contract: 'contracts/components/Table.json',
  a11y: [
    'Uses real <table>/<thead>/<tbody>/<tr>/<th>/<td> elements — full table semantics for free, nothing hand-rolled.',
    'Row hover is CSS-only (:hover) — never a JS mouseenter/mouseleave handler mutating inline styles.',
  ],
  variants: [],
  sizes: [],
  tokens: [
    { part: 'table-header-cell', label: 'fontSize', token: '--helix-table-header-fontSize', kind: 'typography', meta: 'Caption / Semibold' },
    { part: 'table-header-cell', label: 'fontWeight', token: '--helix-table-header-fontWeight', kind: 'typography', meta: 'Caption / Semibold' },
    { part: 'table-header-cell', label: 'color', token: '--helix-table-header-color', kind: 'color' },
    { part: 'table-header-cell', label: 'border-bottom', token: '--helix-table-header-border', kind: 'color' },
    { part: 'table-row', label: 'border-bottom', token: '--helix-table-row-border', kind: 'color' },
    { part: 'table-row', label: 'hover fill', token: '--helix-table-row-hoverFill', kind: 'color', state: 'hover' },
    { part: 'table-cell', label: 'fontSize', token: '--helix-table-cell-fontSize', kind: 'typography', meta: 'Body / s / Regular' },
    { part: 'table-cell', label: 'fontWeight', token: '--helix-table-cell-fontWeight', kind: 'typography', meta: 'Body / s / Regular' },
    { part: 'table-cell', label: 'color', token: '--helix-table-cell-color', kind: 'color' },
  ],
  features: [
    'Table / TableHead / TableBody / TableRow / TableHeaderCell / TableCell — one wrapper per native table element',
    'Cell content is fully consumer-controlled — a TableCell can hold text, Avatar, Badge, Button, anything',
    'v1 scope: rendering only, no built-in sorting or pagination',
    'Drag-to-reorder rows is NOT a Table prop — a consumer can compose real rows with Motion\'s Reorder.Group/Reorder.Item (as="tbody"/as="tr") for that. Try it live in the "DragReorder" story on this page, or see it in context in Storybook\'s Team Dashboard page. Storybook-only pattern today, not part of this contract — see .ai/maps/patterns/motion-effects.md.',
  ],
  examples: [
    {
      label: 'Basic table',
      code: `<Table>
  <TableHead>
    <TableRow>
      <TableHeaderCell>Name</TableHeaderCell>
      <TableHeaderCell>Status</TableHeaderCell>
    </TableRow>
  </TableHead>
  <TableBody>
    <TableRow>
      <TableCell>Ana García</TableCell>
      <TableCell><Badge variant="success" label="Active" /></TableCell>
    </TableRow>
  </TableBody>
</Table>`,
    },
  ],
};
