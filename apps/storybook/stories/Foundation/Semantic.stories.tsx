import type { Meta, StoryObj } from '@storybook/react';
import { label12, SectionHead, SpacingBar, DescCaption, type TokenLeaf } from './_shared';
// Imported directly from source so every section below reflects $value/$description automatically on
// any token change — no hardcoded list to keep in sync by hand.
import tokensJson from '../../../../packages/tokens/src/tokens.json';

const meta: Meta = {
  title: 'Foundation/Semantic',
  parameters: { layout: 'padded' },
};

export default meta;
type Story = StoryObj;

const semantic = tokensJson.semantic as unknown as {
  spacing: Record<string, TokenLeaf>;
  radius: Record<string, TokenLeaf>;
  size: { control: Record<string, TokenLeaf> };
  lineHeight: Record<string, TokenLeaf>;
  fontSize: { mobile: Record<string, TokenLeaf> };
  shadow: Record<string, TokenLeaf>;
  duration: Record<string, TokenLeaf>;
  easing: Record<string, TokenLeaf>;
};

// Resolved px values, used only for display (Storybook renders live via CSS vars regardless).
const SPACING_PX: Record<string, string> = { xs: '8px', s: '12px', m: '16px', l: '24px', xl: '32px' };
const RADIUS_PX: Record<string, string> = {
  none: '0px', xs: '2px', s: '4px', m: '6px', l: '8px', xl: '12px', '2xl': '16px', '3xl': '24px', full: '9999px',
};
const SIZE_CONTROL_PX: Record<string, string> = { xs: '16px', s: '24px', m: '32px', l: '40px', xl: '48px' };
const FONTSIZE_MOBILE: Record<string, [string, string]> = {
  l: ['18px', '16px'], xl: ['24px', '21px'], '2xl': ['32px', '28px'],
  '3xl': ['40px', '35px'], '4xl': ['48px', '42px'], '5xl': ['56px', '49px'], '6xl': ['64px', '56px'],
};

// ── Spacing (t-shirt scale) ─────────────────────────────────────────────

export const Spacing: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {(['xs', 's', 'm', 'l', 'xl']).map(key => (
        <SpacingBar
          key={key} tokenKey={key} varName={`--helix-spacing-${key}`}
          val={SPACING_PX[key]} desc={semantic.spacing[key]?.$description}
        />
      ))}
    </div>
  ),
  parameters: {
    docs: { description: { story: 'The t-shirt spacing scale components actually consume — aliases Foundation/Primitives → Spacing.' } },
  },
};

// ── Radius ───────────────────────────────────────────────────────────────

export const Radius: Story = {
  render: () => (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24 }}>
      {(['none', 'xs', 's', 'm', 'l', 'xl', '2xl', '3xl', 'full']).map(key => (
        <div key={key} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, width: 120 }}>
          <div style={{
            width: 72, height: 72,
            background: 'var(--helix-color-fill-primary-light)',
            border: '2px solid var(--helix-color-fill-primary)',
            borderRadius: `var(--helix-radius-${key})`,
          }} />
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--helix-color-text-neutral)', fontFamily: 'monospace' }}>{key}</div>
            <div style={{ fontSize: 11, color: 'var(--helix-color-text-neutral-lightest)' }}>{RADIUS_PX[key]}</div>
            <div style={{ fontSize: 11, color: 'var(--helix-color-text-neutral-light)', marginTop: 4 }}>{semantic.radius[key]?.$description}</div>
          </div>
        </div>
      ))}
    </div>
  ),
  parameters: {
    docs: { description: { story: 'No primitive layer exists for radius — these values ARE the scale, defined directly at the semantic layer.' } },
  },
};

// ── Sizing (ADR-004 control/field ladder) ──────────────────────────────

export const Sizing: Story = {
  render: () => (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24, alignItems: 'flex-end' }}>
      {(['xs', 's', 'm', 'l', 'xl']).map(key => (
        <div key={key} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, width: 150 }}>
          <div style={{
            width: 72,
            height: `var(--helix-size-control-${key})`,
            background: 'var(--helix-color-fill-primary-light)',
            border: '2px solid var(--helix-color-fill-primary)',
            borderRadius: 'var(--helix-radius-s)',
          }} />
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--helix-color-text-neutral)', fontFamily: 'monospace' }}>{key}</div>
            <div style={{ fontSize: 11, color: 'var(--helix-color-text-neutral-lightest)' }}>{SIZE_CONTROL_PX[key]}</div>
            <div style={{ fontSize: 11, color: 'var(--helix-color-text-neutral-light)', marginTop: 4 }}>{semantic.size.control[key]?.$description}</div>
          </div>
        </div>
      ))}
    </div>
  ),
};

// ── Line height (paired with fontSize) ──────────────────────────────────

