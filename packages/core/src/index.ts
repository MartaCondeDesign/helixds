// Helix DS — @helix-ds/core
// Components
export { Button }     from './components/Button';
export { IconButton } from './components/IconButton';
export { Chip }       from './components/Chip';
export { Input }      from './components/Input';
export { Badge, BADGE_ICON_BY_VARIANT } from './components/Badge';
export { Textarea }   from './components/Textarea';
export { Select }     from './components/Select';
export { MultiSelect } from './components/MultiSelect';
export { Menu }       from './components/Menu';
export { Checkbox }   from './components/Checkbox';
export { CheckboxGroup } from './components/CheckboxGroup';
export { RadioGroup } from './components/RadioGroup';
export { RadioButton } from './components/RadioButton';
export { Switch }     from './components/Switch';
export { Icon, createIconAdapter, iconStrokeForSize, ICON_STROKE_PX_BY_SIZE } from './components/Icon';
export { Card }       from './components/Card';
export { Avatar }     from './components/Avatar';
export { AvatarGroup } from './components/AvatarGroup';
export { Table, TableHead, TableBody, TableRow, TableHeaderCell, TableCell } from './components/Table';
export { NavItem }   from './components/NavItem';
export { FAB }       from './components/FAB';
export { Tooltip }   from './components/Tooltip';
export { Accordion } from './components/Accordion';
export { Modal }     from './components/Modal';
export { SidePanel } from './components/SidePanel';
export { Toast, toast } from './components/Toast';
export { SegmentedControl } from './components/SegmentedControl';

// Layout
export { TopBar }     from './layout/TopBar';
export { SideNav }    from './layout/SideNav';
export { AppShell }   from './layout/AppShell';
export { PageHeader } from './layout/PageHeader';

// Docs
export { doc as ButtonDoc }   from './components/Button/Button.doc';
export { doc as IconButtonDoc } from './components/IconButton/IconButton.doc';
export { doc as ChipDoc }     from './components/Chip/Chip.doc';
export { doc as InputDoc }    from './components/Input/Input.doc';
export { doc as BadgeDoc }    from './components/Badge/Badge.doc';
export { doc as TextareaDoc } from './components/Textarea/Textarea.doc';
export { doc as SelectDoc }   from './components/Select/Select.doc';
export { doc as MultiSelectDoc } from './components/MultiSelect/MultiSelect.doc';
export { doc as MenuDoc }     from './components/Menu/Menu.doc';
export { doc as CheckboxDoc }   from './components/Checkbox/Checkbox.doc';
export { doc as CheckboxGroupDoc } from './components/CheckboxGroup/CheckboxGroup.doc';
export { doc as RadioGroupDoc } from './components/RadioGroup/RadioGroup.doc';
export { doc as RadioButtonDoc } from './components/RadioButton/RadioButton.doc';
export { doc as SwitchDoc }     from './components/Switch/Switch.doc';
export { doc as IconDoc }       from './components/Icon/Icon.doc';
export { doc as CardDoc }       from './components/Card/Card.doc';
export { doc as AvatarDoc }     from './components/Avatar/Avatar.doc';
export { doc as AvatarGroupDoc } from './components/AvatarGroup/AvatarGroup.doc';
export { doc as TableDoc }      from './components/Table/Table.doc';
export { doc as NavItemDoc }    from './components/NavItem/NavItem.doc';
export { doc as FABDoc }        from './components/FAB/FAB.doc';
export { doc as TooltipDoc }    from './components/Tooltip/Tooltip.doc';
export { doc as AccordionDoc }  from './components/Accordion/Accordion.doc';
export { doc as ModalDoc }      from './components/Modal/Modal.doc';
export { doc as SidePanelDoc }  from './components/SidePanel/SidePanel.doc';
export { doc as ToastDoc }      from './components/Toast/Toast.doc';
export { doc as SegmentedControlDoc } from './components/SegmentedControl/SegmentedControl.doc';
export { doc as TopBarDoc }     from './layout/TopBar/TopBar.doc';
export { doc as SideNavDoc }    from './layout/SideNav/SideNav.doc';
export { doc as AppShellDoc }   from './layout/AppShell/AppShell.doc';
export { doc as PageHeaderDoc } from './layout/PageHeader/PageHeader.doc';

// Types
export type { ButtonProps, ButtonVariant, ButtonSize }               from './components/Button';
export type { IconButtonProps, IconButtonVariant, IconButtonSize }   from './components/IconButton';
export type { ChipProps, ChipVariant, ChipSize }                     from './components/Chip';
export type { InputProps, InputSize }                                from './components/Input';
export type { BadgeProps, BadgeVariant, BadgeSize }                  from './components/Badge';
export type { TextareaProps, TextareaSize, TextareaResize }          from './components/Textarea';
export type { SelectProps, SelectOption, SelectOptionGroup } from './components/Select';
export type { MultiSelectProps, MultiSelectOption, MultiSelectOptionGroup } from './components/MultiSelect';
export type { MenuProps, MenuOption, MenuOptionGroup } from './components/Menu';
export type { CheckboxProps }                                        from './components/Checkbox';
export type { CheckboxGroupProps, CheckboxOption, CheckboxGroupOrientation } from './components/CheckboxGroup';
export type { RadioGroupProps, RadioOption, RadioOrientation }       from './components/RadioGroup';
export type { RadioButtonProps }                                     from './components/RadioButton';
export type { SwitchProps, SwitchSize }                              from './components/Switch';
export type { IconProps, IconSize, HelixIconComponent, IconAdapterConfig } from './components/Icon';
export type { CardProps, CardPadding }                               from './components/Card';
export type { AvatarProps, AvatarSize }                              from './components/Avatar';
export type { AvatarGroupProps, AvatarGroupSize }                    from './components/AvatarGroup';
export type {
  TableProps,
  TableSectionProps,
  TableRowProps,
  TableHeaderCellProps,
  TableCellProps,
}                                                                     from './components/Table';
export type { NavItemProps }                                         from './components/NavItem';
export type { FABProps, FABAction }                                  from './components/FAB';
export type { TooltipProps, TooltipPlacement }                       from './components/Tooltip';
export type { AccordionProps }                                       from './components/Accordion';
export type { ModalProps }                                           from './components/Modal';
export type { SidePanelProps }                                       from './components/SidePanel';
export type { ToastProps, ToastVariant, ToastRecord, ToastOptions } from './components/Toast';
export type { SegmentedControlProps, SegmentedControlOption }        from './components/SegmentedControl';
export type { TopBarProps }                                          from './layout/TopBar';
export type { SideNavProps }                                         from './layout/SideNav';
export type { AppShellProps }                                        from './layout/AppShell';
export type { PageHeaderProps, PageHeaderLevel }                     from './layout/PageHeader';
export type { ComponentDoc }                                         from './lib/component-doc';

// Utilities
export { cn } from './lib/utils';
