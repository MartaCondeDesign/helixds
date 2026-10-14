import type { Meta, StoryObj } from '@storybook/react';
import { useEffect, useState } from 'react';
import { label12, SectionHead, SpacingBar, DescCaption, StoryHeader, TableGroup, type TokenLeaf } from './_shared';
// Imported directly from source so every section below reflects $value/$description automatically on
// any token change — no hardcoded list to keep in sync by hand.
import tokensJson from '../../../../packages/tokens/src/tokens.json';
import { toCss } from '../../../../packages/tokens/src/dtcg.mjs';

const meta: Meta = {
  title: 'Foundation/Semantic',
  parameters: { layout: 'padded' },
};

export default meta;
type Story = StoryObj;

const semantic = tokensJson.semantic as unknown as {
  spacing: Record<string, TokenLeaf>;
  radius: Record<string, TokenLeaf>;
  size: Record<string, TokenLeaf>;
  lineHeight: Record<string, TokenLeaf>;
  shadow: Record<string, TokenLeaf>;
  duration: Record<string, TokenLeaf>;
  easing: Record<string, TokenLeaf>;
  transform: { lift: Record<string, TokenLeaf>; scale: Record<string, TokenLeaf> };
};

// Resolved px values, used only for display (Storybook renders live via CSS vars regardless).
const SPACING_PX: Record<string, string> = { '3xs': '2px', '2xs': '4px', xs: '8px', s: '12px', m: '16px', l: '24px', xl: '32px' };
const RADIUS_PX: Record<string, string> = {
  none: '0px', xs: '2px', s: '4px', m: '6px', l: '8px', xl: '12px', '2xl': '16px', '3xl': '24px', full: '9999px',
};
const SIZE_CONTROL_PX: Record<string, string> = { xs: '16px', s: '24px', m: '32px', l: '40px', xl: '48px', '2xl': '56px' };

const tableStyle: React.CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse',
  marginTop: 'var(--helix-spacing-l)',
  border: '1px solid var(--helix-color-border-neutral)',
  borderRadius: 8,
  overflow: 'hidden',
};

const thStyle: React.CSSProperties = {
  textAlign: 'left',
  padding: 'var(--helix-spacing-xs) var(--helix-spacing-s)',
  fontSize: 11,
  fontWeight: 600,
  letterSpacing: '0.04em',
  textTransform: 'uppercase',
  color: 'var(--helix-color-text-neutral-lightest)',
  borderBottom: '1px solid var(--helix-color-border-neutral)',
  borderRight: '1px solid var(--helix-color-border-neutral-light)',
};

const tdStyle: React.CSSProperties = {
  padding: 'var(--helix-spacing-xs) var(--helix-spacing-s)',
  verticalAlign: 'middle',
  borderRight: '1px solid var(--helix-color-border-neutral-light)',
};

// ── Spacing (t-shirt scale) ─────────────────────────────────────────────

