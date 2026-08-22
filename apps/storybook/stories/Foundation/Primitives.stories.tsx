import type { Meta, StoryObj } from '@storybook/react';
import { label12, SectionHead, SpacingBar } from './_shared';

const meta: Meta = {
  title: 'Foundation/Primitives',
  parameters: { layout: 'padded' },
};

export default meta;
type Story = StoryObj;

// ── Color ────────────────────────────────────────────────────────────────

function PaletteRow({ name, prefix, steps }: { name: string; prefix: string; steps: string[] }) {
  return (
    <div style={{ marginBottom: 28 }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--helix-color-text-neutral)', marginBottom: 10 }}>
        {name}
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {steps.map(step => (
          <div key={step} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <div style={{
              width: 52, height: 52, borderRadius: 8,
              background: `var(--helix-primitive-color-${prefix}-${step})`,
              border: '1px solid var(--helix-color-border-neutral-light)',
            }} />
            <span style={{ ...label12, maxWidth: 52 }}>{step}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

const SCALE_10 = ['50','100','200','300','400','500','600','700','800','900'];

export const Color: Story = {
  render: () => (
    <div>
      <PaletteRow name="blue"      prefix="blue"      steps={SCALE_10} />
      <PaletteRow name="gray"      prefix="gray"      steps={['0','50','100','200','300','400','500','600','700','900']} />
      <PaletteRow name="green"     prefix="green"     steps={SCALE_10} />
      <PaletteRow name="orange"    prefix="orange"    steps={SCALE_10} />
      <PaletteRow name="red"       prefix="red"       steps={SCALE_10} />
      <PaletteRow name="turquoise" prefix="turquoise" steps={SCALE_10} />
    </div>
  ),
  parameters: {
    docs: { description: { story: 'Raw color scales — 10 steps per family (50→900). Gray includes step 0 (white) and skips 800 in the display. Always use `--helix-color-*` (Semantic) in components, never these primitives directly.' } },
  },
};

// ── Spacing ──────────────────────────────────────────────────────────────

export const Spacing: Story = {
  render: () => {
    const steps: [string, string][] = [
      ['0', '0px'], ['25', '4px'], ['50', '8px'], ['75', '12px'],
      ['100', '16px'], ['125', '20px'], ['150', '24px'], ['175', '28px'],
      ['200', '32px'], ['250', '40px'], ['300', '48px'], ['350', '56px'],
      ['400', '64px'], ['500', '80px'], ['600', '96px'], ['800', '128px'],
    ];
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {steps.map(([key, val]) => (
          <SpacingBar key={key} tokenKey={key} varName={`--helix-primitive-spacing-${key}`} val={val} dim={val} />
        ))}
      </div>
    );
  },
  parameters: {
    docs: { description: { story: 'Percentage scale, `100` = 16px anchor. Never used directly in components — see Foundation/Semantic → Spacing for the t-shirt scale that actually gets consumed.' } },
  },
};

// ── Radius ───────────────────────────────────────────────────────────────

export const Radius: Story = {
  render: () => (
    <div style={{
      padding: 20, borderRadius: 8,
      background: 'var(--helix-color-fill-surface)',
      border: '1px solid var(--helix-color-border-neutral-light)',
      color: 'var(--helix-color-text-neutral-light)',
      fontSize: 13, maxWidth: 480,
    }}>
      Radius has <strong>no primitive layer</strong> — there is nothing to alias underneath. The semantic
      names (<code>none</code>, <code>xs</code>…<code>full</code>) ARE the scale. See Foundation/Semantic →
      Radius for the actual token set.
    </div>
  ),
};

// ── Typography ───────────────────────────────────────────────────────────

export const Typography: Story = {
  render: () => {
    const sizes: [string, string, string][] = [
      ['6xl', '64px', 'Display+'],
      ['5xl', '56px', 'Display'],
      ['4xl', '48px', 'H1'],
      ['3xl', '40px', 'H2'],
      ['2xl', '32px', 'H3'],
      ['xl',  '24px', 'H4'],
      ['l',   '18px', 'Body Large'],
      ['m',   '14px', 'Body'],
      ['s',   '12px', 'Small'],
      ['xs',  '11px', 'Caption'],
    ];
    return (
      <div>
        <SectionHead title="Font size" />
        {sizes.map(([key, val, name], i) => (
          <div key={key} style={{
            display: 'flex', alignItems: 'baseline', gap: 24, paddingBlock: 14,
            borderBottom: i < sizes.length - 1 ? '1px solid var(--helix-color-border-neutral-light)' : 'none',
          }}>
            <div style={{ width: 130, flexShrink: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--helix-color-text-neutral)' }}>{name}</div>
              <div style={{ fontSize: 11, color: 'var(--helix-color-text-neutral-lightest)', fontFamily: 'monospace' }}>
                fontSize-{key} · {val}
              </div>
            </div>
            <span style={{
              fontSize:   `var(--helix-primitive-fontSize-${key})`,
              fontWeight: 'var(--helix-primitive-fontWeight-semibold)',
              color:      'var(--helix-color-text-neutral)',
              lineHeight: 'var(--helix-primitive-lineHeight-tight)',
            }}>
              The quick brown fox
            </span>
          </div>
        ))}
        <div style={{ marginTop: 32 }}>
          <SectionHead title="Font weights" />
          <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap' }}>
            {[['regular','400'],['medium','500'],['semibold','600'],['bold','700']].map(([key, val]) => (
              <div key={key} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span style={{
                  fontSize: 18, color: 'var(--helix-color-text-neutral)',
                  fontWeight: `var(--helix-primitive-fontWeight-${key})` as React.CSSProperties['fontWeight'],
                }}>
                  Helix DS
                </span>
                <span style={{ ...label12 }}>{key} · {val}</span>
              </div>
            ))}
          </div>
        </div>
        <div style={{ marginTop: 32 }}>
          <SectionHead title="Line height ratios" />
          <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap' }}>
            {([
              ['tight',   '1.2',  'Headings'],
              ['snug',    '1.35', ''],
              ['normal',  '1.5',  'Body'],
              ['relaxed', '1.65', ''],
            ] as [string, string, string][]).map(([key, val, role]) => (
              <div key={key} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{
                  width: 140, padding: '8px 10px', borderRadius: 4,
                  background: 'var(--helix-color-fill-surface)',
                  border: '1px solid var(--helix-color-border-neutral-light)',
                  fontSize: 13,
                  lineHeight: `var(--helix-primitive-lineHeight-${key})`,
                  color: 'var(--helix-color-text-neutral)',
                }}>
                  Helix DS<br />Type scale<br />Line height
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--helix-color-text-neutral)', fontFamily: 'monospace' }}>{key}</span>
                  <span style={{ ...label12, textAlign: 'left' }}>{val}{role ? ` · ${role}` : ''}</span>
                </div>
              </div>
            ))}
          </div>
          <p style={{ fontSize: 12, color: 'var(--helix-color-text-neutral-lightest)', marginTop: 12, maxWidth: 480 }}>
            These 4 ratios are never used directly — see Foundation/Semantic → Line height for the actual
            per-fontSize-key scale (<code>xs</code>…<code>6xl</code>) that components consume.
          </p>
        </div>
        <div style={{ marginTop: 40 }}>
          <SectionHead title="Font families" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {([
              ['sans', '--helix-primitive-fontFamily-sans', 'Inter, ui-sans-serif, system-ui, sans-serif'],
              ['mono', '--helix-primitive-fontFamily-mono', 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace'],
            ] as [string, string, string][]).map(([key, token, stack]) => (
              <div key={key} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ display: 'flex', gap: 10, alignItems: 'baseline' }}>
                  <span style={{ ...label12, width: 36, textAlign: 'right', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>{key}</span>
                  <span style={{ fontSize: 11, fontFamily: 'monospace', color: 'var(--helix-color-text-neutral-light)' }}>{token}</span>
                </div>
                <div style={{ fontFamily: `var(${token})`, fontSize: 22, color: 'var(--helix-color-text-neutral)', lineHeight: 1.3, paddingLeft: 46 }}>
                  The quick brown fox jumps over the lazy dog
                </div>
                <div style={{ fontSize: 11, color: 'var(--helix-color-text-neutral-lightest)', fontFamily: 'monospace', paddingLeft: 46 }}>{stack}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  },
};

// ── Shadows ──────────────────────────────────────────────────────────────

export const Shadows: Story = {
  render: () => {
    const steps = ['none', 'xs', 's', 'm', 'l', 'xl'];
    return (
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 40 }}>
        {steps.map(s => (
          <div key={s} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 100, height: 72,
              background: 'var(--helix-color-fill-page)',
              borderRadius: 8,
              boxShadow: `var(--helix-primitive-shadow-${s})`,
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
