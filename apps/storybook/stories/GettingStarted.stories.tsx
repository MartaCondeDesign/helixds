import type { Meta, StoryObj } from '@storybook/react';
import { StoryHeader } from './_shared/StoryHeader';

const meta: Meta = {
  title: 'Getting Started',
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        story: 'Visual README for the Helix DS workspace: install it, run it, and know where to work without leaving Storybook.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

const tableStyle: React.CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse',
  border: '1px solid var(--helix-color-border-neutral)',
  borderRadius: 12,
  overflow: 'hidden',
  marginTop: 12,
};

const thStyle: React.CSSProperties = {
  textAlign: 'left',
  padding: '10px 12px',
  fontSize: 11,
  fontWeight: 600,
  letterSpacing: '0.04em',
  textTransform: 'uppercase',
  color: 'var(--helix-color-text-neutral-lightest)',
  borderBottom: '1px solid var(--helix-color-border-neutral)',
  borderRight: '1px solid var(--helix-color-border-neutral-light)',
};

const tdStyle: React.CSSProperties = {
  padding: '12px',
  verticalAlign: 'top',
  borderRight: '1px solid var(--helix-color-border-neutral-light)',
};

const sectionStyle: React.CSSProperties = {
  marginTop: 28,
};

const sectionTitleStyle: React.CSSProperties = {
  margin: '0 0 8px',
  fontSize: 14,
  fontWeight: 700,
  color: 'var(--helix-color-text-neutral)',
};

const codeStyle: React.CSSProperties = {
  display: 'block',
  padding: 16,
  borderRadius: 12,
  background: 'var(--helix-color-fill-surface)',
  border: '1px solid var(--helix-color-border-neutral-light)',
  fontFamily: 'monospace',
  fontSize: 13,
  lineHeight: 1.6,
  color: 'var(--helix-color-text-neutral)',
  whiteSpace: 'pre-wrap',
};

