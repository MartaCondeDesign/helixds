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
const semanticColor = tokensJson.semantic.color as unknown as Record<string, ColorGroup>;

function primitiveRef(value: string): string {
  return value.startsWith('{') && value.endsWith('}') ? value.slice(1, -1) : value;
}

// ── Resolved values, following Storybook's theme toolbar ────────────────
// Dark mode is driven by `:root[data-theme="dark"]` in the generated CSS (built from packages/tokens/src/tokens.dark.json,
// the DTCG resolver's dark context — see helix.resolver.json), and
// the toolbar's light/dark switch (withThemeByDataAttribute in .storybook/preview.tsx) sets that attribute.
// The page has no switch of its own: it re-reads every --helix-color-* var whenever the attribute changes.

function useResolvedHexes(): Record<string, string> {
  const [hexes, setHexes] = useState<Record<string, string>>({});
  useEffect(() => {
    const read = () => {
      const styles = getComputedStyle(document.documentElement);
      const next: Record<string, string> = {};
      for (const [kind, group] of Object.entries(semanticColor)) {
        for (const key of Object.keys(group)) {
          const varName = `--helix-color-${kind}-${key}`;
          next[`${kind}-${key}`] = styles.getPropertyValue(varName).trim() || varName;
        }
      }
      setHexes(next);
    };
    read();
    const observer = new MutationObserver(read);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => observer.disconnect();
  }, []);
  return hexes;
}

// ── Swatch preview (small, per row) ──────────────────────────────────────

// fill, text, icon and border get their own swatch; any other group (chart…) is drawn as a fill.
type ColorKind = string;

function SwatchPreview({ kind, varName }: { kind: ColorKind; varName: string }) {
  const box: React.CSSProperties = {
    width: 32, height: 32, borderRadius: 6, flexShrink: 0,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  };
  if (kind !== 'border' && kind !== 'icon' && kind !== 'text') {
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
  textAlign: 'left', padding: 'var(--helix-spacing-xs) var(--helix-spacing-s)', fontSize: 11, fontWeight: 600,
  letterSpacing: '0.04em', textTransform: 'uppercase',
  color: 'var(--helix-color-text-neutral-lightest)',
  borderBottom: '1px solid var(--helix-color-border-neutral)',
  borderRight: '1px solid var(--helix-color-border-neutral-light)',
};
const tdStyle: React.CSSProperties = {
  padding: 'var(--helix-spacing-xs) var(--helix-spacing-s)', verticalAlign: 'middle',
  borderRight: '1px solid var(--helix-color-border-neutral-light)',
};

function ColorTable({ kind, tokens, hexes }: { kind: ColorKind; tokens: ColorGroup; hexes: Record<string, string> }) {
  return (
    <table style={{
      width: '100%', borderCollapse: 'collapse', marginTop: 'var(--helix-spacing-l)', marginBottom: 36,
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
  render: () => <ColorPage />,
  parameters: {
    docs: {
      description: {
        story: 'The Theme collection — every semantic color token, the primitive it aliases, and its usage description (both read live from `tokens.json`, so this table updates automatically on any token change). Switch light/dark with the theme button in the toolbar. Component tokens (`--helix-button-*`, `--helix-input-*`…) are internal implementation; never use them outside their component.',
      },
    },
  },
};

function ColorPage() {
  const hexes = useResolvedHexes();
  return (
    <div style={{ maxWidth: 760 }}>
      <StoryHeader
        title="Color"
        description="Every semantic color token, the primitive it aliases, its resolved hex, and its usage description — all read live from tokens.json. Switch light/dark with the theme button in the toolbar."
      />
      <div style={{ background: 'var(--helix-color-fill-page)', borderRadius: 12 }}>
        {/* Every color group in tokens.json (fill, text, icon, border, chart…) — a new group shows up on its own. */}
        {(Object.keys(semanticColor) as ColorKind[]).map(kind => (
          <div key={kind}>
            <SectionHead title={kind.charAt(0).toUpperCase() + kind.slice(1)} />
            <ColorTable kind={kind} tokens={semanticColor[kind]} hexes={hexes} />
          </div>
        ))}
      </div>
    </div>
  );
}
