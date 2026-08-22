import type { Meta, StoryObj } from '@storybook/react';
import { IconFolder } from '@tabler/icons-react';

// ── Shared primitives ──────────────────────────────────────────────────────

const label12: React.CSSProperties = {
  fontSize: 11, fontFamily: 'monospace',
  color: 'var(--helix-color-text-neutral-light)',
  textAlign: 'center', wordBreak: 'break-all',
};

function SectionHead({ title }: { title: string }) {
  return (
    <h3 style={{
      margin: '0 0 16px',
      fontSize: 11, fontWeight: 600, letterSpacing: '0.08em',
      textTransform: 'uppercase', color: 'var(--helix-color-text-neutral-lightest)',
    }}>
      {title}
    </h3>
  );
}

// ── META ───────────────────────────────────────────────────────────────────

const meta: Meta = {
  title: 'Foundation',
  parameters: { layout: 'padded' },
};

export default meta;
type Story = StoryObj;

// ── 1. Color Primitives ────────────────────────────────────────────────────

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

export const ColorPrimitives: Story = {
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
    docs: { description: { story: 'Raw color scales — 10 steps per family (50→900). Gray includes step 0 (white) and skips 800 in the display. Always use `--helix-color-*` in components, never these primitives directly.' } },
  },
};

// ── 2. Color Semantic ─────────────────────────────────────────────────────

function FillSwatch({ token, lbl }: { token: string; lbl: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 6 }}>
      <div style={{
        width: 56, height: 56, borderRadius: 8,
        background: `var(${token})`,
        border: '1px solid var(--helix-color-border-neutral-light)',
      }} />
      <span style={{ ...label12, maxWidth: 80, textAlign: 'left' }}>{lbl}</span>
    </div>
  );
}

function TextSwatch({ token, lbl }: { token: string; lbl: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 6 }}>
      <div style={{
        width: 56, height: 56, borderRadius: 8,
        background: 'var(--helix-color-fill-surface)',
        border: '1px solid var(--helix-color-border-neutral-light)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <span style={{ fontSize: 22, fontWeight: 700, color: `var(${token})` }}>Aa</span>
      </div>
      <span style={{ ...label12, maxWidth: 80, textAlign: 'left' }}>{lbl}</span>
    </div>
  );
}

function IconSwatch({ token, lbl }: { token: string; lbl: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 6 }}>
      <div style={{
        width: 56, height: 56, borderRadius: 8,
        background: 'var(--helix-color-fill-surface)',
        border: '1px solid var(--helix-color-border-neutral-light)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <IconFolder size={22} color={`var(${token})`} />
      </div>
      <span style={{ ...label12, maxWidth: 80, textAlign: 'left' }}>{lbl}</span>
    </div>
  );
}

function BorderSwatch({ token, lbl }: { token: string; lbl: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 6 }}>
      <div style={{
        width: 56, height: 56, borderRadius: 8,
        background: 'var(--helix-color-fill-surface)',
        border: `2px solid var(${token})`,
      }} />
      <span style={{ ...label12, maxWidth: 80, textAlign: 'left' }}>{lbl}</span>
    </div>
  );
}

// Token row: label on left, swatches on right
function TokenGroup({ label, tokens, type }: {
  label: string;
  tokens: [string, string][];
  type: 'fill' | 'text' | 'border' | 'icon';
}) {
  const renderSwatch = ([token, lbl]: [string, string]) => {
    if (type === 'fill')   return <FillSwatch   key={token} token={token} lbl={lbl} />;
    if (type === 'text')   return <TextSwatch   key={token} token={token} lbl={lbl} />;
    if (type === 'border') return <BorderSwatch key={token} token={token} lbl={lbl} />;
    if (type === 'icon')   return <IconSwatch   key={token} token={token} lbl={lbl} />;
  };
  return (
    <div style={{ display: 'flex', gap: 16, marginBottom: 20, alignItems: 'flex-start' }}>
      <div style={{
        width: 110, flexShrink: 0, paddingTop: 4,
        fontSize: 12, fontWeight: 600,
        color: 'var(--helix-color-text-neutral)',
      }}>
        {label}
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
        {tokens.map(renderSwatch)}
      </div>
    </div>
  );
}

