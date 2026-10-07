import type { Meta, StoryObj } from '@storybook/react';
import type { ReactNode } from 'react';
import { StoryHeader } from './_shared/StoryHeader';
import { ComponentContract as ComponentContractArt } from './Illustrations/ComponentContract';
import { AgentsMd as AgentsMdArt } from './Illustrations/AgentsMd';
import { ContextToAgent as ContextToAgentArt } from './Illustrations/ContextToAgent';
import { EvalChecklist as EvalArt } from './Illustrations/EvalChecklist';
import { EvalGallery as EvalGalleryArt } from './Illustrations/EvalGallery';
import { StatusHealth as StatusHealthArt } from './Illustrations/StatusHealth';

// Animated explainers for design-system concepts (ADR-024). Each one is only the animation — no title or
// caption inside the box. Timing comes from the illustration.motion.* tokens; Motion animates, GSAP
// draws strokes. With reduced motion (OS setting or the toolbar toggle) they show the finished picture.
const meta: Meta = {
  title: 'Assets/Illustrations',
  parameters: { layout: 'padded' },
};
export default meta;
type Story = StoryObj;

const page = (title: string, description: string, illustration: ReactNode): Story => ({
  render: () => (
    <div>
      <StoryHeader title={title} description={description} />
      {illustration}
    </div>
  ),
});

export const ComponentContract = page(
  'Component Contract',
  'One JSON file describes the component; code and Figma are both built from it, so changing the contract changes both.',
  <ComponentContractArt />,
);

export const AgentsMd: Story = { ...page(
  'AGENTS.md',
  'A Markdown file at the root of the repo that agents read before anything else: the stack, the rules and the commands.',
  <AgentsMdArt />,
), name: 'AGENTS.md' };

export const ContextToAgent = page(
  'Context to Agent',
  'Well-ordered files merge into one context for the agent — and what comes out is checked against the system.',
  <ContextToAgentArt />,
);

export const Eval = page(
  'Eval',
  'An eval gives an agent a fixed task, checks its answer against each success criterion and turns that into a score you can compare across runs.',
  <EvalArt />,
);

export const EvalGallery = page(
  'Eval Gallery',
  'The same component is generated many times with more or less context; each run gets a score, and the grid shows which context actually helps.',
  <EvalGalleryArt />,
);

export const StatusHealth = page(
  'Status Health',
  'Every component is checked against Figma, code, accessibility and eval; passing all of them is what makes it stable.',
  <StatusHealthArt />,
);
