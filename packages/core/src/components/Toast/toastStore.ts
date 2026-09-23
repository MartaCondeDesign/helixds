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

let toasts: ToastRecord[] = [];
let listeners: Array<(toasts: ToastRecord[]) => void> = [];
let counter = 0;

function emit() {
  for (const listener of listeners) listener(toasts);
}

function show(variant: ToastVariant, label: string, description?: string): string {
  const id = `helix-toast-${++counter}`;
  // Conditionally spread `description` in, rather than always assigning it (even as `undefined`) —
  // exactOptionalPropertyTypes treats "property present with value undefined" as distinct from
  // "property absent", and ToastRecord['description'] is typed as the former never happening.
  toasts = [{ id, variant, label, ...(description !== undefined ? { description } : {}) }, ...toasts];
  emit();
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

export const toast = {
  neutral: (label: string, description?: string) => show('neutral', label, description),
  info: (label: string, description?: string) => show('info', label, description),
  success: (label: string, description?: string) => show('success', label, description),
  warning: (label: string, description?: string) => show('warning', label, description),
  danger: (label: string, description?: string) => show('danger', label, description),
  dismiss,
};
