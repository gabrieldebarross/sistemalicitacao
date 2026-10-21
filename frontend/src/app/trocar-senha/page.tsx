'use client';

import { KeyRound, LogOut, ShieldCheck } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import {
  AlertaErro,
  Botao,
  Campo,
  Carregando,
  Entrada,
} from '@/components/ui';
import { api, mensagemDeErro } from '@/lib/api';
import { useSessao } from '@/lib/session';

export default function TrocarSenhaPage() {
  const { perfil, carregando, sair, recarregar } = useSessao();
  const router = useRouter();
  const [senhaAtual, setSenhaAtual] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmacao, setConfirmacao] = useState('');
  const [erro, setErro] = useState('');
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    if (carregando) {
      return;
    }
    if (!perfil) {
      router.replace('/login');
    } else if (!perfil.senhaProvisoria) {
      router.replace('/painel');
    }
  }, [carregando, perfil, router]);

  if (carregando || !perfil) {
    return <Carregando texto="Carregando sessão…" />;
  }

  if (!perfil.senhaProvisoria) {
    return <Carregando texto="Redirecionando…" />;
  }

  const senhasConferem =
    novaSenha.length >= 12 && novaSenha === confirmacao;
  const podeEnviar =
    !enviando && senhaAtual.length > 0 && senhasConferem;

  async function submeter(evento: React.FormEvent) {
    evento.preventDefault();
    setErro('');
    if (novaSenha !== confirmacao) {
      setErro('A confirmação não corresponde à nova senha.');
      return;
    }
    if (novaSenha === senhaAtual) {
      setErro('A nova senha deve ser diferente da senha provisória.');
      return;
    }
    setEnviando(true);
    try {
      await api.post('/auth/alterar-senha', { senhaAtual, novaSenha });
      await recarregar();
      router.replace('/painel');
    } catch (falha) {
      setErro(mensagemDeErro(falha));
    } finally {
      setEnviando(false);
    }
  }

  async function aoSair() {
    await sair();
    router.replace('/login');
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 p-4">
      <div className="w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
        <header className="flex items-center gap-3 border-b border-slate-200 bg-slate-50 px-6 py-5">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-sky-700 text-white">
            <ShieldCheck className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <h1 className="text-base font-semibold text-slate-900">
              Gestão de Licitações
            </h1>
            <p className="text-xs text-slate-500">
              Definição de nova senha
            </p>
          </div>
        </header>

        <div className="px-6 py-5">
          <div className="mb-4 flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm text-amber-800">
            <KeyRound className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <p>
              Sua senha é provisória. Defina uma nova senha para acessar o
              sistema.
            </p>
          </div>

          <form onSubmit={submeter} className="flex flex-col gap-4">
            {erro ? <AlertaErro mensagem={erro} /> : null}
            <Campo rotulo="Senha provisória" htmlFor="senha-atual" obrigatorio>
              <Entrada
                id="senha-atual"
                type="password"
                autoComplete="current-password"
                required
                value={senhaAtual}
                onChange={(evento) => setSenhaAtual(evento.target.value)}
              />
            </Campo>
            <Campo
              rotulo="Nova senha"
              htmlFor="nova-senha"
              obrigatorio
              dica="Mínimo de 12 caracteres."
            >
              <Entrada
                id="nova-senha"
                type="password"
                autoComplete="new-password"
                required
                value={novaSenha}
                onChange={(evento) => setNovaSenha(evento.target.value)}
              />
            </Campo>
            <Campo
              rotulo="Confirmar nova senha"
              htmlFor="confirmacao"
              obrigatorio
              erro={
                confirmacao.length > 0 && confirmacao !== novaSenha
                  ? 'As senhas não coincidem.'
                  : undefined
              }
            >
              <Entrada
                id="confirmacao"
                type="password"
                autoComplete="new-password"
                required
                value={confirmacao}
                onChange={(evento) => setConfirmacao(evento.target.value)}
              />
            </Campo>
            <Botao type="submit" disabled={!podeEnviar} className="w-full">
              {enviando ? 'Salvando…' : 'Salvar nova senha'}
            </Botao>
          </form>

          <div className="mt-4 flex justify-center">
            <button
              type="button"
              onClick={aoSair}
              className="inline-flex items-center gap-2 text-xs text-slate-500 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600"
            >
              <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
              Sair desta conta
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
