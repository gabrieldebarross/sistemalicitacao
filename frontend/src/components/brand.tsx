import { Route } from 'lucide-react';

import { cn } from '@/components/ui';

export function MarcaTramitaY({
  compacta = false,
  tema = 'escuro',
}: Readonly<{
  compacta?: boolean;
  tema?: 'escuro' | 'claro';
}>) {
  return (
    <span className="flex min-w-0 items-center gap-2.5">
      <span className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-sinal-500 text-tinta-950 shadow-[0_6px_18px_-8px_rgb(220_122_34/0.9)]">
        <Route className="h-5 w-5" strokeWidth={2.4} aria-hidden="true" />
      </span>
      {!compacta ? (
        <span className="min-w-0 leading-tight">
          <span
            className={cn(
              'block truncate text-[0.98rem] font-bold tracking-[-0.015em]',
              tema === 'escuro' ? 'text-white' : 'text-tinta-950',
            )}
          >
            TramitaY
          </span>
          <span
            className={cn(
              'block truncate text-[0.62rem] font-medium uppercase tracking-[0.13em]',
              tema === 'escuro' ? 'text-rota-200' : 'text-tinta-500',
            )}
          >
            Gestão de licitações
          </span>
        </span>
      ) : null}
    </span>
  );
}
