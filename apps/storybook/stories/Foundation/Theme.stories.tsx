import { useEffect, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { IconFolder } from '@tabler/icons-react';
import { SectionHead, label12 } from './_shared';

const meta: Meta = {
  title: 'Foundation/Theme',
  parameters: { layout: 'padded' },
};

export default meta;
type Story = StoryObj;

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

// ── Swatches (same visual language as before, one component per property kind) ──

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

export const Color: Story = {
  render: () => (
    <ThemeToggle>
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
    </ThemeToggle>
  ),
  parameters: {
    docs: {
      description: {
        story: 'The Theme collection — light/dark modes of every semantic color token. Toggle above to see both. Component tokens (`--helix-button-*`, `--helix-input-*`…) are internal implementation; never use them outside their component.',
      },
    },
  },
};
