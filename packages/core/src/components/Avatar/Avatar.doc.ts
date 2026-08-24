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
  variants: [],
  sizes: ['s', 'm', 'l'],
  tokens: [
    { part: 'avatar-root', label: 'height.s', token: '--helix-avatar-height-s', kind: 'space', size: 's' },
    { part: 'avatar-root', label: 'height.m', token: '--helix-avatar-height-m', kind: 'space', size: 'm' },
    { part: 'avatar-root', label: 'height.l', token: '--helix-avatar-height-l', kind: 'space', size: 'l' },
    { part: 'avatar-root', label: 'fill', token: '--helix-avatar-fill', kind: 'color' },
    { part: 'avatar-initials', label: 'text', token: '--helix-avatar-text', kind: 'color' },
    { part: 'avatar-initials', label: 'fontSize', token: '--helix-avatar-fontSize-s', kind: 'typography', meta: 'Caption / Semibold', size: 's' },
    { part: 'avatar-initials', label: 'fontWeight', token: '--helix-avatar-fontWeight-s', kind: 'typography', meta: 'Caption / Semibold', size: 's' },
    { part: 'avatar-initials', label: 'fontSize', token: '--helix-avatar-fontSize-m', kind: 'typography', meta: 'Caption / Semibold', size: 'm' },
    { part: 'avatar-initials', label: 'fontWeight', token: '--helix-avatar-fontWeight-m', kind: 'typography', meta: 'Caption / Semibold', size: 'm' },
    { part: 'avatar-initials', label: 'fontSize', token: '--helix-avatar-fontSize-l', kind: 'typography', meta: 'Body / m / Semibold', size: 'l' },
    { part: 'avatar-initials', label: 'fontWeight', token: '--helix-avatar-fontWeight-l', kind: 'typography', meta: 'Body / m / Semibold', size: 'l' },
  ],
  features: [
    'src — renders an image, falling back to initials on load error',
    'label — always required, source of truth for initials and accessible name',
  ],
  examples: [
    { label: 'Initials', code: `<Avatar label="Ana García" />` },
    { label: 'Image', code: `<Avatar label="Ana García" src="/ana.jpg" />` },
    { label: 'Current user', code: `<Avatar label="Marta Conde" />` },
  ],
};
