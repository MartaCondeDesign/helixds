// Standard page header — title + description, first thing every story in this app renders.
// Not just docs-panel copy: this renders directly on the canvas, so it's visible in every view mode
// (Canvas, Docs, embedded), not only the Storybook "Docs" tab. See apps/storybook/CLAUDE.md — every
// story in the app follows this same title+description-first structure, not just Foundation.
//
// Typography/spacing matches the actual rendered Component "Docs" page (e.g. Badge) exactly — NOT
// Storybook's theoretical default Title/Subtitle spec (which is 700/20px — that's what the
// @storybook/blocks package source says in isolation, but isn't what actually renders once Helix's own
// CSS is in the cascade). Confirmed against the live Badge docs page:
// Title       — 32px / 400 (regular, not bold) / margin-bottom 16px
// Description — 16px / 400 / margin-bottom 24px
export function StoryHeader({ title, description }: { title: string; description: string }) {
  return (
    <div>
      <h1 style={{
        margin: 0, marginBottom: 16,
        fontSize: 32, fontWeight: 400, lineHeight: '40px',
        color: 'var(--helix-color-text-neutral)',
      }}>
        {title}
      </h1>
      <h2 style={{
        margin: 0, marginBottom: 24,
        fontSize: 16, fontWeight: 400, lineHeight: '24px',
        color: 'var(--helix-color-text-neutral-light)', maxWidth: 720,
      }}>
        {description}
      </h2>
    </div>
  );
}
