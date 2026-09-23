import * as React from 'react';
import { cn } from '../../lib/utils';
import { Avatar } from '../Avatar';
import { Tooltip } from '../Tooltip';
import type { AvatarGroupProps } from './AvatarGroup.types';

const AvatarGroup = ({ avatars, max, size = 'm', className }: AvatarGroupProps) => {
  const displayed = typeof max === 'number' ? avatars.slice(0, max) : avatars;
  const hidden = avatars.slice(displayed.length);
  const overflowCount = hidden.length;
  const stacked = [...displayed].reverse();

  return (
    <div
      data-helix-part="avatar-group-root"
      data-size={size}
      role="group"
      aria-label={`${avatars.length} ${avatars.length === 1 ? 'person' : 'people'}`}
      className={cn(className)}
    >
      {stacked.map((avatar, index) => (
        <span data-helix-part="avatar-group-item" key={`${index}-${avatar.label}`}>
          {/* No explicit placement — Tooltip defaults to 'top' and auto-flips to 'bottom' (or clamps
              sideways) on its own when that would clip the viewport. See ADR-009. */}
          <Tooltip label={avatar.label}>
            <Avatar label={avatar.label} {...(avatar.src ? { src: avatar.src } : {})} size={size} />
          </Tooltip>
        </span>
      ))}
      {overflowCount > 0 && (
        <span data-helix-part="avatar-group-item">
          {/* '\n'-joined, not ', ' — Tooltip.json's content is white-space: pre-line, so each hidden
              name renders on its own line instead of one run-on comma-separated line. */}
          <Tooltip label={hidden.map(a => a.label).join('\n')}>
            <span data-helix-part="avatar-group-overflow">+{overflowCount}</span>
          </Tooltip>
        </span>
      )}
    </div>
  );
};

AvatarGroup.displayName = 'AvatarGroup';

export { AvatarGroup };
