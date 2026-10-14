// Shared render helpers for the Foundation/* story files. Not a *.stories.tsx file itself —
// Storybook's glob (../stories/**/*.stories.@(ts|tsx)) won't pick this up as a story.

// StoryHeader is app-wide (every story, not just Foundation), so it lives in stories/_shared/ — see
// apps/storybook/CLAUDE.md. Re-exported here so the existing Foundation/*.stories.tsx imports (all of
// which import from './_shared') don't need touching.
export { StoryHeader } from '../_shared/StoryHeader';

export const label12: React.CSSProperties = {
  fontSize: 11, fontFamily: 'monospace',
  color: 'var(--helix-color-text-neutral-light)',
  textAlign: 'center', wordBreak: 'break-all',
};

export function SectionHead({ title }: { title: string }) {
  return (
    <h3 style={{
      margin: '0 0 var(--helix-spacing-m)',
      fontSize: 11, fontWeight: 600, letterSpacing: '0.08em',
      textTransform: 'uppercase', color: 'var(--helix-color-text-neutral-lightest)',
    }}>
      {title}
    </h3>
  );
}

export function TableGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginTop: 'var(--helix-spacing-l)' }}>
      <h3 style={{
        margin: '0 0 var(--helix-spacing-m)',
        fontSize: 11,
        fontWeight: 600,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        color: 'var(--helix-color-text-neutral-lightest)',
      }}>
        {title}
      </h3>
      {children}
    </div>
  );
}

// Type shape of a single DTCG token leaf ({ $value, $type, $description? }). $value is an alias string or a
// DTCG 2025.10 value object/array/number — render it with toCss() from packages/tokens/src/dtcg.mjs.
export type TokenLeaf = { $value: unknown; $type: string; $description?: string; $extensions?: Record<string, unknown> };
