// Standard page header — title + description, first thing every story in this app renders.
// Not just docs-panel copy: this renders directly on the canvas, so it's visible in every view mode
// (Canvas, Docs, embedded), not only the Storybook "Docs" tab. See apps/storybook/CLAUDE.md — every
// story in the app follows this same title+description-first structure, not just Foundation.
//
// Typography/spacing/font-family matches the actual rendered Component "Docs" page (e.g. Badge)
// exactly — measured with computed styles pulled live from the running Storybook instance
// (localhost:6006, .sbdocs-title h1 + its following <p>), not read off the @storybook/blocks
// package source in isolation. The description text on a real docs page is a plain <p> right after
// the <h1>, not an <h2> — the visible <h2> on a docs page is the "Stories" section heading further
// down, a different element entirely. If this ever needs re-verifying, inspect that live page again
// rather than re-deriving from source.
// Title       — 32px / 700 (bold) / line-height 36px / margin-bottom 16px
// Description — 14px / 400 / line-height 24px / margin-top 16px / margin-bottom 16px
// Font family — Storybook's own theme stack (Nunito Sans first), used by the docs chrome regardless
// of Helix's own font tokens, since this header is mimicking that chrome's look.
const STORYBOOK_FONT_FAMILY =
  '"Nunito Sans", -apple-system, ".SFNSText-Regular", "San Francisco", "system-ui", "Segoe UI", "Helvetica Neue", Helvetica, Arial, sans-serif';

export function StoryHeader({ title, description }: { title: string; description: string }) {
  return (
    <div>
      <h1 style={{
        margin: 0, marginBottom: 16,
        fontSize: 32, fontWeight: 700, lineHeight: '36px',
        fontFamily: STORYBOOK_FONT_FAMILY,
        color: 'var(--helix-color-text-neutral)',
      }}>
        {title}
      </h1>
      <p style={{
        margin: 0, marginTop: 16, marginBottom: 16,
        fontSize: 14, fontWeight: 400, lineHeight: '24px',
        fontFamily: STORYBOOK_FONT_FAMILY,
        color: 'var(--helix-color-text-neutral-light)', maxWidth: 720,
      }}>
        {description}
      </p>
    </div>
  );
}
