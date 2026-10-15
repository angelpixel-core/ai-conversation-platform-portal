export type TenantTier = 'FREE' | 'STANDARD' | 'PRO' | 'ENTERPRISE';

export function formatTenantTier(tier: TenantTier): string {
  switch (tier) {
    case 'ENTERPRISE':
      return 'Enterprise';
    case 'STANDARD':
      return 'Standard';
    case 'PRO':
      return 'Pro';
    case 'FREE':
    default:
      return 'Free';
  }
}

export function getTenantTierColor(tier: TenantTier): {
  bg: string;
  text: string;
  border: string;
  accent: string;
} {
  switch (tier) {
    case 'ENTERPRISE':
      return {
        bg: 'bg-amber-300',
        text: 'text-amber-950',
        border: 'border-black',
        accent: '#F59E0B',
      };
    case 'STANDARD':
    case 'PRO':
      return {
        bg: 'bg-sky-300',
        text: 'text-sky-950',
        border: 'border-black',
        accent: '#0284C7',
      };
    case 'FREE':
    default:
      return {
        bg: 'bg-zinc-200',
        text: 'text-zinc-800',
        border: 'border-black',
        accent: '#71717A',
      };
  }
}
