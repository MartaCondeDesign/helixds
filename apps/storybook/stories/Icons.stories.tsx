import type { Meta, StoryObj } from '@storybook/react';
import { useState, useMemo } from 'react';

import {
  IconAccessible, IconActivity, IconAdjustments, IconAlarm,
  IconAlertCircle, IconAlertTriangle, IconAlignCenter, IconAlignLeft, IconAlignRight,
  IconApi, IconApps, IconArchive, IconArrowBack, IconArrowDown,
  IconArrowLeft, IconArrowRight, IconArrowUp, IconArrowUpRight, IconArrowsSort,
  IconAt, IconBadge, IconBell, IconBellOff, IconBolt,
  IconBook, IconBookmark, IconBrain, IconBriefcase, IconBrush,
  IconBug, IconBuilding, IconCalendar, IconCamera, IconCheck,
  IconCheckbox, IconChevronDown, IconChevronLeft, IconChevronRight, IconChevronUp,
  IconCircle, IconCircleCheck, IconCircleX, IconClipboard, IconClock,
  IconCloud, IconCode, IconCommand, IconComponents,
  IconCopy, IconCreditCard, IconCrosshair, IconCrown, IconCursorText,
  IconDatabase, IconDeviceLaptop, IconDeviceMobile, IconDeviceTablet, IconDevices,
  IconDots, IconDotsVertical, IconDownload, IconEdit, IconExternalLink,
  IconEye, IconEyeOff, IconFile, IconFileText, IconFilter,
  IconFlag, IconFolder, IconFolderOpen, IconGauge,
  IconGitBranch, IconGitCommit, IconGitMerge, IconGitPullRequest, IconGlobe,
  IconGrid4x4, IconHash, IconHeart, IconHelp, IconHistory,
  IconHome, IconId, IconPhoto, IconInbox,
  IconInfoCircle, IconKey, IconKeyboard, IconLanguage, IconLayout,
  IconLayoutDashboard, IconLayoutGrid, IconLayoutList, IconLayoutRows, IconLink, IconList,
  IconLock, IconLockOpen, IconLogin, IconLogout, IconMail,
  IconMailbox, IconMap, IconMaximize, IconMenu, IconMessage,
  IconMessages, IconMinimize, IconMinus, IconMoon,
  IconMouse, IconNotification, IconNumbers, IconPackages, IconPalette,
  IconPaperclip, IconPencil, IconPhone, IconPin, IconPlus,
  IconPrinter, IconRefresh, IconReload, IconReport, IconRocket,
  IconSearch, IconSend, IconSettings, IconShare,
  IconShield, IconShieldCheck, IconLayoutSidebarRight, IconSlash,
  IconSortAZ, IconSortZA, IconStar, IconSun, IconSwitch,
  IconTable, IconTag, IconTarget, IconTerminal, IconThumbUp,
  IconToggleLeft, IconToggleRight, IconTool, IconTrash, IconTrendingUp,
  IconUpload, IconUser, IconUserCheck, IconUsersGroup, IconUserPlus,
  IconUsers, IconVariable, IconVideo, IconWifi, IconX,
  IconZoomIn, IconZoomOut,
} from '@tabler/icons-react';

type IconComponent = React.FC<{ size?: number; stroke?: number; color?: string }>;

