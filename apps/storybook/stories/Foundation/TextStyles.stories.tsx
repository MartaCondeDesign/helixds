import type { Meta, StoryObj } from '@storybook/react';
import { SectionHead } from './_shared';

const meta: Meta = {
  title: 'Foundation/Text Styles',
  parameters: { layout: 'padded' },
};

export default meta;
type Story = StoryObj;

// Mirrors the named Text Styles defined in the Figma file (see .ai/skills/tokens-to-figma.md → Phase 6).
// group | name | fontWeight key | fontSize/lineHeight key | sample text
const STYLES: [string, string, string, string, string][] = [
  ['Display', 'Display / 6xl / Bold',      'bold',      '6xl', 'Display 6xl'],
  ['Display', 'Display / 5xl / Bold',      'bold',      '5xl', 'Display 5xl'],
  ['Heading', 'Heading / 4xl / Bold',      'bold',      '4xl', 'Heading 4xl'],
  ['Heading', 'Heading / 3xl / Semibold',  'semibold',  '3xl', 'Heading 3xl'],
  ['Heading', 'Heading / 2xl / Semibold',  'semibold',  '2xl', 'Heading 2xl'],
  ['Heading', 'Heading / xl / Semibold',   'semibold',  'xl',  'Heading xl'],
  ['Body',    'Body / l / Medium',         'medium',    'l',   'Body large, medium weight'],
  ['Body',    'Body / l / Regular',        'regular',   'l',   'Body large, regular weight'],
  ['Body',    'Body / m / Medium',         'medium',    'm',   'Body, medium weight'],
  ['Body',    'Body / m / Regular',        'regular',   'm',   'Body, regular weight'],
  ['Body',    'Body / s / Medium',         'medium',    's',   'Body small, medium weight'],
  ['Body',    'Body / s / Regular',        'regular',   's',   'Body small, regular weight'],
  ['Other',   'Caption / Semibold',        'semibold',  's',   'Caption, semibold'],
  ['Other',   'Caption / Regular',         'regular',   's',   'Caption, regular'],
  ['Other',   'Label / Uppercase',         'semibold',  's',   'LABEL UPPERCASE'],
  ['Other',   'Code / Regular',            'regular',   's',   'code.regular()'],
];

function TextStyleRow({ name, weight, sizeKey, sample }: { name: string; weight: string; sizeKey: string; sample: string }) {
  const isLabel = name.startsWith('Label');
  return (
    <div style={{
      display: 'flex', alignItems: 'baseline', gap: 24, paddingBlock: 14,
      borderBottom: '1px solid var(--helix-color-border-neutral-light)',
    }}>
      <div style={{ width: 180, flexShrink: 0 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--helix-color-text-neutral)', fontFamily: 'monospace' }}>{name}</div>
        <div style={{ fontSize: 11, color: 'var(--helix-color-text-neutral-lightest)', fontFamily: 'monospace' }}>
          fontSize/{sizeKey} · lineHeight/{sizeKey} · fontWeight/{weight}
        </div>
      </div>
      <span style={{
        fontFamily: 'var(--helix-primitive-fontFamily-sans)',
        fontSize:   `var(--helix-primitive-fontSize-${sizeKey})`,
        fontWeight: `var(--helix-primitive-fontWeight-${weight})` as React.CSSProperties['fontWeight'],
        lineHeight: `var(--helix-lineHeight-${sizeKey})`,
        color:      'var(--helix-color-text-neutral)',
        textTransform: isLabel ? 'uppercase' : 'none',
        letterSpacing: isLabel ? 'var(--helix-primitive-letterSpacing-wider)' : 'normal',
      }}>
        {sample}
      </span>
    </div>
  );
}

export const All: Story = {
  render: () => {
    const groups = ['Display', 'Heading', 'Body', 'Other'];
    return (
      <div style={{ maxWidth: 700 }}>
        {groups.map(g => (
          <div key={g} style={{ marginBottom: 32 }}>
            <SectionHead title={g} />
            {STYLES.filter(([group]) => group === g).map(([, name, weight, sizeKey, sample]) => (
              <TextStyleRow key={name} name={name} weight={weight} sizeKey={sizeKey} sample={sample} />
            ))}
          </div>
        ))}
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Named `{role} / {size} / {weight}` combinations — the same 16 styles defined as Figma Text Styles (fontFamily/fontWeight always bind to Primitives; fontSize/lineHeight bind to Responsive when ≥18px, Primitives below — see .ai/skills/tokens-to-figma.md → Phase 6). On the web, `--helix-primitive-fontSize-*` already carries the mobile override via the generated `@media (max-width: 767px)` block, so there\'s no separate "Responsive" CSS variable to switch — resize the viewport to see `l`-`6xl` styles respond.',
      },
    },
  },
};
