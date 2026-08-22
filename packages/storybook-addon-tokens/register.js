import React from 'react';
import { AddonPanel } from 'storybook/internal/components';
import { addons, types, useStorybookApi } from '@storybook/manager-api';
import { HELIX_HIGHLIGHT_EVENT } from './constants.js';

const ADDON_ID = 'helix-ds/storybook-addon-tokens';
const PANEL_ID = 'helix-ds/storybook-addon-tokens/panel';

const CATEGORY_ORDER = ['color', 'typography', 'spacing', 'radius', 'sizing', 'shadows'];

const CATEGORY_LABELS = {
  color: 'Color',
  typography: 'Typography',
  spacing: 'Spacing',
  radius: 'Radius',
  sizing: 'Sizing',
  shadows: 'Shadows',
};

// Panel-local UI accent — deliberately NOT the lilac used to highlight the live
// component in the canvas. The panel's own tabs/row-hover stay on the ordinary
// focus color so lilac reads as one unambiguous signal: "this is on the component".
const PANEL_ACCENT = 'var(--helix-color-border-focus)';
const PANEL_ACCENT_SOFT = 'color-mix(in srgb, var(--helix-color-border-focus) 14%, transparent)';

const TABLE_STYLE = {
  width: '100%',
  borderCollapse: 'collapse',
  marginTop: 16,
  border: '1px solid var(--helix-color-border-neutral)',
  borderRadius: 12,
  overflow: 'hidden',
  tableLayout: 'fixed',
};

const TH_STYLE = {
  textAlign: 'left',
  padding: '8px 12px',
  fontSize: 11,
  fontWeight: 600,
  letterSpacing: '0.04em',
  textTransform: 'uppercase',
  color: 'var(--helix-color-text-neutral-lightest)',
  borderBottom: '1px solid var(--helix-color-border-neutral)',
  borderRight: '1px solid var(--helix-color-border-neutral-light)',
};

const TD_STYLE = {
  padding: '10px 12px',
  verticalAlign: 'top',
  borderRight: '1px solid var(--helix-color-border-neutral-light)',
  borderBottom: '1px solid var(--helix-color-border-neutral-light)',
};

function normalizeKind(kind) {
  if (kind === 'color' || kind === 'typography' || kind === 'space' || kind === 'shadow' || kind === 'radius') return kind;
  return 'other';
}

function inferSpaceKind(item) {
  const text = `${item.part ?? ''} ${item.label ?? ''} ${item.token ?? ''}`.toLowerCase();
  if (/(padding|margin|gap|space|inset|offset)/.test(text)) return 'spacing';
  return 'sizing';
}

function getCategory(item) {
  const kind = normalizeKind(item.kind);
  if (kind === 'space') return inferSpaceKind(item);
  if (kind === 'shadow') return 'shadows';
  return kind;
}

function rowKeyFor(item) {
  return `${item.part}:${item.token ?? item.value ?? item.label}`;
}

