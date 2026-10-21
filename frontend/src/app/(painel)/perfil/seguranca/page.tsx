'use client';

import { KeyRound, Monitor, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';

import {
  AlertaErro,
  AlertaSucesso,
  Botao,
  CabecalhoPagina,
  Carregando,
  Cartao,
  Etiqueta,
  EstadoVazio,
} from '@/components/ui';
import { api, mensagemDeErro } from '@/lib/api';
import { formatarDataHora } from '@/lib/format';
import { useSessao } from '@/lib/session';
import type { SessaoUsuario } from '@/lib/tipos';

function descreverDispositivo(userAgent: string | null): string {
  if (!userAgent) {
    return 'Dispositivo não identificado';
  }
  if (/mobile|android|iphone|ipad/i.test(userAgent)) {
    return 'Dispositivo móvel';
  }
  if (/firefox/i.test(userAgent)) {
    return 'Firefox';
  }
  if (/edg\//i.test(userAgent)) {
    return 'Microsoft Edge';
  }
  if (/chrome/i.test(userAgent)) {
    return 'Google Chrome';
  }
  if (/safari/i.test(userAgent)) {
    return 'Safari';
  }
  return userAgent.slice(0, 80);
}

export default function SegurancaPage() {
  const { perfil, recarregar } = useSessao();
  const [sessoes, setSessoes] = useState<SessaoUsuario[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');
  const [revogando, setRevogando] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    setCarregando(true);
    setErro('');
    try {
      const resposta = await api.get<SessaoUsuario[]>('/auth/sessoes');
      setSessoes(resposta.dados);
    } catch (falha) {
      setErro(mensagemDeErro(falha));
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  async function revogar(sessao: SessaoUsuario) {
    setRevogando(sessao.id);
    setErro('');
    setSucesso('');
    try {
      await api.del(`/auth/sessoes/${sessao.id}`);
      if (sessao.atual) {
        await recarregar();
        window.location.assign('/login');
        return;
      }
      setSucesso('Sessão revogada.');
      await carregar();
    } catch (falha) {
      setErro(mensagemDeErro(falha));
    } finally {
      setRevogando(null);
    }
  }

  async function revogarOutras() {
    const outras = sessoes.filter((sessao) => !sessao.atual);
    if (outras.length === 0) {
      return;
    }
    setRevogando('todas');
    setErro('');
    setSucesso('');
    try {
      for (const sessao of outras) {
        await api.del(`/auth/sessoes/${sessao.id}`);
      }
      setSucesso('As outras sessões foram encerradas.');
      await carregar();
    } catch (falha) {
      setErro(mensagemDeErro(falha));
    } finally {
      setRevogando(null);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <CabecalhoPagina
        titulo="Segurança da conta"
        descricao="Gerencie a verificação em duas etapas e os dispositivos com sessões ativas."
      />

      {erro ? <AlertaErro mensagem={erro} /> : null}
      {sucesso ? <AlertaSucesso mensagem={sucesso} /> : null}

      <div className="grid gap-6 lg:grid-cols-[1fr_1.5fr]">
        <Cartao>
          <div className="flex items-start gap-3 px-4 py-4">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-sky-50 text-sky-800">
              <ShieldCheck className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <h2 className="font-semibold text-slate-900">
                Verificação em duas etapas
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                {perfil?.mfaAtivo
                  ? 'O MFA está ativo nesta conta. O acesso exige um código do aplicativo autenticador ou um código de recuperação.'
                  : 'O MFA ainda não está configurado. Contas administrativas precisam configurá-lo no próximo acesso.'}
              </p>
              <div className="mt-3">
                {perfil?.mfaAtivo ? (
                  <Etiqueta tom="sucesso">Ativo</Etiqueta>
                ) : (
                  <Etiqueta tom="alerta">Não configurado</Etiqueta>
                )}
              </div>
            </div>
          </div>
          <div className="border-t border-slate-100 px-4 py-3 text-sm text-slate-600">
            <p className="flex items-center gap-2">
              <KeyRound className="h-4 w-4" aria-hidden="true" />
              Guarde seus códigos de recuperação em local seguro.
            </p>
            <p className="mt-2 text-xs text-slate-500">
              Se você perder o acesso ao autenticador, utilize um código de
              recuperação. Se os códigos também forem perdidos, solicite a
              redefinição de MFA a outro administrador.
            </p>
          </div>
          <div className="border-t border-slate-100 px-4 py-3">
            <Link
              href="/perfil"
              className="text-sm font-medium text-sky-800 hover:underline"
            >
              Alterar senha
            </Link>
          </div>
        </Cartao>

        <Cartao>
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 px-4 py-3">
            <div>
              <h2 className="font-semibold text-slate-900">Sessões ativas</h2>
              <p className="text-xs text-slate-500">
                Dispositivos que possuem acesso válido à sua conta.
              </p>
            </div>
            <Botao
              variante="secundario"
              disabled={revogando !== null || sessoes.every((item) => item.atual)}
              onClick={revogarOutras}
            >
              {revogando === 'todas'
                ? 'Encerrando…'
                : 'Encerrar outras sessões'}
            </Botao>
          </div>

          {carregando ? (
            <Carregando texto="Carregando sessões…" />
          ) : sessoes.length === 0 ? (
            <EstadoVazio
              titulo="Nenhuma sessão ativa"
              descricao="Não há sessões ativas para esta conta."
            />
          ) : (
            <ul className="divide-y divide-slate-100">
              {sessoes.map((sessao) => (
                <li
                  key={sessao.id}
                  className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="flex items-center gap-2 text-sm font-medium text-slate-800">
                      <Monitor className="h-4 w-4" aria-hidden="true" />
                      {descreverDispositivo(sessao.userAgent)}
                      {sessao.atual ? (
                        <Etiqueta tom="info">Sessão atual</Etiqueta>
                      ) : null}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      IP {sessao.ip ?? 'não identificado'} · Início{' '}
                      {formatarDataHora(sessao.criadaEm)} · Último uso{' '}
                      {formatarDataHora(sessao.ultimoUsoEm)} · Expira{' '}
                      {formatarDataHora(sessao.expiraEm)}
                    </p>
                  </div>
                  <Botao
                    variante="secundario"
                    disabled={revogando !== null}
                    onClick={() => revogar(sessao)}
                  >
                    {revogando === sessao.id ? 'Revogando…' : 'Revogar'}
                  </Botao>
                </li>
              ))}
            </ul>
          )}
        </Cartao>
      </div>
    </div>
  );
}
