import type * as React from 'react';

export type AvatarGroupSize = 's' | 'm' | 'l';

export interface AvatarGroupProps {
  /** The people/entities to display, in the order they should stack — first entry renders on top. Each item maps 1:1 to Avatar's `label`/`src`. */
  avatars: { label: string; src?: string }[];
  /** Maximum number of avatars to render before collapsing the rest into a '+N' overflow indicator. Unset shows every avatar. */
  max?: number;
  /** Physical size applied to every avatar and the overflow indicator. Shares Avatar's field scale (s=24, m=32, l=40). Default: 'm' */
  size?: AvatarGroupSize;
  /** Additional className for the root. */
  className?: string;
}
