import * as React from 'react';
import { cn } from '../../lib/utils';
import type { AvatarProps } from './Avatar.types';

function getInitials(label: string): string {
  return (label.trim()[0] ?? '').toUpperCase();
}

const Avatar = ({ label, src, size = 'm', className, 'aria-describedby': ariaDescribedBy }: AvatarProps) => {
  const [imageFailed, setImageFailed] = React.useState(false);
  const showImage = !!src && !imageFailed;

  return (
    <span
      data-helix-part="avatar-root"
      data-size={size}
      aria-describedby={ariaDescribedBy}
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
