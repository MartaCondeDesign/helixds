import type { Meta, StoryObj } from '@storybook/react';
import { label12, StoryHeader } from './_shared';
// Every list on this page comes from tokens.json through _tokens.tsx — add, rename or change a primitive
// there and it shows here with no edit. A new primitive category lands in "Other tokens" until it gets a story.
import { OtherTokens, resolvedCss, tokenRows, TokenTable } from './_tokens';

const meta: Meta = {
  title: 'Foundation/Primitives',
  parameters: { layout: 'padded' },
};

export default meta;
type Story = StoryObj;

/** The primitive categories each story below shows. Any other one appears in the "Other tokens" story. */
const CLAIMED = [
  'color', 'spacing', 'size', 'fontSize', 'fontWeight', 'lineHeight', 'letterSpacing', 'fontFamily',
  'shadow', 'duration', 'easing', 'zIndex', 'breakpoint',
] as const;

// ── Color ────────────────────────────────────────────────────────────────

function PaletteRow({ family }: { family: string }) {
  const steps = tokenRows(`primitive.color.${family}`);
  return (
    <div style={{ marginBottom: 'var(--helix-spacing-l)' }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--helix-color-text-neutral)', marginBottom: 'var(--helix-spacing-xs)' }}>
        {family}
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--helix-spacing-xs)' }}>
        {steps.map(step => (
          <div key={step.key} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--helix-spacing-2xs)' }}>
            <div style={{
              width: 52, height: 52, borderRadius: 8,
              background: `var(${step.cssVar})`,
              border: '1px solid var(--helix-color-border-neutral-light)',
            }} />
            <span style={{ ...label12, maxWidth: 52 }}>{step.key}</span>
            <span style={{ ...label12, maxWidth: 52, color: 'var(--helix-color-text-neutral-lightest)' }}>{resolvedCss(step.token).css}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export const Color: Story = {
  render: () => {
    const families = [...new Set(tokenRows('primitive.color').map(row => row.key.split('.')[0]!))];
    return (
      <div>
        <StoryHeader
          title="Color"
          description="Raw color scales, every step of every family in tokens.json. Always use --helix-color-* (Theme) in components, never these primitives directly."
        />
        {families.map(family => <PaletteRow key={family} family={family} />)}
      </div>
    );
  },
};

// ── Spacing and size ────────────────────────────────────────────────────

export const Spacing: Story = {
  render: () => (
    <div>
      <StoryHeader title="Spacing" description="The raw spacing scale, keyed by percent of 16px (100 = 16px). Components use the semantic t-shirt scale built on it." />
      <TokenTable path="primitive.spacing" preview="bar" />
    </div>
  ),
};

export const Size: Story = {
  render: () => (
    <div>
      <StoryHeader title="Size" description="The raw size scale for a control's own dimensions (same 100 = 16px key as spacing, kept separate on purpose — ADR-004). semantic.size is built on it." />
      <TokenTable path="primitive.size" preview="square" />
    </div>
  ),
};

// ── Typography ───────────────────────────────────────────────────────────

export const Typography: Story = {
  render: () => (
    <div>
      <StoryHeader title="Typography" description="Font size, weight, line-height ratio, letter spacing and font family — the raw building blocks Text Styles combine." />
      <TokenTable title="Font size" path="primitive.fontSize" preview="fontSize" />
      <TokenTable title="Font weight" path="primitive.fontWeight" preview="fontWeight" />
      <TokenTable title="Line height ratio" path="primitive.lineHeight" preview="lineHeight" />
      <TokenTable title="Letter spacing" path="primitive.letterSpacing" preview="letterSpacing" />
      <TokenTable title="Font family" path="primitive.fontFamily" preview="fontFamily" />
    </div>
  ),
};

// ── Shadows ──────────────────────────────────────────────────────────────
// primitive.shadow.* is the light scale; primitive.shadow.dark.* is its dark-theme twin, which
// semantic.shadow.* aliases in tokens.dark.json. Each preview sits on the ground it was tuned for —
// a light card on white, a dark card on the dark page — whatever the toolbar theme is.

const shadowTh: React.CSSProperties = {
  textAlign: 'left', padding: 'var(--helix-spacing-xs) var(--helix-spacing-s)', fontSize: 11, fontWeight: 600,
  letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--helix-color-text-neutral-lightest)',
  borderBottom: '1px solid var(--helix-color-border-neutral)', borderRight: '1px solid var(--helix-color-border-neutral-light)',
};
const shadowTd: React.CSSProperties = {
  padding: 'var(--helix-spacing-xs) var(--helix-spacing-s)', verticalAlign: 'middle',
  borderRight: '1px solid var(--helix-color-border-neutral-light)',
};

function ShadowSample({ cssVar, dark }: { cssVar: string; dark?: boolean }) {
  return (
    <div style={{
      padding: 'var(--helix-spacing-l)', borderRadius: 8,
      background: dark ? 'var(--helix-primitive-color-gray-900)' : 'var(--helix-primitive-color-gray-0)',
    }}>
      <div style={{
        width: 96, height: 56, borderRadius: 8, boxShadow: `var(${cssVar})`,
        background: dark ? 'var(--helix-primitive-color-gray-800)' : 'var(--helix-primitive-color-gray-0)',
      }} />
    </div>
  );
}

const shadowValue: React.CSSProperties = { fontFamily: 'var(--helix-primitive-fontFamily-mono)', fontSize: 11, color: 'var(--helix-color-text-neutral-light)' };

export const Shadows: Story = {
  render: () => {
    const rows = tokenRows('primitive.shadow');
    const light = rows.filter(row => !row.key.startsWith('dark.'));
    const dark = new Map(rows.filter(row => row.key.startsWith('dark.')).map(row => [row.key.slice('dark.'.length), row]));
    return (
      <div>
        <StoryHeader
          title="Shadows"
          description="Raw elevation values: primitive.shadow.* for the light theme and primitive.shadow.dark.* for the dark theme, which semantic.shadow.* switches to in dark mode. xl-up is xl cast upward, for a sheet sliding in from the bottom edge."
        />
        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 'var(--helix-spacing-l)', border: '1px solid var(--helix-color-border-neutral)', borderRadius: 8, overflow: 'hidden' }}>
          <thead>
            <tr style={{ background: 'var(--helix-color-fill-surface)' }}>
              <th style={shadowTh}>Token</th>
              <th style={shadowTh}>Light · shadow.*</th>
              <th style={{ ...shadowTh, borderRight: 'none' }}>Dark · shadow.dark.*</th>
            </tr>
          </thead>
          <tbody>
            {light.map(row => {
              const twin = dark.get(row.key);
              return (
                <tr key={row.key} style={{ borderTop: '1px solid var(--helix-color-border-neutral-light)' }}>
                  <td style={shadowTd}><code style={{ fontSize: 12, color: 'var(--helix-color-text-neutral)' }}>shadow.{row.key}</code></td>
                  <td style={shadowTd}>
                    <ShadowSample cssVar={row.cssVar} />
                    <code style={shadowValue}>{resolvedCss(row.token).css}</code>
                  </td>
                  <td style={{ ...shadowTd, borderRight: 'none' }}>
                    {twin ? <ShadowSample cssVar={twin.cssVar} dark /> : null}
                    <code style={shadowValue}>{twin ? resolvedCss(twin.token).css : '— same in both themes'}</code>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  },
};

// ── Motion, layers, breakpoints ─────────────────────────────────────────

export const Motion: Story = {
  render: () => (
    <div>
      <StoryHeader title="Motion" description="Raw durations and easing curves. Each dot replays its transition; components use the semantic duration and easing roles built on these." />
      <TokenTable title="Duration" path="primitive.duration" preview="duration" />
      <TokenTable title="Easing" path="primitive.easing" preview="easing" />
    </div>
  ),
};

export const ZIndex: Story = {
  name: 'Z-index',
  render: () => (
    <div>
      <StoryHeader title="Z-index" description="Stacking order for layers that sit above the page — a higher value covers a lower one." />
      <TokenTable path="primitive.zIndex" preview="none" />
    </div>
  ),
};

export const Breakpoints: Story = {
  render: () => (
    <div>
      <StoryHeader title="Breakpoints" description="Viewport widths where the layout changes. Below tablet, the mobile font sizes apply (the viewport modifier in helix.resolver.json)." />
      <TokenTable path="primitive.breakpoint" preview="none" />
    </div>
  ),
};

// ── Anything else ───────────────────────────────────────────────────────

export const OtherTokensStory: Story = {
  name: 'Other tokens',
  render: () => (
    <div>
      <StoryHeader title="Other tokens" description="Primitive categories in tokens.json that no story above shows yet — a new category appears here on its own until it gets a page." />
      <OtherTokens layer="primitive" claimed={CLAIMED} />
    </div>
  ),
};
