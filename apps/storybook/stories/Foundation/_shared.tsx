// Shared render helpers for the Foundation/* story files. Not a *.stories.tsx file itself —
// Storybook's glob (../stories/**/*.stories.@(ts|tsx)) won't pick this up as a story.

export const label12: React.CSSProperties = {
  fontSize: 11, fontFamily: 'monospace',
  color: 'var(--helix-color-text-neutral-light)',
  textAlign: 'center', wordBreak: 'break-all',
};

export function SectionHead({ title }: { title: string }) {
  return (
    <h3 style={{
      margin: '0 0 16px',
      fontSize: 11, fontWeight: 600, letterSpacing: '0.08em',
      textTransform: 'uppercase', color: 'var(--helix-color-text-neutral-lightest)',
    }}>
      {title}
    </h3>
  );
}

export function SpacingBar({ varName, tokenKey, val, dim }: { varName: string; tokenKey: string; val: string; dim?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
      <span style={{ ...label12, width: 36, flexShrink: 0, textAlign: 'right' }}>{tokenKey}</span>
      <div style={{
        height: 20, borderRadius: 3,
        background: 'var(--helix-color-fill-primary)',
        width: `var(${varName})`,
        minWidth: dim === '0px' ? 1 : undefined,
        opacity: dim === '0px' ? 0.2 : 1,
        transition: 'width 0.2s',
      }} />
      <span style={{ ...label12, color: 'var(--helix-color-text-neutral-lightest)' }}>{val}</span>
    </div>
  );
}
