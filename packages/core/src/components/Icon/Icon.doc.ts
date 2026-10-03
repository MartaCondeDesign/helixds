/** Machine-readable component documentation for the Helix Icon. */
import type { ComponentDoc } from '../../lib/component-doc';

export const doc: ComponentDoc = {
  name: 'Icon',
  purpose: 'Communicates meaning, action, or status through a recognizable icon symbol. Defaults to Tabler\'s outline set but accepts any icon-set-agnostic component (ADR-014). Always supplemental to text — never the sole conveyor of information without a label.',
  contract: 'contracts/components/Icon.json',
  a11y: [
    "Default (decorative=true) renders aria-hidden='true' — use when a visible label sits next to the icon.",
    "Pass decorative={false} and a label for icon-only usage — renders role='img' aria-label={label} instead of aria-hidden.",
    'Never rely on the icon alone to convey status — pair with text or an explicit label.',
  ],
  variants: [],
  sizes: ['12', '14', '16', '18', '20', '24', '28', '32', '36', '40'],
  tokens: [
    { part: 'icon-root', label: 'color.neutral', token: '--helix-color-icon-neutral', kind: 'color' },
    { part: 'icon-root', label: 'color.neutral-light', token: '--helix-color-icon-neutral-light', kind: 'color' },
    { part: 'icon-root', label: 'color.disabled', token: '--helix-color-icon-disabled', kind: 'color' },
    { part: 'icon-root', label: 'color.inverse', token: '--helix-color-icon-inverse', kind: 'color' },
    { part: 'icon-root', label: 'color.primary', token: '--helix-color-icon-primary', kind: 'color' },
    { part: 'icon-root', label: 'color.danger', token: '--helix-color-icon-danger', kind: 'color' },
    { part: 'icon-root', label: 'color.success', token: '--helix-color-icon-success', kind: 'color' },
    { part: 'icon-root', label: 'color.warning', token: '--helix-color-icon-warning', kind: 'color' },
    { part: 'icon-root', label: 'color.info', token: '--helix-color-icon-info', kind: 'color' },
    { part: 'icon-root', label: 'stroke-width', value: '1.3px → 2.8px real', kind: 'other', meta: 'ADR-017 stroke rule — real on-screen width per size (12: 1.3, 14: 1.4, 16: 1.5, 18: 1.5, 20: 1.7, 24: 1.8, 28: 2.0, 32: 2.2, 36: 2.4, 40: 2.8px), applied automatically by Icon' },
    { part: 'icon-root', label: 'viewBox', value: '0 0 24 24', kind: 'other' },
  ],
  features: [
    'icon — any HelixIconComponent-shaped icon (e.g. IconPlus), passed by reference not by name string — Tabler is the default set, not a requirement',
    'size — fixed pixel size, one of 12 | 14 | 16 | 18 | 20 | 24 | 28 | 32 | 36 | 40 — never scales with font-size',
    'stroke — derived automatically from size (ADR-017 stroke rule); pass only for a deliberate one-off',
    'decorative/label — controls aria-hidden vs role="img" + aria-label',
  ],
  examples: [
    { label: 'Decorative (default, paired with visible text)', code: `<Icon icon={IconPlus} />` },
    { label: 'Icon-only, needs a label', code: `<Icon icon={IconTrash} decorative={false} label="Delete" />` },
    { label: 'Sized + colored via token', code: `<Icon icon={IconAlertCircle} size={20} className="text-[color:var(--helix-color-icon-danger)]" />` },
    { label: 'Non-Tabler icon set via adapter', code: `const LucideSearch = createIconAdapter(Search, { strokeProp: 'strokeWidth' });\n<Icon icon={LucideSearch} />` },
  ],
};