export const ColorSemantic: Story = {
  render: () => (
    <div style={{ maxWidth: 900 }}>

      <SectionHead title="Fill" />
      <TokenGroup label="Surface" type="fill" tokens={[
        ['--helix-color-fill-page',           'fill-page'],
        ['--helix-color-fill-surface',        'fill-surface'],
        ['--helix-color-fill-surface-dark', 'fill-surface-dark'],
        ['--helix-color-fill-overlay',        'fill-overlay'],
        ['--helix-color-fill-disabled',       'fill-disabled'],
      ]} />
      <TokenGroup label="Secondary" type="fill" tokens={[
        ['--helix-color-fill-secondary-interactive-default', 'fill-secondary\ninteractive-default'],
        ['--helix-color-fill-secondary-interactive-hover',   'fill-secondary\ninteractive-hover'],
        ['--helix-color-fill-secondary-interactive-press',   'fill-secondary\ninteractive-press'],
      ]} />
      <TokenGroup label="Primary" type="fill" tokens={[
        ['--helix-color-fill-primary-interactive-default', 'fill-primary\ninteractive-default'],
        ['--helix-color-fill-primary-interactive-hover',   'fill-primary\ninteractive-hover'],
        ['--helix-color-fill-primary-interactive-press',   'fill-primary\ninteractive-press'],
      ]} />
      <TokenGroup label="Primary light" type="fill" tokens={[
        ['--helix-color-fill-primary-interactive-light-default', 'fill-primary\ninteractive-light-default'],
        ['--helix-color-fill-primary-interactive-light-hover',   'fill-primary\ninteractive-light-hover'],
      ]} />
      <TokenGroup label="Danger" type="fill" tokens={[
        ['--helix-color-fill-danger-interactive-default', 'fill-danger\ninteractive-default'],
        ['--helix-color-fill-danger-interactive-hover',   'fill-danger\ninteractive-hover'],
        ['--helix-color-fill-danger-interactive-press',   'fill-danger\ninteractive-press'],
        ['--helix-color-fill-danger-interactive-light-default', 'fill-danger\ninteractive-light-default'],
        ['--helix-color-fill-danger-interactive-light-hover',   'fill-danger\ninteractive-light-hover'],
      ]} />
      <TokenGroup label="Success" type="fill" tokens={[
        ['--helix-color-fill-success-interactive-default', 'fill-success\ninteractive-default'],
        ['--helix-color-fill-success-interactive-hover',   'fill-success\ninteractive-hover'],
        ['--helix-color-fill-success-light', 'fill-success\nlight'],
      ]} />
      <TokenGroup label="Warning" type="fill" tokens={[
        ['--helix-color-fill-warning-interactive-default', 'fill-warning\ninteractive-default'],
        ['--helix-color-fill-warning-interactive-hover',   'fill-warning\ninteractive-hover'],
        ['--helix-color-fill-warning-light', 'fill-warning\nlight'],
      ]} />
      <TokenGroup label="Info" type="fill" tokens={[
        ['--helix-color-fill-info-interactive-default', 'fill-info\ninteractive-default'],
        ['--helix-color-fill-info-interactive-hover',   'fill-info\ninteractive-hover'],
        ['--helix-color-fill-info-light', 'fill-info\nlight'],
      ]} />

      <SectionHead title="Text" />
      <TokenGroup label="Gray" type="text" tokens={[
        ['--helix-color-text-neutral',   'text-neutral'],
        ['--helix-color-text-neutral-light', 'text-neutral\nlight'],
        ['--helix-color-text-neutral-lightest',  'text-neutral\nlightest'],
        ['--helix-color-text-disabled',  'text-disabled'],
        ['--helix-color-text-inverse',   'text-inverse'],
      ]} />
      <TokenGroup label="Brand" type="text" tokens={[
        ['--helix-color-text-primary',      'text-primary'],
        ['--helix-color-text-link',       'text-link'],
        ['--helix-color-text-link-hover', 'text-link\nhover'],
      ]} />
      <TokenGroup label="Status" type="text" tokens={[
        ['--helix-color-text-danger',  'text-danger'],
        ['--helix-color-text-success', 'text-success'],
        ['--helix-color-text-warning', 'text-warning'],
        ['--helix-color-text-info',    'text-info'],
      ]} />

      <SectionHead title="Icon" />
      <TokenGroup label="Gray" type="icon" tokens={[
        ['--helix-color-icon-neutral',   'icon-neutral'],
        ['--helix-color-icon-neutral-light', 'icon-neutral\nlight'],
        ['--helix-color-icon-neutral-lightest',  'icon-neutral\nlightest'],
        ['--helix-color-icon-disabled',  'icon-disabled'],
        ['--helix-color-icon-inverse',   'icon-inverse'],
      ]} />
      <TokenGroup label="Brand" type="icon" tokens={[
        ['--helix-color-icon-primary', 'icon-primary'],
      ]} />
      <TokenGroup label="Status" type="icon" tokens={[
        ['--helix-color-icon-danger',  'icon-danger'],
        ['--helix-color-icon-success', 'icon-success'],
        ['--helix-color-icon-warning', 'icon-warning'],
        ['--helix-color-icon-info',    'icon-info'],
      ]} />

      <SectionHead title="Border" />
      <TokenGroup label="Gray" type="border" tokens={[
        ['--helix-color-border-neutral-light',  'border-neutral\nlight'],
        ['--helix-color-border-neutral', 'border-neutral'],
        ['--helix-color-border-neutral-dark',  'border-neutral\ndark'],
        ['--helix-color-border-inverse', 'border-inverse'],
      ]} />
      <TokenGroup label="Focus" type="border" tokens={[
        ['--helix-color-border-focus', 'border-focus'],
      ]} />
      <TokenGroup label="Status" type="border" tokens={[
        ['--helix-color-border-danger',  'border-danger'],
        ['--helix-color-border-success', 'border-success'],
        ['--helix-color-border-warning', 'border-warning'],
      ]} />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Semantic tokens — the only ones to use in custom UI. Component tokens (`--helix-button-*`, `--helix-input-*`…) are internal implementation; never use them outside their component.',
      },
    },
  },
};

