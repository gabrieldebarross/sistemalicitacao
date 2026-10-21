'use client';

import { Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import {
  AlertaErro,
  AlertaSucesso,
  Botao,
  Campo,
  Entrada,
} from '@/components/ui';
import { api, mensagemDeErro } from '@/lib/api';
import { useSessao, type Perfil } from '@/lib/session';
import type { ConfiguracaoMfa } from '@/lib/tipos';

type Etapa = 'credenciais' | 'mfa' | 'configurar' | 'codigos';

export default function LoginPage() {
  const { perfil, carregando, entrar, recarregar } = useSessao();
  const router = useRouter();
  const [etapa, setEtapa] = useState<Etapa>('credenciais');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [codigo, setCodigo] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [erro, setErro] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [configuracao, setConfiguracao] = useState<ConfiguracaoMfa | null>(
    null,
  );
  const [codigosRecuperacao, setCodigosRecuperacao] = useState<string[]>([]);

  useEffect(() => {
    if (carregando || !perfil) {
      return;
    }
    router.replace(perfil.senhaProvisoria ? '/trocar-senha' : '/painel');
  }, [carregando, perfil, router]);

  function irParaPosLogin(perfilAtual: Perfil) {
    router.replace(perfilAtual.senhaProvisoria ? '/trocar-senha' : '/painel');
  }

  async function submeterCredenciais(evento: React.FormEvent) {
    evento.preventDefault();
    setErro('');
    setEnviando(true);
    try {
      const resultado = await entrar(email, senha);
      if (!resultado.mfaRequerido) {
        irParaPosLogin(resultado.perfil);
        return;
      }
      setCodigo('');
      if (resultado.configuracaoMfa) {
        const resposta = await api.post<ConfiguracaoMfa>(
          '/auth/mfa/configurar',
        );
        setConfiguracao(resposta.dados);
        setEtapa('configurar');
      } else {
        setEtapa('mfa');
      }
    } catch (falha) {
      setErro(mensagemDeErro(falha));
    } finally {
      setEnviando(false);
    }
  }

  async function submeterMfa(evento: React.FormEvent) {
    evento.preventDefault();
    setErro('');
    setEnviando(true);
    try {
      if (etapa === 'configurar') {
        const resposta = await api.post<{
          perfil: Perfil;
          codigosRecuperacao: string[];
        }>('/auth/mfa/confirmar', { codigo });
        setCodigosRecuperacao(resposta.dados.codigosRecuperacao);
        setEtapa('codigos');
      } else {
        const resposta = await api.post<{ perfil: Perfil }>(
          '/auth/mfa/verificar',
          { codigo },
        );
        await recarregar();
        irParaPosLogin(resposta.dados.perfil);
      }
    } catch (falha) {
      setErro(mensagemDeErro(falha));
    } finally {
      setEnviando(false);
    }
  }

  async function continuarAposCodigos() {
    const atual = await recarregar();
    router.replace(atual?.senhaProvisoria ? '/trocar-senha' : '/painel');
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

          {etapa === 'credenciais' ? (
            <>
              <h2 className="text-xl font-semibold tracking-tight text-slate-900">
                Entrar
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Informe suas credenciais institucionais.
              </p>

              <form
                onSubmit={submeterCredenciais}
                className="mt-6 flex flex-col gap-4"
              >
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
                      aria-label={
                        mostrarSenha ? 'Ocultar senha' : 'Mostrar senha'
                      }
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
            </>
          ) : null}

          {etapa === 'mfa' ? (
            <>
              <h2 className="text-xl font-semibold tracking-tight text-slate-900">
                Verificação em duas etapas
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Informe o código de 6 dígitos do aplicativo autenticador ou um
                código de recuperação.
              </p>
              <form
                onSubmit={submeterMfa}
                className="mt-6 flex flex-col gap-4"
              >
                {erro ? <AlertaErro mensagem={erro} /> : null}
                <Campo rotulo="Código" htmlFor="mfa-codigo" obrigatorio>
                  <Entrada
                    id="mfa-codigo"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    autoFocus
                    required
                    maxLength={32}
                    value={codigo}
                    onChange={(evento) => setCodigo(evento.target.value)}
                  />
                </Campo>
                <Botao type="submit" disabled={enviando} className="w-full">
                  {enviando ? 'Verificando…' : 'Verificar e entrar'}
                </Botao>
                <Botao
                  variante="secundario"
                  onClick={() => {
                    setEtapa('credenciais');
                    setErro('');
                  }}
                >
                  Voltar
                </Botao>
              </form>
            </>
          ) : null}

          {etapa === 'configurar' && configuracao ? (
            <>
              <h2 className="text-xl font-semibold tracking-tight text-slate-900">
                Configure a verificação em duas etapas
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Escaneie o QR Code com Google Authenticator, Microsoft
                Authenticator ou outro aplicativo TOTP. A configuração é
                obrigatória para contas administrativas.
              </p>
              <form
                onSubmit={submeterMfa}
                className="mt-4 flex flex-col gap-4"
              >
                {erro ? <AlertaErro mensagem={erro} /> : null}
                <div className="flex flex-col items-center gap-2 rounded-lg border border-slate-200 p-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={configuracao.qrCodeDataUrl}
                    alt="QR Code para configurar o autenticador"
                    width={220}
                    height={220}
                  />
                  <p className="text-xs text-slate-500">
                    Ou informe a chave manualmente:
                  </p>
                  <code className="rounded bg-slate-100 px-2 py-1 text-xs text-slate-700">
                    {configuracao.segredo}
                  </code>
                </div>
                <Campo
                  rotulo="Código gerado pelo aplicativo"
                  htmlFor="mfa-config-codigo"
                  obrigatorio
                >
                  <Entrada
                    id="mfa-config-codigo"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    autoFocus
                    required
                    value={codigo}
                    onChange={(evento) => setCodigo(evento.target.value)}
                  />
                </Campo>
                <Botao type="submit" disabled={enviando} className="w-full">
                  {enviando ? 'Confirmando…' : 'Confirmar configuração'}
                </Botao>
              </form>
            </>
          ) : null}

          {etapa === 'codigos' ? (
            <>
              <h2 className="text-xl font-semibold tracking-tight text-slate-900">
                Guarde seus códigos de recuperação
              </h2>
              <div className="mt-3">
                <AlertaSucesso mensagem="MFA configurado com sucesso." />
              </div>
              <p className="mt-3 text-sm text-slate-600">
                Cada código pode ser usado uma única vez caso você perca o
                acesso ao aplicativo autenticador. Armazene-os em local seguro.
              </p>
              <ul className="mt-4 grid grid-cols-2 gap-2 rounded-lg border border-slate-200 p-3 font-mono text-sm text-slate-800">
                {codigosRecuperacao.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
              <Botao className="mt-4 w-full" onClick={continuarAposCodigos}>
                Continuar
              </Botao>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
