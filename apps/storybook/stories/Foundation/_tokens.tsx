// Token tables for the Foundation/* stories, read from packages/tokens/src/tokens.json — the one source.
//
// Why this file exists (2026-10-14): the Foundation pages were written in Aug 2026 with key lists and px
// values copied by hand (['xs','s','m'…], RADIUS_PX = { m: '6px' }…). A token added or changed in
// tokens.json never reached them unless someone remembered to edit the page — primitive.shadow.dark.* didn't.
// Everything here derives from tokens.json instead:
//   - rows: every token under a path, nested groups included (tokenRows)
//   - previews: drawn with the token's own CSS var, never a copied value, so they follow a value change
//   - value column: the alias it points to and the CSS it resolves to (toCss, packages/tokens/src/dtcg.mjs)
//   - unclaimed categories: OtherTokens renders any primitive/semantic category no story has claimed yet at the
//     end of that file's last story (nothing when there is none), so a whole new category appears with no story edit
// `pnpm verify:storybook-tokens` checks the result in a running Storybook.
import { useEffect, useState } from 'react';
import tokensJson from '../../../../packages/tokens/src/tokens.json';
import { isAlias, toCss } from '../../../../packages/tokens/src/dtcg.mjs';
import { TableGroup, type TokenLeaf } from './_shared';

type Group = { [key: string]: Group | TokenLeaf | unknown };
const root = tokensJson as unknown as Group;

export type TokenRow = {
  /** Path below the requested group — `xs`, `mobile.l`, `dark.focus`. */
  key: string;
  /** Full dotted path — `primitive.shadow.dark.focus`. */
  path: string;
  /** The CSS custom property the build writes — `--helix-primitive-shadow-dark-focus`, `--helix-radius-m`. */
  cssVar: string;
  token: TokenLeaf;
};

const isLeaf = (node: unknown): node is TokenLeaf => !!node && typeof node === 'object' && '$value' in node;

function nodeAt(path: string): unknown {
  return path.split('.').reduce<unknown>((node, key) => (node && typeof node === 'object' ? (node as Group)[key] : undefined), root);
}

/** The build's name rule (packages/tokens/CLAUDE.md → Name rules): drop `semantic.`, keep `primitive-`. */
export const cssVarOf = (path: string) => `--helix-${path.split('.').filter((part, i) => !(i === 0 && part === 'semantic')).join('-')}`;

/** Every token below `path` (e.g. `primitive.spacing`, `semantic.fontSize`), in tokens.json order. */
export function tokenRows(path: string): TokenRow[] {
  const rows: TokenRow[] = [];
  const walk = (node: unknown, at: string[]) => {
    if (isLeaf(node)) {
      rows.push({ key: at.join('.'), path: [path, ...at].join('.'), cssVar: cssVarOf([path, ...at].join('.')), token: node });
      return;
    }
    if (!node || typeof node !== 'object') return;
    for (const [key, child] of Object.entries(node as Group)) if (!key.startsWith('$')) walk(child, [...at, key]);
  };
  walk(nodeAt(path), []);
  return rows;
}

/** The categories of a layer — `primitive` → color, spacing, size… */
export const categoriesOf = (layer: 'primitive' | 'semantic') =>
  Object.keys(nodeAt(layer) as Group).filter(key => !key.startsWith('$'));

/** What a token resolves to in the light theme: its alias chain, then the CSS of the literal at its end. */
export function resolvedCss(token: TokenLeaf): { alias?: string; css: string } {
  let current: TokenLeaf | undefined = token;
  let alias: string | undefined;
  for (let hops = 0; current && isAlias(current.$value) && hops < 10; hops++) {
    alias ??= current.$value.slice(1, -1);
    const target = nodeAt(current.$value.slice(1, -1));
    current = isLeaf(target) ? target : undefined;
  }
  if (!current) return { alias, css: '—' };
  if (current.$type === 'typography') return { alias, css: 'typography (see Text Styles)' };
  return { alias, css: toCss(current.$value, current.$type, { extensions: current.$extensions as Record<string, unknown> | undefined }) };
}

// ── Previews: each draws the token through its CSS var ──────────────────

export type PreviewKind =
  | 'swatch' | 'bar' | 'square' | 'radius' | 'border' | 'blur' | 'shadow' | 'fontSize' | 'fontWeight'
  | 'lineHeight' | 'letterSpacing' | 'fontFamily' | 'duration' | 'easing' | 'lift' | 'scale' | 'none';

const box: React.CSSProperties = {
  width: 56, height: 40, borderRadius: 'var(--helix-radius-s)',
  background: 'var(--helix-color-fill-surface)', border: '1px solid var(--helix-color-border-neutral-dark)',
};
const sample: React.CSSProperties = { color: 'var(--helix-color-text-neutral)', whiteSpace: 'nowrap' };