function TokensPanel({ active }) {
  const api = useStorybookApi();
  const currentStory = api.getCurrentStoryData?.();
  const currentVariant = currentStory?.args?.variant;
  const tokens = currentStory?.parameters?.helixTokens ?? [];
  const [category, setCategory] = React.useState('color');
  const [hoveredRow, setHoveredRow] = React.useState(null);
  const channel = React.useMemo(() => addons.getChannel(), []);

  // The preview iframe reloads its story on navigation — a highlight left over from a
  // hovered row in the previous story would otherwise point at DOM that no longer exists.
  React.useEffect(() => {
    return () => channel.emit(HELIX_HIGHLIGHT_EVENT, null);
  }, [channel, currentStory?.id]);

  function highlightComponent(item) {
    setHoveredRow(item ? rowKeyFor(item) : null);
    channel.emit(
      HELIX_HIGHLIGHT_EVENT,
      item
        ? { part: item.part, variant: item.variant, category: getCategory(item), token: item.token, value: item.value, label: item.label, meta: item.meta }
        : null,
    );
  }

  const categories = React.useMemo(() => {
    const present = CATEGORY_ORDER.filter(kind => tokens.some(item => getCategory(item) === kind && (!currentVariant || !item.variant || item.variant === currentVariant)));
    return present;
  }, [tokens, currentVariant]);

  React.useEffect(() => {
    if (!categories.length) return;
    if (!categories.includes(category)) {
      setCategory(categories[0]);
    }
  }, [category, categories]);

  const filtered = React.useMemo(
    () => tokens.filter(item => {
      const kind = getCategory(item);
      if (kind !== category) return false;
      if (currentVariant && item.variant && item.variant !== currentVariant) return false;
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

  const showPreviewColumn = category === 'color';

  return React.createElement(
    AddonPanel,
    { active },
    React.createElement(
      'div',
      { style: { padding: '24px', overflowX: 'auto' } },
      React.createElement(
        'div',
        { style: { display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 20 } },
        categories.map(item =>
          React.createElement(
            'button',
            {
              key: item,
              type: 'button',
              onClick: () => setCategory(item),
              style: {
                border: `1px solid ${category === item ? PANEL_ACCENT : 'var(--helix-color-border-neutral)'}`,
                borderRadius: 999,
                padding: '4px 9px',
                fontSize: 11,
                background: category === item ? PANEL_ACCENT_SOFT : 'var(--helix-color-fill-surface)',
                color: category === item ? PANEL_ACCENT : 'var(--helix-color-text-neutral)',
                cursor: 'pointer',
                font: 'inherit',
              },
            },
            CATEGORY_LABELS[item] ?? item,
          ),
        ),
      ),
      uniqueFiltered.length > 0
        ? React.createElement(
            'table',
            { style: TABLE_STYLE },
            React.createElement(
              'thead',
              null,
              React.createElement(
                'tr',
                null,
                React.createElement('th', { style: { ...TH_STYLE, width: showPreviewColumn ? '32%' : '38%' } }, 'Element'),
                React.createElement('th', { style: { ...TH_STYLE, width: showPreviewColumn ? '48%' : undefined, borderRight: showPreviewColumn ? '1px solid var(--helix-color-border-neutral-light)' : 'none' } }, 'Token'),
                showPreviewColumn ? React.createElement('th', { style: { ...TH_STYLE, borderRight: 'none' } }, 'Preview') : null,
              ),
            ),
            React.createElement(
              'tbody',
              null,
              uniqueFiltered.map(item => {
                const tokenText = item.token ?? item.value ?? '';
                const key = rowKeyFor(item);
                const isHovered = hoveredRow === key;
                return React.createElement(
                  'tr',
                  {
                    key,
                    onMouseEnter: () => highlightComponent(item),
                    onMouseLeave: () => highlightComponent(null),
                    style: { background: isHovered ? PANEL_ACCENT_SOFT : 'transparent' },
                  },
                  React.createElement('td', { style: TD_STYLE }, item.label || item.part),
                  React.createElement(
                    'td',
                    { style: { ...TD_STYLE, borderRight: showPreviewColumn ? TD_STYLE.borderRight : 'none', overflow: 'hidden' } },
                    React.createElement('code', { style: { fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' } }, tokenText),
                    item.meta ? React.createElement('span', { style: { display: 'block', marginTop: 2, fontSize: 11, color: 'var(--helix-color-text-neutral-lightest)' } }, item.meta) : null,
                  ),
                  showPreviewColumn
                    ? React.createElement(
                        'td',
                        { style: { padding: '10px 12px', verticalAlign: 'middle', borderBottom: '1px solid var(--helix-color-border-neutral-light)' } },
                        React.createElement('span', {
                          title: item.token ? `var(${item.token})` : item.value ?? '',
                          style: {
                            display: 'inline-block',
                            width: 28,
                            height: 28,
                            borderRadius: 8,
                            border: '1px solid var(--helix-color-border-neutral)',
                            backgroundColor: item.token ? `var(${item.token})` : item.value ?? '',
                          },
                        }),
                      )
                    : null,
                );
              }),
            ),
          )
        : React.createElement('p', { style: { margin: '16px 0 0', color: 'var(--helix-color-text-neutral-light)' } }, 'No tokens defined for this category.'),
    ),
  );
}

addons.register(ADDON_ID, (api) => {
  addons.add(PANEL_ID, {
    id: PANEL_ID,
    type: types.PANEL,
    title: 'Tokens',
    disabled: parameters => !parameters?.helixTokens?.length,
    render: ({ active }) => React.createElement(TokensPanel, { active }),
  });
});
