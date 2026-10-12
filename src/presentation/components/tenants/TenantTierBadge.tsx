import React from 'react';
import { TenantTier } from '@/domain/tenants/TenantTier';

interface TenantTierBadgeProps {
  tier: TenantTier;
  className?: string;
}

export const TenantTierBadge: React.FC<TenantTierBadgeProps> = ({ tier, className = '' }) => {
  const colorClasses =
    tier === 'ENTERPRISE'
      ? 'bg-[#FBBF24] text-black border-black'
      : tier === 'PRO'
      ? 'bg-sky-300 text-black border-black'
      : 'bg-slate-200 text-slate-800 border-black';

  return (
    <span
      className={`inline-block px-1.5 py-0.5 text-[10px] font-black uppercase tracking-wider border-2 shadow-neo-xs ${colorClasses} ${className}`}
    >
      {tier}
    </span>
  );
};