/** Replays a CSS transition every few seconds, so a duration or an easing can be seen. */
function useReplay(): boolean {
  const [on, setOn] = useState(false);
  useEffect(() => {
    const flip = () => setOn(value => !value);
    const first = window.setTimeout(flip, 300);
    const loop = window.setInterval(flip, 1600);
    return () => { window.clearTimeout(first); window.clearInterval(loop); };
  }, []);
  return on;
}

function MotionTrack({ cssVar, kind }: { cssVar: string; kind: 'duration' | 'easing' }) {
  const on = useReplay();
  const transition = kind === 'duration'
    ? `transform var(${cssVar}) var(--helix-easing-base)`
    : `transform var(--helix-duration-draw) var(${cssVar})`;
  return (
    <div style={{ width: 96, height: 12, borderRadius: 'var(--helix-radius-full)', background: 'var(--helix-color-fill-surface)', border: '1px solid var(--helix-color-border-neutral-light)' }}>
      <div style={{
        width: 10, height: 10, borderRadius: 'var(--helix-radius-full)', background: 'var(--helix-color-fill-secondary-interactive-dark-default)',
        transform: on ? 'translateX(84px)' : 'translateX(0)', transition,
      }} />
    </div>
  );
}

export function TokenPreview({ kind, row }: { kind: PreviewKind; row: TokenRow }) {
  const v = `var(${row.cssVar})`;
  switch (kind) {
    case 'swatch': return <div style={{ ...box, background: v }} />;
    case 'bar': return <div style={{ width: v, minWidth: 1, height: 12, borderRadius: 'var(--helix-radius-full)', background: 'var(--helix-color-fill-secondary-interactive-dark-default)', border: '1px solid var(--helix-color-border-neutral-dark)' }} />;
    case 'square': return <div style={{ width: v, height: v, background: 'var(--helix-color-fill-secondary-interactive-dark-default)', border: '1px solid var(--helix-color-border-neutral-dark)' }} />;
    case 'radius': return <div style={{ ...box, width: 64, height: 64, borderRadius: v }} />;
    case 'border': return <div style={{ ...box, border: `${v} solid var(--helix-color-border-neutral-dark)` }} />;
    case 'blur': return <span style={{ ...sample, fontSize: 18, filter: `blur(${v})` }}>Helix</span>;
    case 'shadow': return <div style={{ ...box, border: 'none', boxShadow: v, margin: 'var(--helix-spacing-s)' }} />;
    case 'fontSize': return <span style={{ ...sample, fontSize: v, lineHeight: 1.2 }}>Aa</span>;
    case 'fontWeight': return <span style={{ ...sample, fontSize: 18, fontWeight: v as React.CSSProperties['fontWeight'] }}>Helix DS</span>;
    case 'lineHeight': return <div style={{ ...sample, whiteSpace: 'normal', width: 140, fontSize: 13, lineHeight: v, background: 'var(--helix-color-fill-surface)' }}>Helix DS<br />Type scale<br />Line height</div>;
    case 'letterSpacing': return <span style={{ ...sample, fontSize: 16, letterSpacing: v }}>HELIX DS</span>;
    case 'fontFamily': return <span style={{ ...sample, fontSize: 18, fontFamily: v }}>The quick brown fox</span>;
    case 'duration': return <MotionTrack cssVar={row.cssVar} kind="duration" />;
    case 'easing': return <MotionTrack cssVar={row.cssVar} kind="easing" />;
    case 'lift': return <div style={{ ...box, width: 28, height: 28, transform: `translateY(${v})` }} />;
    case 'scale': return <div style={{ ...box, width: 28, height: 28, transform: `scale(${v})` }} />;
    default: return null;
  }
}

/** A preview that fits the token's $type, for tokens no story has a specific preview for. */
export function previewForType(type: string): PreviewKind {
  return ({ color: 'swatch', dimension: 'bar', shadow: 'shadow', fontWeight: 'fontWeight', fontFamily: 'fontFamily', duration: 'duration', cubicBezier: 'easing' } as Record<string, PreviewKind>)[type] ?? 'none';
}

// ── Table ───────────────────────────────────────────────────────────────

const th: React.CSSProperties = {
  textAlign: 'left', padding: 'var(--helix-spacing-xs) var(--helix-spacing-s)', fontSize: 11, fontWeight: 600,
  letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--helix-color-text-neutral-lightest)',
  borderBottom: '1px solid var(--helix-color-border-neutral)', borderRight: '1px solid var(--helix-color-border-neutral-light)',
};
const td: React.CSSProperties = {
  padding: 'var(--helix-spacing-xs) var(--helix-spacing-s)', verticalAlign: 'middle',
  borderRight: '1px solid var(--helix-color-border-neutral-light)',
};
const code: React.CSSProperties = { fontFamily: 'var(--helix-primitive-fontFamily-mono)', fontSize: 11, color: 'var(--helix-color-text-neutral-light)' };

