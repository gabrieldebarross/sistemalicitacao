import type { Metadata } from 'next';

import { SessaoProvider } from '@/lib/session';

import './globals.css';

export const metadata: Metadata = {
  title: 'Gestão de Licitações',
  description:
    'Sistema de gestão e acompanhamento de processos de licitação e contratações públicas.',
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen">
        <SessaoProvider>{children}</SessaoProvider>
      </body>
    </html>
  );
}
