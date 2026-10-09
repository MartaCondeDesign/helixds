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

export function SpacingBar({ varName, tokenKey, val, dim, desc }: { varName: string; tokenKey: string; val: string; dim?: string; desc?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--helix-spacing-m)' }}>
      <span style={{ ...label12, width: 36, flexShrink: 0, textAlign: 'right' }}>{tokenKey}</span>
      <div style={{
        display: 'inline-block',
        width: val,
        minWidth: dim === '0px' ? 1 : undefined,
        height: 12,
        borderRadius: 999,
        background: 'var(--helix-color-fill-surface)',
      }}>
        <div style={{
          width: '100%',
          height: '100%',
          borderRadius: 999,
          background: 'var(--helix-color-fill-neutral)',
          border: '1px solid var(--helix-color-border-neutral-dark)',
          opacity: dim === '0px' ? 0.2 : 1,
          transition: 'width 0.2s',
        }} />
      </div>
      <span style={{ ...label12, width: 40, textAlign: 'left' }}>{val}</span>
      {desc && <span style={{ fontSize: 12, color: 'var(--helix-color-text-neutral-light)' }}>{desc}</span>}
    </div>
  );
}

// Type shape of a single DTCG token leaf ({ $value, $type, $description? }).
export type TokenLeaf = { $value: string; $type: string; $description?: string };

export function DescCaption({ text }: { text?: string }) {
  if (!text) return null;
  return <span style={{ fontSize: 11, color: 'var(--helix-color-text-neutral-lightest)' }}>{text}</span>;
}
