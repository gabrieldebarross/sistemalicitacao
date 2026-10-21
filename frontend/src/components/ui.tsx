'use client';

import {
  CheckCircle2,
  CircleAlert,
  Inbox,
  Loader2,
  X,
} from 'lucide-react';
import {
  useEffect,
  useId,
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from 'react';

export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(' ');
}

type VarianteBotao = 'primario' | 'secundario' | 'perigo' | 'sutil';

const ESTILOS_BOTAO: Record<VarianteBotao, string> = {
  primario:
    'bg-rota-700 text-white shadow-sm shadow-rota-950/15 hover:bg-rota-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rota-600 focus-visible:ring-offset-2 disabled:bg-rota-300 disabled:shadow-none',
  secundario:
    'border border-linha-300 bg-white text-tinta-800 shadow-sm hover:border-tinta-400 hover:bg-papel-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rota-600 focus-visible:ring-offset-2 disabled:opacity-55',
  perigo:
    'bg-red-700 text-white shadow-sm hover:bg-red-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600 focus-visible:ring-offset-2 disabled:bg-red-300 disabled:shadow-none',
  sutil:
    'text-tinta-700 hover:bg-papel-100 hover:text-tinta-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rota-600 focus-visible:ring-offset-2 disabled:opacity-55',
};

interface BotaoProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variante?: VarianteBotao;
}

export function Botao({
  variante = 'primario',
  className,
  type = 'button',
  ...props
}: BotaoProps) {
  return (
    <button
      type={type}
      className={cn(
        'inline-flex min-h-9 items-center justify-center gap-2 rounded-lg px-3.5 py-2 text-sm font-semibold transition-colors disabled:cursor-not-allowed',
        ESTILOS_BOTAO[variante],
        className,
      )}
      {...props}
    />
  );
}

interface CampoProps {
  rotulo: string;
  htmlFor?: string;
  erro?: string;
  obrigatorio?: boolean;
  dica?: string;
  children: ReactNode;
}

export function Campo({
  rotulo,
  htmlFor,
  erro,
  obrigatorio,
  dica,
  children,
}: CampoProps) {
  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <label
        htmlFor={htmlFor}
        className="text-[0.8rem] font-semibold tracking-wide text-tinta-800"
      >
        {rotulo}
        {obrigatorio ? (
          <span className="text-sinal-600" aria-hidden="true">
            {' '}
            *
          </span>
        ) : null}
      </label>
      {children}
      {dica && !erro ? (
        <span className="text-xs leading-relaxed text-tinta-600">{dica}</span>
      ) : null}
      {erro ? (
        <span className="text-xs font-medium text-red-700" role="alert">
          {erro}
        </span>
      ) : null}
    </div>
  );
}

const BASE_CAMPO =
  'w-full min-w-0 rounded-lg border border-linha-300 bg-white px-3.5 py-2.5 text-sm text-tinta-900 shadow-[inset_0_1px_1px_rgb(12_38_49/0.04)] placeholder:text-tinta-500 hover:border-tinta-400 focus:border-rota-600 focus:outline-none focus:ring-2 focus:ring-rota-600/25 disabled:cursor-not-allowed disabled:bg-papel-100 disabled:text-tinta-600';

export function Entrada(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cn(BASE_CAMPO, props.className)} />;
}

export function AreaTexto(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={cn(BASE_CAMPO, 'min-h-28 resize-y', props.className)}
    />
  );
}

export function Selecao(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={cn(BASE_CAMPO, 'cursor-pointer pr-9', props.className)}
    />
  );
}

export function Cartao({
  children,
  className,
}: Readonly<{ children: ReactNode; className?: string }>) {
  return (
    <section
      className={cn(
        'overflow-hidden rounded-2xl border border-linha-200 bg-white shadow-[0_1px_2px_rgb(12_38_49/0.04),0_12px_32px_-24px_rgb(12_38_49/0.35)]',
        className,
      )}
    >
      {children}
    </section>
  );
}

export function CabecalhoCartao({
  titulo,
  descricao,
  acao,
}: Readonly<{ titulo: string; descricao?: string; acao?: ReactNode }>) {
  return (
    <header className="flex flex-wrap items-start justify-between gap-3 border-b border-linha-200 bg-papel-50/60 px-5 py-4">
      <div className="min-w-0">
        <h2 className="text-[0.95rem] font-semibold text-tinta-900">{titulo}</h2>
        {descricao ? (
          <p className="mt-0.5 text-sm leading-relaxed text-tinta-600">
            {descricao}
          </p>
        ) : null}
      </div>
      {acao}
    </header>
  );
}

type TomEtiqueta = 'neutro' | 'info' | 'sucesso' | 'alerta' | 'perigo';

const TONS: Record<TomEtiqueta, string> = {
  neutro: 'border-linha-200 bg-papel-100 text-tinta-700',
  info: 'border-rota-200 bg-rota-50 text-rota-800',
  sucesso: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  alerta: 'border-amber-200 bg-amber-50 text-amber-900',
  perigo: 'border-red-200 bg-red-50 text-red-800',
};

