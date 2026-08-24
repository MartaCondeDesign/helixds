import {
  IconLayoutDashboard, IconComponents, IconPalette, IconUsers, IconCode, IconSettings,
} from '@tabler/icons-react';

export type Member = {
  id: string; name: string; email: string; role: string;
  status: 'active' | 'invited' | 'suspended';
  components: number; lastSeen: string;
};

export const MEMBERS: Member[] = [
  { id: '1', name: 'Ana García',   email: 'ana@company.com',   role: 'Design Lead',    status: 'active',    components: 24, lastSeen: '2 min ago' },
  { id: '2', name: 'Pau Torres',   email: 'pau@company.com',   role: 'Engineer',       status: 'active',    components: 18, lastSeen: '1 hr ago'  },
  { id: '3', name: 'Marta Conde',  email: 'marta@company.com', role: 'DS Specialist',  status: 'active',    components: 47, lastSeen: 'Just now'  },
  { id: '4', name: 'Jordi Puig',   email: 'jordi@company.com', role: 'Frontend',       status: 'active',    components: 11, lastSeen: '3 hrs ago' },
  { id: '5', name: 'Sara Navarro', email: 'sara@new.com',      role: 'Designer',       status: 'invited',   components: 0,  lastSeen: '—'         },
  { id: '6', name: 'Alex Romero',  email: 'alex@company.com',  role: 'Product Manager',status: 'suspended', components: 3,  lastSeen: '2 days ago'},
];

export const NAV_ITEMS = [
  { icon: IconLayoutDashboard, label: 'Dashboard',  href: '#' },
  { icon: IconComponents,      label: 'Components', href: '#' },
  { icon: IconPalette,         label: 'Tokens',      href: '#' },
  { icon: IconUsers,           label: 'Team',        href: '#', current: true },
  { icon: IconCode,            label: 'AI Context',  href: '#' },
  { icon: IconSettings,        label: 'Settings',    href: '#' },
];
