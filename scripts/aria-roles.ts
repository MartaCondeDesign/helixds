/**
 * What a screen reader should hear for a component, read from its contract — shared by verify:stable
 * (criterion 4, against each story's Playwright ariaSnapshot) and scripts/aria-snapshots.ts.
 *
 *   a11y.announces  explicit list of ARIA roles, when the prose in a11y.role is conditional
 *                   ("banner when it's a direct child of <body>") or names no role ("native <details>")
 *   a11y.role       otherwise: the first ARIA role word in it ("dialog (implicit via native <dialog>)" → dialog)
 */
const ARIA_ROLES = new Set([
  'alert', 'alertdialog', 'article', 'banner', 'button', 'cell', 'checkbox', 'columnheader', 'combobox', 'complementary',
  'contentinfo', 'dialog', 'form', 'grid', 'group', 'heading', 'img', 'link', 'list', 'listbox', 'listitem', 'main',
  'menu', 'menuitem', 'navigation', 'option', 'progressbar', 'radio', 'radiogroup', 'region', 'row', 'rowheader',
  'search', 'separator', 'slider', 'spinbutton', 'status', 'switch', 'tab', 'table', 'tablist', 'tabpanel',
  'textbox', 'tooltip',
]);

export function expectedRoles(a11y: { role?: string; announces?: string[] } | undefined): string[] {
  if (Array.isArray(a11y?.announces)) return a11y.announces;
  const first = String(a11y?.role ?? '').toLowerCase().match(/[a-z]+/g)?.find(w => ARIA_ROLES.has(w));
  return first ? [first] : [];
}

/** Roles present in a Playwright ariaSnapshot (YAML lines like `- button "Save"` or `- dialog "Delete?":`). */
export function rolesIn(snapshot: string): Set<string> {
  return new Set([...snapshot.matchAll(/^\s*- ([a-z]+)\b/gm)].map(m => m[1]!));
}
