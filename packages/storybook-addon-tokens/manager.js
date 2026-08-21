import React from 'react';
import { AddonPanel } from 'storybook/internal/components';
import { addons, types, useStorybookApi, useStorybookState } from 'storybook/internal/manager-api';
import '../tokens/dist/helix.css';

const ADDON_ID = 'helix-ds/storybook-addon-tokens';
const PANEL_ID = `${ADDON_ID}/panel`;

const CATEGORY_ORDER = ['color', 'typography', 'space', 'radius', 'shadow'];

function normalizeKind(kind) {
  if (kind === 'color' || kind === 'typography' || kind === 'space' || kind === 'shadow' || kind === 'radius') return kind;
  return 'other';
}

function getTypographyPreviewStyle(item) {
  const style = {
    display: 'inline-flex',
    alignItems: 'baseline',
    color: 'var(--helix-color-text-default)',
    whiteSpace: 'nowrap',
  };

  if (!item.token || typeof window === 'undefined') return style;

  const resolved = window.getComputedStyle(document.documentElement).getPropertyValue(item.token).trim();

  if (item.token.includes('fontSize')) {
    style.fontSize = resolved;
  }
  if (item.token.includes('fontWeight')) {
    style.fontWeight = resolved;
  }
  if (item.token.includes('lineHeight')) {
    style.lineHeight = resolved;
  }
  if (item.token.includes('letterSpacing')) {
    style.letterSpacing = resolved;
  }
  if (item.token.includes('fontFamily')) {
    style.fontFamily = resolved;
  }

  return style;
}

const DEFAULT_WIDTHS = {
  element: 180,
  token: 280,
  preview: 92,
};

function useResizableColumns() {
  const [widths, setWidths] = React.useState(DEFAULT_WIDTHS);
  const dragRef = React.useRef(null);

  React.useEffect(() => {
    function onMove(event) {
      if (!dragRef.current) return;

      const { key, startX, startWidth } = dragRef.current;
      const delta = event.clientX - startX;

      setWidths(current => {
        const next = { ...current };
        if (key === 'element') {
          next.element = Math.max(120, startWidth + delta);
        }
        if (key === 'token') {
          next.token = Math.max(220, startWidth + delta);
        }
        if (key === 'preview') {
          next.preview = Math.max(60, startWidth + delta);
        }
        return next;
      });
    }

    function onUp() {
      dragRef.current = null;
    }

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);

    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, []);

  function startResize(key, event) {
    dragRef.current = { key, startX: event.clientX, startWidth: widths[key] };
    event.preventDefault();
  }

  return { widths, startResize };
}