const ICONS: [string, IconComponent][] = [
  ['IconAccessible', IconAccessible], ['IconActivity', IconActivity], ['IconAdjustments', IconAdjustments],
  ['IconAlarm', IconAlarm], ['IconAlertCircle', IconAlertCircle], ['IconAlertTriangle', IconAlertTriangle],
  ['IconAlignCenter', IconAlignCenter], ['IconAlignLeft', IconAlignLeft], ['IconAlignRight', IconAlignRight],
  ['IconApi', IconApi], ['IconApps', IconApps], ['IconArchive', IconArchive],
  ['IconArrowBack', IconArrowBack], ['IconArrowDown', IconArrowDown], ['IconArrowLeft', IconArrowLeft],
  ['IconArrowRight', IconArrowRight], ['IconArrowUp', IconArrowUp], ['IconArrowUpRight', IconArrowUpRight],
  ['IconArrowsSort', IconArrowsSort], ['IconAt', IconAt], ['IconBadge', IconBadge],
  ['IconBell', IconBell], ['IconBellOff', IconBellOff], ['IconBolt', IconBolt],
  ['IconBook', IconBook], ['IconBookmark', IconBookmark], ['IconBrain', IconBrain],
  ['IconBriefcase', IconBriefcase], ['IconBrush', IconBrush], ['IconBug', IconBug],
  ['IconBuilding', IconBuilding], ['IconCalendar', IconCalendar], ['IconCamera', IconCamera],
  ['IconCheck', IconCheck], ['IconCheckbox', IconCheckbox], ['IconChevronDown', IconChevronDown],
  ['IconChevronLeft', IconChevronLeft], ['IconChevronRight', IconChevronRight], ['IconChevronUp', IconChevronUp],
  ['IconCircle', IconCircle], ['IconCircleCheck', IconCircleCheck], ['IconCircleX', IconCircleX],
  ['IconClipboard', IconClipboard], ['IconClock', IconClock], ['IconCloud', IconCloud],
  ['IconCode', IconCode], ['IconCommand', IconCommand], ['IconComponents', IconComponents],
  ['IconCopy', IconCopy], ['IconCreditCard', IconCreditCard], ['IconCrosshair', IconCrosshair],
  ['IconCrown', IconCrown], ['IconCursorText', IconCursorText], ['IconDatabase', IconDatabase],
  ['IconDeviceLaptop', IconDeviceLaptop], ['IconDeviceMobile', IconDeviceMobile], ['IconDeviceTablet', IconDeviceTablet],
  ['IconDevices', IconDevices], ['IconDots', IconDots], ['IconDotsVertical', IconDotsVertical],
  ['IconDownload', IconDownload], ['IconEdit', IconEdit], ['IconExternalLink', IconExternalLink],
  ['IconEye', IconEye], ['IconEyeOff', IconEyeOff], ['IconFile', IconFile],
  ['IconFileText', IconFileText], ['IconFilter', IconFilter], ['IconFlag', IconFlag],
  ['IconFolder', IconFolder], ['IconFolderOpen', IconFolderOpen], ['IconGauge', IconGauge],
  ['IconGitBranch', IconGitBranch], ['IconGitCommit', IconGitCommit], ['IconGitMerge', IconGitMerge],
  ['IconGitPullRequest', IconGitPullRequest], ['IconGlobe', IconGlobe], ['IconGrid4x4', IconGrid4x4],
  ['IconHash', IconHash], ['IconHeart', IconHeart], ['IconHelp', IconHelp],
  ['IconHistory', IconHistory], ['IconHome', IconHome], ['IconId', IconId],
  ['IconPhoto', IconPhoto], ['IconInbox', IconInbox], ['IconInfoCircle', IconInfoCircle],
  ['IconKey', IconKey], ['IconKeyboard', IconKeyboard], ['IconLanguage', IconLanguage],
  ['IconLayout', IconLayout], ['IconLayoutDashboard', IconLayoutDashboard], ['IconLayoutGrid', IconLayoutGrid],
  ['IconLayoutList', IconLayoutList], ['IconLayoutRows', IconLayoutRows], ['IconLink', IconLink],
  ['IconList', IconList], ['IconLock', IconLock], ['IconLockOpen', IconLockOpen],
  ['IconLogin', IconLogin], ['IconLogout', IconLogout], ['IconMail', IconMail],
  ['IconMailbox', IconMailbox], ['IconMap', IconMap], ['IconMaximize', IconMaximize],
  ['IconMenu', IconMenu], ['IconMessage', IconMessage], ['IconMessages', IconMessages],
  ['IconMinimize', IconMinimize], ['IconMinus', IconMinus], ['IconMoon', IconMoon],
  ['IconMouse', IconMouse], ['IconNotification', IconNotification], ['IconNumbers', IconNumbers],
  ['IconPackages', IconPackages], ['IconPalette', IconPalette], ['IconPaperclip', IconPaperclip],
  ['IconPencil', IconPencil], ['IconPhone', IconPhone], ['IconPin', IconPin],
  ['IconPlus', IconPlus], ['IconPrinter', IconPrinter], ['IconRefresh', IconRefresh],
  ['IconReload', IconReload], ['IconReport', IconReport], ['IconRocket', IconRocket],
  ['IconSearch', IconSearch], ['IconSend', IconSend], ['IconSettings', IconSettings],
  ['IconShare', IconShare], ['IconShield', IconShield], ['IconShieldCheck', IconShieldCheck],
  ['IconLayoutSidebarRight', IconLayoutSidebarRight], ['IconSlash', IconSlash],
  ['IconSortAZ', IconSortAZ], ['IconSortZA', IconSortZA], ['IconStar', IconStar],
  ['IconSun', IconSun], ['IconSwitch', IconSwitch], ['IconTable', IconTable],
  ['IconTag', IconTag], ['IconTarget', IconTarget], ['IconTerminal', IconTerminal],
  ['IconThumbUp', IconThumbUp], ['IconToggleLeft', IconToggleLeft], ['IconToggleRight', IconToggleRight],
  ['IconTool', IconTool], ['IconTrash', IconTrash], ['IconTrendingUp', IconTrendingUp],
  ['IconUpload', IconUpload], ['IconUser', IconUser], ['IconUserCheck', IconUserCheck],
  ['IconUsersGroup', IconUsersGroup], ['IconUserPlus', IconUserPlus], ['IconUsers', IconUsers],
  ['IconVariable', IconVariable], ['IconVideo', IconVideo], ['IconWifi', IconWifi],
  ['IconX', IconX], ['IconZoomIn', IconZoomIn], ['IconZoomOut', IconZoomOut],
];

