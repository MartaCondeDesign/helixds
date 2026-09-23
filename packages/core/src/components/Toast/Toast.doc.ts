/** Machine-readable component documentation for the Helix Toast. */
import type { ComponentDoc } from '../../lib/component-doc';

export const doc: ComponentDoc = {
  name: 'Toast',
  purpose: 'A Sonner-style stacking notification, fixed to the top-right corner, triggered imperatively from anywhere.',
  contract: 'contracts/components/Toast.json',
  a11y: [
    'The viewport is role="region" aria-live="polite" — new toasts are announced without interrupting.',
    'Each toast\'s close button is a real IconButton with an accessible label ("Dismiss").',
    'Hover pauses (never restarts) that toast\'s auto-dismiss timer.',
  ],
  variants: [
    { name: 'neutral', description: 'Default neutral notification.' },
    { name: 'info', description: 'Informational update.' },
    { name: 'success', description: 'Confirms a completed action.' },
    { name: 'warning', description: 'A caution or upcoming issue.' },
    { name: 'danger', description: 'An error or failure.' },
  ],
  sizes: [],
  tokens: [
    { part: 'toast', label: 'fill', token: '--helix-toast-fill', kind: 'color' },
    { part: 'toast-title', label: 'text', token: '--helix-toast-text', kind: 'color' },
    { part: 'toast-description', label: 'text', token: '--helix-toast-textDescription', kind: 'color' },
    { part: 'toast-icon', label: 'color (per variant)', token: '--helix-badge-icon-{variant}', kind: 'color', meta: 'Reused from Badge — the only place variant color shows, per ADR-011.' },
    { part: 'toast', label: 'shadow', token: '--helix-toast-shadow', kind: 'shadow' },
  ],
  features: [
    'Mount <Toast /> once, anywhere in your app (portals to document.body).',
    'toast.neutral / .info / .success / .warning / .danger (label, description?) — fire from anywhere, returns an id.',
    'toast.dismiss(id) — dismiss one early, plays the leave transition.',
    'Stacks up to 3 visible, hover to spread and read older ones.',
  ],
  examples: [
    { label: 'Mount once', code: `<Toast />` },
    { label: 'Fire a toast', code: `toast.success('Published', 'Your changes are now live.')` },
    { label: 'Dismiss early', code: `const id = toast.info('Update available'); toast.dismiss(id);` },
  ],
};