export function Etiqueta({
  children,
  tom = 'neutro',
}: Readonly<{ children: ReactNode; tom?: TomEtiqueta }>) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[0.7rem] font-semibold tracking-wide',
        TONS[tom],
      )}
    >
      <span
        className="h-1.5 w-1.5 rounded-full bg-current opacity-70"
        aria-hidden="true"
      />
      {children}
    </span>
  );
}

export function AlertaErro({ mensagem }: Readonly<{ mensagem: string }>) {
  return (
    <div
      role="alert"
      className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-3.5 py-3 text-sm leading-relaxed text-red-800"
    >
      <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      <span>{mensagem}</span>
    </div>
  );
}

export function EstadoVazio({
  titulo,
  descricao,
  acao,
}: Readonly<{ titulo: string; descricao?: string; acao?: ReactNode }>) {
  return (
    <div className="flex flex-col items-center gap-2 px-6 py-16 text-center">
      <span className="mb-1 flex h-11 w-11 items-center justify-center rounded-xl border border-linha-200 bg-papel-100 text-tinta-500">
        <Inbox className="h-5 w-5" aria-hidden="true" />
      </span>
      <p className="text-base font-semibold text-tinta-900">{titulo}</p>
      {descricao ? (
        <p className="max-w-md text-sm leading-relaxed text-tinta-600">
          {descricao}
        </p>
      ) : null}
      {acao ? <div className="mt-3">{acao}</div> : null}
    </div>
  );
}

export function Carregando({
  texto = 'Carregando…',
}: Readonly<{ texto?: string }>) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex items-center justify-center gap-2.5 px-4 py-12 text-sm font-medium text-tinta-600"
    >
      <Loader2
        className="h-4 w-4 animate-spin text-rota-600"
        aria-hidden="true"
      />
      {texto}
    </div>
  );
}

interface ModalProps {
  aberto: boolean;
  titulo: string;
  aoFechar: () => void;
  children: ReactNode;
  rodape?: ReactNode;
}

export function Modal({
  aberto,
  titulo,
  aoFechar,
  children,
  rodape,
}: ModalProps) {
  const tituloId = useId();

  useEffect(() => {
    if (!aberto) {
      return;
    }
    function aoTeclar(evento: KeyboardEvent) {
      if (evento.key === 'Escape') {
        aoFechar();
      }
    }
    const overflowAnterior = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', aoTeclar);
    return () => {
      document.body.style.overflow = overflowAnterior;
      document.removeEventListener('keydown', aoTeclar);
    };
  }, [aberto, aoFechar]);

  if (!aberto) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-tinta-950/55 backdrop-blur-[2px]"
        onClick={aoFechar}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={tituloId}
        className="relative z-10 max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-linha-200 bg-white shadow-2xl"
      >
        <header className="flex items-center justify-between border-b border-linha-200 px-5 py-4">
          <h2 id={tituloId} className="text-base font-semibold text-tinta-900">
            {titulo}
          </h2>
          <button
            type="button"
            onClick={aoFechar}
            aria-label="Fechar"
            className="rounded-lg p-1.5 text-tinta-500 transition-colors hover:bg-papel-100 hover:text-tinta-800"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </header>
        <div className="px-5 py-5">{children}</div>
        {rodape ? (
          <footer className="flex flex-wrap justify-end gap-2 border-t border-linha-200 bg-papel-50/60 px-5 py-3.5">
            {rodape}
          </footer>
        ) : null}
      </div>
    </div>
  );
}

export function CabecalhoPagina({
  titulo,
  descricao,
  acao,
}: Readonly<{ titulo: string; descricao?: string; acao?: ReactNode }>) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        <span
          className="mb-2 block h-1 w-9 rounded-full bg-sinal-500"
          aria-hidden="true"
        />
        <h1 className="text-[1.65rem] font-semibold leading-tight tracking-[-0.02em] text-tinta-950">
          {titulo}
        </h1>
        {descricao ? (
          <p className="mt-1 max-w-2xl text-sm leading-relaxed text-tinta-600">
            {descricao}
          </p>
        ) : null}
      </div>
      {acao}
    </div>
  );
}

export function AlertaSucesso({
  mensagem,
}: Readonly<{ mensagem: string }>) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex items-start gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-3 text-sm leading-relaxed text-emerald-800"
    >
      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      <span>{mensagem}</span>
    </div>
  );
}

export function Skeleton({ className }: Readonly<{ className?: string }>) {
  return (
    <div
      aria-hidden="true"
      className={cn('animate-pulse rounded-lg bg-linha-100', className)}
    />
  );
}

export function ListaDescricao({
  itens,
}: Readonly<{
  itens: Array<{ rotulo: string; valor: ReactNode }>;
}>) {
  return (
    <dl className="grid gap-x-8 gap-y-4 sm:grid-cols-2">
      {itens.map((item) => (
        <div key={item.rotulo} className="flex min-w-0 flex-col gap-1">
          <dt className="text-[0.7rem] font-semibold uppercase tracking-[0.08em] text-tinta-500">
            {item.rotulo}
          </dt>
          <dd className="text-sm leading-relaxed text-tinta-900">
            {item.valor}
          </dd>
        </div>
      ))}
    </dl>
  );
}