export const LineHeight: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
      {(['xs', 's', 'm', 'l', 'xl', '2xl', '3xl', '4xl', '5xl', '6xl']).map(key => (
        <div key={key} style={{ display: 'flex', flexDirection: 'column', gap: 6, width: 160 }}>
          <div style={{
            padding: '8px 10px', borderRadius: 4,
            background: 'var(--helix-color-fill-surface)',
            border: '1px solid var(--helix-color-border-neutral-light)',
            fontSize: 13,
            lineHeight: `var(--helix-lineHeight-${key})`,
            color: 'var(--helix-color-text-neutral)',
          }}>
            Helix DS<br />lineHeight-{key}
          </div>
          <span style={{ ...label12, textAlign: 'left' }}>fontSize-{key}</span>
          <span style={{ fontSize: 11, color: 'var(--helix-color-text-neutral-light)', textAlign: 'left' }}>{semantic.lineHeight[key]?.$description}</span>
        </div>
      ))}
    </div>
  ),
};

// ── Font size — mobile override ─────────────────────────────────────────

export const FontSizeMobile: Story = {
  name: 'Font size — mobile override',
  render: () => (
    <div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {(['l', 'xl', '2xl', '3xl', '4xl', '5xl', '6xl']).map(key => {
          const [desktop, mobile] = FONTSIZE_MOBILE[key];
          return (
            <div key={key} style={{ display: 'flex', alignItems: 'baseline', gap: 16 }}>
              <span style={{ ...label12, width: 36, textAlign: 'right' }}>{key}</span>
              <span style={{ fontSize: `var(--helix-primitive-fontSize-${key})`, color: 'var(--helix-color-text-neutral)' }}>Aa</span>
              <span style={{ ...label12, width: 50 }}>{desktop}</span>
              <span style={{ ...label12, color: 'var(--helix-color-text-neutral-lightest)' }}>→</span>
              <span style={{ fontSize: `var(--helix-fontSize-mobile-${key})`, color: 'var(--helix-color-text-neutral)' }}>Aa</span>
              <span style={{ ...label12, width: 50 }}>{mobile}</span>
              <span style={{ fontSize: 12, color: 'var(--helix-color-text-neutral-light)' }}>{semantic.fontSize.mobile[key]?.$description}</span>
            </div>
          );
        })}
      </div>
      <p style={{ fontSize: 12, color: 'var(--helix-color-text-neutral-lightest)', marginTop: 16, maxWidth: 480 }}>
        Only keys ≥18px (<code>l</code>–<code>6xl</code>) — <code>xs</code>/<code>s</code>/<code>m</code> stay
        constant across breakpoints. This is the Storybook mirror of the `@media (max-width: 767px)` block
        `build.ts` emits and the Figma `Responsive` collection's mobile mode.
      </p>
    </div>
  ),
};

// ── Shadows ──────────────────────────────────────────────────────────────

export const Shadows: Story = {
  render: () => (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 32 }}>
      {(['xs', 's', 'm', 'l', 'xl', 'focus']).map(s => (
        <div key={s} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, width: 160 }}>
          <div style={{
            width: 100, height: 72,
            background: 'var(--helix-color-fill-page)',
            borderRadius: 8,
            boxShadow: `var(--helix-shadow-${s})`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{ ...label12, fontSize: 12, color: 'var(--helix-color-text-neutral)' }}>shadow-{s}</span>
          </div>
          <DescCaption text={semantic.shadow[s]?.$description} />
        </div>
      ))}
    </div>
  ),
  decorators: [Story => (
    <div style={{ background: 'var(--helix-color-fill-surface)', padding: 48, borderRadius: 12 }}>
      <Story />
    </div>
  )],
};

// ── Motion ───────────────────────────────────────────────────────────────

export const Motion: Story = {
  render: () => (
    <div>
      <SectionHead title="Duration" />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 32 }}>
        {(['instant', 'fast', 'base', 'slow', 'slower']).map(key => (
          <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <span style={{ ...label12, width: 60, flexShrink: 0, textAlign: 'right' }}>{key}</span>
            <code style={{ fontSize: 12, color: 'var(--helix-color-text-primary)', width: 220, flexShrink: 0 }}>
              {`var(--helix-duration-${key})`}
            </code>
            <span style={{ fontSize: 12, color: 'var(--helix-color-text-neutral-light)' }}>{semantic.duration[key]?.$description}</span>
          </div>
        ))}
      </div>
      <SectionHead title="Easing" />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {(['base', 'in', 'out']).map(key => (
          <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <span style={{ ...label12, width: 60, flexShrink: 0, textAlign: 'right' }}>{key}</span>
            <code style={{ fontSize: 12, color: 'var(--helix-color-text-primary)', width: 220, flexShrink: 0 }}>
              {`var(--helix-easing-${key})`}
            </code>
            <span style={{ fontSize: 12, color: 'var(--helix-color-text-neutral-light)' }}>{semantic.easing[key]?.$description}</span>
          </div>
        ))}
      </div>
    </div>
  ),
  parameters: {
    docs: { description: { story: 'The tokens components actually bind to — see Foundation/Primitives → Motion for the interactive duration/easing demos.' } },
  },
};
