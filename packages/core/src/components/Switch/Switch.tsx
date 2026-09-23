import * as React from 'react';
import { motion, MotionConfig } from 'motion/react';
import { resolveTokenPx } from '../../lib/resolveTokenPx';
import { SPRING_SNAPPY } from '../../lib/motionPresets';
import type { SwitchProps } from './Switch.types';

let idCounter = 0;

// Thumb offset needs a measured pixel value regardless of animation engine — Switch's own contract says
// track/thumb widths are fixed per size ("not consumer-configurable"), so reading them from tokens is
// exact, no ResizeObserver needed.
function useThumbOffset(size: 's' | 'm') {
  const [x, setX] = React.useState(0);
  React.useEffect(() => {
    const trackWidth = resolveTokenPx(`--helix-switch-width-${size}`);
    const thumbWidth = resolveTokenPx(`--helix-switch-thumb-size-${size}`);
    // Resting position is `left: 2px`; the checked position is `trackWidth - thumbWidth - 2px` from the
    // track's left edge, so the extra slide distance on top of that 2px base is trackWidth-thumbWidth-4.
    setX(trackWidth - thumbWidth - 4);
  }, [size]);
  return x;
}

export function Switch({
  label,
  hideLabel = false,
  description,
  checked,
  defaultChecked = false,
  onChange,
  disabled = false,
  size = 'm',
  id: idProp,
  name,
}: SwitchProps) {
  const uid  = `helix-switch-${++idCounter}`;
  const id   = idProp ?? uid;
  const descId = description ? `${id}-desc` : undefined;
  const offset = useThumbOffset(size);

  // True uncontrolled state — without this, a Switch used with only `defaultChecked` (no `checked` +
  // `onChange` wired back by the consumer) never visually toggles.
  const [uncontrolledChecked, setUncontrolledChecked] = React.useState(defaultChecked);
  const isControlled = checked !== undefined;
  const isChecked = isControlled ? checked : uncontrolledChecked;

  const handleToggle = () => {
    const next = !isChecked;
    if (!isControlled) setUncontrolledChecked(next);
    onChange?.(next);
  };

  return (
    <div
      data-helix-part="switch-root"
      data-size={size}
      {...(disabled ? { 'data-disabled': '' } : {})}
    >
      <div data-helix-part="switch-row">
        {/* Hidden native checkbox for form integration */}
        <input
          type="checkbox"
          id={`${id}-native`}
          name={name}
          checked={isChecked}
          disabled={disabled}
          style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0,0,0,0)' }}
          onChange={() => {}} // native input mirrors isChecked; the button's onClick (handleToggle) owns the real state change
          aria-hidden="true"
          tabIndex={-1}
        />

        {/* Accessible switch button */}
        <button
          id={id}
          type="button"
          role="switch"
          data-helix-part="switch-track"
          data-size={size}
          aria-checked={isChecked}
          aria-describedby={descId}
          disabled={disabled}
          onClick={handleToggle}
        >
          {/* Motion spring — see ADR-007. Motion does NOT respect prefers-reduced-motion on its own
              (verified against motion.dev's own accessibility docs). MotionConfig is scoped locally to
              this component rather than relying on the consuming app to wrap its root in one — a shared
              component can't assume that setup exists. */}
          <MotionConfig reducedMotion="user">
            <motion.span
              data-helix-part="switch-thumb"
              aria-hidden="true"
              style={{ position: 'absolute', top: 2, left: 2 }}
              animate={{ x: isChecked ? offset : 0 }}
              // `type` here is Motion's own Transition.type key ('spring'), not a Helix prop —
              // verify:props flags it as a false positive against prop-map.md's `variant` mapping.
              // Shared with NavItem's indicator via ../../lib/motionPresets — both are "a small
              // element snapping to its new resting position" and are meant to feel identical.
              transition={SPRING_SNAPPY}
            />
          </MotionConfig>
        </button>

        <label
          data-helix-part="switch-label"
          htmlFor={id}
          style={hideLabel ? { position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0,0,0,0)' } : undefined}
        >
          {label}
        </label>
      </div>

      {description && (
        <span id={descId} data-helix-part="switch-description">
          {description}
        </span>
      )}
    </div>
  );
}

Switch.displayName = 'Switch';