export const Overview: Story = {
  render: () => (
    <div style={{ maxWidth: 980 }}>
      <StoryHeader
        title="Getting Started"
        description="A visual README for new contributors. Use it to understand the workspace, install the repo, run the right command, and find the source of truth for each change."
      />

      <section style={sectionStyle}>
        <h2 style={sectionTitleStyle}>Workspace map</h2>
        <table style={tableStyle}>
          <thead>
            <tr style={{ background: 'var(--helix-color-fill-surface)' }}>
              <th style={thStyle}>Area</th>
              <th style={thStyle}>Path</th>
              <th style={{ ...thStyle, borderRight: 'none' }}>What it is</th>
            </tr>
          </thead>
          <tbody>
            {[
              ['Core UI', 'packages/core', 'React components built on native HTML elements + Tailwind CSS v4.'],
              ['Tokens', 'packages/tokens', 'DTCG source that builds CSS custom properties and TypeScript constants.'],
              ['Storybook addon', 'packages/storybook-addon-tokens', 'Manager panel that reads story token metadata.'],
              ['Docs app', 'apps/storybook', 'Storybook for components, patterns, foundations, and onboarding pages.'],
              ['Contracts', 'contracts/components/<Name>.json', 'Machine-readable component contracts used before implementation.'],
              ['Architecture docs', 'docs/ADR', 'Decision records that explain the system structure.'],
              ['Automation', 'scripts', 'Repo checks, scaffolding, and eval helpers.'],
              ['AI context', '.ai/ and llms.txt', 'Prompt maps, skills, and other context for agents.'],
            ].map(([area, path, summary]) => (
              <tr key={area} style={{ borderTop: '1px solid var(--helix-color-border-neutral-light)' }}>
                <td style={tdStyle}><strong>{area}</strong></td>
                <td style={tdStyle}><code style={{ fontSize: 12 }}>{path}</code></td>
                <td style={{ ...tdStyle, borderRight: 'none' }}>{summary}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section style={sectionStyle}>
        <h2 style={sectionTitleStyle}>Install and run</h2>
        <table style={tableStyle}>
          <thead>
            <tr style={{ background: 'var(--helix-color-fill-surface)' }}>
              <th style={thStyle}>Command</th>
              <th style={{ ...thStyle, borderRight: 'none' }}>Use</th>
            </tr>
          </thead>
          <tbody>
            {[
              ['`pnpm install`', 'Install workspace dependencies. Node must be >=20 and the repo is pinned to pnpm@9.0.0.'],
              ['`pnpm sb`', 'Run Storybook for the design system at `http://localhost:6006`.'],
              ['`pnpm build`', 'Build every package and app in the workspace.'],
              ['`pnpm typecheck`', 'Run TypeScript checks across the workspace.'],
              ['`pnpm lint`', 'Run workspace linting.'],
              ['`pnpm test`', 'Run workspace tests.'],
            ].map(([command, use]) => (
              <tr key={command} style={{ borderTop: '1px solid var(--helix-color-border-neutral-light)' }}>
                <td style={tdStyle}><code style={{ fontSize: 12 }}>{command}</code></td>
                <td style={{ ...tdStyle, borderRight: 'none' }}>{use}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section style={sectionStyle}>
        <h2 style={sectionTitleStyle}>Storybook map</h2>
        <table style={tableStyle}>
          <thead>
            <tr style={{ background: 'var(--helix-color-fill-surface)' }}>
              <th style={thStyle}>Section</th>
              <th style={{ ...thStyle, borderRight: 'none' }}>What to look for</th>
            </tr>
          </thead>
          <tbody>
            {[
              ['Foundation / Primitives', 'Raw scales and foundational values.'],
              ['Foundation / Semantic', 'Role-based tokens that components actually consume.'],
              ['Foundation / Theme', 'Light / dark semantic color tokens.'],
              ['Foundation / TextStyles', 'Named text styles built from typography primitives.'],
              ['Components / *', 'Component APIs, states, and token contracts.'],
              ['Patterns', 'Multi-component UI recipes.'],
              ['Icons', 'Available icon set and usage.'],
            ].map(([section, summary]) => (
              <tr key={section} style={{ borderTop: '1px solid var(--helix-color-border-neutral-light)' }}>
                <td style={tdStyle}><strong>{section}</strong></td>
                <td style={{ ...tdStyle, borderRight: 'none' }}>{summary}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section style={sectionStyle}>
        <h2 style={sectionTitleStyle}>When you change something</h2>
        <table style={tableStyle}>
          <thead>
            <tr style={{ background: 'var(--helix-color-fill-surface)' }}>
              <th style={thStyle}>Change</th>
              <th style={thStyle}>Edit</th>
              <th style={{ ...thStyle, borderRight: 'none' }}>Verify</th>
            </tr>
          </thead>
          <tbody>
            {[
              ['Token', '`packages/tokens/src/tokens.json`', '`pnpm --filter @helix/tokens build` and `pnpm verify:tokens`'],
              ['Core component', '`packages/core/src/components/<Name>/...`', '`pnpm --filter @helix/react build`, `pnpm verify:contract`, `pnpm verify:props`'],
              ['Storybook docs', '`apps/storybook/stories/**/*.stories.tsx`', '`pnpm sb` and `pnpm --filter @helix/storybook build`'],
              ['New component', '`pnpm contract <ComponentName>`', 'Fill the generated contract and the matching eval prompt stub'],
              ['Prop vocabulary', '`.ai/maps/prop-map.md`', '`pnpm verify:props`'],
            ].map(([change, edit, verify]) => (
              <tr key={change} style={{ borderTop: '1px solid var(--helix-color-border-neutral-light)' }}>
                <td style={tdStyle}><strong>{change}</strong></td>
                <td style={tdStyle}><code style={{ fontSize: 12 }}>{edit}</code></td>
                <td style={{ ...tdStyle, borderRight: 'none' }}>{verify}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section style={sectionStyle}>
        <h2 style={sectionTitleStyle}>Useful snippets</h2>
        <div style={codeStyle}>{`pnpm install
pnpm sb

pnpm contract Button
pnpm token:add semantic.color.fill.primary "{primitive.color.blue.600}" --type color --description "Primary background"`}</div>
      </section>
    </div>
  ),
};
