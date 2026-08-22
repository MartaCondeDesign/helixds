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

const HIGHLIGHT = 'var(--helix-color-border-focus)';
const HIGHLIGHT_SOFT = 'color-mix(in srgb, var(--helix-color-border-focus) 18%, transparent)';

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
  padding: '10px 12px',
  fontSize: 11,
  fontWeight: 600,
  letterSpacing: '0.04em',
  textTransform: 'uppercase',
  color: 'var(--helix-color-text-neutral-lightest)',
  borderBottom: '1px solid var(--helix-color-border-neutral)',
  borderRight: '1px solid var(--helix-color-border-neutral-light)',
};

const TD_STYLE = {
  padding: '12px',
  verticalAlign: 'top',
  borderRight: '1px solid var(--helix-color-border-neutral-light)',
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

function getResolvedTokenValue(item) {
  if (!item.token) return item.value ?? '';
  if (typeof window === 'undefined') return `var(${item.token})`;
  const resolved = window.getComputedStyle(document.documentElement).getPropertyValue(item.token).trim();
  return resolved || `var(${item.token})`;
}

function getPreviewMode(item) {
  const text = `${item.part ?? ''} ${item.label ?? ''} ${item.token ?? ''}`.toLowerCase();
  if (text.includes('width')) return 'width';
  if (text.includes('height')) return 'height';
  return 'size';
}

function getTypographyPreviewStyle(item) {
  const style = {
    display: 'inline-flex',
    alignItems: 'baseline',
    color: 'var(--helix-color-text-neutral)',
    whiteSpace: 'nowrap',
  };

  if (!item.token || typeof window === 'undefined') return style;

  const resolved = window.getComputedStyle(document.documentElement).getPropertyValue(item.token).trim();

  if (item.token.includes('fontSize')) style.fontSize = resolved;
  if (item.token.includes('fontWeight')) style.fontWeight = resolved;
  if (item.token.includes('lineHeight')) style.lineHeight = resolved;
  if (item.token.includes('letterSpacing')) style.letterSpacing = resolved;
  if (item.token.includes('fontFamily')) style.fontFamily = resolved;

  return style;
}

function previewTextStyle() {
  return {
    fontSize: 11,
    color: 'var(--helix-color-text-neutral-lightest)',
  };
}

// Static previews — the row itself no longer glows on hover. Hovering a row instead
// highlights the real, live component in the preview canvas (see the channel emit in
// TokensPanel's row handlers + packages/storybook-addon-tokens/preview.js).
function renderPreview(item) {
  const kind = getCategory(item);
  const tokenValue = item.token ? `var(${item.token})` : item.value ?? '';

  if (kind === 'color') {
    return React.createElement(
      'div',
      { style: { display: 'flex', alignItems: 'center', gap: 8 } },
      React.createElement('span', {
        title: tokenValue,
        style: {
          width: 28,
          height: 28,
          borderRadius: 8,
          border: '1px solid var(--helix-color-border-neutral)',
          backgroundColor: tokenValue,
        },
      }),
    );
  }

  if (kind === 'typography') {
    return React.createElement(
      'div',
      { style: { display: 'flex', flexDirection: 'column', gap: 4 } },
      item.meta ? React.createElement('span', { style: previewTextStyle() }, item.meta) : null,
      React.createElement('span', { style: getTypographyPreviewStyle(item) }, 'Ag Aa'),
    );
  }

  if (kind === 'radius') {
    const radius = item.token ? getResolvedTokenValue(item) : tokenValue;
    return React.createElement(
      'div',
      { style: { display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-start' } },
      React.createElement('div', {
        title: radius,
        style: {
          width: 60,
          height: 36,
          borderRadius: radius,
          border: '1px solid var(--helix-color-border-neutral)',
          background: 'var(--helix-color-fill-surface)',
        },
      }),
      React.createElement('span', { style: previewTextStyle() }, radius),
    );
  }

  if (kind === 'shadows') {
    const shadow = tokenValue;
    return React.createElement(
      'div',
      { style: { display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-start' } },
      React.createElement('div', {
        title: shadow,
        style: {
          width: 60,
          height: 36,
          borderRadius: 10,
          border: '1px solid var(--helix-color-border-neutral-light)',
          background: 'var(--helix-color-fill-surface)',
          boxShadow: shadow,
        },
      }),
      React.createElement('span', { style: previewTextStyle() }, 'Shadow preview'),
    );
  }

  if (kind === 'spacing' || kind === 'sizing') {
    const mode = getPreviewMode(item);
    const length = item.token ? getResolvedTokenValue(item) : tokenValue;
    const outerLineStyle = {
      position: 'absolute',
      borderColor: 'var(--helix-color-border-neutral-dark)',
    };
    const boxStyle = {
      position: 'relative',
      borderRadius: 10,
      background: 'var(--helix-color-fill-surface)',
      border: '1px solid var(--helix-color-border-neutral)',
    };

    if (mode === 'width') {
      return React.createElement(
        'div',
        { style: { position: 'relative', width: 88, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center' } },
        React.createElement('span', { style: { ...outerLineStyle, left: 4, right: 4, top: 10, borderTopWidth: 2, borderTopStyle: 'solid' } }),
        React.createElement('div', { style: { ...boxStyle, width: length, height: 16, minWidth: 20 } }),
      );
    }

    if (mode === 'height') {
      return React.createElement(
        'div',
        { style: { position: 'relative', width: 64, height: 64, display: 'flex', alignItems: 'center', justifyContent: 'center' } },
        React.createElement('span', { style: { ...outerLineStyle, top: 4, bottom: 4, left: 18, borderLeftWidth: 2, borderLeftStyle: 'solid' } }),
        React.createElement('div', { style: { ...boxStyle, width: 16, height: length, minHeight: 20 } }),
      );
    }

    return React.createElement(
      'div',
      { style: { position: 'relative', width: 88, height: 64, display: 'flex', alignItems: 'center', justifyContent: 'center' } },
      React.createElement('span', { style: { ...outerLineStyle, left: 8, right: 8, top: 10, borderTopWidth: 2, borderTopStyle: 'solid' } }),
      React.createElement('span', { style: { ...outerLineStyle, top: 8, bottom: 8, left: 18, borderLeftWidth: 2, borderLeftStyle: 'solid' } }),
      React.createElement('div', { style: { ...boxStyle, width: 24, height: 24 } }),
    );
  }

  return React.createElement('span', { style: previewTextStyle() }, tokenValue || '');
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
    setHoveredRow(item ? `${item.part}:${item.token ?? item.value ?? item.label}` : null);
    channel.emit(HELIX_HIGHLIGHT_EVENT, item ? { part: item.part, variant: item.variant } : null);
  }

  const categories = React.useMemo(() => {
    const present = CATEGORY_ORDER.filter(kind => tokens.some(item => getCategory(item) === kind && (kind !== 'color' || !currentVariant || !item.variant || item.variant === currentVariant)));
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
      { style: { padding: '24px', overflowX: 'auto' } },
      React.createElement(
        'div',
        { style: { display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 20 } },
        categories.map(item =>
          React.createElement(
            'button',
            {
              key: item,
              type: 'button',
              onClick: () => setCategory(item),
              style: {
                border: `1px solid ${category === item ? 'var(--helix-color-border-focus)' : 'var(--helix-color-border-neutral)'}`,
                borderRadius: 999,
                padding: '7px 12px',
                background: category === item ? 'var(--helix-color-fill-primary-interactive-light-default)' : 'var(--helix-color-fill-surface)',
                color: 'var(--helix-color-text-neutral)',
                cursor: 'pointer',
                font: 'inherit',
                boxShadow: category === item ? `0 0 0 4px ${HIGHLIGHT_SOFT}` : 'none',
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
                React.createElement('th', { style: { ...TH_STYLE, width: '32%' } }, 'Element'),
                React.createElement('th', { style: { ...TH_STYLE, width: '48%' } }, 'Token'),
                React.createElement('th', { style: { ...TH_STYLE, borderRight: 'none' } }, 'Preview'),
              ),
            ),
            React.createElement(
              'tbody',
              null,
              uniqueFiltered.map(item => {
                const tokenText = item.token ?? item.value ?? '';
                const rowKey = `${item.part}:${item.token ?? item.value ?? item.label}`;
                const isHovered = hoveredRow === rowKey;
                return React.createElement(
                  'tr',
                  {
                    key: rowKey,
                    onMouseEnter: () => highlightComponent(item),
                    onMouseLeave: () => highlightComponent(null),
                    style: { background: isHovered ? HIGHLIGHT_SOFT : 'transparent' },
                  },
                  React.createElement('td', { style: { ...TD_STYLE, borderBottom: '1px solid var(--helix-color-border-neutral-light)' } }, item.label || item.part),
                  React.createElement(
                    'td',
                    { style: { ...TD_STYLE, borderBottom: '1px solid var(--helix-color-border-neutral-light)', overflow: 'hidden' } },
                    React.createElement('code', { style: { fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' } }, tokenText),
                  ),
                  React.createElement(
                    'td',
                    { style: { padding: '12px', verticalAlign: 'middle', borderBottom: '1px solid var(--helix-color-border-neutral-light)' } },
                    renderPreview(item),
                  ),
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
