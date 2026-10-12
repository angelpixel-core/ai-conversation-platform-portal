import React from 'react';
import { Tenant } from '@/domain/tenants/Tenant';

interface TenantAvatarProps {
  tenant: Tenant;
  size?: 'sm' | 'md' | 'lg';
}

const COLOR_VARIANTS = [
  'bg-rose-300 text-rose-950',
  'bg-amber-300 text-amber-950',
  'bg-emerald-300 text-emerald-950',
  'bg-sky-300 text-sky-950',
  'bg-violet-300 text-violet-950',
  'bg-teal-300 text-teal-950',
];

export const TenantAvatar: React.FC<TenantAvatarProps> = ({ tenant, size = 'md' }) => {
  // Deterministic color selection from tenant ID string
  const hash = tenant.id.value
    .split('')
    .reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const colorClass = COLOR_VARIANTS[hash % COLOR_VARIANTS.length];

  const sizeClasses =
    size === 'sm'
      ? 'w-7 h-7 text-xs'
      : size === 'lg'
      ? 'w-11 h-11 text-base'
      : 'w-8 h-8 text-xs';

  return (
    <div
      aria-hidden="true"
      className={`shrink-0 flex items-center justify-center font-black border-2 border-black shadow-neo-xs select-none ${sizeClasses} ${colorClass}`}
    >
      {tenant.initials}
    </div>
  );
};
