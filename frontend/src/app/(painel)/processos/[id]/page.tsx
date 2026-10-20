'use client';

import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

import {
  AlertaErro,
  AreaTexto,
  Botao,
  CabecalhoCartao,
  Campo,
  Carregando,
  Cartao,
  Entrada,
  Etiqueta,
  Modal,
  Selecao,
  cn,
} from '@/components/ui';
import { api, mensagemDeErro } from '@/lib/api';
import {
  ROTULOS_MOVIMENTACAO,
  ROTULOS_STATUS_ETAPA,
  ROTULOS_STATUS_PROCESSO,
  formatarData,
  formatarDataHora,
} from '@/lib/format';
import { useSessao } from '@/lib/session';
import type {
  ProcessoDetalhe,
  Setor,
  UsuarioAtribuivel,
} from '@/lib/tipos';

type ModalTipo =
  | 'concluirEtapa'
  | 'devolverEtapa'
  | 'atribuir'
  | 'suspender'
  | 'retomar'
  | 'editar'
  | 'anular'
  | 'revogar'
  | 'concluirProcesso';

const TOM_STATUS: Record<string, 'neutro' | 'info' | 'sucesso' | 'alerta' | 'perigo'> = {
  RASCUNHO: 'neutro',
  EM_ANDAMENTO: 'info',
  SUSPENSO: 'alerta',
  CONCLUIDO: 'sucesso',
  ANULADO: 'perigo',
  REVOGADO: 'perigo',
};

const TOM_ETAPA: Record<string, 'neutro' | 'info' | 'sucesso' | 'alerta'> = {
  PENDENTE: 'neutro',
  EM_ANDAMENTO: 'info',
  CONCLUIDA: 'sucesso',
  BLOQUEADA: 'alerta',
  PULADA: 'neutro',
};

/** Tempo decorrido na etapa: concluída usa a data de conclusão; aberta usa hoje. */
function duracaoEtapa(
  inicio: string | null,
  fim: string | null,
): string {
  if (!inicio) {
    return '—';
  }
  const inicioData = new Date(inicio);
  const fimData = fim ? new Date(fim) : new Date();
  const diferenca = fimData.getTime() - inicioData.getTime();
  if (Number.isNaN(diferenca) || diferenca < 0) {
    return '—';
  }
  const horas = diferenca / 3_600_000;
  if (horas < 24) {
    return `${Math.max(1, Math.round(horas))} h`;
  }
  return `${(horas / 24).toFixed(1)} d`;
}

