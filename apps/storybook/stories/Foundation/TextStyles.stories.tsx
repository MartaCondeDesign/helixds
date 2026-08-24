import type { Meta, StoryObj } from '@storybook/react';
import { StoryHeader, TableGroup, type TokenLeaf } from './_shared';
// Imported directly from source so the description line below reflects $description automatically.
// Note: primitive.fontSize.* has no $description by design (primitives never do — see
// packages/tokens/CLAUDE.md "Adding a token"); semantic.lineHeight.* is the one that carries usage intent.
import tokensJson from '../../../../packages/tokens/src/tokens.json';
// TEXT_STYLES is the single source of truth for these 16 styles — scripts/audit-token-exceptions.ts
// matches component typography against the same list, so both stay in sync automatically.
import { TEXT_STYLES } from '../../../../scripts/text-styles';

const semanticLineHeight = tokensJson.semantic.lineHeight as unknown as Record<string, TokenLeaf>;

const meta: Meta = {
  title: 'Foundation/Text Styles',
  parameters: { layout: 'padded' },
};

export default meta;
type Story = StoryObj;

// Sample text is presentation-only, so it stays local rather than living in the shared data module.
const SAMPLE_TEXT: Record<string, string> = {
  'Display / 6xl / Bold': 'Display 6xl',
  'Display / 5xl / Bold': 'Display 5xl',
  'Heading / 4xl / Bold': 'Heading 4xl',
  'Heading / 3xl / Semibold': 'Heading 3xl',
  'Heading / 2xl / Semibold': 'Heading 2xl',
  'Heading / xl / Semibold': 'Heading xl',
  'Body / l / Medium': 'Body large, medium weight',
  'Body / l / Regular': 'Body large, regular weight',
  'Body / m / Medium': 'Body, medium weight',
  'Body / m / Regular': 'Body, regular weight',
  'Body / s / Medium': 'Body small, medium weight',
  'Body / s / Regular': 'Body small, regular weight',
  'Caption / Semibold': 'Caption, semibold',
  'Caption / Regular': 'Caption, regular',
  'Label / Uppercase': 'LABEL UPPERCASE',
  'Code / Regular': 'code.regular()',
};

// group | name | fontWeight key | fontSize/lineHeight key | sample text
const STYLES: [string, string, string, string, string][] = TEXT_STYLES.map(
  s => [s.group, s.name, s.weight, s.size, SAMPLE_TEXT[s.name] ?? s.name],
);

function TextStyleRow({ name, weight, sizeKey, sample }: { name: string; weight: string; sizeKey: string; sample: string }) {
  const isLabel = name.startsWith('Label');
  return (
    <div style={{
      display: 'flex', alignItems: 'baseline', gap: 24, paddingBlock: 14,
      borderBottom: '1px solid var(--helix-color-border-neutral-light)',
    }}>
      <div style={{ width: 220, flexShrink: 0 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--helix-color-text-neutral)', fontFamily: 'monospace' }}>{name}</div>
        <div style={{ fontSize: 11, color: 'var(--helix-color-text-neutral-lightest)', fontFamily: 'monospace' }}>
          fontSize/{sizeKey} · lineHeight/{sizeKey} · fontWeight/{weight}
        </div>
        <div style={{ fontSize: 11, color: 'var(--helix-color-text-neutral-light)', marginTop: 2 }}>
          {semanticLineHeight[sizeKey]?.$description}
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
      <div style={{ maxWidth: 1020 }}>
        <StoryHeader
          title="Text Styles"
          description="Named {role} / {size} / {weight} combinations mirroring the Figma Text Styles. fontFamily/fontWeight/fontSize/lineHeight bind to Primitives."
        />
        {groups.map((group) => (
          <TableGroup key={group} title={group}>
            <table style={{
              width: '100%',
              borderCollapse: 'collapse',
              marginTop: 0,
              border: '1px solid var(--helix-color-border-neutral)',
              borderRadius: 12,
              overflow: 'hidden',
            }}>
              <thead>
                <tr style={{ background: 'var(--helix-color-fill-surface)' }}>
                  <th style={{ textAlign: 'left', padding: '10px 12px', fontSize: 11, fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--helix-color-text-neutral-lightest)', borderBottom: '1px solid var(--helix-color-border-neutral)', borderRight: '1px solid var(--helix-color-border-neutral-light)' }}>Style</th>
                  <th style={{ textAlign: 'left', padding: '10px 12px', fontSize: 11, fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--helix-color-text-neutral-lightest)', borderBottom: '1px solid var(--helix-color-border-neutral)', borderRight: '1px solid var(--helix-color-border-neutral-light)' }}>Tokens</th>
                  <th style={{ textAlign: 'left', padding: '10px 12px', fontSize: 11, fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--helix-color-text-neutral-lightest)', borderBottom: '1px solid var(--helix-color-border-neutral)', borderRight: '1px solid var(--helix-color-border-neutral-light)' }}>Sample</th>
                  <th style={{ textAlign: 'left', padding: '10px 12px', fontSize: 11, fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--helix-color-text-neutral-lightest)', borderBottom: '1px solid var(--helix-color-border-neutral)' }}>Description</th>
                </tr>
              </thead>
              <tbody>
                {STYLES.filter(([styleGroup]) => styleGroup === group).map(([styleGroup, name, weight, sizeKey, sample]) => (
                  <tr key={name} style={{ borderTop: '1px solid var(--helix-color-border-neutral-light)' }}>
                    <td style={{ padding: '12px', verticalAlign: 'top', borderRight: '1px solid var(--helix-color-border-neutral-light)' }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--helix-color-text-neutral)', fontFamily: 'monospace' }}>{name}</div>
                    </td>
                    <td style={{ padding: '12px', verticalAlign: 'top', borderRight: '1px solid var(--helix-color-border-neutral-light)' }}>
                      <div style={{ fontSize: 11, color: 'var(--helix-color-text-neutral-lightest)', fontFamily: 'monospace', lineHeight: 1.6 }}>
                        fontSize/{sizeKey}<br />
                        lineHeight/{sizeKey}<br />
                        fontWeight/{weight}
                      </div>
                    </td>
                    <td style={{ padding: '12px', verticalAlign: 'top', borderRight: '1px solid var(--helix-color-border-neutral-light)' }}>
                      <span style={{
                        fontFamily: 'var(--helix-primitive-fontFamily-sans)',
                        fontSize: `var(--helix-primitive-fontSize-${sizeKey})`,
                        fontWeight: `var(--helix-primitive-fontWeight-${weight})` as React.CSSProperties['fontWeight'],
                        lineHeight: `var(--helix-lineHeight-${sizeKey})`,
                        color: 'var(--helix-color-text-neutral)',
                      }}>
                        {sample}
                      </span>
                    </td>
                    <td style={{ padding: '12px', verticalAlign: 'top' }}>
                      <div style={{ fontSize: 11, color: 'var(--helix-color-text-neutral-light)' }}>
                        {semanticLineHeight[sizeKey]?.$description}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableGroup>
        ))}
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Named `{role} / {size} / {weight}` combinations — the same 16 styles defined as Figma Text Styles (fontFamily/fontWeight/fontSize/lineHeight bind to Primitives — see .ai/skills/tokens-to-figma.md → Phase 6).',
      },
    },
  },
};
