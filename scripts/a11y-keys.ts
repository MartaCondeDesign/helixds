/**
 * The keys a contract's a11y.keyboardNav entry promises, and the strings a story's `play` test must contain
 * to exercise each (`userEvent.keyboard('{Escape}')`, `userEvent.tab()`…). Shared by verify:stable
 * (criterion 5) and verify:a11y-contracts (pre-commit), so both read a contract the same way.
 */
export function requiredKeys(entry: string): { label: string; anyOf: string[] }[] {
  const keyPart = entry.split(/\s[—-]\s/)[0]!;
  const out: { label: string; anyOf: string[] }[] = [];
  if (/\bArrow keys\b/i.test(keyPart)) out.push({ label: 'Arrow keys', anyOf: ['{ArrowDown}', '{ArrowRight}', '{ArrowUp}', '{ArrowLeft}'] });
  if (/Arrow Up/i.test(keyPart)) out.push({ label: 'ArrowUp', anyOf: ['{ArrowUp}'] });
  if (/Arrow (Up\/)?Down|Up\/Down/i.test(keyPart)) out.push({ label: 'ArrowDown', anyOf: ['{ArrowDown}'] });
  if (/\bHome\b/.test(keyPart)) out.push({ label: 'Home', anyOf: ['{Home}'] });
  if (/\bEnd\b/.test(keyPart)) out.push({ label: 'End', anyOf: ['{End}'] });
  if (/\bEnter\b/.test(keyPart)) out.push({ label: 'Enter', anyOf: ['{Enter}'] });
  if (/\bSpace\b/.test(keyPart)) out.push({ label: 'Space', anyOf: ['[Space]', '{Space}', "keyboard(' ')"] });
  if (/\bEscape\b/.test(keyPart)) out.push({ label: 'Escape', anyOf: ['{Escape}'] });
  if (/\bTab\b/.test(keyPart)) out.push({ label: 'Tab', anyOf: ['userEvent.tab(', '{Tab}'] });
  return out;
}