export default function ProcessoDetalhePage() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);
  const { temPermissao } = useSessao();

  const [processo, setProcesso] = useState<ProcessoDetalhe | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const [processando, setProcessando] = useState(false);

  const [modal, setModal] = useState<ModalTipo | null>(null);
  const [etapaAlvo, setEtapaAlvo] = useState<number | null>(null);
  const [texto, setTexto] = useState('');
  const [paraEtapaId, setParaEtapaId] = useState('');
  const [setorId, setSetorId] = useState('');
  const [responsavelId, setResponsavelId] = useState('');
  const [setores, setSetores] = useState<Setor[]>([]);
  const [usuarios, setUsuarios] = useState<UsuarioAtribuivel[]>([]);
  const [objeto, setObjeto] = useState('');
  const [descricao, setDescricao] = useState('');

  const carregar = useCallback(async () => {
    setCarregando(true);
    setErro('');
    try {
      const resposta = await api.get<ProcessoDetalhe>(`/processos/${id}`);
      setProcesso(resposta.dados);
    } catch (falha) {
      setErro(mensagemDeErro(falha));
    } finally {
      setCarregando(false);
    }
  }, [id]);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  async function executar(acao: () => Promise<unknown>) {
    setProcessando(true);
    setErro('');
    try {
      await acao();
      setModal(null);
      await carregar();
    } catch (falha) {
      setErro(mensagemDeErro(falha));
    } finally {
      setProcessando(false);
    }
  }

  function abrir(novo: ModalTipo, etapa?: number) {
    setTexto('');
    setParaEtapaId('');
    setEtapaAlvo(etapa ?? null);
    setModal(novo);
  }

  function abrirAtribuir() {
    setSetorId(processo?.setorAtual ? String(processo.setorAtual.id) : '');
    setResponsavelId(
      processo?.responsavelAtual ? String(processo.responsavelAtual.id) : '',
    );
    setModal('atribuir');
    if (setores.length === 0) {
      api
        .get<Setor[]>('/setores?ativo=true&tamanhoPagina=100')
        .then((r) => setSetores(r.dados))
        .catch(() => setSetores([]));
    }
    if (usuarios.length === 0) {
      api
        .get<UsuarioAtribuivel[]>('/usuarios/atribuiveis')
        .then((r) => setUsuarios(r.dados))
        .catch(() => setUsuarios([]));
    }
  }

  function abrirEditar() {
    setObjeto(processo?.objeto ?? '');
    setDescricao(processo?.descricao ?? '');
    setModal('editar');
  }

  if (carregando) {
    return <Carregando />;
  }
  if (!processo) {
    return <AlertaErro mensagem={erro || 'Processo não encontrado.'} />;
  }

  const status = processo.status;
  const emAndamento = status === 'EM_ANDAMENTO';
  const terminal = ['CONCLUIDO', 'ANULADO', 'REVOGADO'].includes(status);
  const etapaAtual = processo.etapas.find(
    (etapa) => etapa.id === processo.etapaAtual?.id,
  );

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link
          href="/processos"
          className="inline-flex items-center gap-1 text-sm text-sky-800 hover:underline"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Voltar para processos
        </Link>
      </div>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-800">
            {processo.numero}
          </h1>
          <p className="max-w-2xl text-sm text-slate-600">{processo.objeto}</p>
          <div className="mt-2 flex items-center gap-2">
            <Etiqueta tom={TOM_STATUS[status] ?? 'neutro'}>
              {ROTULOS_STATUS_PROCESSO[status] ?? status}
            </Etiqueta>
            {processo.fluxo ? (
              <span className="text-xs text-slate-500">
                Fluxo: {processo.fluxo.nome} (v{processo.fluxo.versao})
              </span>
            ) : null}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {status === 'RASCUNHO' && temPermissao('processos.advance') ? (
            <Botao
              disabled={processando}
              onClick={() =>
                executar(() => api.post(`/processos/${id}/iniciar`))
              }
            >
              Iniciar
            </Botao>
          ) : null}
          {emAndamento && temPermissao('processos.suspend') ? (
            <Botao variante="secundario" onClick={() => abrir('suspender')}>
              Suspender
            </Botao>
          ) : null}
          {status === 'SUSPENSO' && temPermissao('processos.resume') ? (
            <Botao disabled={processando} onClick={() => abrir('retomar')}>
              Retomar
            </Botao>
          ) : null}
          {emAndamento && temPermissao('processos.conclude') ? (
            <Botao variante="secundario" onClick={() => abrir('concluirProcesso')}>
              Concluir processo
            </Botao>
          ) : null}
          {!terminal && temPermissao('processos.update') ? (
            <Botao variante="secundario" onClick={abrirEditar}>
              Editar dados
            </Botao>
          ) : null}
          {!terminal && temPermissao('processos.assign') ? (
            <Botao variante="secundario" onClick={abrirAtribuir}>
              Atribuir
            </Botao>
          ) : null}
          {!terminal && temPermissao('processos.cancel') ? (
            <>
              <Botao variante="secundario" onClick={() => abrir('anular')}>
                Anular
              </Botao>
              {emAndamento || status === 'SUSPENSO' ? (
                <Botao variante="perigo" onClick={() => abrir('revogar')}>
                  Revogar
                </Botao>
              ) : null}
            </>
          ) : null}
        </div>
      </div>

      {erro ? <AlertaErro mensagem={erro} /> : null}

      <div className="grid gap-4 lg:grid-cols-3">
        <Cartao className="lg:col-span-2">
          <CabecalhoCartao titulo="Etapas" />
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-2">#</th>
                  <th className="px-4 py-2">Etapa</th>
                  <th className="px-4 py-2">Situação</th>
                  <th className="px-4 py-2">Responsável / setor</th>
                  <th className="px-4 py-2">Prazo</th>
                  <th className="px-4 py-2">Duração</th>
                  <th className="px-4 py-2" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {processo.etapas.map((etapa) => (
                  <tr
                    key={etapa.id}
                    className={cn(
                      'hover:bg-slate-50',
                      etapa.id === etapaAtual?.id && 'bg-sky-50/60',
                    )}
                  >
                    <td className="px-4 py-3 text-slate-500">{etapa.sequencia}</td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-800">{etapa.nome}</p>
                      {etapa.faseNome ? (
                        <p className="text-xs text-slate-500">{etapa.faseNome}</p>
                      ) : null}
                    </td>
                    <td className="px-4 py-3">
                      <Etiqueta tom={TOM_ETAPA[etapa.status] ?? 'neutro'}>
                        {ROTULOS_STATUS_ETAPA[etapa.status] ?? etapa.status}
                      </Etiqueta>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      <p>{etapa.responsavel?.nome ?? '—'}</p>
                      <p className="text-xs text-slate-500">
                        {etapa.setor?.nome ?? '—'}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {formatarData(etapa.dataPrevista)}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {duracaoEtapa(etapa.dataInicio, etapa.dataConclusao)}
                    </td>
                    <td className="px-4 py-3">
                      {etapa.status === 'EM_ANDAMENTO' ? (
                        <div className="flex justify-end gap-2">
                          {temPermissao('processos.return') ? (
                            <Botao
                              variante="secundario"
                              onClick={() => abrir('devolverEtapa', etapa.id)}
                            >
                              Devolver
                            </Botao>
                          ) : null}
                          {temPermissao('processos.advance') ? (
                            <Botao
                              onClick={() => abrir('concluirEtapa', etapa.id)}
                            >
                              Concluir
                            </Botao>
                          ) : null}
                        </div>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Cartao>

        <Cartao>
          <CabecalhoCartao titulo="Resumo" />
          <dl className="flex flex-col gap-3 px-4 py-4 text-sm">
            <div>
              <dt className="text-slate-500">Tipo</dt>
              <dd className="text-slate-800">
                {processo.tipoProcesso?.nome ?? '—'}
              </dd>
            </div>
            <div>
              <dt className="text-slate-500">Setor atual</dt>
              <dd className="text-slate-800">{processo.setorAtual?.nome ?? '—'}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Responsável atual</dt>
              <dd className="text-slate-800">
                {processo.responsavelAtual?.nome ?? '—'}
              </dd>
            </div>
            <div>
              <dt className="text-slate-500">Iniciado em</dt>
              <dd className="text-slate-800">
                {formatarDataHora(processo.iniciadoEm)}
              </dd>
            </div>
            <div>
              <dt className="text-slate-500">Finalizado em</dt>
              <dd className="text-slate-800">
                {formatarDataHora(processo.finalizadoEm)}
              </dd>
            </div>
          </dl>
        </Cartao>
      </div>

      <Cartao>
        <CabecalhoCartao titulo="Histórico de movimentações" />
        {processo.movimentacoes.length === 0 ? (
          <p className="px-4 py-4 text-sm text-slate-500">
            Nenhuma movimentação registrada.
          </p>
        ) : (
          <ol className="divide-y divide-slate-100">
            {processo.movimentacoes.map((mov) => (
              <li key={mov.id} className="px-4 py-3 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-medium text-slate-800">
                    {ROTULOS_MOVIMENTACAO[mov.tipo] ?? mov.tipo}
                  </span>
                  <span className="text-xs text-slate-500">
                    {formatarDataHora(mov.criadoEm)}
                  </span>
                </div>
                {mov.descricao ? (
                  <p className="text-slate-600">{mov.descricao}</p>
                ) : null}
                <p className="text-xs text-slate-500">
                  {mov.usuario?.nome ?? 'Sistema'}
                  {mov.setor ? ` · ${mov.setor.nome}` : ''}
                </p>
              </li>
            ))}
          </ol>
        )}
      </Cartao>

      <Modal
        aberto={modal === 'concluirEtapa'}
        titulo="Concluir etapa"
        aoFechar={() => setModal(null)}
        rodape={
          <>
            <Botao variante="secundario" onClick={() => setModal(null)}>
              Cancelar
            </Botao>
            <Botao
              disabled={processando}
              onClick={() =>
                executar(() =>
                  api.post(
                    `/processos/${id}/etapas/${etapaAlvo}/concluir`,
                    texto ? { parecer: texto } : {},
                  ),
                )
              }
            >
              Confirmar conclusão
            </Botao>
          </>
        }
      >
        <Campo rotulo="Parecer (opcional)" htmlFor="parecer">
          <AreaTexto
            id="parecer"
            value={texto}
            onChange={(evento) => setTexto(evento.target.value)}
          />
        </Campo>
      </Modal>

      <Modal
        aberto={modal === 'devolverEtapa'}
        titulo="Devolver etapa"
        aoFechar={() => setModal(null)}
        rodape={
          <>
            <Botao variante="secundario" onClick={() => setModal(null)}>
              Cancelar
            </Botao>
            <Botao
              variante="perigo"
              disabled={processando || texto.trim().length < 3}
              onClick={() =>
                executar(() =>
                  api.post(`/processos/${id}/etapas/${etapaAlvo}/devolver`, {
                    motivo: texto,
                    paraEtapaId: paraEtapaId
                      ? Number(paraEtapaId)
                      : undefined,
                  }),
                )
              }
            >
              Devolver
            </Botao>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <Campo rotulo="Motivo" htmlFor="motivo" obrigatorio>
            <AreaTexto
              id="motivo"
              value={texto}
              onChange={(evento) => setTexto(evento.target.value)}
            />
          </Campo>
          <Campo
            rotulo="Etapa de destino (opcional)"
            htmlFor="destino"
            dica="Se vazio, retorna à etapa concluída imediatamente anterior."
          >
            <Selecao
              id="destino"
              value={paraEtapaId}
              onChange={(evento) => setParaEtapaId(evento.target.value)}
            >
              <option value="">Anterior concluída</option>
              {processo.etapas
                .filter(
                  (etapa) =>
                    etapa.status === 'CONCLUIDA' &&
                    (processo.etapas.find((e) => e.id === etapaAlvo)
                      ?.sequencia ?? 0) > etapa.sequencia,
                )
                .map((etapa) => (
                  <option key={etapa.id} value={etapa.id}>
                    {etapa.sequencia}. {etapa.nome}
                  </option>
                ))}
            </Selecao>
          </Campo>
        </div>
      </Modal>

      <Modal
        aberto={modal === 'atribuir'}
        titulo="Atribuir responsável"
        aoFechar={() => setModal(null)}
        rodape={
          <>
            <Botao variante="secundario" onClick={() => setModal(null)}>
              Cancelar
            </Botao>
            <Botao
              disabled={processando}
              onClick={() =>
                executar(() =>
                  api.post(`/processos/${id}/atribuir`, {
                    setorAtualId: setorId ? Number(setorId) : null,
                    responsavelAtualId: responsavelId
                      ? Number(responsavelId)
                      : null,
                  }),
                )
              }
            >
              Salvar
            </Botao>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <Campo rotulo="Setor" htmlFor="setor">
            <Selecao
              id="setor"
              value={setorId}
              onChange={(evento) => setSetorId(evento.target.value)}
            >
              <option value="">Manter atual</option>
              {setores.map((setor) => (
                <option key={setor.id} value={setor.id}>
                  {setor.nome}
                </option>
              ))}
            </Selecao>
          </Campo>
          <Campo rotulo="Responsável" htmlFor="responsavel">
            <Selecao
              id="responsavel"
              value={responsavelId}
              onChange={(evento) => setResponsavelId(evento.target.value)}
            >
              <option value="">Manter atual</option>
              {usuarios.map((usuario) => (
                <option key={usuario.id} value={usuario.id}>
                  {usuario.nome}
                </option>
              ))}
            </Selecao>
          </Campo>
        </div>
      </Modal>

      <Modal
        aberto={modal === 'retomar'}
        titulo="Retomar processo"
        aoFechar={() => setModal(null)}
        rodape={
          <>
            <Botao variante="secundario" onClick={() => setModal(null)}>
              Cancelar
            </Botao>
            <Botao
              disabled={processando}
              onClick={() =>
                executar(() => api.post(`/processos/${id}/retomar`))
              }
            >
              Retomar
            </Botao>
          </>
        }
      >
        <p className="text-sm text-slate-600">
          O processo voltará ao status <strong>Em andamento</strong> e a etapa
          atual será reaberta para continuidade. Deseja continuar?
        </p>
      </Modal>

      <Modal
        aberto={modal === 'editar'}
        titulo="Editar dados do processo"
        aoFechar={() => setModal(null)}
        rodape={
          <>
            <Botao variante="secundario" onClick={() => setModal(null)}>
              Cancelar
            </Botao>
            <Botao
              disabled={processando || objeto.trim().length === 0}
              onClick={() =>
                executar(() =>
                  api.patch(`/processos/${id}`, {
                    objeto,
                    descricao: descricao.trim() ? descricao : null,
                  }),
                )
              }
            >
              Salvar
            </Botao>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <Campo rotulo="Objeto" htmlFor="objeto" obrigatorio>
            <Entrada
              id="objeto"
              value={objeto}
              onChange={(evento) => setObjeto(evento.target.value)}
            />
          </Campo>
          <Campo rotulo="Descrição" htmlFor="descricao">
            <AreaTexto
              id="descricao"
              value={descricao}
              onChange={(evento) => setDescricao(evento.target.value)}
            />
          </Campo>
          <p className="text-xs text-slate-500">
            A alteração é registrada na auditoria. Processos encerrados não
            podem ser editados.
          </p>
        </div>
      </Modal>

      <Modal
        aberto={
          modal === 'suspender' ||
          modal === 'anular' ||
          modal === 'revogar' ||
          modal === 'concluirProcesso'
        }
        titulo="Informar justificativa"
        aoFechar={() => setModal(null)}
        rodape={
          <>
            <Botao variante="secundario" onClick={() => setModal(null)}>
              Cancelar
            </Botao>
            <Botao
              variante={
                modal === 'anular' || modal === 'revogar' ? 'perigo' : 'primario'
              }
              disabled={processando || texto.trim().length < 5}
              onClick={() => {
                const destino =
                  modal === 'suspender'
                    ? 'suspender'
                    : modal === 'anular'
                      ? 'anular'
                      : modal === 'revogar'
                        ? 'revogar'
                        : 'concluir';
                return executar(() =>
                  api.post(`/processos/${id}/${destino}`, {
                    justificativa: texto,
                  }),
                );
              }}
            >
              Confirmar
            </Botao>
          </>
        }
      >
        <Campo rotulo="Justificativa" htmlFor="justificativa" obrigatorio>
          <AreaTexto
            id="justificativa"
            value={texto}
            onChange={(evento) => setTexto(evento.target.value)}
          />
        </Campo>
      </Modal>
    </div>
  );
}
