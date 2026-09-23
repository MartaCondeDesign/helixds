import * as React from 'react';
import { AnimatePresence, motion, MotionConfig } from 'motion/react';
import { cn } from '../../lib/utils';
import { resolveTokenPx } from '../../lib/resolveTokenPx';
import { FAB_COLLAPSE_TRANSITION, FAB_EXPAND_TRANSITION, FAB_TRIGGER_BOUNCE_TRANSITION } from '../../lib/motionPresets';
import { Icon } from '../Icon';
import type { FABProps } from './FAB.types';

// Action stack offset: each revealed action sits `ACTION_SIZE + GAP` further from the trigger than the
// last. Read from tokens at render time (never hardcoded px) via resolveTokenPx — see ADR-007 (motion
// engine) and .ai/maps/patterns/motion-effects.md for why this indirection exists (Motion's animate.y is a
// plain number, tokens are CSS custom properties, something has to bridge the two).
function useStackOffset() {
  // pre-measurement defaults (fabSize 48, actionSize 36, gap 8 -> base 50, step 44)
  const [layout, setLayout] = React.useState({ baseOffset: 50, step: 44, center: 6 });
  React.useEffect(() => {
    const fabSize = resolveTokenPx('--helix-fab-height');
    const actionSize = resolveTokenPx('--helix-fab-action-height');
    const gap = resolveTokenPx('--helix-primitive-spacing-50'); // 8px, explicit spec
    // `step` (action-to-action) and `baseOffset` (trigger-to-first-action) are NOT the same distance — the
    // trigger (fabSize) and an action (actionSize) have different radii, so a uniform `actionSize + gap`
    // step under-spaces the trigger/action-0 pair specifically. Both are true edge-to-edge distances
    // between circle centers, derived from the real radii:
    //   baseOffset = fabRadius + actionRadius + gap   (trigger center -> action-0 center)
    //   step = actionDiameter + gap                    (action i center -> action i+1 center)
    const baseOffset = fabSize / 2 + actionSize / 2 + gap;
    const step = actionSize + gap;
    // `center` is not itself a token — it's the geometric midpoint between two tokens (how far a smaller
    // action circle sits inset from the larger trigger footprint so both are visually concentric), same
    // category of token-derived arithmetic as Switch's thumb-position math.
    setLayout({ baseOffset, step, center: (fabSize - actionSize) / 2 });
  }, []);
  return layout;
}

// Directional easing: expanding overshoots outward (the "back" bounce) — safe, nothing beyond the target
// to collide with. Collapsing must never dip PAST y=0 (the trigger's own position) — the same "back" curve
// run in reverse does exactly that, so collapse gets a no-overshoot ease-out instead. Presets shared via
// ../../lib/motionPresets — see that file for why these can't be tokens.json entries.
const EXPAND_TRANSITION = FAB_EXPAND_TRANSITION;
const COLLAPSE_TRANSITION = FAB_COLLAPSE_TRANSITION;
// A brief squish-and-release, fired once at the exact moment the actions are collected back — not a
// sustained size change. The trigger's real footprint never changes (48px, always); this is a transient
// scale pulse on top of it.
const TRIGGER_BOUNCE_TRANSITION = FAB_TRIGGER_BOUNCE_TRANSITION;

