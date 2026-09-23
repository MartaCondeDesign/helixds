import * as React from 'react';
import type { HelixIconComponent } from './Icon.types';

export interface IconAdapterConfig {
  /** Prop name this icon set uses for stroke width. Pass `false` if the set has no concept of
   *  stroke width at all (e.g. a filled/solid icon set). Default: 'stroke' */
  strokeProp?: string | false;
  /** Prop name this icon set uses for size. Default: 'size' */
  sizeProp?: string;
  /** Prop name this icon set uses for color. Default: 'color' */
  colorProp?: string;
}

/**
 * Wraps a foreign icon component (Lucide, Heroicons, a custom SVG component, ...) so it satisfies
 * `HelixIconComponent` and can be passed to Helix's `icon`/`iconEnd` props. Only needed when the
 * icon set's prop names differ from Tabler's (`size`/`stroke`/`color`) — a set that already
 * matches that shape needs no adapter. See ADR-014.
 *
 * @example
 * import { Search } from 'lucide-react';
 * const LucideSearch = createIconAdapter(Search, { strokeProp: 'strokeWidth' });
 * <Icon icon={LucideSearch} />
 */
export function createIconAdapter(
  Component: React.ComponentType<Record<string, unknown>>,
  config: IconAdapterConfig = {},
): HelixIconComponent {
  const { strokeProp = 'stroke', sizeProp = 'size', colorProp = 'color' } = config;

  const Adapted = ({ size, stroke, color, ...rest }: React.ComponentProps<HelixIconComponent>) => {
    const mapped: Record<string, unknown> = { ...rest };
    if (size !== undefined) mapped[sizeProp] = size;
    if (stroke !== undefined && strokeProp !== false) mapped[strokeProp] = stroke;
    if (color !== undefined) mapped[colorProp] = color;
    return React.createElement(Component, mapped);
  };

  Adapted.displayName = `IconAdapter(${Component.displayName || Component.name || 'Icon'})`;
  return Adapted;
}
