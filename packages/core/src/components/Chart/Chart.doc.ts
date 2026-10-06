/** Machine-readable component documentation for the Helix Chart. */
import type { ComponentDoc } from '../../lib/component-doc';

export const doc: ComponentDoc = {
  name: 'Chart',
  purpose: 'Visualizes a metric with a token-branded, accessible chart so people can understand trends, comparisons, composition, or events.',
  contract: 'contracts/components/Chart.json',
  a11y: [
    'The canvas is exposed as role="img" named by label (plus description when given).',
    'Every chart renders a source-data table (chart-data) so the values are reachable without the visual.',
    'Never rely on series color alone — pair precise audit values with a Table.',
    'With two or more series the legend entries are toggle buttons (aria-pressed): Tab to reach them, Space/Enter to show or hide a series. A hidden series keeps its swatch; only its name turns gray (text-disabled).',
  ],
  variants: [
    { name: 'line', description: 'Trend of one or more series over ordered categories.' },
    { name: 'area', description: 'Trend with filled area — emphasizes volume over time.' },
    { name: 'bar', description: 'Comparison between categories.' },
    { name: 'stacked-bar', description: 'Composition of a total across categories.' },
    { name: 'donut', description: 'Part-to-whole of a single series — six categories at most.' },
    { name: 'timeline', description: 'Discrete events over time, unsmoothed.' },
  ],
  sizes: [],
  tokens: [
    { part: 'chart-canvas', label: 'series 1', token: '--helix-color-chart-series-1', kind: 'color', colorRole: 'asset' },
    { part: 'chart-canvas', label: 'series 2', token: '--helix-color-chart-series-2', kind: 'color', colorRole: 'asset' },
    { part: 'chart-canvas', label: 'series 3', token: '--helix-color-chart-series-3', kind: 'color', colorRole: 'asset' },
    { part: 'chart-canvas', label: 'series 4', token: '--helix-color-chart-series-4', kind: 'color', colorRole: 'asset' },
    { part: 'chart-canvas', label: 'series 5', token: '--helix-color-chart-series-5', kind: 'color', colorRole: 'asset' },
    { part: 'chart-canvas', label: 'series 6', token: '--helix-color-chart-series-6', kind: 'color', colorRole: 'asset' },
    { part: 'chart-canvas', label: 'axis + legend text', token: '--helix-color-text-neutral-light', kind: 'color', colorRole: 'text' },
    { part: 'chart-canvas', label: 'axis + grid lines', token: '--helix-color-border-neutral', kind: 'color', colorRole: 'border' },
    { part: 'chart-canvas', label: 'tooltip background', token: '--helix-color-fill-page', kind: 'color', colorRole: 'background' },
    { part: 'chart-canvas', label: 'tooltip text', token: '--helix-color-text-neutral', kind: 'color', colorRole: 'text' },
    { part: 'chart-legend-item', label: 'legend text', token: '--helix-color-text-neutral-light', kind: 'color', colorRole: 'text' },
    { part: 'chart-legend-item', label: 'legend text (hover / press)', token: '--helix-color-text-neutral', kind: 'color', colorRole: 'text' },
    { part: 'chart-legend-item', label: 'legend hover', token: '--helix-color-fill-secondary-interactive-default', kind: 'color', colorRole: 'background' },
    { part: 'chart-legend-item', label: 'legend text (series hidden)', token: '--helix-color-text-disabled', kind: 'color', colorRole: 'text' },
    { part: 'chart-legend-item', label: 'legend press', token: '--helix-color-fill-secondary-interactive-hover', kind: 'color', colorRole: 'background' },
    { part: 'chart-canvas', label: 'fontFamily', token: '--helix-textStyle-body-s-regular-fontFamily', kind: 'typography', meta: 'Body / s / Regular' },
  ],
  features: [
    'Series colors, axes and typography resolve from --helix-* tokens at render time — light and dark follow the theme',
    'null values leave a gap instead of plotting zero',
    'Resizes with its container',
    'Legend with square swatches: entries toggle their series on and off when there are two or more',
  ],
  examples: [
    { label: 'Line', code: `<Chart variant="line" label="Weekly sign-ups" categories={['Mon', 'Tue', 'Wed']} series={[{ name: 'Sign-ups', data: [12, 18, 15] }]} />` },
    { label: 'Donut', code: `<Chart variant="donut" label="Traffic by source" categories={['Search', 'Direct', 'Social']} series={[{ name: 'Visits', data: [52, 31, 17] }]} />` },
  ],
};
