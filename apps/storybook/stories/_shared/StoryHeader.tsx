// Standard page header — title + description, first thing every story in this app renders.
// Not just docs-panel copy: this renders directly on the canvas, so it's visible in every view mode
// (Canvas, Docs, embedded), not only the Storybook "Docs" tab. See apps/storybook/CLAUDE.md — every
// story in the app follows this same title+description-first structure, not just Foundation.
//
// Typography/spacing matches Storybook's own DocsPage Title/Subtitle exactly (desktop breakpoint,
// ≥600px — @storybook/blocks' Title/Subtitle styled.h1/h2, read from the installed package source),
// so a component's auto-generated "Docs" page and any story's Canvas header look identical:
// Title    — 32px / 700 / line-height 36px / margin-bottom 16px
// Subtitle (description) — 20px / 400 / line-height 28px / margin-bottom 24px
export function StoryHeader({ title, description }: { title: string; description: string }) {
  return (
    <div>
      <h1 style={{
        margin: 0, marginBottom: 16,
        fontSize: 32, fontWeight: 700, lineHeight: '36px',
        color: 'var(--helix-color-text-neutral)',
      }}>
        {title}
      </h1>
      <h2 style={{
        margin: 0, marginBottom: 24,
        fontSize: 20, fontWeight: 400, lineHeight: '28px',
        color: 'var(--helix-color-text-neutral-light)', maxWidth: 720,
      }}>
        {description}
      </h2>
    </div>
  );
}
