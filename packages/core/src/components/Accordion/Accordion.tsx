import * as React from 'react';
import { IconChevronDown } from '@tabler/icons-react';
import { cn } from '../../lib/utils';
import { Icon } from '../Icon';
import { useDisclosureTransition } from '../../lib/useDisclosureTransition';
import type { AccordionProps } from './Accordion.types';

const Accordion = ({
  label,
  children,
  expanded,
  defaultExpanded = false,
  onExpandedChange,
  disabled = false,
  className,
}: AccordionProps) => {
  const [uncontrolledExpanded, setUncontrolledExpanded] = React.useState(defaultExpanded);
  const isControlled = expanded !== undefined;
  const isExpanded = isControlled ? expanded : uncontrolledExpanded;

  const { ref, state } = useDisclosureTransition(isExpanded, '--helix-accordion-duration-collapse');
  const panelRef = React.useRef<HTMLDivElement>(null);
  const innerRef = React.useRef<HTMLDivElement>(null);

  // Explicit pixel height, not grid-template-rows 0fr/1fr — see the conversation this shipped from:
  // 'fr' unit interpolation doesn't track the same visual pace in both directions even with matched
  // duration/easing, which read as a slow/laggy collapse. A measured, real height transitions
  // identically regardless of direction.
  React.useLayoutEffect(() => {
    const panel = panelRef.current;
    const inner = innerRef.current;
    if (!panel || !inner) return;

    if (state === 'open') {
      panel.style.height = `${inner.scrollHeight}px`;
    } else if (state === 'closing') {
      // Coming from 'open', height is likely 'auto' (released once the expand settled, below) —
      // 'auto' can't be transitioned, so lock in the current real height first, force the browser to
      // register it (a read that triggers layout), then collapse to 0 on the next line. Without the
      // forced read, the browser could coalesce both writes and jump straight to 0 with no transition.
      panel.style.height = `${inner.scrollHeight}px`;
      void panel.offsetHeight;
      panel.style.height = '0px';
    } else {
      panel.style.height = '0px';
    }
  }, [state]);

  // Once fully open, release the locked pixel height to `auto` so content that changes size while
  // expanded (e.g. an image loading in) isn't clipped — re-locked to a real px value above the moment
  // a close starts.
  const handlePanelTransitionEnd = (event: React.TransitionEvent<HTMLDivElement>) => {
    if (event.target !== event.currentTarget || event.propertyName !== 'height') return;
    if (state === 'open') {
      event.currentTarget.style.height = 'auto';
    }
  };

  const handleSummaryClick = (event: React.MouseEvent<HTMLElement>) => {
    // Always prevent the native instant toggle — see useDisclosureTransition's own comment for why:
    // collapsing has to play the closing transition before `open` actually comes off.
    event.preventDefault();
    if (disabled) return;
    const next = !isExpanded;
    if (!isControlled) setUncontrolledExpanded(next);
    onExpandedChange?.(next);
  };

  return (
    <details
      ref={ref}
      data-helix-part="accordion-root"
      data-state={state}
      className={cn(className)}
    >
      <summary
        data-helix-part="accordion-header"
        aria-disabled={disabled ? 'true' : undefined}
        aria-expanded={isExpanded ? 'true' : 'false'}
        onClick={handleSummaryClick}
      >
        <span data-helix-part="accordion-title">{label}</span>
        <span data-helix-part="accordion-chevron" aria-hidden="true">
          <Icon icon={IconChevronDown} size={16} />
        </span>
      </summary>
      <div ref={panelRef} data-helix-part="accordion-panel" onTransitionEnd={handlePanelTransitionEnd}>
        <div ref={innerRef} data-helix-part="accordion-panel-inner">{children}</div>
      </div>
    </details>
  );
};

Accordion.displayName = 'Accordion';

export { Accordion };