const FAB = React.forwardRef<HTMLButtonElement, FABProps>(
  (
    {
      icon,
      label,
      actions,
      expanded: expandedProp,
      defaultExpanded = false,
      onExpandedChange,
      disabled = false,
      className,
      onPress,
      // Native ButtonHTMLAttributes passthrough (style, onDrag, ...) isn't spread onto the trigger —
      // Motion's own `HTMLMotionProps` redefines several of those names (style, onDrag, onAnimationStart,
      // ...) with incompatible signatures for its own gesture/animation system, and FAB's contract never
      // documented arbitrary native passthrough as a feature. Use `className` for styling.
    },
    ref,
  ) => {
    const [uncontrolledExpanded, setUncontrolledExpanded] = React.useState(defaultExpanded);
    const expanded = expandedProp ?? uncontrolledExpanded;
    const hasActions = !!actions && actions.length > 0;
    const rootRef = React.useRef<HTMLDivElement>(null);
    const triggerRef = React.useRef<HTMLButtonElement>(null);
    const { baseOffset, step, center } = useStackOffset();

    // Trigger's own bounce: always the same size (scale 1) except for a brief squish-and-release pulse
    // fired exactly when the speed-dial collapses (the actions "landing back" on it) — not a size change
    // tied to `expanded` for its whole duration.
    const [triggerScale, setTriggerScale] = React.useState(1);
    const prevExpandedRef = React.useRef(expanded);
    React.useEffect(() => {
      if (prevExpandedRef.current && !expanded) {
        setTriggerScale(0.92);
        const id = setTimeout(() => setTriggerScale(1), 90);
        prevExpandedRef.current = expanded;
        return () => clearTimeout(id);
      }
      prevExpandedRef.current = expanded;
    }, [expanded]);

    // Same convention as a Menu/Popover returning focus to its trigger on close: an action button that
    // just collapsed back into the trigger shouldn't be left holding a visible focus ring on a piece that
    // no longer reads as a separate, reachable control once it's animated back to y=0.
    const setExpanded = React.useCallback(
      (next: boolean) => {
        if (expandedProp === undefined) setUncontrolledExpanded(next);
        onExpandedChange?.(next);
        if (!next) triggerRef.current?.focus();
      },
      [expandedProp, onExpandedChange],
    );

    // Speed-dial UX: Escape and an outside press both collapse.
    React.useEffect(() => {
      if (!expanded) return;
      const onKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') setExpanded(false);
      };
      const onPointerDown = (e: PointerEvent) => {
        if (rootRef.current && !rootRef.current.contains(e.target as Node)) setExpanded(false);
      };
      document.addEventListener('keydown', onKeyDown);
      document.addEventListener('pointerdown', onPointerDown);
      return () => {
        document.removeEventListener('keydown', onKeyDown);
        document.removeEventListener('pointerdown', onPointerDown);
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [expanded]);

    const handleTriggerPress: React.MouseEventHandler<HTMLButtonElement> = e => {
      onPress?.(e);
      if (hasActions) setExpanded(!expanded);
    };

    // Merge the internal triggerRef (focus-return target) with the forwarded consumer ref — both need
    // the same DOM node, and React only takes one `ref` prop per element.
    const setTriggerRef = React.useCallback(
      (node: HTMLButtonElement | null) => {
        triggerRef.current = node;
        if (typeof ref === 'function') ref(node);
        else if (ref) (ref as React.MutableRefObject<HTMLButtonElement | null>).current = node;
      },
      [ref],
    );

    return (
      // MotionConfig scoped locally, not relying on the consuming app to wrap its root in one — Motion
      // does NOT respect prefers-reduced-motion on its own (verified against motion.dev's docs). See
      // ADR-007.
      <MotionConfig reducedMotion="user">
        <div ref={rootRef} data-helix-part="fab-root-wrapper" className={cn(className)}>
          {hasActions && (
            <div data-helix-part="fab-actions">
              <AnimatePresence>
                {expanded &&
                  actions.map((action, i) => (
                    <motion.button
                      key={action.label}
                      type="button"
                      data-helix-part="fab-action"
                      aria-label={action.label}
                      disabled={disabled}
                      onClick={() => {
                        action.onPress();
                        setExpanded(false);
                      }}
                      style={{ position: 'absolute', bottom: center, right: center }}
                      // `scale` in initial/animate/exit is Motion's own animation-target key, not a
                      // Helix prop — verify:props flags it as a false positive against prop-map.md's
                      // `size` mapping; same category of expected flag as Switch's `type: 'spring'`.
                      initial={{ opacity: 0, scale: 0.5, y: 0 }}
                      animate={{ opacity: 1, scale: 1, y: -(baseOffset + step * i) }}
                      exit={{ opacity: 0, scale: 0.5, y: 0 }}
                      transition={{
                        ...(expanded ? EXPAND_TRANSITION : COLLAPSE_TRANSITION),
                        delay: expanded ? i * 0.04 : (actions.length - i) * 0.04,
                      }}
                    >
                      <Icon icon={action.icon} size={16} />
                    </motion.button>
                  ))}
              </AnimatePresence>
            </div>
          )}

          <motion.button
            ref={setTriggerRef}
            type="button"
            data-helix-part="fab-root"
            aria-label={label}
            aria-expanded={hasActions ? expanded : undefined}
            disabled={disabled}
            onClick={handleTriggerPress}
            animate={{ scale: triggerScale }}
            transition={TRIGGER_BOUNCE_TRANSITION}
          >
            <span data-helix-part="fab-icon" data-expanded={hasActions && expanded ? 'true' : undefined}>
              <Icon icon={icon} size={20} />
            </span>
          </motion.button>
        </div>
      </MotionConfig>
    );
  },
);

FAB.displayName = 'FAB';

export { FAB };
