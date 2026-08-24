import type { Meta, StoryObj } from '@storybook/react';
import { label12, StoryHeader, TableGroup } from './_shared';

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
      <StoryHeader
        title="Color"
        description="Raw color scales — 10 steps per family (50→900). Gray includes step 0 (white) and skips 800 in the display. Always use --helix-color-* (Semantic) in components, never these primitives directly."
      />
      <PaletteRow name="blue"      prefix="blue"      steps={SCALE_10} />
      <PaletteRow name="gray"      prefix="gray"      steps={['0','50','100','200','300','400','500','600','700','900']} />
      <PaletteRow name="green"     prefix="green"     steps={SCALE_10} />
      <PaletteRow name="orange"    prefix="orange"    steps={SCALE_10} />
      <PaletteRow name="red"       prefix="red"       steps={SCALE_10} />
      <PaletteRow name="turquoise" prefix="turquoise" steps={SCALE_10} />
    </div>
  ),
};

// ── Typography ───────────────────────────────────────────────────────────

export const Typography: Story = {
  render: () => {
    const tables = [
      {
        title: 'Font size',
        rows: [
          { token: 'fontSize-6xl', value: '64px', preview: <span style={{ fontSize: 'var(--helix-primitive-fontSize-6xl)', fontWeight: 'var(--helix-primitive-fontWeight-semibold)' }}>The quick brown fox</span> },
          { token: 'fontSize-5xl', value: '56px', preview: <span style={{ fontSize: 'var(--helix-primitive-fontSize-5xl)', fontWeight: 'var(--helix-primitive-fontWeight-semibold)' }}>The quick brown fox</span> },
          { token: 'fontSize-4xl', value: '48px', preview: <span style={{ fontSize: 'var(--helix-primitive-fontSize-4xl)', fontWeight: 'var(--helix-primitive-fontWeight-semibold)' }}>The quick brown fox</span> },
          { token: 'fontSize-3xl', value: '40px', preview: <span style={{ fontSize: 'var(--helix-primitive-fontSize-3xl)', fontWeight: 'var(--helix-primitive-fontWeight-semibold)' }}>The quick brown fox</span> },
          { token: 'fontSize-2xl', value: '32px', preview: <span style={{ fontSize: 'var(--helix-primitive-fontSize-2xl)', fontWeight: 'var(--helix-primitive-fontWeight-semibold)' }}>The quick brown fox</span> },
          { token: 'fontSize-xl', value: '24px', preview: <span style={{ fontSize: 'var(--helix-primitive-fontSize-xl)', fontWeight: 'var(--helix-primitive-fontWeight-semibold)' }}>The quick brown fox</span> },
          { token: 'fontSize-l', value: '18px', preview: <span style={{ fontSize: 'var(--helix-primitive-fontSize-l)', fontWeight: 'var(--helix-primitive-fontWeight-semibold)' }}>The quick brown fox</span> },
          { token: 'fontSize-m', value: '14px', preview: <span style={{ fontSize: 'var(--helix-primitive-fontSize-m)', fontWeight: 'var(--helix-primitive-fontWeight-semibold)' }}>The quick brown fox</span> },
          { token: 'fontSize-s', value: '12px', preview: <span style={{ fontSize: 'var(--helix-primitive-fontSize-s)', fontWeight: 'var(--helix-primitive-fontWeight-semibold)' }}>The quick brown fox</span> },
        ],
      },
      {
        title: 'Font weights',
        rows: [
          { token: 'fontWeight-regular', value: '400', preview: <span style={{ fontSize: 18, fontWeight: 'var(--helix-primitive-fontWeight-regular)' }}>Helix DS</span> },
          { token: 'fontWeight-medium', value: '500', preview: <span style={{ fontSize: 18, fontWeight: 'var(--helix-primitive-fontWeight-medium)' }}>Helix DS</span> },
          { token: 'fontWeight-semibold', value: '600', preview: <span style={{ fontSize: 18, fontWeight: 'var(--helix-primitive-fontWeight-semibold)' }}>Helix DS</span> },
          { token: 'fontWeight-bold', value: '700', preview: <span style={{ fontSize: 18, fontWeight: 'var(--helix-primitive-fontWeight-bold)' }}>Helix DS</span> },
        ],
      },
      {
        title: 'Line height ratios',
        rows: [
          { token: 'lineHeight-tight', value: '1.2', preview: <div style={{ width: 140, padding: '8px 10px', borderRadius: 4, background: 'var(--helix-color-fill-surface)', border: '1px solid var(--helix-color-border-neutral-light)', fontSize: 13, lineHeight: 'var(--helix-primitive-lineHeight-tight)', color: 'var(--helix-color-text-neutral)' }}>Helix DS<br />Type scale<br />Line height</div> },
          { token: 'lineHeight-snug', value: '1.35', preview: <div style={{ width: 140, padding: '8px 10px', borderRadius: 4, background: 'var(--helix-color-fill-surface)', border: '1px solid var(--helix-color-border-neutral-light)', fontSize: 13, lineHeight: 'var(--helix-primitive-lineHeight-snug)', color: 'var(--helix-color-text-neutral)' }}>Helix DS<br />Type scale<br />Line height</div> },
          { token: 'lineHeight-normal', value: '1.5', preview: <div style={{ width: 140, padding: '8px 10px', borderRadius: 4, background: 'var(--helix-color-fill-surface)', border: '1px solid var(--helix-color-border-neutral-light)', fontSize: 13, lineHeight: 'var(--helix-primitive-lineHeight-normal)', color: 'var(--helix-color-text-neutral)' }}>Helix DS<br />Type scale<br />Line height</div> },
          { token: 'lineHeight-relaxed', value: '1.65', preview: <div style={{ width: 140, padding: '8px 10px', borderRadius: 4, background: 'var(--helix-color-fill-surface)', border: '1px solid var(--helix-color-border-neutral-light)', fontSize: 13, lineHeight: 'var(--helix-primitive-lineHeight-relaxed)', color: 'var(--helix-color-text-neutral)' }}>Helix DS<br />Type scale<br />Line height</div> },
        ],
      },
      {
        title: 'Font families',
        rows: [
          { token: 'fontFamily-sans', value: 'Inter stack', preview: <div style={{ fontFamily: 'var(--helix-primitive-fontFamily-sans)', fontSize: 22, color: 'var(--helix-color-text-neutral)', lineHeight: 1.3 }}>The quick brown fox jumps over the lazy dog</div> },
          { token: 'fontFamily-mono', value: 'Monospace stack', preview: <div style={{ fontFamily: 'var(--helix-primitive-fontFamily-mono)', fontSize: 22, color: 'var(--helix-color-text-neutral)', lineHeight: 1.3 }}>The quick brown fox jumps over the lazy dog</div> },
        ],
      },
    ];
    return (
      <div>
        <StoryHeader title="Typography" description="Font size, weight, line-height ratios, and font family — the raw building blocks." />
        {tables.map((table) => (
          <TableGroup key={table.title} title={table.title}>
            <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid var(--helix-color-border-neutral)', borderRadius: 12, overflow: 'hidden' }}>
              <thead>
                <tr style={{ background: 'var(--helix-color-fill-surface)' }}>
                  <th style={{ textAlign: 'left', padding: '10px 12px', fontSize: 11, fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--helix-color-text-neutral-lightest)', borderBottom: '1px solid var(--helix-color-border-neutral)', borderRight: '1px solid var(--helix-color-border-neutral-light)' }}>Token</th>
                  <th style={{ textAlign: 'left', padding: '10px 12px', fontSize: 11, fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--helix-color-text-neutral-lightest)', borderBottom: '1px solid var(--helix-color-border-neutral)', borderRight: '1px solid var(--helix-color-border-neutral-light)' }}>Value</th>
                  <th style={{ textAlign: 'left', padding: '10px 12px', fontSize: 11, fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--helix-color-text-neutral-lightest)', borderBottom: '1px solid var(--helix-color-border-neutral)', borderRight: '1px solid var(--helix-color-border-neutral-light)' }}>Preview</th>
                </tr>
              </thead>
              <tbody>
                {table.rows.map((row) => (
                  <tr key={row.token} style={{ borderTop: '1px solid var(--helix-color-border-neutral-light)' }}>
                    <td style={{ padding: '12px', verticalAlign: 'top', borderRight: '1px solid var(--helix-color-border-neutral-light)' }}><code style={{ fontSize: 12 }}>{row.token}</code></td>
                    <td style={{ padding: '12px', verticalAlign: 'top', borderRight: '1px solid var(--helix-color-border-neutral-light)' }}>{row.value}</td>
                    <td style={{ padding: '12px', verticalAlign: 'top', borderRight: '1px solid var(--helix-color-border-neutral-light)' }}>{row.preview}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableGroup>
        ))}
      </div>
    );
  },
};
