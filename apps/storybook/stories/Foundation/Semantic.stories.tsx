import type { Meta, StoryObj } from '@storybook/react';
import { StoryHeader } from './_shared';
// Every list on this page comes from tokens.json through _tokens.tsx — rows, values and $description. Add,
// rename or change a semantic token there and it shows here with no edit; previews draw through the token's
// own CSS var, so they follow a value change and the light/dark toolbar. A new semantic category lands in
// the end of the last story (Motion) until it gets its own.
import { CLAIMED, OtherTokens, TokenTable, type TokenRow } from './_tokens';

const meta: Meta = {
  title: 'Foundation/Semantic',
  parameters: { layout: 'padded' },
};

export default meta;
type Story = StoryObj;


// semantic.spacing holds two scales: the t-shirt one (xs, m…) and the older context one (component-*, layout-*).
const isContextKey = (row: TokenRow) => row.key.includes('-');

export const Spacing: Story = {
  render: () => (
    <div>
      <StoryHeader title="Spacing" description="The t-shirt spacing scale components actually consume — aliases the raw primitive.spacing.* percentage scale." />
      <TokenTable title="T-shirt scale" path="semantic.spacing" preview="bar" only={row => !isContextKey(row)} />
      <TokenTable title="Context scale" path="semantic.spacing" preview="bar" only={isContextKey} />
    </div>
  ),
};

export const Radius: Story = {
  render: () => (
    <div>
      <StoryHeader title="Radius" description="No primitive layer exists for radius — these values ARE the scale, defined directly at the semantic layer." />
      <TokenTable path="semantic.radius" preview="radius" />
    </div>
  ),
};

export const Sizing: Story = {
  render: () => (
    <div>
      <StoryHeader title="Sizing" description="semantic.size — the shared t-shirt height ladder for Button and Input/Select (ADR-004)." />
      <TokenTable path="semantic.size" preview="square" />
    </div>
  ),
};

export const BorderWidth: Story = {
  name: 'Border width',
  render: () => (
    <div>
      <StoryHeader title="Border width" description="Stroke widths for borders. A component with a border keeps the same width in every state — only its color changes." />
      <TokenTable path="semantic.borderWidth" preview="border" />
    </div>
  ),
};

export const Shadows: Story = {
  render: () => (
    <div>
      <StoryHeader title="Shadows" description="The shadow scale components actually consume. Each one aliases primitive.shadow.* in light and primitive.shadow.dark.* in dark — switch the theme in the toolbar to see both." />
      <TokenTable path="semantic.shadow" preview="shadow" />
    </div>
  ),
};

export const Typography: Story = {
  render: () => (
    <div>
      <StoryHeader title="Typography" description="The line-height paired with each font size, and the smaller font sizes used below the tablet breakpoint. Text Styles combine these with the primitives." />
      <TokenTable title="Line height" path="semantic.lineHeight" preview="lineHeight" />
      <TokenTable title="Font size on mobile" path="semantic.fontSize" preview="fontSize" />
    </div>
  ),
};

export const Motion: Story = {
  render: () => (
    <div>
      <StoryHeader title="Motion" description="Duration, easing, transform and blur roles for animations and transitions. Each dot replays its transition." />
      <TokenTable title="Duration" path="semantic.duration" preview="duration" />
      <TokenTable title="Easing" path="semantic.easing" preview="easing" />
      <TokenTable title="Transform" path="semantic.transform" preview={row => (row.key.startsWith('lift.') ? 'lift' : 'scale')} />
      <TokenTable title="Blur" path="semantic.blur" preview="blur" />
      {/* A semantic category with no story yet shows here; nothing while every category has one. */}
      <OtherTokens layer="semantic" claimed={CLAIMED.semantic} />
    </div>
  ),
};
