import type { Meta, StoryObj } from '@storybook/react';
import { label12, SectionHead, SpacingBar } from './_shared';

const meta: Meta = {
  title: 'Foundation/Semantic',
  parameters: { layout: 'padded' },
};

export default meta;
type Story = StoryObj;

// ── Spacing (t-shirt scale) ─────────────────────────────────────────────

export const Spacing: Story = {
  render: () => {
    const steps: [string, string][] = [
      ['xs', '8px'], ['s', '12px'], ['m', '16px'], ['l', '24px'], ['xl', '32px'],
    ];
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {steps.map(([key, val]) => (
          <SpacingBar key={key} tokenKey={key} varName={`--helix-spacing-${key}`} val={val} />
        ))}
      </div>
    );
  },
  parameters: {
    docs: { description: { story: 'The t-shirt spacing scale components actually consume — aliases Foundation/Primitives → Spacing.' } },
  },
};

// ── Radius ───────────────────────────────────────────────────────────────

export const Radius: Story = {
  render: () => {
    const steps: [string, string][] = [
      ['none', '0px'], ['xs', '2px'], ['s', '4px'], ['m', '6px'],
      ['l', '8px'], ['xl', '12px'], ['2xl', '16px'], ['3xl', '24px'], ['full', '9999px'],
    ];
    return (
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24 }}>
        {steps.map(([key, val]) => (
          <div key={key} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 72, height: 72,
              background: 'var(--helix-color-fill-primary-light)',
              border: '2px solid var(--helix-color-fill-primary)',
              borderRadius: `var(--helix-radius-${key})`,
            }} />
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--helix-color-text-neutral)', fontFamily: 'monospace' }}>{key}</div>
              <div style={{ fontSize: 11, color: 'var(--helix-color-text-neutral-lightest)' }}>{val}</div>
            </div>
          </div>
        ))}
      </div>
    );
  },
  parameters: {
    docs: { description: { story: 'No primitive layer exists for radius — these values ARE the scale, defined directly at the semantic layer.' } },
  },
};

// ── Sizing (ADR-004 control/field ladder) ──────────────────────────────

export const Sizing: Story = {
  render: () => {
    const steps: [string, string][] = [
      ['xs', '16px'], ['s', '24px'], ['m', '32px'], ['l', '40px'], ['xl', '48px'],
    ];
    return (
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24, alignItems: 'flex-end' }}>
        {steps.map(([key, val]) => (
          <div key={key} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 72,
              height: `var(--helix-size-control-${key})`,
              background: 'var(--helix-color-fill-primary-light)',
              border: '2px solid var(--helix-color-fill-primary)',
              borderRadius: 'var(--helix-radius-s)',
            }} />
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--helix-color-text-neutral)', fontFamily: 'monospace' }}>{key}</div>
              <div style={{ fontSize: 11, color: 'var(--helix-color-text-neutral-lightest)' }}>{val}</div>
            </div>
          </div>
        ))}
      </div>
    );
  },
  parameters: {
    docs: { description: { story: 'semantic.size.control — the shared height ladder for Button and Input/Select (ADR-004).' } },
  },
};

// ── Line height (paired with fontSize) ──────────────────────────────────

export const LineHeight: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
      {(['xs', 's', 'm', 'l', 'xl', '2xl', '3xl', '4xl', '5xl', '6xl']).map(key => (
        <div key={key} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{
            width: 120, padding: '8px 10px', borderRadius: 4,
            background: 'var(--helix-color-fill-surface)',
            border: '1px solid var(--helix-color-border-neutral-light)',
            fontSize: 13,
            lineHeight: `var(--helix-lineHeight-${key})`,
            color: 'var(--helix-color-text-neutral)',
          }}>
            Helix DS<br />lineHeight-{key}
          </div>
          <span style={{ ...label12, textAlign: 'left' }}>fontSize-{key}</span>
        </div>
      ))}
    </div>
  ),
  parameters: {
    docs: { description: { story: 'Every fontSize key has a paired lineHeight — same key, always. This is the scale components actually bind to (aliases Foundation/Primitives → Typography → Line height ratios).' } },
  },
};

// ── Font size — mobile override ─────────────────────────────────────────

export const FontSizeMobile: Story = {
  name: 'Font size — mobile override',
  render: () => {
    const steps: [string, string, string][] = [
      ['l', '18px', '16px'], ['xl', '24px', '21px'], ['2xl', '32px', '28px'],
      ['3xl', '40px', '35px'], ['4xl', '48px', '42px'], ['5xl', '56px', '49px'],
      ['6xl', '64px', '56px'],
    ];
    return (
      <div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {steps.map(([key, desktop, mobile]) => (
            <div key={key} style={{ display: 'flex', alignItems: 'baseline', gap: 16 }}>
              <span style={{ ...label12, width: 36, textAlign: 'right' }}>{key}</span>
              <span style={{ fontSize: `var(--helix-primitive-fontSize-${key})`, color: 'var(--helix-color-text-neutral)' }}>Aa</span>
              <span style={{ ...label12, width: 50 }}>{desktop}</span>
              <span style={{ ...label12, color: 'var(--helix-color-text-neutral-lightest)' }}>→</span>
              <span style={{ fontSize: `var(--helix-fontSize-mobile-${key})`, color: 'var(--helix-color-text-neutral)' }}>Aa</span>
              <span style={{ ...label12, width: 50 }}>{mobile}</span>
            </div>
          ))}
        </div>
        <p style={{ fontSize: 12, color: 'var(--helix-color-text-neutral-lightest)', marginTop: 16, maxWidth: 480 }}>
          87.5% of desktop, only for keys ≥18px (<code>l</code>–<code>6xl</code>) — <code>xs</code>/<code>s</code>/<code>m</code> stay
          constant across breakpoints. This is the Storybook mirror of the `@media (max-width: 767px)` block
          `build.ts` emits and the Figma `Responsive` collection's mobile mode.
        </p>
      </div>
    );
  },
};

// ── Shadows ──────────────────────────────────────────────────────────────

export const Shadows: Story = {
  render: () => {
    const steps = ['xs', 's', 'm', 'l', 'xl', 'focus'];
    return (
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 40 }}>
        {steps.map(s => (
          <div key={s} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 100, height: 72,
              background: 'var(--helix-color-fill-page)',
              borderRadius: 8,
              boxShadow: `var(--helix-shadow-${s})`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <span style={{ ...label12, fontSize: 12, color: 'var(--helix-color-text-neutral)' }}>shadow-{s}</span>
            </div>
          </div>
        ))}
      </div>
    );
  },
  decorators: [Story => (
    <div style={{ background: 'var(--helix-color-fill-surface)', padding: 48, borderRadius: 12 }}>
      <Story />
    </div>
  )],
};
