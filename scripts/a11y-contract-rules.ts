/**
 * The accessibility checks that need no browser — read from a component's contract and its stories file.
 * Shared by the pre-commit gate (verify:a11y-contracts) and `pnpm a11y` (scripts/a11y.ts).
 *
 *   contract      a11y.role filled in, a11y.wcag names at least one criterion, an INTERACTIVE component
 *                 (onClick/onChange/onSelect/onDismiss/expanded…, or a widget role) lists its keys in a11y.keyboardNav,
 *                 and a11y.applied documents the layer it applies (focus, ARIA, contrast, target size — pnpm a11y)
 *   keys          every key in a11y.keyboardNav is pressed by a `play` test in its stories
 *   focus-return  when Escape closes something (dialog, panel, menu, tooltip, speed dial), a play test asserts
 *                 where focus lands right after (`toHaveFocus` after `{Escape}`) — WCAG 2.4.3
 */
import { requiredKeys } from './a11y-keys.ts';

// Props that mean "the user operates this", and roles that are widgets by definition.
const INTERACTIVE_PROPS = /^(onClick|onChange|onSelect|onDismiss|onExpandedChange|onValueChange|onReorder|expanded|checked|value)$/;
const WIDGET_ROLE = /\b(button|checkbox|radio|switch|tab|dialog|listbox|combobox|menu|menuitem|slider|textbox|spinbutton|disclosure)\b/i;

export type StaticCheck = 'contract' | 'keys' | 'focus-return';

export function staticA11yIssues(contract: any, storySrc: string): Record<StaticCheck, string[] | null> {
  const a11y = contract.a11y ?? {};
  const keys: string[] = a11y.keyboardNav ?? [];
  const play = storySrc.includes('play:') ? storySrc : '';

  const contractIssues: string[] = [];
  if (!String(a11y.role ?? '').trim()) contractIssues.push('a11y.role is empty');
  if (!(a11y.wcag ?? []).length) contractIssues.push('a11y.wcag names no WCAG criterion');
  const interactive = (contract.props ?? []).some((p: { name: string }) => INTERACTIVE_PROPS.test(p.name)) || WIDGET_ROLE.test(String(a11y.role ?? ''));
  if (interactive && keys.length === 0) contractIssues.push('interactive, but a11y.keyboardNav lists no keys');
  // The layer it applies must be documented (written by `pnpm a11y` from the real code — never by hand).
  const applied = a11y.applied;
  if (!applied) contractIssues.push('no a11y.applied — run `pnpm a11y <Name>` (Storybook running) to record its focus, ARIA, contrast and target sizes');
  else if (keys.length && !(applied.focus ?? []).length) contractIssues.push('a11y.applied has no focus indicator for an interactive component');

  const keyIssues: string[] = [];
  for (const entry of keys)
    for (const k of requiredKeys(entry))
      if (!k.anyOf.some(s => play.includes(s))) keyIssues.push(`no play test presses ${k.label} ("${entry.slice(0, 50)}")`);

  // null = doesn't apply (nothing closes on Escape)
  const closesOnEscape = keys.some(k => /esc/i.test(k) && /clos|dismiss|collaps/i.test(k));
  let focusIssues: string[] | null = null;
  if (closesOnEscape) {
    // toHaveFocus within the few lines after an Escape press (the assertion that follows it)
    const checked = [...play.matchAll(/\{Escape\}/g)].some(m => play.slice(m.index, m.index + 400).includes('toHaveFocus'));
    focusIssues = checked ? [] : ['Escape closes it, but no play test asserts where focus goes afterwards (add `expect(trigger).toHaveFocus()` after `{Escape}`)'];
  }

  return { contract: contractIssues, keys: keys.length ? keyIssues : (interactive ? keyIssues : null), 'focus-return': focusIssues };
}
