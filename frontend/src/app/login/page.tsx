'use client';

import { ArrowRight, Eye, EyeOff, KeyRound } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { MarcaTramitaY } from '@/components/brand';
import {
  AlertaErro,
  AlertaSucesso,
  Botao,
  Campo,
  Entrada,
} from '@/components/ui';
import { ApiError, api, mensagemDeErro } from '@/lib/api';
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

  useEffect(() => {
    const parametros = new URLSearchParams(window.location.search);
    if (parametros.get('motivo') === 'sessao-expirada') {
      setErro('Sua sessão foi encerrada. Entre novamente para continuar.');
      window.history.replaceState({}, '', '/login');
    }
  }, []);

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

  function encerrarDesafioMfa(mensagem: string) {
    setEtapa('credenciais');
    setCodigo('');
    setSenha('');
    setConfiguracao(null);
    setCodigosRecuperacao([]);
    setErro(mensagem);
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
      if (
        falha instanceof ApiError &&
        falha.codigo === 'MFA_DESAFIO_ENCERRADO'
      ) {
        encerrarDesafioMfa(falha.message);
        return;
      }
      setErro(mensagemDeErro(falha));
    } finally {
      setEnviando(false);
    }
  }

  async function continuarAposCodigos() {
    const atual = await recarregar();
    router.replace(atual?.senhaProvisoria ? '/trocar-senha' : '/painel');
  }

  const tituloEtapa: Record<Etapa, string> = {
    credenciais: 'Entrar na plataforma',
    mfa: 'Confirme sua identidade',
    configurar: 'Ative a verificação em duas etapas',
    codigos: 'Guarde seus códigos',
  };

  return (
    <div className="min-h-dvh overflow-x-hidden bg-papel-50 lg:grid lg:h-dvh lg:min-h-0 lg:grid-cols-[minmax(0,1.05fr)_minmax(28rem,0.95fr)] lg:overflow-hidden">
      <aside className="relative hidden overflow-hidden bg-tinta-950 p-10 text-white lg:flex lg:flex-col xl:p-14">
        <div className="fundo-malha absolute inset-0 opacity-70" aria-hidden="true" />
        <svg
          className="absolute -bottom-24 -right-16 h-[34rem] w-[34rem] text-rota-700/50"
          viewBox="0 0 400 400"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M18 332C82 332 92 214 158 214C224 214 236 102 304 102H386"
            stroke="currentColor"
            strokeWidth="1.5"
          />
          <path
            d="M18 358C96 358 108 262 174 262C240 262 254 150 322 150H386"
            stroke="currentColor"
            strokeWidth="1"
            strokeDasharray="4 7"
          />
          <circle cx="158" cy="214" r="7" fill="#dc7a22" />
          <circle cx="304" cy="102" r="5" fill="#47a092" />
        </svg>

        <div className="relative z-10">
          <MarcaTramitaY />
        </div>

        <div className="relative z-10 my-auto max-w-lg py-10 xl:py-14">
          <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-rota-100">
            <span className="h-1.5 w-1.5 rounded-full bg-sinal-400" aria-hidden="true" />
            Gestão pública em movimento
          </p>
          <h1 className="max-w-md text-[2.65rem] font-semibold leading-[1.05] tracking-[-0.035em] text-white xl:text-[3.15rem]">
            O processo inteiro,
            <span className="block text-sinal-300">no mesmo trilho.</span>
          </h1>
          <p className="mt-5 max-w-md text-[0.98rem] leading-relaxed text-rota-100/90">
            Acompanhe etapas, responsáveis e prazos com a rastreabilidade que a
            rotina de licitações exige.
          </p>

          <ol className="mt-10 space-y-4 border-l border-white/15 pl-6">
            {[
              ['01', 'Fluxo visível', 'Cada etapa, prazo e responsável no lugar certo.'],
              ['02', 'Acesso controlado', 'Permissões explícitas por papel e por setor.'],
              ['03', 'Trilha auditável', 'Movimentações registradas para consulta e supervisão.'],
            ].map(([numero, titulo, texto]) => (
              <li key={numero} className="relative">
                <span
                  className="absolute -left-[1.93rem] top-1 flex h-4 w-4 items-center justify-center rounded-full border border-sinal-400 bg-tinta-950"
                  aria-hidden="true"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-sinal-400" />
                </span>
                <p className="text-sm font-semibold text-white">
                  <span className="mr-2 font-mono text-[0.65rem] font-normal text-rota-300">
                    {numero}
                  </span>
                  {titulo}
                </p>
                <p className="mt-0.5 text-sm leading-relaxed text-rota-100/75">
                  {texto}
                </p>
              </li>
            ))}
          </ol>
        </div>

      </aside>

      <main className="flex min-h-dvh flex-col justify-center px-5 py-8 sm:px-10 lg:min-h-0 lg:px-14 lg:py-10">
        <div className="mx-auto w-full max-w-md">
          <div className="mb-7 lg:hidden">
            <MarcaTramitaY tema="claro" />
          </div>

          <div className="mb-7">
            <p className="text-[0.67rem] font-semibold uppercase tracking-[0.16em] text-rota-700">
              TramitaY · Acesso institucional
            </p>
            <h2 className="mt-2 text-[1.8rem] font-semibold tracking-[-0.025em] text-tinta-950">
              {tituloEtapa[etapa]}
            </h2>
            <p className="mt-1.5 text-sm leading-relaxed text-tinta-600">
              {etapa === 'credenciais'
                ? 'Informe suas credenciais para continuar.'
                : etapa === 'mfa'
                  ? 'Use o código do aplicativo autenticador ou um código de recuperação.'
                  : etapa === 'configurar'
                    ? 'Escaneie o QR Code e confirme o código gerado pelo aplicativo.'
                    : 'Armazene os códigos em local seguro antes de continuar.'}
            </p>
          </div>

          {etapa === 'credenciais' ? (
            <>
              <form
                onSubmit={submeterCredenciais}
                className="flex flex-col gap-4"
              >
                {erro ? <AlertaErro mensagem={erro} /> : null}
                <Campo rotulo="E-mail institucional" htmlFor="email" obrigatorio>
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
                      className="pr-11"
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
                      className="absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-r-lg text-tinta-500 transition-colors hover:text-tinta-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rota-600"
                    >
                      {mostrarSenha ? (
                        <EyeOff className="h-4 w-4" aria-hidden="true" />
                      ) : (
                        <Eye className="h-4 w-4" aria-hidden="true" />
                      )}
                    </button>
                  </div>
                </Campo>
                <Botao type="submit" disabled={enviando} className="mt-1 w-full">
                  {enviando ? 'Entrando…' : 'Entrar'}
                  {!enviando ? (
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  ) : null}
                </Botao>
              </form>

              <div className="mt-7 flex items-start gap-2.5 rounded-xl border border-linha-200 bg-white px-3.5 py-3">
                <KeyRound
                  className="mt-0.5 h-4 w-4 shrink-0 text-tinta-500"
                  aria-hidden="true"
                />
                <p className="text-xs leading-relaxed text-tinta-600">
                  Problemas de acesso? Procure o administrador do sistema para
                  desbloquear a conta ou redefinir a senha.
                </p>
              </div>
            </>
          ) : null}

          {etapa === 'mfa' ? (
            <form onSubmit={submeterMfa} className="flex flex-col gap-4">
              {erro ? <AlertaErro mensagem={erro} /> : null}
              <Campo
                rotulo="Código de verificação"
                htmlFor="mfa-codigo"
                obrigatorio
                dica="Aceita de 4 a 8 dígitos do aplicativo ou um código de recuperação."
              >
                <Entrada
                  id="mfa-codigo"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  autoFocus
                  required
                  maxLength={16}
                  className="tabular text-center text-lg tracking-[0.3em]"
                  value={codigo}
                  onChange={(evento) => setCodigo(evento.target.value)}
                />
              </Campo>
              <Botao type="submit" disabled={enviando} className="w-full">
                {enviando ? 'Verificando…' : 'Verificar e entrar'}
              </Botao>
              <Botao
                variante="sutil"
                onClick={() => {
                  setEtapa('credenciais');
                  setErro('');
                  setCodigo('');
                }}
              >
                Voltar ao login
              </Botao>
            </form>
          ) : null}

          {etapa === 'configurar' && configuracao ? (
            <form onSubmit={submeterMfa} className="flex flex-col gap-4">
              {erro ? <AlertaErro mensagem={erro} /> : null}
              <div className="flex flex-col items-center gap-3 rounded-2xl border border-linha-200 bg-white p-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={configuracao.qrCodeDataUrl}
                  alt="QR Code para configurar o autenticador"
                  width={210}
                  height={210}
                  className="rounded-lg"
                />
                <p className="text-xs text-tinta-600">Ou informe a chave manualmente:</p>
                <code className="max-w-full break-all rounded-lg bg-papel-100 px-2.5 py-1.5 font-mono text-xs text-tinta-800">
                  {configuracao.segredo}
                </code>
              </div>
              <Campo
                rotulo="Código gerado pelo aplicativo"
                htmlFor="mfa-config-codigo"
                obrigatorio
                dica="Digite de 4 a 8 dígitos, conforme o aplicativo autenticador."
              >
                <Entrada
                  id="mfa-config-codigo"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  autoFocus
                  required
                  maxLength={8}
                  className="tabular text-center text-lg tracking-[0.3em]"
                  value={codigo}
                  onChange={(evento) => setCodigo(evento.target.value)}
                />
              </Campo>
              <Botao type="submit" disabled={enviando} className="w-full">
                {enviando ? 'Confirmando…' : 'Confirmar configuração'}
              </Botao>
            </form>
          ) : null}

          {etapa === 'codigos' ? (
            <>
              <AlertaSucesso mensagem="Verificação em duas etapas ativada." />
              <p className="mt-4 text-sm leading-relaxed text-tinta-600">
                Cada código pode ser usado uma única vez caso você perca o acesso
                ao aplicativo autenticador.
              </p>
              <ul className="mt-4 grid grid-cols-2 gap-2 rounded-2xl border border-linha-200 bg-white p-4 font-mono text-sm text-tinta-900">
                {codigosRecuperacao.map((item) => (
                  <li key={item} className="tabular">
                    {item}
                  </li>
                ))}
              </ul>
              <Botao className="mt-5 w-full" onClick={continuarAposCodigos}>
                Já guardei os códigos
              </Botao>
            </>
          ) : null}

          <p className="mt-7 border-t border-linha-200 pt-4 text-[0.68rem] leading-relaxed text-tinta-500">
            Acesso restrito a servidores autorizados. Todas as operações são
            registradas para auditoria.
          </p>
        </div>
      </main>
    </div>
  );
}
