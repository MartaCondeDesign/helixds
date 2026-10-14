import type { Meta, StoryObj } from '@storybook/react';
import { StoryHeader, TableGroup, type TokenLeaf } from './_shared';
import { cssVarOf } from './_tokens';
// Read from tokens.json: the styles (TEXT_STYLES, scripts/text-styles.ts — also what scripts/audit-token-exceptions.ts
// matches against) and each style's $description. Every sample is drawn with the style's own
// --helix-textStyle-{key}-* vars, so changing a semantic.textStyle token in tokens.json changes it here.
import tokensJson from '../../../../packages/tokens/src/tokens.json';
import { TEXT_STYLES } from '../../../../scripts/text-styles';

const textStyleTokens = tokensJson.semantic.textStyle as unknown as Record<string, TokenLeaf>;

const meta: Meta = {
  title: 'Foundation/Text Styles',
  parameters: { layout: 'padded' },
};

export default meta;
type Story = StoryObj;

// Sample copy is presentation only; a new style shows its own name until it gets a line here.
const SAMPLE_TEXT: Record<string, string> = {
  'Label / Uppercase': 'LABEL UPPERCASE',
  'Code / Regular': 'code.regular()',
};

const PROPS = ['fontFamily', 'fontSize', 'fontWeight', 'lineHeight', 'letterSpacing'] as const;

const th: React.CSSProperties = {
  textAlign: 'left', padding: 'var(--helix-spacing-xs) var(--helix-spacing-s)', fontSize: 11, fontWeight: 600,
  letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--helix-color-text-neutral-lightest)',
  borderBottom: '1px solid var(--helix-color-border-neutral)', borderRight: '1px solid var(--helix-color-border-neutral-light)',
};
const td: React.CSSProperties = {
  padding: 'var(--helix-spacing-s)', verticalAlign: 'top', borderRight: '1px solid var(--helix-color-border-neutral-light)',
};
const mono: React.CSSProperties = { fontFamily: 'var(--helix-primitive-fontFamily-mono)', fontSize: 11 };

/** `{primitive.fontSize.m}` → `fontSize.m` — what the style is built from, for the Tokens column. */
const shortAlias = (value: unknown) => (typeof value === 'string' ? value.slice(1, -1).split('.').slice(-2).join('.') : String(value));

export const All: Story = {
  render: () => {
    const groups = [...new Set(TEXT_STYLES.map(style => style.group))];
    return (
      <div style={{ maxWidth: 1020 }}>
        <StoryHeader
          title="Text Styles"
          description="Named {role} / {size} / {weight} combinations — every semantic.textStyle token in tokens.json, mirroring the Figma Text Styles. Each sample uses the style's own CSS vars."
        />
        {groups.map(group => (
          <TableGroup key={group} title={group}>
            <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid var(--helix-color-border-neutral)', borderRadius: 12, overflow: 'hidden' }}>
              <thead>
                <tr style={{ background: 'var(--helix-color-fill-surface)' }}>
                  <th style={th}>Style</th>
                  <th style={th}>Tokens</th>
                  <th style={th}>Sample</th>
                  <th style={{ ...th, borderRight: 'none' }}>Description</th>
                </tr>
              </thead>
              <tbody>
                {TEXT_STYLES.filter(style => style.group === group).map(style => {
                  const token = textStyleTokens[style.key];
                  const value = (token?.$value ?? {}) as Record<string, unknown>;
                  const cssVar = cssVarOf(`semantic.textStyle.${style.key}`);
                  return (
                    <tr key={style.key} style={{ borderTop: '1px solid var(--helix-color-border-neutral-light)' }}>
                      <td style={td}>
                        <div style={{ ...mono, fontSize: 12, fontWeight: 600, color: 'var(--helix-color-text-neutral)' }}>{style.name}</div>
                        <div style={{ ...mono, color: 'var(--helix-color-text-neutral-lightest)' }}>textStyle.{style.key}</div>
                      </td>
                      <td style={td}>
                        <div style={{ ...mono, color: 'var(--helix-color-text-neutral-lightest)', lineHeight: 1.6 }}>
                          {PROPS.map(prop => <div key={prop}>{prop}: {shortAlias(value[prop])}</div>)}
                        </div>
                      </td>
                      <td style={td}>
                        <span style={{
                          fontFamily: `var(${cssVar}-fontFamily)`,
                          fontSize: `var(${cssVar}-fontSize)`,
                          fontWeight: `var(${cssVar}-fontWeight)` as React.CSSProperties['fontWeight'],
                          lineHeight: `var(${cssVar}-lineHeight)`,
                          letterSpacing: `var(${cssVar}-letterSpacing)`,
                          textTransform: style.name.startsWith('Label') ? 'uppercase' : 'none',
                          color: 'var(--helix-color-text-neutral)',
                        }}>
                          {SAMPLE_TEXT[style.name] ?? style.name.replace(/ \/ /g, ' ')}
                        </span>
                      </td>
                      <td style={{ ...td, borderRight: 'none' }}>
                        <div style={{ fontSize: 11, color: 'var(--helix-color-text-neutral-light)' }}>
                          {token?.$description?.split(' — ').slice(1).join(' — ') || '—'}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </TableGroup>
        ))}
      </div>
    );
  },
};
