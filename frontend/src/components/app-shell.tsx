'use client';

import {
  ClipboardList,
  FileText,
  Gauge,
  Layers,
  LogOut,
  Menu,
  ScrollText,
  Tag,
  ShieldCheck,
  UserRound,
  Users,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { Carregando, cn } from '@/components/ui';
import { useSessao } from '@/lib/session';

interface ItemMenu {
  href: string;
  rotulo: string;
  permissao: string | null;
  icone: typeof Gauge;
}

const ITENS: ItemMenu[] = [
  { href: '/painel', rotulo: 'Painel', permissao: null, icone: Gauge },
  {
    href: '/processos',
    rotulo: 'Processos',
    permissao: 'processos.read',
    icone: ClipboardList,
  },
  { href: '/fluxos', rotulo: 'Fluxos', permissao: 'fluxos.read', icone: Layers },
  {
    href: '/cadastros/tipos-processo',
    rotulo: 'Tipos de processo',
    permissao: 'processos.read',
    icone: FileText,
  },
  {
    href: '/cadastros/setores',
    rotulo: 'Setores',
    permissao: 'processos.read',
    icone: Tag,
  },
  {
    href: '/cadastros/cargos',
    rotulo: 'Cargos',
    permissao: 'processos.read',
    icone: ScrollText,
  },
  {
    href: '/usuarios',
    rotulo: 'Usuários',
    permissao: 'usuarios.read',
    icone: Users,
  },
  { href: '/roles', rotulo: 'Papéis', permissao: 'roles.read', icone: ShieldCheck },
  {
    href: '/auditoria',
    rotulo: 'Auditoria',
    permissao: 'audit.read',
    icone: ScrollText,
  },
  { href: '/perfil', rotulo: 'Meu perfil', permissao: null, icone: UserRound },
];

export function AppShell({ children }: Readonly<{ children: React.ReactNode }>) {
  const { perfil, carregando, sair, temPermissao } = useSessao();
  const router = useRouter();
  const pathname = usePathname();
  const [menuAberto, setMenuAberto] = useState(false);

  useEffect(() => {
    if (carregando) {
      return;
    }
    if (!perfil) {
      router.replace('/login');
    } else if (perfil.senhaProvisoria) {
      router.replace('/trocar-senha');
    }
  }, [carregando, perfil, router]);

  if (carregando || !perfil || perfil.senhaProvisoria) {
    return <Carregando texto="Carregando sessão…" />;
  }

  const itensVisiveis = ITENS.filter(
    (item) => item.permissao === null || temPermissao(item.permissao),
  );

  async function aoSair() {
    await sair();
    router.replace('/login');
  }

  const navegacao = (
    <nav className="flex flex-1 flex-col gap-1 p-3" aria-label="Navegação principal">
      {itensVisiveis.map((item) => {
        const ativo = pathname === item.href || pathname.startsWith(`${item.href}/`);
        const Icone = item.icone;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setMenuAberto(false)}
            aria-current={ativo ? 'page' : undefined}
            className={cn(
              'flex items-center gap-3 rounded-md border-l-2 px-3 py-2 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600',
              ativo
                ? 'border-sky-600 bg-sky-50 text-sky-900'
                : 'border-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900',
            )}
          >
            <Icone className="h-4 w-4" aria-hidden="true" />
            {item.rotulo}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Sidebar desktop */}
      <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col border-r border-slate-200 bg-white md:flex">
        <div className="flex h-16 items-center gap-2 border-b border-slate-200 px-4">
          <span className="flex h-8 w-8 items-center justify-center rounded-md bg-sky-700 text-white">
            <ShieldCheck className="h-4 w-4" aria-hidden="true" />
          </span>
          <span className="text-sm font-semibold leading-tight text-slate-800">
            Gestão de
            <br />
            Licitações
          </span>
        </div>
        {navegacao}
        <div className="border-t border-slate-200 p-3">
          <p className="text-xs font-medium text-slate-700">{perfil.nome}</p>
          <p className="truncate text-xs text-slate-500">
            {perfil.roles.join(', ') || 'Sem papel'}
          </p>
        </div>
      </aside>

      {/* Sidebar mobile */}
      {menuAberto ? (
        <div className="fixed inset-0 z-40 md:hidden">
          <div
            className="absolute inset-0 bg-slate-900/40"
            onClick={() => setMenuAberto(false)}
            aria-hidden="true"
          />
          <aside className="relative z-10 flex h-full w-64 flex-col bg-white">
            <div className="flex h-16 items-center justify-between border-b border-slate-200 px-4">
              <span className="text-sm font-semibold">Gestão de Licitações</span>
              <button
                type="button"
                aria-label="Fechar menu"
                onClick={() => setMenuAberto(false)}
                className="rounded p-1 text-slate-500 hover:bg-slate-100"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
            {navegacao}
          </aside>
        </div>
      ) : null}

      <div className="md:pl-64">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b border-slate-200 bg-white/95 px-4 shadow-sm backdrop-blur">
          <button
            type="button"
            aria-label="Abrir menu"
            onClick={() => setMenuAberto(true)}
            className="rounded p-2 text-slate-600 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600 md:hidden"
          >
            <Menu className="h-5 w-5" aria-hidden="true" />
          </button>
          <div className="ml-auto flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-200 text-xs font-semibold text-slate-700">
              {perfil.nome.slice(0, 1).toUpperCase()}
            </span>
            <div className="hidden leading-tight sm:block">
              <p className="text-sm font-medium text-slate-800">
                {perfil.nome}
              </p>
              <p className="text-xs text-slate-500">
                {perfil.roles.join(', ') || 'Sem papel'}
              </p>
            </div>
            <button
              type="button"
              onClick={aoSair}
              className="inline-flex items-center gap-2 rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600"
            >
              <LogOut className="h-4 w-4" aria-hidden="true" />
              Sair
            </button>
          </div>
        </header>
        <main className="mx-auto max-w-6xl p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
