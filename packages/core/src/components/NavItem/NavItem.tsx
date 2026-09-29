import * as React from 'react';
import { motion, MotionConfig } from 'motion/react';
import { cn } from '../../lib/utils';
import { SPRING_SNAPPY } from '../../lib/motionPresets';
import { Icon } from '../Icon';
import type { NavItemProps } from './NavItem.types';

// Shared across every NavItem instance in the tree — Motion's layout animation system uses this to
// recognize "the same element" moving from one NavItem to another when `current` changes, and animates
// its position/size (a FLIP-style transition) instead of the background just cutting to the new item.
// See ADR-007 / .ai/maps/patterns/motion-effects.md.
const ACTIVE_INDICATOR_LAYOUT_ID = 'helix-nav-item-active-indicator';

const NavItem = ({ label, href, icon, current = false, className }: NavItemProps) => {
  // MotionConfig scoped locally — Motion doesn't honor prefers-reduced-motion on its own (ADR-007).
  return (
    <MotionConfig reducedMotion="user">
    <a
      data-helix-part="nav-item"
      data-current={current ? 'true' : undefined}
      href={href}
      aria-current={current ? 'page' : undefined}
      className={cn(className)}
    >
      {current && (
        <motion.span
          data-helix-part="nav-item-indicator"
          layoutId={ACTIVE_INDICATOR_LAYOUT_ID}
          aria-hidden="true"
          // Shared with Switch's thumb via ../../lib/motionPresets (was damping 35 here vs 32 on
          // Switch — undocumented drift between two springs meant to feel identical, consolidated).
          transition={SPRING_SNAPPY}
        />
      )}
      {icon && (
        <span data-helix-part="nav-item-icon">
          <Icon icon={icon} size={16} />
        </span>
      )}
      <span data-helix-part="nav-item-label">{label}</span>
    </a>
    </MotionConfig>
  );
};

NavItem.displayName = 'NavItem';

export { NavItem };
