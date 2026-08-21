import type { SwitchProps } from './Switch.types';

let idCounter = 0;

export function Switch({
  label,
  description,
  checked,
  defaultChecked,
  onChange,
  disabled = false,
  size = 'm',
  id: idProp,
  name,
}: SwitchProps) {
  const uid  = `helix-switch-${++idCounter}`;
  const id   = idProp ?? uid;
  const descId = description ? `${id}-desc` : undefined;

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
          checked={checked}
          defaultChecked={defaultChecked}
          disabled={disabled}
          style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0,0,0,0)' }}
          onChange={e => onChange?.(e.target.checked)}
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
          aria-checked={checked ?? defaultChecked ?? false}
          aria-describedby={descId}
          disabled={disabled}
          onClick={() => onChange?.(!checked)}
        >
          <span data-helix-part="switch-thumb" aria-hidden="true" />
        </button>

        <label data-helix-part="switch-label" htmlFor={id}>
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
