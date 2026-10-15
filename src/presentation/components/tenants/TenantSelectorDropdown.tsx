import React, { useState, useRef, useEffect } from 'react';
import { Tenant } from '@/domain/tenants/Tenant';
import { TenantAvatar } from './TenantAvatar';
import { TenantTierBadge } from './TenantTierBadge';
import { ChevronDown, Check, Building2 } from 'lucide-react';

export interface TenantSelectorDropdownProps {
  activeTenant: Tenant | null;
  tenants: Tenant[];
  onSelectTenant: (tenant: Tenant) => void;
  isLoading?: boolean;
}

export const TenantSelectorDropdown: React.FC<TenantSelectorDropdownProps> = ({
  activeTenant,
  tenants,
  onSelectTenant,
  isLoading = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside or pressing Escape
  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false);
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleSelect = (tenant: Tenant) => {
    onSelectTenant(tenant);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className="relative inline-block text-left">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label="Seleccionar espacio corporativo"
        disabled={isLoading || !activeTenant}
        className="flex items-center gap-2.5 px-3 py-1.5 bg-white border-2 border-black shadow-[3px_3px_0px_#000] hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all cursor-pointer select-none disabled:opacity-50"
      >
        {activeTenant ? (
          <>
            <TenantAvatar tenant={activeTenant} size="sm" />
            <div className="flex flex-col text-left">
              <span className="text-xs font-black uppercase text-black leading-tight max-w-[130px] truncate">
                {activeTenant.name}
              </span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-[10px] font-mono text-zinc-600 font-bold leading-none">
                  {activeTenant.id.value}
                </span>
                {activeTenant.formattedBalance && (
                  <span className="hidden md:inline-block text-[9px] font-mono font-bold bg-emerald-100 text-emerald-900 border border-black/30 px-1 leading-tight">
                    {activeTenant.formattedBalance}
                  </span>
                )}
              </div>
            </div>
            <TenantTierBadge tier={activeTenant.tier} className="hidden sm:inline-block ml-1" />
          </>
        ) : (
          <span className="text-xs font-black uppercase text-black flex items-center gap-1.5">
            <Building2 className="w-4 h-4" />
            {isLoading ? 'Cargando empresas...' : 'Seleccionar Empresa'}
          </span>
        )}
        <ChevronDown
          className={`w-4 h-4 stroke-[3] text-black transition-transform duration-150 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          role="listbox"
          aria-label="Empresas registradas"
          className="absolute right-0 mt-2 w-80 bg-white border-3 border-black shadow-[6px_6px_0px_#000] z-50 p-1 space-y-1 animate-fade-in"
        >
          <div className="px-3 py-1.5 border-b-2 border-black/20 flex items-center justify-between text-[10px] font-mono font-black uppercase text-zinc-600 tracking-wider">
            <span>Organizaciones Disponibles</span>
            <span className="bg-zinc-200 px-1 border border-black/20 text-zinc-700">{tenants.length}</span>
          </div>
          {tenants.map((t) => {
            const isSelected = activeTenant?.id.equals(t.id);
            return (
              <button
                key={t.id.value}
                type="button"
                role="option"
                aria-selected={isSelected}
                aria-label={t.name}
                onClick={() => handleSelect(t)}
                className={`w-full flex items-center justify-between p-2.5 text-left border-2 transition-all cursor-pointer ${
                  isSelected
                    ? 'border-black bg-amber-200 font-black shadow-[2px_2px_0px_#000]'
                    : 'border-transparent hover:border-black hover:bg-zinc-100 hover:shadow-[2px_2px_0px_#000] font-bold'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <TenantAvatar tenant={t} size="sm" />
                  <div className="min-w-0">
                    <p className="text-xs font-black uppercase text-black truncate leading-tight">
                      {t.name}
                    </p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-[10px] font-mono text-zinc-600 truncate">{t.id.value}</span>
                      {t.formattedBalance && (
                        <span className="text-[9px] font-mono font-bold bg-emerald-100 text-emerald-900 border border-black/30 px-1 leading-tight shrink-0">
                          {t.formattedBalance}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <TenantTierBadge tier={t.tier} />
                  {isSelected && <Check className="w-4 h-4 stroke-[3] text-black" />}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
