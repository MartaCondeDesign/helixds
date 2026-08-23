export type AvatarSize = 's' | 'm' | 'l';
export type AvatarVariant = 'light' | 'solid';

export interface AvatarProps {
  /** The person's full name — source for the initials fallback, and the accessible name (image alt / aria-label). */
  label: string;
  /** Image URL. Falls back to initials when absent or on load error. */
  src?: string;
  /** Physical size. Shares the field scale with Input/Select (s=24, m=32, l=40). Default: 'm' */
  size?: AvatarSize;
  /** 'light' = tinted fill for dense repeated rows. 'solid' = filled brand background for a single emphasized avatar. Default: 'light' */
  variant?: AvatarVariant;
  /** Additional className for the root. */
  className?: string;
}
