'use client';

import {
  ClipboardList,
  FileText,
  Gauge,
  KeyRound,
  Layers,
  ListTodo,
  LogOut,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  ScrollText,
  ShieldCheck,
  Tag,
  UserRound,
  Users,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { MarcaTramitaY } from '@/components/brand';
import { Carregando, cn } from '@/components/ui';
import { useSessao } from '@/lib/session';

interface ItemMenu {
  href: string;
  rotulo: string;
  permissao: string | null;
  icone: typeof Gauge;
}

interface GrupoMenu {
  titulo: string;
  itens: ItemMenu[];
}

const GRUPOS: GrupoMenu[] = [
  {
    titulo: 'Operação',
    itens: [
      { href: '/painel', rotulo: 'Painel', permissao: null, icone: Gauge },
      {
        href: '/minhas-tarefas',
        rotulo: 'Minhas tarefas',
        permissao: 'processos.read',
        icone: ListTodo,
      },
      {
        href: '/processos',
        rotulo: 'Processos',
        permissao: 'processos.read',
        icone: ClipboardList,
      },
      { href: '/fluxos', rotulo: 'Fluxos', permissao: 'fluxos.read', icone: Layers },
    ],
  },
  {
    titulo: 'Cadastros',
    itens: [
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
    ],
  },
  {
    titulo: 'Administração',
    itens: [
      {
        href: '/usuarios',
        rotulo: 'Usuários',
        permissao: 'usuarios.read',
        icone: Users,
      },
      {
        href: '/roles',
        rotulo: 'Papéis',
        permissao: 'roles.read',
        icone: ShieldCheck,
      },
      {
        href: '/auditoria',
        rotulo: 'Auditoria',
        permissao: 'audit.read',
        icone: ScrollText,
      },
    ],
  },
  {
    titulo: 'Conta',
    itens: [
      {
        href: '/perfil',
        rotulo: 'Meu perfil',
        permissao: null,
        icone: UserRound,
      },
      {
        href: '/perfil/seguranca',
        rotulo: 'Segurança',
        permissao: null,
        icone: KeyRound,
      },
    ],
  },
];

const CHAVE_MENU = 'tramitay:menu-recolhido';

export function AppShell({ children }: Readonly<{ children: React.ReactNode }>) {
  const { perfil, carregando, sair, temPermissao } = useSessao();
  const router = useRouter();
  const pathname = usePathname();
  const [menuAberto, setMenuAberto] = useState(false);
  const [recolhido, setRecolhido] = useState(false);

  useEffect(() => {
    try {
      setRecolhido(window.localStorage.getItem(CHAVE_MENU) === '1');
    } catch {
      setRecolhido(false);
    }
  }, []);

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

  useEffect(() => {
    if (!menuAberto) {
      return;
    }
    function aoTeclar(evento: KeyboardEvent) {
      if (evento.key === 'Escape') {
        setMenuAberto(false);
      }
    }
    const overflowAnterior = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', aoTeclar);
    return () => {
      document.body.style.overflow = overflowAnterior;
      document.removeEventListener('keydown', aoTeclar);
    };
  }, [menuAberto]);

  if (carregando || !perfil || perfil.senhaProvisoria) {
    return <Carregando texto="Carregando sessão…" />;
  }

  function alternarMenuLateral() {
    setRecolhido((atual) => {
      const proximo = !atual;
      try {
        window.localStorage.setItem(CHAVE_MENU, proximo ? '1' : '0');
      } catch {
        // A preferência é apenas conveniência; falha de storage não bloqueia o uso.
      }
      return proximo;
    });
  }

  const itensVisiveis = GRUPOS.map((grupo) => ({
    ...grupo,
    itens: grupo.itens.filter(
      (item) => item.permissao === null || temPermissao(item.permissao),
    ),
  })).filter((grupo) => grupo.itens.length > 0);

  const itemAtual = itensVisiveis
    .flatMap((grupo) => grupo.itens)
    .find(
      (item) =>
        pathname === item.href ||
        (item.href !== '/painel' && pathname.startsWith(`${item.href}/`)),
    );

  async function aoSair() {
    await sair();
    router.replace('/login');
  }

  function navegacao(compacta: boolean) {
    return (
      <nav
        className={cn(
          'flex flex-1 flex-col gap-4 overflow-y-auto py-4',
          compacta ? 'px-2' : 'px-3',
        )}
        aria-label="Navegação principal"
      >
        {itensVisiveis.map((grupo) => (
          <div key={grupo.titulo}>
            {compacta ? (
              <div className="mx-auto mb-2 h-px w-7 bg-white/10" aria-hidden="true" />
            ) : (
              <p className="mb-1.5 px-2.5 text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-rota-300">
                {grupo.titulo}
              </p>
            )}
            <div className="flex flex-col gap-0.5">
              {grupo.itens.map((item) => {
                const ativo = item.href === itemAtual?.href;
                const Icone = item.icone;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMenuAberto(false)}
                    aria-current={ativo ? 'page' : undefined}
                    aria-label={compacta ? item.rotulo : undefined}
                    title={compacta ? item.rotulo : undefined}
                    className={cn(
                      'relative flex min-h-9 items-center rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sinal-300 focus-visible:ring-offset-2 focus-visible:ring-offset-tinta-950',
                      compacta
                        ? 'justify-center px-2 py-2'
                        : 'gap-2.5 px-2.5 py-2',
                      ativo
                        ? 'bg-white/10 text-white'
                        : 'text-rota-100/80 hover:bg-white/10 hover:text-white',
                    )}
                  >
                    {ativo ? (
                      <span
                        className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-sinal-400"
                        aria-hidden="true"
                      />
                    ) : null}
                    <Icone
                      className={cn(
                        'shrink-0',
                        compacta ? 'h-[1.15rem] w-[1.15rem]' : 'h-4 w-4',
                        ativo ? 'text-sinal-300' : 'text-rota-300',
                      )}
                      aria-hidden="true"
                    />
                    {!compacta ? (
                      <span className="truncate">{item.rotulo}</span>
                    ) : null}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
    );
  }

  return (
    <div className="min-h-screen bg-papel-50">
      <a
        href="#conteudo-principal"
        className="sr-only z-[60] rounded-lg bg-white px-4 py-2 text-sm font-semibold text-tinta-950 focus:not-sr-only focus:fixed focus:left-4 focus:top-3"
      >
        Ir para o conteúdo
      </a>

      <aside
        id="menu-lateral"
        aria-label="Menu lateral"
        className={cn(
          'fixed inset-y-0 left-0 z-40 hidden flex-col border-r border-white/10 bg-tinta-950 transition-[width] duration-200 md:flex',
          recolhido ? 'w-[4.75rem]' : 'w-[17rem]',
        )}
      >
        <div
          className={cn(
            'flex h-[4.5rem] shrink-0 items-center border-b border-white/10',
            recolhido ? 'justify-center px-2' : 'justify-between px-4',
          )}
        >
          <MarcaTramitaY compacta={recolhido} />
          {!recolhido ? (
            <button
              type="button"
              onClick={alternarMenuLateral}
              aria-label="Recolher menu lateral"
              aria-expanded="true"
              aria-controls="menu-lateral"
              className="rounded-lg p-1.5 text-rota-200 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sinal-300"
            >
              <PanelLeftClose className="h-[1.15rem] w-[1.15rem]" aria-hidden="true" />
            </button>
          ) : null}
        </div>

        {navegacao(recolhido)}

        <div
          className={cn(
            'shrink-0 border-t border-white/10',
            recolhido ? 'flex flex-col items-center gap-2 px-2 py-3' : 'p-3',
          )}
        >
          {recolhido ? (
            <button
              type="button"
              onClick={alternarMenuLateral}
              aria-label="Expandir menu lateral"
              aria-expanded="false"
              aria-controls="menu-lateral"
              className="rounded-lg p-2 text-rota-200 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sinal-300"
              title="Expandir menu"
            >
              <PanelLeftOpen className="h-[1.15rem] w-[1.15rem]" aria-hidden="true" />
            </button>
          ) : (
            <p className="px-2 text-[0.62rem] font-medium uppercase tracking-[0.12em] text-rota-300">
              Sessão institucional
            </p>
          )}
          <div
            className={cn(
              'mt-2 flex items-center gap-2.5',
              recolhido ? 'justify-center' : 'rounded-xl bg-white/5 p-2',
            )}
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-rota-700 text-xs font-bold text-white">
              {perfil.nome.slice(0, 1).toUpperCase()}
            </span>
            {!recolhido ? (
              <span className="min-w-0 flex-1 leading-tight">
                <span className="block truncate text-xs font-semibold text-white">
                  {perfil.nome}
                </span>
                <span className="block truncate text-[0.65rem] text-rota-300">
                  {perfil.roles.join(', ') || 'Sem papel'}
                </span>
              </span>
            ) : null}
          </div>
        </div>
      </aside>

      {menuAberto ? (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-tinta-950/60 backdrop-blur-[2px]"
            onClick={() => setMenuAberto(false)}
            aria-hidden="true"
          />
          <aside
            role="dialog"
            aria-modal="true"
            aria-label="Menu de navegação"
            className="relative z-10 flex h-full w-[17rem] flex-col bg-tinta-950 shadow-2xl"
          >
            <div className="flex h-[4.5rem] items-center justify-between border-b border-white/10 px-4">
              <MarcaTramitaY />
              <button
                type="button"
                aria-label="Fechar menu"
                onClick={() => setMenuAberto(false)}
                className="rounded-lg p-1.5 text-rota-200 hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sinal-300"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
            {navegacao(false)}
            <div className="border-t border-white/10 p-4">
              <p className="truncate text-sm font-semibold text-white">{perfil.nome}</p>
              <p className="truncate text-xs text-rota-300">
                {perfil.roles.join(', ') || 'Sem papel'}
              </p>
            </div>
          </aside>
        </div>
      ) : null}

      <div
        className={cn(
          'transition-[padding] duration-200',
          recolhido ? 'md:pl-[4.75rem]' : 'md:pl-[17rem]',
        )}
      >
        <header className="sticky top-0 z-30 flex h-[4.5rem] items-center justify-between gap-3 border-b border-linha-200 bg-papel-50/90 px-4 backdrop-blur md:px-7">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              aria-label="Abrir menu"
              onClick={() => setMenuAberto(true)}
              className="rounded-lg p-2 text-tinta-700 hover:bg-papel-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rota-600 md:hidden"
            >
              <Menu className="h-5 w-5" aria-hidden="true" />
            </button>
            <div className="min-w-0">
              <p className="text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-tinta-500">
                TramitaY
              </p>
              <p className="truncate text-sm font-semibold text-tinta-900">
                {itemAtual?.rotulo ?? 'Painel'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <div className="hidden text-right leading-tight sm:block">
              <p className="text-sm font-semibold text-tinta-900">{perfil.nome}</p>
              <p className="text-xs text-tinta-600">
                {perfil.roles.join(', ') || 'Sem papel'}
              </p>
            </div>
            <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-linha-200 bg-white text-xs font-bold text-tinta-800 shadow-sm">
              {perfil.nome.slice(0, 1).toUpperCase()}
            </span>
            <button
              type="button"
              onClick={aoSair}
              className="inline-flex min-h-9 items-center gap-2 rounded-lg border border-linha-300 bg-white px-3 py-1.5 text-sm font-semibold text-tinta-800 shadow-sm transition-colors hover:bg-papel-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rota-600"
            >
              <LogOut className="h-4 w-4" aria-hidden="true" />
              <span className="hidden sm:inline">Sair</span>
            </button>
          </div>
        </header>
        <main
          id="conteudo-principal"
          className="mx-auto max-w-[96rem] px-4 py-5 md:px-7 md:py-7"
        >
          {children}
        </main>
      </div>
    </div>
  );
}
