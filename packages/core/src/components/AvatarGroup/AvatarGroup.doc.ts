/** Machine-readable component documentation for the Helix AvatarGroup. */
import type { ComponentDoc } from '../../lib/component-doc';

export const doc: ComponentDoc = {
  name: 'AvatarGroup',
  purpose: 'Shows several people or entities on the same record as a compact overlapping stack of Avatars, collapsing overflow into a +N count.',
  contract: 'contracts/components/AvatarGroup.json',
  a11y: [
    'Root carries role="group" with an aria-label summarizing the count (e.g. "4 people") — individual avatars still expose their own name via Avatar\'s built-in accessible name.',
    'Each avatar is wrapped in Tooltip, showing that person\'s name on hover (mouse only — avatars have no tabindex/focus behavior of their own).',
    'The +N overflow indicator is wrapped in Tooltip too, listing the hidden names comma-separated.',
  ],
  variants: [],
  sizes: ['s', 'm', 'l'],
  tokens: [
    { part: 'avatar-group-item', label: 'ring', token: '--helix-avatarGroup-ring', kind: 'color' },
    { part: 'avatar-group-item', label: 'border-width', token: '--helix-avatarGroup-border-width', kind: 'space' },
    { part: 'avatar-group-item', label: 'overlap', token: '--helix-avatarGroup-overlap', kind: 'space' },
    { part: 'avatar-group-overflow', label: 'fill', token: '--helix-avatarGroup-overflow-fill', kind: 'color' },
    { part: 'avatar-group-overflow', label: 'text', token: '--helix-avatarGroup-overflow-text', kind: 'color' },
  ],
  features: [
    'avatars — the people/entities to render, first entry stacks on top',
    'max — caps how many avatars render before collapsing the rest into a +N indicator, always rendered last (rightmost, on top), in a neutral gray distinct from Avatar\'s own tinted fill',
    'size — shared s/m/l scale, applied to every avatar and the overflow indicator',
  ],
  examples: [
    { label: 'Basic', code: `<AvatarGroup avatars={[{ label: 'Ana García' }, { label: 'Marta Conde' }, { label: 'Luis Pérez' }]} />` },
    { label: 'With overflow', code: `<AvatarGroup avatars={people} max={3} />` },
    { label: 'Small', code: `<AvatarGroup avatars={people} size="s" />` },
  ],
};
