import React from 'react';
import { WifiOff, RefreshCw } from 'lucide-react';

export interface StreamRecoveryBannerProps {
  isReconnecting: boolean;
  lastEventId: number | null;
  onResume: () => void;
}

export const StreamRecoveryBanner: React.FC<StreamRecoveryBannerProps> = ({
  isReconnecting,
  lastEventId,
  onResume,
}) => {
  if (!isReconnecting) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="bg-amber-300 border-4 border-black p-4 shadow-[4px_4px_0px_#000] flex flex-wrap items-center justify-between gap-3 animate-fade-in"
    >
      <div className="flex items-center gap-3">
        <div className="p-2 bg-black text-amber-300 border-2 border-black shrink-0">
          <WifiOff className="w-5 h-5 stroke-[2.5]" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-black uppercase bg-black text-white px-2 py-0.5">
              Stream Recovery Activo
            </span>
            {lastEventId !== null && (
              <span className="font-mono text-xs font-black bg-white border border-black px-1.5 py-0.5">
                Last-Event-ID: {lastEventId}
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm font-bold text-black mt-1">
            Desconexión de red detectada. Reanudando flujo desde el último token confirmado...
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={onResume}
        className="px-3.5 py-1.5 bg-white hover:bg-amber-100 border-2 border-black font-black text-xs uppercase shadow-[2px_2px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none flex items-center gap-1.5 cursor-pointer"
      >
        <RefreshCw className="w-3.5 h-3.5 stroke-[2.5]" />
        Reintentar Ahora
      </button>
    </div>
  );
};
