import * as React from 'react';
import { IconChevronDown } from '@tabler/icons-react';
import { cn } from '../../lib/utils';
import { Icon } from '../Icon';
import { Menu, optionId } from '../Menu';
import type { SelectProps, SelectOption, SelectOptionGroup } from './Select.types';

let idCounter = 0;

function isGroup(opt: SelectOption | SelectOptionGroup): opt is SelectOptionGroup {
  return 'options' in opt;
}

function flattenOptions(options: (SelectOption | SelectOptionGroup)[]): SelectOption[] {
  return options.flatMap(opt => (isGroup(opt) ? opt.options : [opt]));
}

export function Select({
  label,
  options,
  value,
  defaultValue,
  onChange,
  placeholder,
  description,
  errorMessage,
  invalid = false,
  disabled = false,
  required = false,
  fullWidth = false,
  hideLabel = false,
  id: idProp,
  name,
  className,
}: SelectProps) {
  const uid    = React.useRef(`helix-select-${++idCounter}`).current;
  const id     = idProp ?? uid;
  const menuId = `${id}-menu`;
  const descId = description  ? `${id}-desc` : undefined;
  const errId  = errorMessage ? `${id}-err`  : undefined;
  const describedby = [descId, errId].filter(Boolean).join(' ') || undefined;

  const isControlled = value !== undefined;
  const [internalValue, setInternalValue] = React.useState(defaultValue);
  const current = isControlled ? value : internalValue;

  const [open, setOpen] = React.useState(false);
  const [activeValue, setActiveValue] = React.useState<string | undefined>(current);

  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const flatOptions = React.useMemo(() => flattenOptions(options), [options]);
  const selectedOption = flatOptions.find(o => o.value === current);

  const commit = (next: string) => {
    if (!isControlled) setInternalValue(next);
    onChange?.(next);
    setOpen(false);
    triggerRef.current?.focus();
  };

  const openMenu = (initialActive?: string) => {
    if (disabled) return;
    // Highlight the selected option if it's a real, enabled one — not just `current ?? first`: a
    // controlled "nothing selected" value of '' isn't nullish, and would open with no highlight at all.
    const selected = flatOptions.find(o => o.value === current && !o.disabled)?.value;
    setActiveValue(initialActive ?? selected ?? flatOptions.find(o => !o.disabled)?.value);
    setOpen(true);
  };

  const closeMenu = () => setOpen(false);

  const moveActive = (dir: 1 | -1) => {
    const enabled = flatOptions.filter(o => !o.disabled);
    if (enabled.length === 0) return;
    const currentIndex = enabled.findIndex(o => o.value === activeValue);
    const nextIndex = currentIndex === -1
      ? (dir === 1 ? 0 : enabled.length - 1)
      : (currentIndex + dir + enabled.length) % enabled.length;
    setActiveValue(enabled[nextIndex]!.value);
  };

  // Hand-rolled roving keyboard nav on the trigger — Menu itself is deliberately non-focusable
  // (real DOM focus stays on this button throughout, aria-activedescendant tracks the highlighted
  // option), the same interaction model a native <select> gives away for free. See ADR-013.
  const handleTriggerKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (disabled) return;
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        open ? moveActive(1) : openMenu();
        break;
      case 'ArrowUp':
        e.preventDefault();
        open ? moveActive(-1) : openMenu();
        break;
      case 'Home': {
        if (!open) break;
        e.preventDefault();
        const enabled = flatOptions.filter(o => !o.disabled);
        if (enabled[0]) setActiveValue(enabled[0].value);
        break;
      }
      case 'End': {
        if (!open) break;
        e.preventDefault();
        const enabled = flatOptions.filter(o => !o.disabled);
        if (enabled.length) setActiveValue(enabled[enabled.length - 1]!.value);
        break;
      }
      case 'Enter':
      case ' ':
        e.preventDefault();
        if (open) { if (activeValue) commit(activeValue); }
        else openMenu();
        break;
      case 'Escape':
        if (open) { e.preventDefault(); closeMenu(); }
        break;
      case 'Tab':
        // Close first, then let focus move on as usual (no preventDefault) — contract a11y.keyboardNav.
        if (open) closeMenu();
        break;
      default:
        break;
    }
  };

  // Click-outside — closes when a pointer lands outside both the trigger and the portaled menu.
  React.useEffect(() => {
    if (!open) return;
    const handlePointerDown = (e: PointerEvent) => {
      const target = e.target as Node;
      if (triggerRef.current?.contains(target)) return;
      if (document.getElementById(menuId)?.contains(target)) return;
      setOpen(false);
    };
    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, [open, menuId]);

  return (
    <div
      data-helix-part="select-root"
      {...(fullWidth ? { 'data-full-width': '' } : {})}
      {...(disabled  ? { 'data-disabled':   '' } : {})}
      {...(invalid   ? { 'data-invalid':    '' } : {})}
      className={cn(className)}
    >
      <label
        data-helix-part="select-label"
        htmlFor={id}
        style={hideLabel ? { position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0,0,0,0)' } : undefined}
      >
        {label}
        {required && <span aria-hidden="true"> *</span>}
      </label>

      <div
        data-helix-part="select-wrapper"
        {...(disabled ? { 'data-disabled': '' } : {})}
        {...(invalid  ? { 'data-invalid':  '' } : {})}
      >
        <button
          ref={triggerRef}
          type="button"
          id={id}
          data-helix-part="select-trigger"
          {...(!selectedOption ? { 'data-placeholder': '' } : {})}
          disabled={disabled}
          // role="combobox" — the WAI-ARIA select-only combobox pattern. A plain button role doesn't
          // allow aria-required or aria-activedescendant (axe aria-allowed-attr); combobox allows both
          // and is a permitted role on <button> (ARIA in HTML).
          role="combobox"
          aria-haspopup="listbox"
          aria-expanded={open}
          // Only while open: Menu isn't in the DOM when closed, and an id reference to a missing element
          // is invalid ARIA (axe aria-valid-attr-value).
          aria-controls={open ? menuId : undefined}
          aria-invalid={invalid || undefined}
          aria-describedby={describedby}
          aria-required={required || undefined}
          aria-activedescendant={open && activeValue ? optionId(menuId, activeValue) : undefined}
          onClick={() => (open ? closeMenu() : openMenu())}
          onKeyDown={handleTriggerKeyDown}
        >
          {/* Own span, not a bare text node — lets a fixed-width trigger (className/min-width set
              by the consumer) truncate a long option label with an ellipsis instead of overflowing
              or forcing the box to grow, matching how a native <select> handles the same case. */}
          <span data-helix-part="select-trigger-label">
            {selectedOption?.label ?? placeholder ?? ''}
          </span>
        </button>

        <span data-helix-part="select-chevron" aria-hidden="true">
          <Icon icon={IconChevronDown} size={16} />
        </span>

        <Menu
          id={menuId}
          expanded={open}
          anchorRef={triggerRef}
          options={options}
          onSelect={commit}
          {...(current !== undefined ? { value: current } : {})}
          {...(activeValue !== undefined ? { activeValue } : {})}
        />

        {/* Form participation — a hand-rolled trigger has nothing native to submit or validate with.
            A real (not type="hidden") input so native constraint validation applies: `required`
            blocks submit while empty, same as a native <select>. Not readOnly either — readOnly
            inputs are barred from validation too. Invisible, untabbable and aria-hidden; when the
            browser focuses it to report the error, focus is handed to the trigger instead. */}
        {(name || required) && (
          <input
            data-helix-part="select-native"
            type="text"
            tabIndex={-1}
            aria-hidden="true"
            name={name}
            value={current ?? ''}
            required={required}
            disabled={disabled}
            onChange={() => {}} // mirrors `current`; the Menu owns the real value change
            onFocus={() => triggerRef.current?.focus()}
          />
        )}
      </div>

      {description && !errorMessage && (
        <span id={descId} data-helix-part="select-description">
          {description}
        </span>
      )}
      {errorMessage && (
        <span id={errId} data-helix-part="select-error" role="alert">
          {errorMessage}
        </span>
      )}
    </div>
  );
}

Select.displayName = 'Select';
