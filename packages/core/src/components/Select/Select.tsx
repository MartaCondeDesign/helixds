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
    setActiveValue(initialActive ?? current ?? flatOptions.find(o => !o.disabled)?.value);
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
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={menuId}
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
          <Icon icon={IconChevronDown} size={14} />
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

        {/* Form participation — a hand-rolled trigger has nothing native to submit with otherwise.
            Native constraint validation doesn't apply to hidden inputs (`required` is a no-op here);
            real required-field validation for Select is a known follow-up, not solved by this alone. */}
        {name && <input type="hidden" name={name} value={current ?? ''} />}
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
