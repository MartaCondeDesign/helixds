import * as React from 'react';
import { IconChevronDown } from '@tabler/icons-react';
import { cn } from '../../lib/utils';
import { Icon } from '../Icon';
import { Chip } from '../Chip';
import { Menu, optionId } from '../Menu';
import type { MultiSelectProps, MultiSelectOption, MultiSelectOptionGroup } from './MultiSelect.types';

let idCounter = 0;

function isGroup(opt: MultiSelectOption | MultiSelectOptionGroup): opt is MultiSelectOptionGroup {
  return 'options' in opt;
}

function flattenOptions(options: (MultiSelectOption | MultiSelectOptionGroup)[]): MultiSelectOption[] {
  return options.flatMap(opt => (isGroup(opt) ? opt.options : [opt]));
}

const VISUALLY_HIDDEN: React.CSSProperties = {
  position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0,0,0,0)', whiteSpace: 'nowrap',
};

/**
 * Select's field and interaction model (ADR-013) with the selected values as Chips inside the field —
 * see ADR-019. The combobox button owns real DOM focus; the chips' × buttons are the only other stops.
 */
export function MultiSelect({
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
}: MultiSelectProps) {
  const uid    = React.useRef(`helix-multi-select-${++idCounter}`).current;
  const id     = idProp ?? uid;
  const menuId = `${id}-menu`;
  const descId = description  ? `${id}-desc` : undefined;
  const errId  = errorMessage ? `${id}-err`  : undefined;
  const describedby = [descId, errId].filter(Boolean).join(' ') || undefined;

  const isControlled = value !== undefined;
  const [internalValue, setInternalValue] = React.useState<string[]>(defaultValue ?? []);
  const current = isControlled ? value : internalValue;

  const [open, setOpen] = React.useState(false);
  const [activeValue, setActiveValue] = React.useState<string | undefined>(undefined);

  const fieldRef   = React.useRef<HTMLDivElement>(null);
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const flatOptions = React.useMemo(() => flattenOptions(options), [options]);
  // In the order they were picked, so a new chip always lands at the end of the row.
  const selectedOptions = current
    .map(v => flatOptions.find(o => o.value === v))
    .filter((o): o is MultiSelectOption => o !== undefined);

  const setValues = (next: string[]) => {
    if (!isControlled) setInternalValue(next);
    onChange?.(next);
  };

  // Toggle, don't close — several values can be picked in one go (ADR-019).
  const toggle = (optionValue: string) => {
    setValues(current.includes(optionValue) ? current.filter(v => v !== optionValue) : [...current, optionValue]);
    triggerRef.current?.focus();
  };

  const remove = (optionValue: string) => {
    setValues(current.filter(v => v !== optionValue));
  };

  const enabledOptions = () => flatOptions.filter(o => !o.disabled);

  // The gray keyboard highlight only starts on the first option when the keyboard opened the menu — a
  // pointer open starts with nothing highlighted, so no option looks hovered that isn't.
  const openMenu = (via: 'keyboard' | 'pointer' = 'keyboard') => {
    if (disabled) return;
    setActiveValue(via === 'keyboard' ? enabledOptions()[0]?.value : undefined);
    setOpen(true);
  };

  const closeMenu = () => setOpen(false);

  const moveActive = (dir: 1 | -1) => {
    const enabled = enabledOptions();
    if (enabled.length === 0) return;
    const currentIndex = enabled.findIndex(o => o.value === activeValue);
    const nextIndex = currentIndex === -1
      ? (dir === 1 ? 0 : enabled.length - 1)
      : (currentIndex + dir + enabled.length) % enabled.length;
    setActiveValue(enabled[nextIndex]!.value);
  };

  // Same hand-rolled roving model as Select's trigger (ADR-013); differences are Enter/Space toggling
  // without closing, and Backspace removing the last chip.
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
        const enabled = enabledOptions();
        if (enabled[0]) setActiveValue(enabled[0].value);
        break;
      }
      case 'End': {
        if (!open) break;
        e.preventDefault();
        const enabled = enabledOptions();
        if (enabled.length) setActiveValue(enabled[enabled.length - 1]!.value);
        break;
      }
      case 'Enter':
      case ' ':
        e.preventDefault();
        if (open) { if (activeValue) toggle(activeValue); }
        else openMenu();
        break;
      case 'Backspace':
        if (!open && current.length > 0) {
          e.preventDefault();
          remove(current[current.length - 1]!);
        }
        break;
      case 'Escape':
        if (open) { e.preventDefault(); closeMenu(); }
        break;
      case 'Tab':
        // Close first, then let focus move on as usual (no preventDefault).
        if (open) closeMenu();
        break;
      default:
        break;
    }
  };

  // Click-outside — closes when a pointer lands outside both the field and the portaled menu.
  React.useEffect(() => {
    if (!open) return;
    const handlePointerDown = (e: PointerEvent) => {
      const target = e.target as Node;
      if (fieldRef.current?.contains(target)) return;
      if (document.getElementById(menuId)?.contains(target)) return;
      setOpen(false);
    };
    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, [open, menuId]);

  // Clicking the field's empty area behaves like clicking the combobox. Clicks on a chip (its label or
  // its ×) are left alone.
  const handleFieldClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (disabled || (e.target as HTMLElement).closest('[data-helix-part="multi-select-chip"]')) return;
    if (e.target === triggerRef.current) return; // the button's own onClick handles it
    triggerRef.current?.focus();
    open ? closeMenu() : openMenu('pointer');
  };

  return (
    <div
      data-helix-part="multi-select-root"
      {...(fullWidth ? { 'data-full-width': '' } : {})}
      {...(disabled  ? { 'data-disabled':   '' } : {})}
      {...(invalid   ? { 'data-invalid':    '' } : {})}
      className={cn(className)}
    >
      <label
        data-helix-part="multi-select-label"
        htmlFor={id}
        style={hideLabel ? VISUALLY_HIDDEN : undefined}
      >
        {label}
        {required && <span data-helix-part="multi-select-required" aria-hidden="true"> *</span>}
      </label>

      <div
        ref={fieldRef}
        data-helix-part="multi-select-field"
        {...(disabled ? { 'data-disabled': '' } : {})}
        {...(invalid  ? { 'data-invalid':  '' } : {})}
        {...(open     ? { 'data-open':     '' } : {})}
        {...(selectedOptions.length ? { 'data-has-value': '' } : {})}
        onClick={handleFieldClick}
      >
        {selectedOptions.map(opt => (
          <span key={opt.value} data-helix-part="multi-select-chip">
            {/* The chip's own button is taken out of the tab order and hidden from assistive tech —
                the combobox announces the selection itself; only the × stays reachable. */}
            <Chip
              size="s"
              label={opt.label}
              dismissible
              onDismiss={() => remove(opt.value)}
              disabled={disabled}
              tabIndex={-1}
              aria-hidden="true"
            />
          </span>
        ))}

        <button
          ref={triggerRef}
          type="button"
          id={id}
          data-helix-part="multi-select-trigger"
          disabled={disabled}
          role="combobox"
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={open ? menuId : undefined}
          aria-invalid={invalid || undefined}
          aria-describedby={describedby}
          aria-required={required || undefined}
          aria-activedescendant={open && activeValue ? optionId(menuId, activeValue) : undefined}
          onClick={() => (open ? closeMenu() : openMenu('pointer'))}
          onKeyDown={handleTriggerKeyDown}
        >
          {selectedOptions.length === 0 ? (
            <span data-helix-part="multi-select-placeholder">{placeholder ?? ''}</span>
          ) : (
            <span style={VISUALLY_HIDDEN}>
              {`${selectedOptions.length} selected: ${selectedOptions.map(o => o.label).join(', ')}`}
            </span>
          )}
        </button>

        <span data-helix-part="multi-select-chevron" aria-hidden="true">
          <Icon icon={IconChevronDown} size={16} />
        </span>

        <Menu
          id={menuId}
          expanded={open}
          anchorRef={fieldRef}
          options={options}
          multiple
          values={current}
          onSelect={toggle}
          {...(activeValue !== undefined ? { activeValue } : {})}
        />

        {/* Form participation, same approach as Select: a real (not hidden) input so `required` blocks
            submit while nothing is selected. Invisible, untabbable, aria-hidden; focus is handed to the
            combobox if the browser focuses it to report the error. */}
        {(name || required) && (
          <input
            data-helix-part="multi-select-native"
            type="text"
            tabIndex={-1}
            aria-hidden="true"
            name={name}
            value={current.join(',')}
            required={required}
            disabled={disabled}
            onChange={() => {}}
            onFocus={() => triggerRef.current?.focus()}
          />
        )}
      </div>

      {description && !errorMessage && (
        <span id={descId} data-helix-part="multi-select-description">
          {description}
        </span>
      )}
      {errorMessage && (
        <span id={errId} data-helix-part="multi-select-error" role="alert">
          {errorMessage}
        </span>
      )}
    </div>
  );
}

MultiSelect.displayName = 'MultiSelect';
