import type { Metadata, Viewport } from 'next';

import { SessaoProvider } from '@/lib/session';

import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'TramitaY · Gestão de licitações',
    template: '%s · TramitaY',
  },
  description:
    'Plataforma de gestão, acompanhamento e supervisão de processos de licitação e contratações públicas.',
  applicationName: 'TramitaY',
  authors: [{ name: 'TramitaY' }],
};

export const viewport: Viewport = {
  themeColor: '#0c2631',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen bg-papel-50 text-tinta-900 antialiased">
        <SessaoProvider>{children}</SessaoProvider>
      </body>
    </html>
  );
}
