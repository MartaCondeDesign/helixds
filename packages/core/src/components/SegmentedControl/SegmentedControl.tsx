import * as React from 'react';
import { motion, MotionConfig } from 'motion/react';
import { cn } from '../../lib/utils';
import { SPRING_SNAPPY } from '../../lib/motionPresets';
import type { SegmentedControlProps } from './SegmentedControl.types';

let idCounter = 0;

export function SegmentedControl({
  label,
  options,
  value,
  defaultValue,
  onChange,
  disabled = false,
  name: nameProp,
  className,
}: SegmentedControlProps) {
  // One layoutId per instance — otherwise two SegmentedControls on the same page would share Motion's
  // FLIP animation and the pill would jump between them instead of staying scoped to its own group.
  const uid = React.useRef(`helix-segmented-control-${++idCounter}`).current;
  const layoutId = `${uid}-pill`;
  const name = nameProp ?? uid;

  const isControlled = value !== undefined;
  const [internalValue, setInternalValue] = React.useState(defaultValue ?? options[0]?.value);
  const current = isControlled ? value : internalValue;

  const itemRefs = React.useRef(new Map<string, HTMLButtonElement>());

  const select = (optionValue: string) => {
    if (!isControlled) setInternalValue(optionValue);
    onChange?.(optionValue);
  };

  // Roving tabindex + arrow-key navigation, hand-rolled — these are buttons, not native radio inputs,
  // so the browser doesn't give this behavior away for free the way it does for RadioGroup (ADR-012).
  const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>, index: number) => {
    const enabled = options.filter(o => !(o.disabled || disabled));
    if (enabled.length === 0) return;
    const currentEnabledIndex = enabled.findIndex(o => o.value === options[index]!.value);

    let nextIndex = -1;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      nextIndex = (currentEnabledIndex + 1) % enabled.length;
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      nextIndex = (currentEnabledIndex - 1 + enabled.length) % enabled.length;
    } else if (e.key === 'Home') {
      nextIndex = 0;
    } else if (e.key === 'End') {
      nextIndex = enabled.length - 1;
    } else {
      return;
    }

    e.preventDefault();
    const next = enabled[nextIndex]!;
    select(next.value);
    itemRefs.current.get(next.value)?.focus();
  };

  // MotionConfig scoped locally — Motion doesn't honor prefers-reduced-motion on its own (ADR-007).
  return (
    <MotionConfig reducedMotion="user">
    <div
      data-helix-part="segmented-control-root"
      role="radiogroup"
      aria-label={label}
      {...(disabled ? { 'data-disabled': '' } : {})}
      className={cn(className)}
    >
      <input type="hidden" name={name} value={current ?? ''} />
      {options.map((opt, index) => {
        const isChecked = opt.value === current;
        const isDisabled = opt.disabled || disabled;
        return (
          <button
            key={opt.value}
            ref={el => {
              if (el) itemRefs.current.set(opt.value, el);
              else itemRefs.current.delete(opt.value);
            }}
            type="button"
            role="radio"
            aria-checked={isChecked}
            tabIndex={isChecked ? 0 : -1}
            disabled={isDisabled}
            data-helix-part="segmented-control-item"
            onClick={() => select(opt.value)}
            onKeyDown={e => handleKeyDown(e, index)}
          >
            {isChecked && (
              <motion.span
                data-helix-part="segmented-control-pill"
                layoutId={layoutId}
                aria-hidden="true"
                transition={SPRING_SNAPPY}
              />
            )}
            <span data-helix-part="segmented-control-item-label">{opt.label}</span>
          </button>
        );
      })}
    </div>
    </MotionConfig>
  );
}

SegmentedControl.displayName = 'SegmentedControl';
