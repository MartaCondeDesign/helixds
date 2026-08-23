// Helix DS — @helix-ds/core
// Components
export { Button }     from './components/Button';
export { Chip }       from './components/Chip';
export { Input }      from './components/Input';
export { Badge }      from './components/Badge';
export { Textarea }   from './components/Textarea';
export { Select }     from './components/Select';
export { Checkbox }   from './components/Checkbox';
export { RadioGroup } from './components/RadioGroup';
export { Switch }     from './components/Switch';
export { Icon }       from './components/Icon';
export { Card }       from './components/Card';
export { Avatar }     from './components/Avatar';
export { PageHeader } from './components/PageHeader';
export { StatCard }   from './components/StatCard';
export { Table, TableHead, TableBody, TableRow, TableHeaderCell, TableCell } from './components/Table';
export { NavItem }   from './components/NavItem';

// Layout
export { TopBar }    from './layout/TopBar';
export { SideNav }   from './layout/SideNav';
export { AppShell }  from './layout/AppShell';

// Docs
export { doc as ButtonDoc }   from './components/Button/Button.doc';
export { doc as ChipDoc }     from './components/Chip/Chip.doc';
export { doc as InputDoc }    from './components/Input/Input.doc';
export { doc as BadgeDoc }    from './components/Badge/Badge.doc';
export { doc as TextareaDoc } from './components/Textarea/Textarea.doc';
export { doc as SelectDoc }   from './components/Select/Select.doc';
export { doc as CheckboxDoc }   from './components/Checkbox/Checkbox.doc';
export { doc as RadioGroupDoc } from './components/RadioGroup/RadioGroup.doc';
export { doc as SwitchDoc }     from './components/Switch/Switch.doc';
export { doc as IconDoc }       from './components/Icon/Icon.doc';
export { doc as CardDoc }       from './components/Card/Card.doc';
export { doc as AvatarDoc }     from './components/Avatar/Avatar.doc';
export { doc as PageHeaderDoc } from './components/PageHeader/PageHeader.doc';
export { doc as StatCardDoc }   from './components/StatCard/StatCard.doc';
export { doc as TableDoc }      from './components/Table/Table.doc';
export { doc as NavItemDoc }    from './components/NavItem/NavItem.doc';
export { doc as TopBarDoc }     from './layout/TopBar/TopBar.doc';
export { doc as SideNavDoc }    from './layout/SideNav/SideNav.doc';
export { doc as AppShellDoc }   from './layout/AppShell/AppShell.doc';

// Types
export type { ButtonProps, ButtonVariant, ButtonSize }               from './components/Button';
export type { ChipProps, ChipVariant, ChipSize }                     from './components/Chip';
export type { InputProps, InputSize }                                from './components/Input';
export type { BadgeProps, BadgeVariant, BadgeSize }                  from './components/Badge';
export type { TextareaProps, TextareaSize, TextareaResize }          from './components/Textarea';
export type { SelectProps, SelectOption, SelectOptionGroup, SelectSize } from './components/Select';
export type { CheckboxProps }                                        from './components/Checkbox';
export type { RadioGroupProps, RadioOption, RadioOrientation }       from './components/RadioGroup';
export type { SwitchProps, SwitchSize }                              from './components/Switch';
export type { IconProps, IconSize }                                  from './components/Icon';
export type { CardProps, CardPadding }                               from './components/Card';
export type { AvatarProps, AvatarSize, AvatarVariant }               from './components/Avatar';
export type { PageHeaderProps, PageHeaderLevel }                     from './components/PageHeader';
export type { StatCardProps, StatCardTrend }                         from './components/StatCard';
export type {
  TableProps,
  TableSectionProps,
  TableRowProps,
  TableHeaderCellProps,
  TableCellProps,
}                                                                     from './components/Table';
export type { NavItemProps }                                         from './components/NavItem';
export type { TopBarProps }                                          from './layout/TopBar';
export type { SideNavProps }                                         from './layout/SideNav';
export type { AppShellProps }                                        from './layout/AppShell';
export type { ComponentDoc }                                         from './lib/component-doc';

// Utilities
export { cn } from './lib/utils';
