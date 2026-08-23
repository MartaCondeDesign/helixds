import * as React from 'react';
import { cn } from '../../lib/utils';
import type { PageHeaderProps } from './PageHeader.types';

const PageHeader = ({ label, description, level = 1, actions, className }: PageHeaderProps) => {
  const Title = level === 1 ? 'h1' : 'h2';

  return (
    <div data-helix-part="page-header-root" className={cn(className)}>
      <div>
        <Title data-helix-part="page-header-title" data-level={level}>{label}</Title>
        {description && (
          <p data-helix-part="page-header-description">{description}</p>
        )}
      </div>
      {actions && <div data-helix-part="page-header-actions">{actions}</div>}
    </div>
  );
};

PageHeader.displayName = 'PageHeader';

export { PageHeader };
