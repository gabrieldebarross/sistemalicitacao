'use client';

import { X } from 'lucide-react';
import {
  useEffect,
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
    'bg-sky-700 text-white shadow-sm hover:bg-sky-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600 focus-visible:ring-offset-2 disabled:bg-sky-300',
  secundario:
    'border border-slate-300 bg-white text-slate-700 shadow-sm hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600 focus-visible:ring-offset-2 disabled:opacity-60',
  perigo:
    'bg-red-700 text-white shadow-sm hover:bg-red-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600 focus-visible:ring-offset-2 disabled:bg-red-300',
  sutil:
    'text-slate-600 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600 focus-visible:ring-offset-2',
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
        'inline-flex items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition disabled:cursor-not-allowed',
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
    <div className="flex flex-col gap-1">
      <label
        htmlFor={htmlFor}
        className="text-sm font-medium text-slate-700"
      >
        {rotulo}
        {obrigatorio ? <span className="text-red-600"> *</span> : null}
      </label>
      {children}
      {dica && !erro ? (
        <span className="text-xs text-slate-500">{dica}</span>
      ) : null}
      {erro ? (
        <span className="text-xs text-red-600" role="alert">
          {erro}
        </span>
      ) : null}
    </div>
  );
}

const BASE_CAMPO =
  'w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/40 disabled:bg-slate-100';

export function Entrada(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cn(BASE_CAMPO, props.className)} />;
}

export function AreaTexto(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={cn(BASE_CAMPO, 'min-h-24', props.className)}
    />
  );
}

export function Selecao(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={cn(BASE_CAMPO, props.className)} />;
}

export function Cartao({
  children,
  className,
}: Readonly<{ children: ReactNode; className?: string }>) {
  return (
    <section
      className={cn(
        'rounded-lg border border-slate-200 bg-white shadow-sm',
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
    <header className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-200 px-4 py-3">
      <div>
        <h2 className="text-base font-semibold text-slate-800">{titulo}</h2>
        {descricao ? (
          <p className="text-sm text-slate-500">{descricao}</p>
        ) : null}
      </div>
      {acao}
    </header>
  );
}

type TomEtiqueta = 'neutro' | 'info' | 'sucesso' | 'alerta' | 'perigo';

const TONS: Record<TomEtiqueta, string> = {
  neutro: 'bg-slate-100 text-slate-700',
  info: 'bg-sky-100 text-sky-800',
  sucesso: 'bg-emerald-100 text-emerald-800',
  alerta: 'bg-amber-100 text-amber-800',
  perigo: 'bg-red-100 text-red-800',
};

export function Etiqueta({
  children,
  tom = 'neutro',
}: Readonly<{ children: ReactNode; tom?: TomEtiqueta }>) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
        TONS[tom],
      )}
    >
      {children}
    </span>
  );
}

export function AlertaErro({ mensagem }: Readonly<{ mensagem: string }>) {
  return (
    <div
      role="alert"
      className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
    >
      {mensagem}
    </div>
  );
}

export function EstadoVazio({
  titulo,
  descricao,
  acao,
}: Readonly<{ titulo: string; descricao?: string; acao?: ReactNode }>) {
  return (
    <div className="flex flex-col items-center gap-2 px-4 py-12 text-center">
      <p className="text-base font-medium text-slate-700">{titulo}</p>
      {descricao ? (
        <p className="max-w-md text-sm text-slate-500">{descricao}</p>
      ) : null}
      {acao ? <div className="mt-2">{acao}</div> : null}
    </div>
  );
}

export function Carregando({ texto = 'Carregando…' }: Readonly<{ texto?: string }>) {
  return (
    <div className="flex items-center justify-center gap-2 px-4 py-10 text-sm text-slate-500">
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-sky-600" />
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
  useEffect(() => {
    if (!aberto) {
      return;
    }
    function aoTeclar(evento: KeyboardEvent) {
      if (evento.key === 'Escape') {
        aoFechar();
      }
    }
    document.addEventListener('keydown', aoTeclar);
    return () => document.removeEventListener('keydown', aoTeclar);
  }, [aberto, aoFechar]);

  if (!aberto) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-slate-900/40"
        onClick={aoFechar}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={titulo}
        className="relative z-10 max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-lg bg-white shadow-xl"
      >
        <header className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
          <h2 className="text-base font-semibold text-slate-800">{titulo}</h2>
          <button
            type="button"
            onClick={aoFechar}
            aria-label="Fechar"
            className="rounded p-1 text-slate-500 hover:bg-slate-100"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </header>
        <div className="px-4 py-4">{children}</div>
        {rodape ? (
          <footer className="flex justify-end gap-2 border-t border-slate-200 px-4 py-3">
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
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-slate-900">
          {titulo}
        </h1>
        {descricao ? (
          <p className="mt-0.5 max-w-2xl text-sm text-slate-500">{descricao}</p>
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
      className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800"
    >
      {mensagem}
    </div>
  );
}

export function Skeleton({ className }: Readonly<{ className?: string }>) {
  return (
    <div
      aria-hidden="true"
      className={cn('animate-pulse rounded bg-slate-200', className)}
    />
  );
}

export function ListaDescricao({
  itens,
}: Readonly<{
  itens: Array<{ rotulo: string; valor: ReactNode }>;
}>) {
  return (
    <dl className="grid gap-x-6 gap-y-2 sm:grid-cols-2">
      {itens.map((item) => (
        <div key={item.rotulo} className="flex flex-col">
          <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
            {item.rotulo}
          </dt>
          <dd className="text-sm text-slate-800">{item.valor}</dd>
        </div>
      ))}
    </dl>
  );
}