export const Spacing: Story = {
  render: () => (
    <div>
      <StoryHeader title="Spacing" description="The t-shirt spacing scale components actually consume — aliases the raw primitive.spacing.* percentage scale." />
      <table style={tableStyle}>
        <thead>
          <tr style={{ background: 'var(--helix-color-fill-surface)' }}>
            <th style={thStyle}>Token</th>
            <th style={thStyle}>Preview</th>
            <th style={thStyle}>Value</th>
            <th style={{ ...thStyle, borderRight: 'none' }}>Description</th>
          </tr>
        </thead>
        <tbody>
          {(['3xs', '2xs', 'xs', 's', 'm', 'l', 'xl']).map(key => (
            <tr key={key} style={{ borderTop: '1px solid var(--helix-color-border-neutral-light)' }}>
              <td style={tdStyle}><code style={{ fontSize: 12, color: 'var(--helix-color-text-neutral)' }}>{key}</code></td>
              <td style={tdStyle}>
                <div style={{
                  width: SPACING_PX[key],
                  height: 12,
                  borderRadius: 999,
                  background: 'var(--helix-color-fill-surface)',
                }}>
                  <div style={{ width: '100%', height: '100%', borderRadius: 999, background: 'var(--helix-color-fill-neutral)', border: '1px solid var(--helix-color-border-neutral-dark)' }} />
                </div>
              </td>
              <td style={tdStyle}><code style={{ fontSize: 11, color: 'var(--helix-color-text-neutral-light)' }}>{SPACING_PX[key]}</code></td>
              <td style={{ ...tdStyle, borderRight: 'none' }}><span style={{ fontSize: 12, color: 'var(--helix-color-text-neutral-light)' }}>{semantic.spacing[key]?.$description}</span></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  ),
};

// ── Radius ───────────────────────────────────────────────────────────────

export const Radius: Story = {
  render: () => (
    <div>
      <StoryHeader title="Radius" description="No primitive layer exists for radius — these values ARE the scale, defined directly at the semantic layer." />
      <table style={tableStyle}>
        <thead>
          <tr style={{ background: 'var(--helix-color-fill-surface)' }}>
            <th style={thStyle}>Token</th>
            <th style={thStyle}>Preview</th>
            <th style={thStyle}>Value</th>
            <th style={{ ...thStyle, borderRight: 'none' }}>Description</th>
          </tr>
        </thead>
        <tbody>
          {(['none', 'xs', 's', 'm', 'l', 'xl', '2xl', '3xl', 'full']).map(key => (
            <tr key={key} style={{ borderTop: '1px solid var(--helix-color-border-neutral-light)' }}>
              <td style={tdStyle}><code style={{ fontSize: 12, color: 'var(--helix-color-text-neutral)' }}>{key}</code></td>
              <td style={tdStyle}>
                <div style={{
                  width: 72,
                  height: 72,
                  background: 'var(--helix-color-fill-surface)',
                  border: '2px solid var(--helix-color-border-neutral-dark)',
                  borderRadius: RADIUS_PX[key],
                }} />
              </td>
              <td style={tdStyle}><code style={{ fontSize: 11, color: 'var(--helix-color-text-neutral-light)' }}>{RADIUS_PX[key]}</code></td>
              <td style={{ ...tdStyle, borderRight: 'none' }}><span style={{ fontSize: 12, color: 'var(--helix-color-text-neutral-light)' }}>{semantic.radius[key]?.$description}</span></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  ),
};

// ── Sizing (ADR-004 control/field ladder) ──────────────────────────────

export const Sizing: Story = {
  render: () => (
    <div>
      <StoryHeader title="Sizing" description="semantic.size — the shared t-shirt height ladder for Button and Input/Select." />
      <table style={tableStyle}>
        <thead>
          <tr style={{ background: 'var(--helix-color-fill-surface)' }}>
            <th style={thStyle}>Token</th>
            <th style={thStyle}>Preview</th>
            <th style={thStyle}>Value</th>
            <th style={{ ...thStyle, borderRight: 'none' }}>Description</th>
          </tr>
        </thead>
        <tbody>
          {(['xs', 's', 'm', 'l', 'xl', '2xl']).map(key => (
            <tr key={key} style={{ borderTop: '1px solid var(--helix-color-border-neutral-light)' }}>
              <td style={tdStyle}><code style={{ fontSize: 12, color: 'var(--helix-color-text-neutral)' }}>control.{key}</code></td>
              <td style={tdStyle}>
                <div style={{
                  width: SIZE_CONTROL_PX[key],
                  height: SIZE_CONTROL_PX[key],
                  background: 'var(--helix-color-fill-surface)',
                  border: '2px solid var(--helix-color-border-neutral-dark)',
                  borderRadius: 'var(--helix-radius-s)',
                }} />
              </td>
              <td style={tdStyle}><code style={{ fontSize: 11, color: 'var(--helix-color-text-neutral-light)' }}>{SIZE_CONTROL_PX[key]}</code></td>
              <td style={{ ...tdStyle, borderRight: 'none' }}><span style={{ fontSize: 12, color: 'var(--helix-color-text-neutral-light)' }}>{semantic.size[key]?.$description}</span></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  ),
};

// ── Shadows ──────────────────────────────────────────────────────────────

export const Shadows: Story = {
  render: () => (
    <div>
      <StoryHeader title="Shadows" description="The shadow scale components actually consume — aliases the raw primitive.shadow.* elevation values." />
      <table style={tableStyle}>
        <thead>
          <tr style={{ background: 'var(--helix-color-fill-surface)' }}>
            <th style={thStyle}>Token</th>
            <th style={thStyle}>Preview</th>
            <th style={thStyle}>Value</th>
            <th style={{ ...thStyle, borderRight: 'none' }}>Description</th>
          </tr>
        </thead>
        <tbody>
          {(['xs', 's', 'm', 'l', 'xl', 'focus']).map(s => (
            <tr key={s} style={{ borderTop: '1px solid var(--helix-color-border-neutral-light)' }}>
              <td style={tdStyle}><code style={{ fontSize: 12, color: 'var(--helix-color-text-neutral)' }}>shadow.{s}</code></td>
              <td style={tdStyle}>
                <div style={{
                  width: 96,
                  height: 56,
                  background: 'var(--helix-color-fill-surface)',
                  borderRadius: 8,
                  boxShadow: `var(--helix-shadow-${s})`,
                }} />
              </td>
              <td style={tdStyle}><code style={{ fontSize: 11, color: 'var(--helix-color-text-neutral-light)' }}>var(--helix-shadow-{s})</code></td>
              <td style={{ ...tdStyle, borderRight: 'none' }}><span style={{ fontSize: 12, color: 'var(--helix-color-text-neutral-light)' }}>{semantic.shadow[s]?.$description}</span></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  ),
};

// ── Motion (duration + easing, interactive) ──────────────────────────────

// Derived from tokens.json (semantic alias → primitive value), so a new duration rung shows up on its own.
// Values are DTCG 2025.10 shapes ({ value, unit }, [x1, y1, x2, y2]) — toCss renders them ("150ms", "cubic-bezier(…)").
const primitiveDuration = (tokensJson.primitive as unknown as { duration: Record<string, TokenLeaf> }).duration;
const DURATION_MS: Record<string, string> = Object.fromEntries(Object.entries(semantic.duration).map(([key, leaf]) => {
  const ref = String(leaf.$value).match(/^\{primitive\.duration\.(\w+)\}$/)?.[1];
  const target = ref ? primitiveDuration[ref] : leaf;
  return [key, target ? toCss(target.$value, 'duration') : '0ms'];
}));
// Derived from tokens.json like DURATION_MS — a semantic easing either aliases a primitive or is a literal.
const primitiveEasing = (tokensJson.primitive as unknown as { easing: Record<string, TokenLeaf> }).easing;
const EASING_CURVE: Record<string, string> = Object.fromEntries(Object.entries(semantic.easing).map(([key, leaf]) => {
  const ref = String(leaf.$value).match(/^\{primitive\.easing\.(\w+)\}$/)?.[1];
  const target = ref ? primitiveEasing[ref] : leaf;
  return [key, target ? toCss(target.$value, 'cubicBezier') : ''];
}));

function DurationPreview({ duration, selected }: { duration: string; selected: boolean }) {
  const [filled, setFilled] = useState(false);
  const durationMs = Number((DURATION_MS[duration] ?? '0ms').replace('ms', ''));

  useEffect(() => {
    setFilled(false);
    const start = window.setTimeout(() => setFilled(true), 40);
    const end = window.setTimeout(() => setFilled(false), durationMs + 3040);
    const loop = window.setInterval(() => {
      setFilled(false);
      window.setTimeout(() => setFilled(true), 40);
      window.setTimeout(() => setFilled(false), durationMs + 3040);
    }, durationMs + 3040);

    return () => {
      window.clearTimeout(start);
      window.clearTimeout(end);
      window.clearInterval(loop);
    };
  }, [duration]);

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--helix-spacing-s)' }}>
      <div style={{ width: 66, height: 14, borderRadius: 999, border: '1px solid var(--helix-color-border-neutral-dark)', background: 'var(--helix-color-fill-surface)', overflow: 'hidden', position: 'relative' }}>
        <div
          style={{
            position: 'absolute',
            inset: 0,
            width: filled ? '100%' : '0%',
            height: '100%',
            borderRadius: 999,
            background: selected ? 'var(--helix-color-fill-neutral-dark)' : 'var(--helix-color-fill-neutral)',
            transition: `width var(--helix-duration-${duration}) var(--helix-easing-out)`,
          }}
        />
      </div>
      <span style={{ fontSize: 13, color: 'var(--helix-color-text-neutral-light)' }}>{(durationMs / 1000).toFixed(durationMs < 1000 ? 2 : 1).replace(/\.0+$/, '')}s</span>
    </div>
  );
}

function EasingPreview({ easing }: { easing: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--helix-spacing-s)' }}>
      <svg width="34" height="34" viewBox="0 0 34 34" style={{ flexShrink: 0, overflow: 'visible' }}>
        <path d="M 6 28 C 8 10 14 6 28 6" fill="none" stroke="var(--helix-color-border-neutral-dark)" strokeWidth="2" strokeLinecap="round" />
      </svg>
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--helix-spacing-xs)' }}>
        <div style={{ width: 58, height: 10, borderRadius: 999, background: 'var(--helix-color-fill-neutral-lightest)', position: 'relative' }}>
          <div style={{ position: 'absolute', right: 0, top: -2, width: 14, height: 14, borderRadius: 999, background: 'var(--helix-color-fill-neutral-dark)' }} />
        </div>
        <span style={{ fontFamily: 'monospace', fontSize: 13, color: 'var(--helix-color-text-neutral-light)' }}>{EASING_CURVE[easing]}</span>
      </div>
    </div>
  );
}

function TransformPreview({ kind, token }: { kind: 'lift' | 'scale'; token: string }) {
  const style: React.CSSProperties =
    kind === 'lift'
      ? { transform: `translateY(var(--helix-transform-lift-${token}))` }
      : { transform: `scale(var(--helix-transform-scale-${token}))` };
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--helix-spacing-s)' }}>
      <div style={{ width: 68, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: 'var(--helix-radius-s)',
            background: 'var(--helix-color-fill-neutral)',
            border: '1px solid var(--helix-color-border-neutral-dark)',
            ...style,
          }}
        />
      </div>
      <code style={{ fontSize: 12, color: 'var(--helix-color-text-neutral-light)' }}>
        var(--helix-transform-{kind}-{token})
      </code>
    </div>
  );
}

export const Motion: Story = {
  render: () => {
    const [active, setActive] = useState<string | null>('base');

    function toggle(name: string) {
      setActive(prev => prev === name ? null : name);
    }
    return (
      <div>
        <StoryHeader title="Motion" description="Duration and easing tokens for animations and transitions. Duration uses a simple visual bar and easing shows the curve with its value inline." />
        <TableGroup title="Duration">
          <table style={tableStyle}>
            <thead>
              <tr style={{ background: 'var(--helix-color-fill-surface)' }}>
                <th style={thStyle}>Token</th>
                <th style={thStyle}>Value</th>
                <th style={{ ...thStyle, borderRight: 'none' }}>Description</th>
              </tr>
            </thead>
            <tbody>
              {Object.keys(DURATION_MS).map(key => {
                const on = active === key;
                return (
                  <tr key={key} style={{ borderTop: '1px solid var(--helix-color-border-neutral-light)' }}>
                    <td style={tdStyle}><code style={{ fontSize: 12, color: 'var(--helix-color-text-neutral)' }}>duration.{key}</code></td>
                    <td style={tdStyle}>
                      <DurationPreview duration={key} selected={on} />
                    </td>
                    <td style={{ ...tdStyle, borderRight: 'none' }}><span style={{ fontSize: 12, color: 'var(--helix-color-text-neutral-light)' }}>{semantic.duration[key]?.$description}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </TableGroup>
        <TableGroup title="Easing">
          <table style={tableStyle}>
            <thead>
              <tr style={{ background: 'var(--helix-color-fill-surface)' }}>
                <th style={thStyle}>Token</th>
                <th style={thStyle}>Value</th>
                <th style={{ ...thStyle, borderRight: 'none' }}>Description</th>
              </tr>
            </thead>
            <tbody>
              {Object.keys(EASING_CURVE).map(key => (
                <tr key={key} style={{ borderTop: '1px solid var(--helix-color-border-neutral-light)' }}>
                  <td style={tdStyle}><code style={{ fontSize: 12, color: 'var(--helix-color-text-neutral)' }}>easing.{key}</code></td>
                  <td style={tdStyle}>
                    <EasingPreview easing={key} />
                  </td>
                  <td style={{ ...tdStyle, borderRight: 'none' }}><span style={{ fontSize: 12, color: 'var(--helix-color-text-neutral-light)' }}>{semantic.easing[key]?.$description}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableGroup>
        <TableGroup title="Transform">
          <table style={tableStyle}>
            <thead>
              <tr style={{ background: 'var(--helix-color-fill-surface)' }}>
                <th style={thStyle}>Token</th>
                <th style={thStyle}>Preview</th>
                <th style={{ ...thStyle, borderRight: 'none' }}>Description</th>
              </tr>
            </thead>
            <tbody>
              {(['s', 'm', 'l']).map(key => (
                <tr key={`lift-${key}`} style={{ borderTop: '1px solid var(--helix-color-border-neutral-light)' }}>
                  <td style={tdStyle}><code style={{ fontSize: 12, color: 'var(--helix-color-text-neutral)' }}>transform.lift.{key}</code></td>
                  <td style={tdStyle}><TransformPreview kind="lift" token={key} /></td>
                  <td style={{ ...tdStyle, borderRight: 'none' }}><span style={{ fontSize: 12, color: 'var(--helix-color-text-neutral-light)' }}>{semantic.transform.lift[key]?.$description}</span></td>
                </tr>
              ))}
              {(['s', 'm', 'l']).map(key => (
                <tr key={`scale-${key}`} style={{ borderTop: '1px solid var(--helix-color-border-neutral-light)' }}>
                  <td style={tdStyle}><code style={{ fontSize: 12, color: 'var(--helix-color-text-neutral)' }}>transform.scale.{key}</code></td>
                  <td style={tdStyle}><TransformPreview kind="scale" token={key} /></td>
                  <td style={{ ...tdStyle, borderRight: 'none' }}><span style={{ fontSize: 12, color: 'var(--helix-color-text-neutral-light)' }}>{semantic.transform.scale[key]?.$description}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableGroup>
      </div>
    );
  },
};
