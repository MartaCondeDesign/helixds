/**
 * Plain module-level pub-sub, not React context — see ADR-011. `toast.*` needs to work from anywhere
 * (an event handler, a fetch `.then()`, code with no component tree access at all), which a
 * context-based store can't offer since it only exists inside whatever subtree provides it.
 */
export type ToastVariant = 'neutral' | 'info' | 'success' | 'warning' | 'danger';

export interface ToastRecord {
  id: string;
  variant: ToastVariant;
  label: string;
  description?: string;
  /** Set by ToastViewport once the leave transition starts — kept in the list (not spliced out
   *  immediately) so the closing animation has something to animate; removed for real after
   *  component.toast.durationClose has elapsed. */
  leaving?: boolean;
}

/** Sonner-style options object — accepted as the second argument in place of the description string,
 *  since that's the shape agents and developers coming from Sonner reach for first. */
export interface ToastOptions {
  description?: string;
}

let toasts: ToastRecord[] = [];
let listeners: Array<(toasts: ToastRecord[]) => void> = [];
let counter = 0;

function emit() {
  for (const listener of listeners) listener(toasts);
}

let missingViewportWarned = false;

function show(variant: ToastVariant, label: string, detail?: string | ToastOptions): string {
  const description = typeof detail === 'string' ? detail : detail?.description;
  const id = `helix-toast-${++counter}`;
  // Conditionally spread `description` in, rather than always assigning it (even as `undefined`) —
  // exactOptionalPropertyTypes treats "property present with value undefined" as distinct from
  // "property absent", and ToastRecord['description'] is typed as the former never happening.
  toasts = [{ id, variant, label, ...(description !== undefined ? { description } : {}) }, ...toasts];
  emit();
  // Nothing renders a toast unless <Toast /> is mounted somewhere. Checked a moment later, not
  // immediately, so a toast fired while <Toast /> is still mounting in the same render isn't flagged.
  if (!missingViewportWarned && typeof window !== 'undefined') {
    window.setTimeout(() => {
      if (listeners.length === 0 && !missingViewportWarned) {
        missingViewportWarned = true;
        console.warn('[helix] toast.* was called but no <Toast /> is mounted, so nothing is shown. Render <Toast /> once near your app root.');
      }
    }, 1000);
  }
  return id;
}

function dismiss(id: string): void {
  const target = toasts.find(t => t.id === id);
  if (!target || target.leaving) return;
  toasts = toasts.map(t => (t.id === id ? { ...t, leaving: true } : t));
  emit();
}

/** Called by ToastViewport once a leaving toast's close transition actually finishes. */
export function removeToast(id: string): void {
  toasts = toasts.filter(t => t.id !== id);
  emit();
}

export function subscribeToasts(listener: (toasts: ToastRecord[]) => void): () => void {
  listeners.push(listener);
  listener(toasts);
  return () => {
    listeners = listeners.filter(l => l !== listener);
  };
}

/** toast.success(label, description?) — the description can also be passed as { description }. */
export const toast = {
  neutral: (label: string, detail?: string | ToastOptions) => show('neutral', label, detail),
  info: (label: string, detail?: string | ToastOptions) => show('info', label, detail),
  success: (label: string, detail?: string | ToastOptions) => show('success', label, detail),
  warning: (label: string, detail?: string | ToastOptions) => show('warning', label, detail),
  danger: (label: string, detail?: string | ToastOptions) => show('danger', label, detail),
  dismiss,
};
