import { useEffect, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { IconFolder } from '@tabler/icons-react';
import { SectionHead, StoryHeader } from './_shared';
// Imported directly from source (not dist/index.ts, which only holds resolved values) so this table
// reflects $value (the primitive it aliases) and $description automatically on every token change —
// no hardcoded list to keep in sync by hand. resolveJsonModule is enabled in tsconfig.json.
import tokensJson from '../../../../packages/tokens/src/tokens.json';

const meta: Meta = {
  title: 'Foundation/Theme',
  parameters: { layout: 'padded' },
};

export default meta;
type Story = StoryObj;

type ColorToken = { $value: string; $type: string; $description?: string };
type ColorGroup = Record<string, ColorToken>;
const semanticColor = tokensJson.semantic.color as unknown as {
  fill: ColorGroup; text: ColorGroup; icon: ColorGroup; border: ColorGroup;
};

function primitiveRef(value: string): string {
  return value.startsWith('{') && value.endsWith('}') ? value.slice(1, -1) : value;
}

// Resolves a "primitive.color.blue.600"-style path against tokensJson to its raw hex $value.
function resolveHex(ref: string): string {
  const node = ref.split('.').reduce<unknown>((acc, key) => (acc as Record<string, unknown> | undefined)?.[key], tokensJson);
  const leaf = node as { $value?: string } | undefined;
  return leaf?.$value ?? ref;
}

// ── Light/dark toggle wrapper ────────────────────────────────────────────
// Dark mode is driven by `:root[data-theme="dark"]` in the generated CSS (packages/tokens/src/build.ts)
// — setting the attribute on document.documentElement is what actually flips every --helix-color-* var.

function ThemeToggle({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    return () => { document.documentElement.removeAttribute('data-theme'); };
  }, [theme]);

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        {(['light', 'dark'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTheme(t)}
            style={{
              padding: '6px 14px', borderRadius: 'var(--helix-radius-s)',
              border: `1px solid var(--helix-color-border-${theme === t ? 'focus' : 'neutral'})`,
              background: theme === t ? 'var(--helix-color-fill-primary-interactive-light-default)' : 'var(--helix-color-fill-surface)',
              color: 'var(--helix-color-text-neutral)',
              fontSize: 12, fontWeight: 600, cursor: 'pointer',
            }}
          >
            {t}
          </button>
        ))}
      </div>
      <div style={{ background: 'var(--helix-color-fill-page)', padding: 24, borderRadius: 12 }}>
        {children}
      </div>
    </div>
  );
}

// ── Swatch preview (small, per row) ──────────────────────────────────────

function SwatchPreview({ kind, varName }: { kind: 'fill' | 'text' | 'icon' | 'border'; varName: string }) {
  const box: React.CSSProperties = {
    width: 32, height: 32, borderRadius: 6, flexShrink: 0,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  };
  if (kind === 'fill') {
    return <div style={{ ...box, background: `var(${varName})`, border: '1px solid var(--helix-color-border-neutral-light)' }} />;
  }
  if (kind === 'border') {
    return <div style={{ ...box, background: 'var(--helix-color-fill-surface)', border: `2px solid var(${varName})` }} />;
  }
  if (kind === 'icon') {
    return (
      <div style={{ ...box, background: 'var(--helix-color-fill-surface)', border: '1px solid var(--helix-color-border-neutral-light)' }}>
        <IconFolder size={16} color={`var(${varName})`} />
      </div>
    );
  }
  // text
  return (
    <div style={{ ...box, background: 'var(--helix-color-fill-surface)', border: '1px solid var(--helix-color-border-neutral-light)' }}>
      <span style={{ fontSize: 14, fontWeight: 700, color: `var(${varName})` }}>Aa</span>
    </div>
  );
}

// ── Table ─────────────────────────────────────────────────────────────────

const thStyle: React.CSSProperties = {
  textAlign: 'left', padding: '8px 12px', fontSize: 11, fontWeight: 600,
  letterSpacing: '0.04em', textTransform: 'uppercase',
  color: 'var(--helix-color-text-neutral-lightest)',
  borderBottom: '1px solid var(--helix-color-border-neutral)',
  borderRight: '1px solid var(--helix-color-border-neutral-light)',
};
const tdStyle: React.CSSProperties = {
  padding: '8px 12px', verticalAlign: 'middle',
  borderRight: '1px solid var(--helix-color-border-neutral-light)',
};

function ColorTable({ kind, tokens }: { kind: 'fill' | 'text' | 'icon' | 'border'; tokens: ColorGroup }) {
  return (
    <table style={{
      width: '100%', borderCollapse: 'collapse', marginBottom: 36,
      border: '1px solid var(--helix-color-border-neutral)', borderRadius: 8, overflow: 'hidden',
    }}>
      <thead>
        <tr style={{ background: 'var(--helix-color-fill-surface)' }}>
          <th style={thStyle}>Color</th>
          <th style={thStyle}>Primitive</th>
          <th style={thStyle}>Hex</th>
          <th style={{ ...thStyle, borderRight: 'none' }}>Description</th>
        </tr>
      </thead>
      <tbody>
        {Object.entries(tokens).map(([key, tok]) => {
          const hex = resolveHex(primitiveRef(tok.$value));
          return (
            <tr key={key} style={{ borderTop: '1px solid var(--helix-color-border-neutral-light)' }}>
              <td style={tdStyle}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <SwatchPreview kind={kind} varName={`--helix-color-${kind}-${key}`} />
                  <code style={{ fontSize: 12, color: 'var(--helix-color-text-neutral)' }}>{kind}-{key}</code>
                </div>
              </td>
              <td style={tdStyle}>
                <code style={{ fontSize: 11, color: 'var(--helix-color-text-neutral-lightest)' }}>{primitiveRef(tok.$value)}</code>
              </td>
              <td style={tdStyle}>
                <code style={{ fontSize: 11, color: 'var(--helix-color-text-neutral-light)' }}>{hex}</code>
              </td>
              <td style={{ ...tdStyle, borderRight: 'none' }}>
                <span style={{ fontSize: 12, color: 'var(--helix-color-text-neutral-light)' }}>{tok.$description ?? '—'}</span>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

export const Color: Story = {
  render: () => (
    <div style={{ maxWidth: 760 }}>
      <StoryHeader
        title="Theme — Color"
        description="Every semantic color token, the primitive it aliases, its resolved hex, and its usage description — all read live from tokens.json. Toggle light/dark below."
      />
    <ThemeToggle>
      <div>
        <SectionHead title="Fill" />
        <ColorTable kind="fill" tokens={semanticColor.fill} />
        <SectionHead title="Text" />
        <ColorTable kind="text" tokens={semanticColor.text} />
        <SectionHead title="Icon" />
        <ColorTable kind="icon" tokens={semanticColor.icon} />
        <SectionHead title="Border" />
        <ColorTable kind="border" tokens={semanticColor.border} />
      </div>
    </ThemeToggle>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'The Theme collection — every semantic color token, the primitive it aliases, and its usage description (both read live from `tokens.json`, so this table updates automatically on any token change). Toggle light/dark above. Component tokens (`--helix-button-*`, `--helix-input-*`…) are internal implementation; never use them outside their component.',
      },
    },
  },
};
