/** Machine-readable component documentation for the Helix Avatar. */
import type { ComponentDoc } from '../../lib/component-doc';

export const doc: ComponentDoc = {
  name: 'Avatar',
  purpose: 'Represents a person or entity as a small circular image or initials indicator.',
  contract: 'contracts/components/Avatar.json',
  a11y: [
    'label is required — it drives both the initials fallback and the accessible name.',
    'Falls back to initials automatically if the image fails to load (broken URL, offline).',
  ],
  variants: [
    { name: 'light', description: 'Tinted fill, colored initials — for dense repeated rows (a table, a list).' },
    { name: 'solid', description: 'Filled brand background, inverse initials — for a single emphasized avatar (the current user).' },
  ],
  sizes: ['s', 'm', 'l'],
  tokens: [
    { part: 'avatar-root', label: 'height.s', token: '--helix-avatar-height-s', kind: 'space', size: 's' },
    { part: 'avatar-root', label: 'height.m', token: '--helix-avatar-height-m', kind: 'space', size: 'm' },
    { part: 'avatar-root', label: 'height.l', token: '--helix-avatar-height-l', kind: 'space', size: 'l' },
    { part: 'avatar-root', label: 'fill.light', token: '--helix-avatar-fill-light', kind: 'color', variant: 'light' },
    { part: 'avatar-root', label: 'fill.solid', token: '--helix-avatar-fill-solid', kind: 'color', variant: 'solid' },
    { part: 'avatar-initials', label: 'text.light', token: '--helix-avatar-text-light', kind: 'color', variant: 'light' },
    { part: 'avatar-initials', label: 'text.solid', token: '--helix-avatar-text-solid', kind: 'color', variant: 'solid' },
    { part: 'avatar-initials', label: 'fontWeight', token: '--helix-avatar-fontWeight', kind: 'typography' },
  ],
  features: [
    'src — renders an image, falling back to initials on load error',
    'label — always required, source of truth for initials and accessible name',
  ],
  examples: [
    { label: 'Initials', code: `<Avatar label="Ana García" />` },
    { label: 'Image', code: `<Avatar label="Ana García" src="/ana.jpg" />` },
    { label: 'Emphasized (current user)', code: `<Avatar label="Marta Conde" variant="solid" />` },
  ],
};
