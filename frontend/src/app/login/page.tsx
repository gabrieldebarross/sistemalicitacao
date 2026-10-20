'use client';

import { Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { AlertaErro, Botao, Campo, Entrada } from '@/components/ui';
import { mensagemDeErro } from '@/lib/api';
import { useSessao } from '@/lib/session';

export default function LoginPage() {
  const { perfil, carregando, entrar } = useSessao();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [erro, setErro] = useState('');
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    if (carregando || !perfil) {
      return;
    }
    router.replace(perfil.senhaProvisoria ? '/trocar-senha' : '/painel');
  }, [carregando, perfil, router]);

  async function submeter(evento: React.FormEvent) {
    evento.preventDefault();
    setErro('');
    setEnviando(true);
    try {
      const autenticado = await entrar(email, senha);
      router.replace(
        autenticado.senhaProvisoria ? '/trocar-senha' : '/painel',
      );
    } catch (falha) {
      setErro(mensagemDeErro(falha));
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 p-4">
      <div className="grid w-full max-w-4xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl md:grid-cols-[1.05fr_1fr]">
        <aside className="relative hidden flex-col justify-between overflow-hidden bg-gradient-to-br from-sky-800 via-sky-700 to-sky-600 p-10 text-white md:flex">
          <div
            className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/10"
            aria-hidden="true"
          />
          <div
            className="absolute -bottom-24 -left-12 h-64 w-64 rounded-full bg-white/10"
            aria-hidden="true"
          />
          <div className="relative">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15 backdrop-blur">
              <ShieldCheck className="h-6 w-6" aria-hidden="true" />
            </span>
            <h1 className="mt-6 text-2xl font-semibold leading-snug">
              Gestão de Licitações
            </h1>
            <p className="mt-2 max-w-xs text-sm text-sky-100">
              Supervisão e acompanhamento de processos de contratação pública.
            </p>
          </div>
          <ul className="relative mt-10 space-y-2.5 text-sm text-sky-100">
            <li className="flex gap-2">
              <span aria-hidden="true">•</span>
              Processos, fluxos e prazos em um só lugar.
            </li>
            <li className="flex gap-2">
              <span aria-hidden="true">•</span>
              Acesso por cargo com permissões explícitas.
            </li>
            <li className="flex gap-2">
              <span aria-hidden="true">•</span>
              Histórico e auditoria de cada movimentação.
            </li>
          </ul>
          <p className="relative mt-10 text-xs text-sky-200">
            Uso institucional — autarquia municipal.
          </p>
        </aside>

        <div className="flex flex-col justify-center p-6 sm:p-10">
          <div className="mb-6 flex items-center gap-3 md:hidden">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-sky-700 text-white">
              <ShieldCheck className="h-5 w-5" aria-hidden="true" />
            </span>
            <span className="text-base font-semibold text-slate-800">
              Gestão de Licitações
            </span>
          </div>

          <h2 className="text-xl font-semibold tracking-tight text-slate-900">
            Entrar
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Informe suas credenciais institucionais.
          </p>

          <form onSubmit={submeter} className="mt-6 flex flex-col gap-4">
            {erro ? <AlertaErro mensagem={erro} /> : null}
            <Campo rotulo="E-mail" htmlFor="email" obrigatorio>
              <Entrada
                id="email"
                type="email"
                autoComplete="username"
                autoFocus
                required
                placeholder="nome@instituicao.gov.br"
                value={email}
                onChange={(evento) => setEmail(evento.target.value)}
              />
            </Campo>
            <Campo rotulo="Senha" htmlFor="senha" obrigatorio>
              <div className="relative">
                <Entrada
                  id="senha"
                  type={mostrarSenha ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  className="pr-10"
                  value={senha}
                  onChange={(evento) => setSenha(evento.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setMostrarSenha((valor) => !valor)}
                  aria-label={mostrarSenha ? 'Ocultar senha' : 'Mostrar senha'}
                  aria-pressed={mostrarSenha}
                  className="absolute inset-y-0 right-0 flex w-10 items-center justify-center rounded-r-md text-slate-400 hover:text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600"
                >
                  {mostrarSenha ? (
                    <EyeOff className="h-4 w-4" aria-hidden="true" />
                  ) : (
                    <Eye className="h-4 w-4" aria-hidden="true" />
                  )}
                </button>
              </div>
            </Campo>
            <Botao type="submit" disabled={enviando} className="w-full">
              {enviando ? 'Entrando…' : 'Entrar'}
            </Botao>
          </form>

          <p className="mt-6 text-xs text-slate-400">
            Problemas de acesso? Procure o administrador do sistema.
          </p>
        </div>
      </div>
    </div>
  );
}