function TokensPanel({ active }) {
  const api = useStorybookApi();
  const { storyId } = useStorybookState();
  const currentStory = api.getCurrentStoryData?.();
  const currentVariant = currentStory?.args?.variant;
  const tokens = api.getParameters?.(storyId, 'helixTokens') ?? [];
  const [category, setCategory] = React.useState('all');
  const { widths, startResize } = useResizableColumns();

  const categories = React.useMemo(() => {
    const present = CATEGORY_ORDER.filter(kind => tokens.some(item => normalizeKind(item.kind) === kind));
    return ['all', ...present];
  }, [tokens]);

  React.useEffect(() => {
    if (category !== 'all' && !categories.includes(category)) {
      setCategory('all');
    }
  }, [category, categories]);

  const filtered = React.useMemo(
    () => tokens.filter(item => {
      const kind = normalizeKind(item.kind);
      if (category !== 'all' && kind !== category) return false;
      if (kind === 'color' && currentVariant && item.variant && item.variant !== currentVariant) return false;
      return true;
    }),
    [tokens, category, currentVariant],
  );

  const uniqueFiltered = React.useMemo(() => {
    const seen = new Set();
    return filtered.filter(item => {
      const key = [
        normalizeKind(item.kind),
        item.part,
        item.label,
        item.token ?? '',
        item.value ?? '',
        item.variant ?? '',
        item.meta ?? '',
      ].join('|');
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [filtered]);

  return React.createElement(
    AddonPanel,
    { active },
    React.createElement(
      'div',
      { style: { padding: '12px 16px', overflowX: 'auto' } },
      React.createElement('p', { style: { margin: 0, fontWeight: 600 } }, 'Tokens'),
      React.createElement(
        'div',
        { style: { display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12 } },
        categories.map(item =>
          React.createElement(
            'button',
            {
              key: item,
              type: 'button',
              onClick: () => setCategory(item),
              style: {
                border: '1px solid var(--helix-color-border-subtle)',
                borderRadius: 999,
                padding: '6px 10px',
                background: category === item ? 'var(--helix-color-fill-secondary)' : 'var(--helix-color-fill-surface)',
                color: 'var(--helix-color-text-default)',
                cursor: 'pointer',
                font: 'inherit',
              },
            },
            item,
          ),
        ),
      ),
      uniqueFiltered.length > 0
        ? React.createElement(
            'table',
            { style: { width: 'fit-content', maxWidth: '100%', marginTop: 12, borderCollapse: 'collapse', tableLayout: 'fixed' } },
            React.createElement(
              'colgroup',
              null,
              React.createElement('col', { style: { width: `${widths.element}px` } }),
              React.createElement('col', { style: { width: `${widths.token}px` } }),
              React.createElement('col', { style: { width: `${widths.preview}px` } }),
            ),
            React.createElement(
              'thead',
              null,
              React.createElement(
                'tr',
                null,
                React.createElement(
                  'th',
                  { style: { position: 'relative', textAlign: 'left', padding: '8px 8px', borderBottom: '1px solid var(--helix-color-border-subtle)', borderRight: '1px solid var(--helix-color-border-subtle)', color: 'var(--helix-color-text-secondary)' } },
                  'Element',
                  React.createElement('span', {
                    onMouseDown: event => startResize('element', event),
                    style: {
                      position: 'absolute',
                      top: 0,
                      right: -3,
                      width: 6,
                      height: '100%',
                      cursor: 'col-resize',
                      userSelect: 'none',
                    },
                  }),
                ),
                React.createElement(
                  'th',
                  { style: { position: 'relative', textAlign: 'left', padding: '8px 8px', borderBottom: '1px solid var(--helix-color-border-subtle)', borderRight: '1px solid var(--helix-color-border-subtle)', color: 'var(--helix-color-text-secondary)' } },
                  'Token',
                  React.createElement('span', {
                    onMouseDown: event => startResize('token', event),
                    style: {
                      position: 'absolute',
                      top: 0,
                      right: -3,
                      width: 6,
                      height: '100%',
                      cursor: 'col-resize',
                      userSelect: 'none',
                    },
                  }),
                ),
                React.createElement('th', { style: { textAlign: 'left', padding: '8px 8px', borderBottom: '1px solid var(--helix-color-border-subtle)', color: 'var(--helix-color-text-secondary)' } }, 'Preview'),
              ),
            ),
            React.createElement(
              'tbody',
              null,
              uniqueFiltered.map(item => {
                const tokenText = item.token ?? item.value ?? '';
                const tokenValue = item.token ? `var(${item.token})` : item.value ?? '';
                const isColor = normalizeKind(item.kind) === 'color';
                const isTypography = normalizeKind(item.kind) === 'typography';
                const isSpace = normalizeKind(item.kind) === 'space';
                const rowKey = `${item.part}:${item.token ?? item.value ?? item.label}`;
                return React.createElement(
                  'tr',
                  { key: rowKey },
                  React.createElement('td', { style: { padding: '6px 8px', verticalAlign: 'middle', borderBottom: '1px solid var(--helix-color-border-subtle)', borderRight: '1px solid var(--helix-color-border-subtle)' } }, item.label || item.part),
                  React.createElement(
                    'td',
                    { style: { padding: '6px 8px', verticalAlign: 'middle', borderBottom: '1px solid var(--helix-color-border-subtle)', borderRight: '1px solid var(--helix-color-border-subtle)', overflow: 'hidden' } },
                    React.createElement('code', { style: { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' } }, tokenText),
                  ),
                  React.createElement(
                    'td',
                    { style: { padding: '6px 8px', verticalAlign: 'middle', borderBottom: '1px solid var(--helix-color-border-subtle)' } },
                    isColor
                      ? React.createElement('span', {
                          title: item.token,
                          style: {
                            display: 'inline-block',
                            width: 24,
                            height: 24,
                            borderRadius: 6,
                            backgroundColor: tokenValue,
                            border: '1px solid var(--helix-color-border-subtle)',
                          },
                        })
                      : isSpace
                        ? null
                      : isTypography
                        ? React.createElement(
                            'div',
                            { style: { display: 'flex', flexDirection: 'column', gap: 4 } },
                            item.meta ? React.createElement('span', { style: { fontSize: 11, color: 'var(--helix-color-text-secondary)' } }, item.meta) : null,
                            React.createElement('span', { style: getTypographyPreviewStyle(item) }, 'Ag Aa'),
                          )
                      : null,
                  ),
                );
              }),
            ),
          )
        : React.createElement('p', { style: { margin: '12px 0 0' } }, 'No tokens defined for this category.'),
    ),
  );
}

addons.register(ADDON_ID, () => {
  addons.add(PANEL_ID, {
    type: types.PANEL,
    title: 'Tokens',
    render: ({ active }) => React.createElement(TokensPanel, { active }),
  });
});
