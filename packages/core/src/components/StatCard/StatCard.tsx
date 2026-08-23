import * as React from 'react';
import { IconArrowUpRight, IconArrowDownRight } from '@tabler/icons-react';
import { cn } from '../../lib/utils';
import { Card } from '../Card';
import { Icon } from '../Icon';
import type { StatCardProps } from './StatCard.types';

const StatCard = ({ label, value, delta, trend, className }: StatCardProps) => {
  return (
    <Card className={cn(className)}>
      <div data-helix-part="stat-card-label">{label}</div>
      <div data-helix-part="stat-card-value">{value}</div>
      {delta && (
        <div data-helix-part="stat-card-delta" data-trend={trend}>
          {trend && (
            <span data-helix-part="stat-card-delta-icon">
              <Icon icon={trend === 'up' ? IconArrowUpRight : IconArrowDownRight} size={12} />
            </span>
          )}
          {delta}
        </div>
      )}
    </Card>
  );
};

StatCard.displayName = 'StatCard';

export { StatCard };