const meta: Meta = {
  title: 'Icons',
  parameters: { layout: 'padded' },
};

export default meta;
type Story = StoryObj;

function IconBrowser() {
  const [query,  setQuery]  = useState('');
  const [copied, setCopied] = useState('');
  const [size,   setSize]   = useState(24);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? ICONS.filter(([name]) => name.toLowerCase().includes(q)) : ICONS;
  }, [query]);

  function copyName(name: string) {
    navigator.clipboard.writeText(name).catch(() => {});
    setCopied(name);
    setTimeout(() => setCopied(c => c === name ? '' : c), 1500);
  }

  return (
    <div>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 20, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: '1 1 240px', maxWidth: 360 }}>
          <input
            type="search"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder={`Search ${ICONS.length} icons…`}
            autoFocus
            style={{
              width: '100%', boxSizing: 'border-box', padding: '8px 12px 8px 36px',
              fontSize: 14, border: '1px solid var(--helix-color-border-default)',
              borderRadius: 8, background: 'var(--helix-color-fill-surface)',
              color: 'var(--helix-color-text-default)', outline: 'none',
            }}
            onFocus={e => (e.target.style.borderColor = 'var(--helix-color-border-focus)')}
            onBlur={e  => (e.target.style.borderColor = 'var(--helix-color-border-default)')}
          />
          <IconSearch size={16} style={{
            position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)',
            color: 'var(--helix-color-text-tertiary)', pointerEvents: 'none',
          }} />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <label style={{ fontSize: 13, color: 'var(--helix-color-text-secondary)' }}>Size</label>
          <input type="range" min={16} max={40} step={4} value={size}
            onChange={e => setSize(Number(e.target.value))} style={{ width: 80 }} />
          <span style={{ fontSize: 13, fontFamily: 'monospace', color: 'var(--helix-color-text-tertiary)', width: 28 }}>
            {size}
          </span>
        </div>

        <span style={{ fontSize: 13, color: 'var(--helix-color-text-tertiary)' }}>
          {filtered.length} / {ICONS.length}
        </span>
      </div>

      <p style={{ margin: '0 0 16px', fontSize: 13, color: 'var(--helix-color-text-secondary)' }}>
        Curated set from <strong>@tabler/icons-react v3</strong> — 5 000+ icons total at{' '}
        <strong>tabler.io/icons</strong>. Click any icon to copy its import name.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(90px, 1fr))', gap: 4 }}>
        {filtered.map(([name, IconComp]) => (
          <button
            key={name}
            title={`Click to copy: ${name}`}
            onClick={() => copyName(name)}
            style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              gap: 8, padding: '12px 8px', border: '1px solid transparent', borderRadius: 8,
              background: copied === name ? 'var(--helix-color-fill-success-subtle)' : 'transparent',
              color: copied === name ? 'var(--helix-color-text-success)' : 'var(--helix-color-text-default)',
              cursor: 'pointer', transition: 'background 120ms, border-color 120ms',
            }}
            onMouseEnter={e => {
              if (copied !== name) {
                const btn = e.currentTarget as HTMLButtonElement;
                btn.style.background = 'var(--helix-color-fill-secondary)';
                btn.style.borderColor = 'var(--helix-color-border-default)';
              }
            }}
            onMouseLeave={e => {
              if (copied !== name) {
                const btn = e.currentTarget as HTMLButtonElement;
                btn.style.background = 'transparent';
                btn.style.borderColor = 'transparent';
              }
            }}
          >
            <IconComp size={size} stroke={1.5} />
            <span style={{
              fontSize: 10, fontFamily: 'monospace', color: 'inherit',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100%',
            }}>
              {copied === name ? '✓ Copied' : name.replace(/^Icon/, '')}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

export const Browse: Story = {
  render: () => <IconBrowser />,
  parameters: {
    docs: {
      description: {
        story: `
**@tabler/icons-react** — curated set of the most-used icons. Click to copy the import name.

\`\`\`tsx
import { IconBolt } from '@tabler/icons-react';
<IconBolt size={20} stroke={1.5} />
\`\`\`
        `,
      },
    },
  },
};
