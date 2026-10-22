'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

import {
  AlertaErro,
  AlertaSucesso,
  Botao,
  CabecalhoCartao,
  CabecalhoPagina,
  Campo,
  Carregando,
  Cartao,
  Entrada,
} from '@/components/ui';
import { api, mensagemDeErro } from '@/lib/api';
import { useSessao } from '@/lib/session';

export default function PerfilPage() {
  const { perfil, carregando, recarregar } = useSessao();

  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [salvandoDados, setSalvandoDados] = useState(false);
  const [erroDados, setErroDados] = useState('');
  const [sucessoDados, setSucessoDados] = useState('');

  const [senhaAtual, setSenhaAtual] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmacao, setConfirmacao] = useState('');
  const [salvandoSenha, setSalvandoSenha] = useState(false);
  const [erroSenha, setErroSenha] = useState('');
  const [sucessoSenha, setSucessoSenha] = useState('');

  useEffect(() => {
    if (perfil) {
      setNome(perfil.nome);
      setEmail(perfil.email);
    }
  }, [perfil]);

  if (carregando) {
    return <Carregando texto="Carregando perfil…" />;
  }
  if (!perfil) {
    return <AlertaErro mensagem="Sessão não encontrada." />;
  }

  const dadosAlterados =
    nome.trim() !== perfil.nome || email.trim() !== perfil.email;
  const senhasConferem =
    novaSenha.length >= 8 && novaSenha === confirmacao;
  const podeAlterarSenha =
    !salvandoSenha &&
    senhaAtual.length > 0 &&
    senhasConferem &&
    novaSenha !== senhaAtual;

  async function salvarDados(evento: React.FormEvent) {
    evento.preventDefault();
    setErroDados('');
    setSucessoDados('');
    setSalvandoDados(true);
    try {
      await api.patch('/auth/me', { nome, email });
      await recarregar();
      setSucessoDados('Dados pessoais atualizados.');
    } catch (falha) {
      setErroDados(mensagemDeErro(falha));
    } finally {
      setSalvandoDados(false);
    }
  }

  async function alterarSenha(evento: React.FormEvent) {
    evento.preventDefault();
    setErroSenha('');
    setSucessoSenha('');
    if (novaSenha !== confirmacao) {
      setErroSenha('A confirmação não corresponde à nova senha.');
      return;
    }
    if (novaSenha === senhaAtual) {
      setErroSenha('A nova senha deve ser diferente da senha atual.');
      return;
    }
    setSalvandoSenha(true);
    try {
      await api.post('/auth/alterar-senha', { senhaAtual, novaSenha });
      setSenhaAtual('');
      setNovaSenha('');
      setConfirmacao('');
      setSucessoSenha('Senha alterada com sucesso.');
    } catch (falha) {
      setErroSenha(mensagemDeErro(falha));
    } finally {
      setSalvandoSenha(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <CabecalhoPagina
        titulo="Meu perfil"
        descricao="Atualize seus dados pessoais e a senha de acesso. Alterações são registradas na auditoria."
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Cartao>
          <CabecalhoCartao titulo="Dados pessoais" />
          <form onSubmit={salvarDados} className="flex flex-col gap-4 px-4 py-4">
            {erroDados ? <AlertaErro mensagem={erroDados} /> : null}
            {sucessoDados ? (
              <AlertaSucesso mensagem={sucessoDados} />
            ) : null}
            <Campo rotulo="Nome" htmlFor="perfil-nome" obrigatorio>
              <Entrada
                id="perfil-nome"
                required
                value={nome}
                onChange={(evento) => setNome(evento.target.value)}
              />
            </Campo>
            <Campo rotulo="E-mail" htmlFor="perfil-email" obrigatorio>
              <Entrada
                id="perfil-email"
                type="email"
                required
                value={email}
                onChange={(evento) => setEmail(evento.target.value)}
              />
            </Campo>
            <div className="text-sm text-tinta-500">
              <p>Cargo: {perfil.cargo?.nome ?? 'Não definido'}</p>
              <p>Papéis: {perfil.roles.join(', ') || 'Sem papel'}</p>
            </div>
            <div className="flex justify-end">
              <Botao
                type="submit"
                disabled={
                  salvandoDados ||
                  !nome.trim() ||
                  !email.trim() ||
                  !dadosAlterados
                }
              >
                {salvandoDados ? 'Salvando…' : 'Salvar dados'}
              </Botao>
            </div>
          </form>
        </Cartao>

        <Cartao>
          <CabecalhoCartao titulo="Alterar senha" />
          <form
            onSubmit={alterarSenha}
            className="flex flex-col gap-4 px-4 py-4"
          >
            {erroSenha ? <AlertaErro mensagem={erroSenha} /> : null}
            {sucessoSenha ? (
              <AlertaSucesso mensagem={sucessoSenha} />
            ) : null}
            <Campo
              rotulo="Senha atual"
              htmlFor="perfil-senha-atual"
              obrigatorio
            >
              <Entrada
                id="perfil-senha-atual"
                type="password"
                autoComplete="current-password"
                required
                value={senhaAtual}
                onChange={(evento) => setSenhaAtual(evento.target.value)}
              />
            </Campo>
            <Campo
              rotulo="Nova senha"
              htmlFor="perfil-nova-senha"
              obrigatorio
              dica="Mínimo de 8 caracteres."
            >
              <Entrada
                id="perfil-nova-senha"
                type="password"
                autoComplete="new-password"
                required
                value={novaSenha}
                onChange={(evento) => setNovaSenha(evento.target.value)}
              />
            </Campo>
            <Campo
              rotulo="Confirmar nova senha"
              htmlFor="perfil-confirmacao"
              obrigatorio
              erro={
                confirmacao.length > 0 && confirmacao !== novaSenha
                  ? 'As senhas não coincidem.'
                  : undefined
              }
            >
              <Entrada
                id="perfil-confirmacao"
                type="password"
                autoComplete="new-password"
                required
                value={confirmacao}
                onChange={(evento) => setConfirmacao(evento.target.value)}
              />
            </Campo>
            <div className="flex justify-end">
              <Botao type="submit" disabled={!podeAlterarSenha}>
                {salvandoSenha ? 'Salvando…' : 'Alterar senha'}
              </Botao>
            </div>
          </form>
        </Cartao>
      </div>

      <Cartao>
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-4">
          <div>
            <h2 className="font-semibold text-tinta-950">
              Segurança e sessões
            </h2>
            <p className="text-sm text-tinta-500">
              Consulte o status do MFA e revogue dispositivos com acesso ativo.
            </p>
          </div>
          <Link
            href="/perfil/seguranca"
            className="text-sm font-medium text-rota-800 hover:underline"
          >
            Abrir segurança
          </Link>
        </div>
      </Cartao>
    </div>
  );
}