/** One row per token below `path`. `preview` picks the drawing; by default it follows each token's $type. */
export function TokenTable({ path, preview, title, label, only }: {
  path: string;
  /** Keep only some of the rows — e.g. one half of a group that holds two scales. */
  only?: (row: TokenRow) => boolean;
  preview?: PreviewKind | ((row: TokenRow) => PreviewKind);
  title?: string;
  /** Prefix shown before each key — defaults to the group's own name (`spacing.m`). */
  label?: string;
}) {
  const rows = tokenRows(path).filter(only ?? (() => true));
  const prefix = label ?? path.split('.').slice(1).join('.');
  const pick = (row: TokenRow) => (typeof preview === 'function' ? preview(row) : preview ?? previewForType(row.token.$type));
  const table = (
    <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 'var(--helix-spacing-s)', border: '1px solid var(--helix-color-border-neutral)', borderRadius: 8, overflow: 'hidden' }}>
      <thead>
        <tr style={{ background: 'var(--helix-color-fill-surface)' }}>
          <th style={th}>Token</th>
          <th style={th}>Preview</th>
          <th style={th}>Value</th>
          <th style={{ ...th, borderRight: 'none' }}>Description</th>
        </tr>
      </thead>
      <tbody>
        {rows.map(row => {
          const { alias, css } = resolvedCss(row.token);
          return (
            <tr key={row.path} style={{ borderTop: '1px solid var(--helix-color-border-neutral-light)' }}>
              <td style={td}><code style={{ ...code, fontSize: 12, color: 'var(--helix-color-text-neutral)' }}>{prefix ? `${prefix}.` : ''}{row.key}</code></td>
              <td style={td}><TokenPreview kind={pick(row)} row={row} /></td>
              <td style={td}>
                <div style={code}>{css}</div>
                {alias && <div style={{ ...code, color: 'var(--helix-color-text-neutral-lightest)' }}>→ {alias}</div>}
                <div style={{ ...code, color: 'var(--helix-color-text-neutral-lightest)' }}>var({row.cssVar})</div>
              </td>
              <td style={{ ...td, borderRight: 'none' }}>
                <span style={{ fontSize: 12, color: 'var(--helix-color-text-neutral-light)' }}>{row.token.$description ?? '—'}</span>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
  return title ? <TableGroup title={title}>{table}</TableGroup> : table;
}

/**
 * The categories that have a page of their own. A category in tokens.json that isn't here is new: it shows at
 * the end of the file's last story, and `pnpm verify:storybook-tokens` (pre-commit) prints a warning asking to
 * review it with the design-system owner — what it is, whether it belongs in tokens.json, and which page shows it.
 * Add it here once it has its page.
 */
export const CLAIMED = {
  // Foundation/Primitives
  primitive: [
    'color', 'spacing', 'size', 'fontSize', 'fontWeight', 'lineHeight', 'letterSpacing', 'fontFamily',
    'shadow', 'duration', 'easing', 'zIndex', 'breakpoint',
  ],
  // Foundation/Semantic — plus color (Foundation/Theme) and textStyle (Foundation/Text Styles)
  semantic: [
    'color', 'textStyle', 'spacing', 'radius', 'size', 'borderWidth', 'shadow', 'fontSize', 'lineHeight',
    'duration', 'easing', 'transform', 'blur',
  ],
} as const;

/** Categories of `layer` in tokens.json with no page of their own yet. */
export const unclaimedCategories = (layer: 'primitive' | 'semantic') =>
  categoriesOf(layer).filter(category => !(CLAIMED[layer] as readonly string[]).includes(category));

/** Every category of `layer` not in `claimed`, at the end of that file's last story — so a category added to
 * tokens.json shows up before it gets its own story. Renders nothing while every category has one. */
export function OtherTokens({ layer, claimed }: { layer: 'primitive' | 'semantic'; claimed: readonly string[] }) {
  const rest = categoriesOf(layer).filter(category => !claimed.includes(category));
  if (!rest.length) return null;
  return (
    <TableGroup title={`Not on a page yet: new ${layer} categories`}>
      <p style={{ fontSize: 13, color: 'var(--helix-color-text-neutral-light)', margin: 0 }}>
        In tokens.json but with no story of their own — add one, and the category to CLAIMED in _tokens.tsx.
      </p>
      {rest.map(category => <TokenTable key={category} title={category} path={`${layer}.${category}`} />)}
    </TableGroup>
  );
}