// ── 3. Spacing ────────────────────────────────────────────────────────────

function SpacingBar({ varName, tokenKey, val, dim }: { varName: string; tokenKey: string; val: string; dim?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
      <span style={{ ...label12, width: 36, flexShrink: 0, textAlign: 'right' }}>{tokenKey}</span>
      <div style={{
        height: 20, borderRadius: 3,
        background: 'var(--helix-color-fill-primary)',
        width: `var(${varName})`,
        minWidth: dim === '0px' ? 1 : undefined,
        opacity: dim === '0px' ? 0.2 : 1,
        transition: 'width 0.2s',
      }} />
      <span style={{ ...label12, color: 'var(--helix-color-text-neutral-lightest)' }}>{val}</span>
    </div>
  );
}

export const Spacing: Story = {
  render: () => {
    const primitiveSteps: [string, string][] = [
      ['0', '0px'], ['25', '4px'], ['50', '8px'], ['75', '12px'],
      ['100', '16px'], ['125', '20px'], ['150', '24px'], ['175', '28px'],
      ['200', '32px'], ['250', '40px'], ['300', '48px'], ['350', '56px'],
      ['400', '64px'], ['500', '80px'], ['600', '96px'], ['800', '128px'],
    ];
    const semanticSteps: [string, string][] = [
      ['xs', '8px'], ['s', '12px'], ['m', '16px'], ['l', '24px'], ['xl', '32px'],
    ];
    return (
      <div>
        <SectionHead title="Primitive" />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {primitiveSteps.map(([key, val]) => (
            <SpacingBar key={key} tokenKey={key} varName={`--helix-primitive-spacing-${key}`} val={val} dim={val} />
          ))}
        </div>
        <div style={{ marginTop: 32 }}>
          <SectionHead title="Semantic (t-shirt scale)" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {semanticSteps.map(([key, val]) => (
              <SpacingBar key={key} tokenKey={key} varName={`--helix-spacing-${key}`} val={val} />
            ))}
          </div>
        </div>
      </div>
    );
  },
};

// ── 4. Radius ─────────────────────────────────────────────────────────────

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
};

// ── 4b. Sizing (semantic.size.control — ADR-004 control/field ladder) ──────

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
};

// ── 5. Typography ─────────────────────────────────────────────────────────

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
          <SectionHead title="Line heights — primitive (ratio)" />
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
        </div>
        <div style={{ marginTop: 32 }}>
          <SectionHead title="Line heights — semantic (paired with fontSize)" />
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

// ── 6. Shadows ─────────────────────────────────────────────────────────────

function ShadowRow({ varName, steps }: { varName: (step: string) => string; steps: string[] }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 40 }}>
      {steps.map(s => (
        <div key={s} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 100, height: 72,
            background: 'var(--helix-color-fill-page)',
            borderRadius: 8,
            boxShadow: `var(${varName(s)})`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{ ...label12, fontSize: 12, color: 'var(--helix-color-text-neutral)' }}>shadow-{s}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

export const Shadows: Story = {
  render: () => (
    <div>
      <SectionHead title="Primitive" />
      <ShadowRow varName={s => `--helix-primitive-shadow-${s}`} steps={['none', 'xs', 's', 'm', 'l', 'xl']} />
      <div style={{ marginTop: 32 }}>
        <SectionHead title="Semantic" />
        <ShadowRow varName={s => `--helix-shadow-${s}`} steps={['xs', 's', 'm', 'l', 'xl', 'focus']} />
      </div>
    </div>
  ),
  decorators: [Story => (
    <div style={{ background: 'var(--helix-color-fill-surface)', padding: 48, borderRadius: 12 }}>
      <Story />
    </div>
  )],
};
