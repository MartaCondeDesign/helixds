import * as React from 'react';
import { cn } from '../../lib/utils';
import type { AvatarProps } from './Avatar.types';

function getInitials(label: string): string {
  return label
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map(word => word[0])
    .join('')
    .toUpperCase();
}

const Avatar = ({ label, src, size = 'm', variant = 'light', className }: AvatarProps) => {
  const [imageFailed, setImageFailed] = React.useState(false);
  const showImage = !!src && !imageFailed;

  return (
    <span
      data-helix-part="avatar-root"
      data-size={size}
      data-variant={variant}
      className={cn(className)}
    >
      {showImage ? (
        <img
          data-helix-part="avatar-image"
          src={src}
          alt={label}
          onError={() => setImageFailed(true)}
        />
      ) : (
        <span data-helix-part="avatar-initials" aria-label={label} role="img">
          {getInitials(label)}
        </span>
      )}
    </span>
  );
};

Avatar.displayName = 'Avatar';

export { Avatar };
