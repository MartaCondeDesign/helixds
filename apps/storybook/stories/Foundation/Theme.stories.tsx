import { useEffect, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { IconFolder } from '@tabler/icons-react';
import { Switch } from '@helix-ds/core';
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

// ── Light/dark toggle wrapper ────────────────────────────────────────────
// Dark mode is driven by `:root[data-theme="dark"]` in the generated CSS (packages/tokens/src/build.ts)
// — setting the attribute on document.documentElement is what actually flips every --helix-color-* var.

function ThemeToggle({ children }: { children: (theme: 'light' | 'dark', hexes: Record<string, string>) => React.ReactNode }) {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [hexes, setHexes] = useState<Record<string, string>>({});

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    const next: Record<string, string> = {};
    for (const [kind, group] of Object.entries(semanticColor)) {
      for (const key of Object.keys(group)) {
        const varName = `--helix-color-${kind}-${key}`;
        next[`${kind}-${key}`] = getComputedStyle(document.documentElement).getPropertyValue(varName).trim() || varName;
      }
    }
    setHexes(next);
    return () => { document.documentElement.removeAttribute('data-theme'); };
  }, [theme]);

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Switch label="Dark mode" checked={theme === 'dark'} onChange={checked => setTheme(checked ? 'dark' : 'light')} />
      </div>
      <div style={{ background: 'var(--helix-color-fill-page)', borderRadius: 12 }}>
        {children(theme, hexes)}
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

function ColorTable({ kind, tokens, hexes }: { kind: 'fill' | 'text' | 'icon' | 'border'; tokens: ColorGroup; hexes: Record<string, string> }) {
  return (
    <table style={{
      width: '100%', borderCollapse: 'collapse', marginTop: 24, marginBottom: 36,
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
          const hex = hexes[`${kind}-${key}`] ?? `--helix-color-${kind}-${key}`;
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
        title="Color"
        description="Every semantic color token, the primitive it aliases, its resolved hex, and its usage description — all read live from tokens.json. Toggle light/dark below."
      />
      <ThemeToggle>{(_, hexes) => (
        <div>
          <SectionHead title="Fill" />
          <ColorTable kind="fill" tokens={semanticColor.fill} hexes={hexes} />
          <SectionHead title="Text" />
          <ColorTable kind="text" tokens={semanticColor.text} hexes={hexes} />
          <SectionHead title="Icon" />
          <ColorTable kind="icon" tokens={semanticColor.icon} hexes={hexes} />
          <SectionHead title="Border" />
          <ColorTable kind="border" tokens={semanticColor.border} hexes={hexes} />
        </div>
      )}</ThemeToggle>
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
