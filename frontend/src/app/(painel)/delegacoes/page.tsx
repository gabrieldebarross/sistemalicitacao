'use client';

import { Plus } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

import {
  AlertaErro,
  Botao,
  CabecalhoPagina,
  Campo,
  Carregando,
  Cartao,
  Entrada,
  Etiqueta,
  EstadoVazio,
  Modal,
  Selecao,
} from '@/components/ui';
import { api, mensagemDeErro, type Paginacao } from '@/lib/api';
import { formatarDataHora } from '@/lib/format';
import { useSessao } from '@/lib/session';
import type {
  Delegacao,
  ProcessoResumo,
  UsuarioAtribuivel,
} from '@/lib/tipos';

function valorLocal(data: Date): string {
  const ajustada = new Date(data.getTime() - data.getTimezoneOffset() * 60_000);
  return ajustada.toISOString().slice(0, 16);
}

export default function DelegacoesPage() {
  const { perfil } = useSessao();
  const [delegacoes, setDelegacoes] = useState<Delegacao[]>([]);
  const [usuarios, setUsuarios] = useState<UsuarioAtribuivel[]>([]);
  const [processos, setProcessos] = useState<ProcessoResumo[]>([]);
  const [paginacao, setPaginacao] = useState<Paginacao | null>(null);
  const [pagina, setPagina] = useState(1);
  const [historico, setHistorico] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const [modalAberto, setModalAberto] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [erroForm, setErroForm] = useState('');
  const [destinoId, setDestinoId] = useState('');
  const [processoId, setProcessoId] = useState('');
  const [inicioEm, setInicioEm] = useState('');
  const [fimEm, setFimEm] = useState('');
  const [motivo, setMotivo] = useState('');
  const [cancelando, setCancelando] = useState<number | null>(null);

  const carregar = useCallback(async () => {
    setCarregando(true);
    setErro('');
    const params = new URLSearchParams({
      pagina: String(pagina),
      tamanhoPagina: '15',
      incluirHistorico: String(historico),
    });
    try {
      const resposta = await api.get<Delegacao[]>(
        `/delegacoes?${params.toString()}`,
      );
      setDelegacoes(resposta.dados);
      setPaginacao(resposta.paginacao ?? null);
    } catch (falha) {
      setErro(mensagemDeErro(falha));
    } finally {
      setCarregando(false);
    }
  }, [pagina, historico]);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  useEffect(() => {
    api
      .get<UsuarioAtribuivel[]>('/usuarios/atribuiveis')
      .then((resposta) => setUsuarios(resposta.dados))
      .catch(() => setUsuarios([]));
    api
      .get<ProcessoResumo[]>('/processos?tamanhoPagina=100')
      .then((resposta) => setProcessos(resposta.dados))
      .catch(() => setProcessos([]));
  }, []);

  function abrirNova() {
    const agora = new Date();
    const fim = new Date(agora.getTime() + 7 * 86_400_000);
    setDestinoId('');
    setProcessoId('');
    setInicioEm(valorLocal(agora));
    setFimEm(valorLocal(fim));
    setMotivo('');
    setErroForm('');
    setModalAberto(true);
  }

  async function criar(evento: React.FormEvent) {
    evento.preventDefault();
    setSalvando(true);
    setErroForm('');
    try {
      await api.post('/delegacoes', {
        destinoUsuarioId: Number(destinoId),
        processoId: processoId ? Number(processoId) : null,
        inicioEm: new Date(inicioEm).toISOString(),
        fimEm: new Date(fimEm).toISOString(),
        motivo,
      });
      setModalAberto(false);
      setPagina(1);
      await carregar();
    } catch (falha) {
      setErroForm(mensagemDeErro(falha));
    } finally {
      setSalvando(false);
    }
  }

  async function cancelar(delegacao: Delegacao) {
    setCancelando(delegacao.id);
    setErro('');
    try {
      await api.del(`/delegacoes/${delegacao.id}`);
      await carregar();
    } catch (falha) {
      setErro(mensagemDeErro(falha));
    } finally {
      setCancelando(null);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <CabecalhoPagina
        titulo="Delegações temporárias"
        descricao="Compartilhe suas tarefas com outro usuário por um período determinado. A delegação não altera o responsável original da etapa."
        acao={
          <Botao onClick={abrirNova}>
            <Plus className="h-4 w-4" aria-hidden="true" />
            Nova delegação
          </Botao>
        }
      />

      <Cartao>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-4 py-3">
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <Entrada
              type="checkbox"
              className="h-4 w-4"
              checked={historico}
              onChange={(evento) => {
                setHistorico(evento.target.checked);
                setPagina(1);
              }}
            />
            Incluir histórico (encerradas e canceladas)
          </label>
          {perfil ? (
            <span className="text-xs text-slate-500">
              Origem das novas delegações: {perfil.nome}
            </span>
          ) : null}
        </div>

        {erro ? (
          <div className="px-4 py-4">
            <AlertaErro mensagem={erro} />
          </div>
        ) : carregando ? (
          <Carregando texto="Carregando delegações…" />
        ) : delegacoes.length === 0 ? (
          <EstadoVazio
            titulo="Nenhuma delegação"
            descricao="Você não possui delegações com os filtros atuais."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-2">Destino</th>
                  <th className="px-4 py-2">Processo</th>
                  <th className="px-4 py-2">Período</th>
                  <th className="px-4 py-2">Motivo</th>
                  <th className="px-4 py-2">Situação</th>
                  <th className="px-4 py-2 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {delegacoes.map((delegacao) => (
                  <tr key={delegacao.id}>
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-800">
                        {delegacao.destino?.nome ?? '—'}
                      </p>
                      <p className="text-xs text-slate-500">
                        De {delegacao.origem?.nome ?? '—'}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {delegacao.processo
                        ? `${delegacao.processo.numero} — ${delegacao.processo.nome}`
                        : 'Todas as tarefas'}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {formatarDataHora(delegacao.inicioEm)}
                      <br />
                      até {formatarDataHora(delegacao.fimEm)}
                    </td>
                    <td className="max-w-xs px-4 py-3 text-slate-600">
                      {delegacao.motivo}
                    </td>
                    <td className="px-4 py-3">
                      {delegacao.canceladoEm ? (
                        <Etiqueta tom="neutro">Cancelada</Etiqueta>
                      ) : delegacao.ativa ? (
                        <Etiqueta tom="sucesso">Ativa</Etiqueta>
                      ) : new Date(delegacao.fimEm) <= new Date() ? (
                        <Etiqueta tom="neutro">Encerrada</Etiqueta>
                      ) : (
                        <Etiqueta tom="info">Agendada</Etiqueta>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {!delegacao.canceladoEm &&
                      new Date(delegacao.fimEm) > new Date() ? (
                        <Botao
                          variante="secundario"
                          disabled={cancelando === delegacao.id}
                          onClick={() => cancelar(delegacao)}
                        >
                          {cancelando === delegacao.id
                            ? 'Cancelando…'
                            : 'Cancelar'}
                        </Botao>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {paginacao && paginacao.totalPaginas > 1 ? (
          <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3 text-sm">
            <span className="text-slate-500">
              Página {paginacao.pagina} de {paginacao.totalPaginas} (
              {paginacao.total} itens)
            </span>
            <div className="flex gap-2">
              <Botao
                variante="secundario"
                disabled={paginacao.pagina <= 1}
                onClick={() => setPagina((valor) => Math.max(1, valor - 1))}
              >
                Anterior
              </Botao>
              <Botao
                variante="secundario"
                disabled={paginacao.pagina >= paginacao.totalPaginas}
                onClick={() => setPagina((valor) => valor + 1)}
              >
                Próxima
              </Botao>
            </div>
          </div>
        ) : null}
      </Cartao>

      <Modal
        aberto={modalAberto}
        titulo="Nova delegação"
        aoFechar={() => setModalAberto(false)}
        rodape={
          <>
            <Botao
              variante="secundario"
              onClick={() => setModalAberto(false)}
            >
              Cancelar
            </Botao>
            <Botao
              type="submit"
              form="form-delegacao"
              disabled={
                salvando ||
                !destinoId ||
                !inicioEm ||
                !fimEm ||
                motivo.trim().length < 5
              }
            >
              {salvando ? 'Salvando…' : 'Criar delegação'}
            </Botao>
          </>
        }
      >
        <form
          id="form-delegacao"
          onSubmit={criar}
          className="flex flex-col gap-4"
        >
          {erroForm ? <AlertaErro mensagem={erroForm} /> : null}
          <Campo rotulo="Usuário de destino" htmlFor="delegacao-destino" obrigatorio>
            <Selecao
              id="delegacao-destino"
              value={destinoId}
              onChange={(evento) => setDestinoId(evento.target.value)}
            >
              <option value="">Selecione um usuário</option>
              {usuarios
                .filter((usuario) => usuario.id !== perfil?.id)
                .map((usuario) => (
                  <option key={usuario.id} value={usuario.id}>
                    {usuario.nome}
                  </option>
                ))}
            </Selecao>
          </Campo>
          <Campo
            rotulo="Processo"
            htmlFor="delegacao-processo"
            dica="Deixe em branco para delegar todas as suas tarefas no período."
          >
            <Selecao
              id="delegacao-processo"
              value={processoId}
              onChange={(evento) => setProcessoId(evento.target.value)}
            >
              <option value="">Todas as tarefas</option>
              {processos.map((processo) => (
                <option key={processo.id} value={processo.id}>
                  {processo.numero} — {processo.nome}
                </option>
              ))}
            </Selecao>
          </Campo>
          <div className="grid gap-4 sm:grid-cols-2">
            <Campo rotulo="Início" htmlFor="delegacao-inicio" obrigatorio>
              <Entrada
                id="delegacao-inicio"
                type="datetime-local"
                value={inicioEm}
                onChange={(evento) => setInicioEm(evento.target.value)}
              />
            </Campo>
            <Campo rotulo="Fim" htmlFor="delegacao-fim" obrigatorio>
              <Entrada
                id="delegacao-fim"
                type="datetime-local"
                value={fimEm}
                onChange={(evento) => setFimEm(evento.target.value)}
              />
            </Campo>
          </div>
          <Campo rotulo="Motivo" htmlFor="delegacao-motivo" obrigatorio>
            <Entrada
              id="delegacao-motivo"
              value={motivo}
              maxLength={500}
              onChange={(evento) => setMotivo(evento.target.value)}
            />
          </Campo>
        </form>
      </Modal>
    </div>
  );
}
