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
// Description — 14px / 400 / line-height 24px / margin-bottom 16px
// Description margin-top is 8px, not the 16px measured off the plain docs page — deliberately
// tighter now that a title row can include the "View in Figma" link, per explicit feedback.
// Font family — Storybook's own theme stack (Nunito Sans first), used by the docs chrome regardless
// of Helix's own font tokens, since this header is mimicking that chrome's look.
const STORYBOOK_FONT_FAMILY =
  '"Nunito Sans", -apple-system, ".SFNSText-Regular", "San Francisco", "system-ui", "Segoe UI", "Helvetica Neue", Helvetica, Arial, sans-serif';

// figmaUrl: every Components/* and Layout/* story must pass this — see apps/storybook/CLAUDE.md's
// "Every component story links to Figma" rule. Built from contracts/figma-sync.json, not hand-typed
// per story, so it can't drift from the actual node id on file.
export function StoryHeader({ title, description, figmaUrl }: { title: string; description: string; figmaUrl?: string }) {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--helix-spacing-s)' }}>
        <h1 style={{
          margin: 0,
          fontSize: 32, fontWeight: 700, lineHeight: '36px',
          fontFamily: STORYBOOK_FONT_FAMILY,
          color: 'var(--helix-color-text-neutral)',
        }}>
          {title}
        </h1>
        {figmaUrl && (
          <a
            href={figmaUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 'var(--helix-spacing-2xs)',
              fontSize: 13, fontWeight: 500, fontFamily: STORYBOOK_FONT_FAMILY,
              color: 'var(--helix-color-text-neutral-light)',
              textDecoration: 'none',
              border: '1px solid var(--helix-color-border-neutral)',
              borderRadius: 'var(--helix-radius-full)',
              padding: 'var(--helix-spacing-2xs) 10px',
            }}
          >
            View in Figma
          </a>
        )}
      </div>
      <p style={{
        margin: 0, marginTop: 'var(--helix-spacing-xs)', marginBottom: 'var(--helix-spacing-m)',
        fontSize: 14, fontWeight: 400, lineHeight: '24px',
        fontFamily: STORYBOOK_FONT_FAMILY,
        color: 'var(--helix-color-text-neutral-light)', maxWidth: 720,
      }}>
        {description}
      </p>
    </div>
  );
}
