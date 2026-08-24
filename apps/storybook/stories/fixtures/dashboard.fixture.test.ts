import { describe, it, expect } from 'vitest';
import { MEMBERS, NAV_ITEMS } from './dashboard.fixture';

describe('dashboard fixture', () => {
  it('has one row per member with a unique id', () => {
    const ids = MEMBERS.map(m => m.id);
    expect(new Set(ids).size).toBe(MEMBERS.length);
  });

  it('every member has a valid status', () => {
    const validStatuses = ['active', 'invited', 'suspended'];
    for (const member of MEMBERS) {
      expect(validStatuses).toContain(member.status);
    }
  });

  it('exactly one nav item is marked current', () => {
    const current = NAV_ITEMS.filter(item => item.current);
    expect(current).toHaveLength(1);
  });
});
