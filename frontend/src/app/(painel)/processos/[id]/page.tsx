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
  ProcessoEtapa,
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
  | 'concluirProcesso'
  | 'bloquearEtapa'
  | 'desbloquearEtapa'
  | 'pularEtapa'
  | 'prazoEtapa';

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
  if (horas < 1) {
    return `${Math.max(1, Math.round(horas * 60))} min`;
  }
  if (horas < 24) {
    return `${Math.round(horas)} h`;
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
  const [etapaAtribuir, setEtapaAtribuir] = useState<number | null>(null);
  const [texto, setTexto] = useState('');
  const [paraEtapaId, setParaEtapaId] = useState('');
  const [setorId, setSetorId] = useState('');
  const [responsavelId, setResponsavelId] = useState('');
  const [responsavelEtapaId, setResponsavelEtapaId] = useState('');
  const [prazoDias, setPrazoDias] = useState('');
  const [setores, setSetores] = useState<Setor[]>([]);
  const [usuarios, setUsuarios] = useState<UsuarioAtribuivel[]>([]);
  const [nome, setNome] = useState('');
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

  async function executar(
    acao: () => Promise<unknown>,
    aoConcluir?: () => void,
  ) {
    setProcessando(true);
    setErro('');
    try {
      await acao();
      setModal(null);
      aoConcluir?.();
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

  function carregarUsuarios() {
    if (usuarios.length > 0) {
      return;
    }
    api
      .get<UsuarioAtribuivel[]>('/usuarios/atribuiveis')
      .then((r) => setUsuarios(r.dados))
      .catch(() => setUsuarios([]));
  }

  function carregarSetores() {
    if (setores.length > 0) {
      return;
    }
    api
      .get<Setor[]>('/setores?ativo=true&tamanhoPagina=100')
      .then((r) => setSetores(r.dados))
      .catch(() => setSetores([]));
  }

  function abrirAtribuir() {
    setSetorId(processo?.setorAtual ? String(processo.setorAtual.id) : '');
    setResponsavelId(
      processo?.responsavelAtual ? String(processo.responsavelAtual.id) : '',
    );
    setModal('atribuir');
    carregarSetores();
    carregarUsuarios();
  }

  function abrirAtribuirEtapa(etapa: ProcessoEtapa) {
    setEtapaAtribuir(etapa.id);
    setResponsavelEtapaId(
      etapa.responsavel ? String(etapa.responsavel.id) : '',
    );
    carregarUsuarios();
  }

  function abrirPrazo(etapa: ProcessoEtapa) {
    setEtapaAlvo(etapa.id);
    setPrazoDias(
      etapa.prazoGestaoDias !== null ? String(etapa.prazoGestaoDias) : '',
    );
    setModal('prazoEtapa');
  }

  function abrirEditar() {
    setNome(processo?.nome ?? '');
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
  const etapaEmAtribuicao = processo.etapas.find(
    (etapa) => etapa.id === etapaAtribuir,
  );
  const usuarioEtapaSelecionado = usuarios.find(
    (item) => String(item.id) === responsavelEtapaId,
  );
  const setorPrincipalEtapa = usuarioEtapaSelecionado
    ? (usuarioEtapaSelecionado.setorPrincipalId ??
      usuarioEtapaSelecionado.setores.find((setor) => setor.principal)?.id ??
      usuarioEtapaSelecionado.setores[0]?.id ??
      null)
    : null;
  const nomeSetorPrincipalEtapa = setorPrincipalEtapa
    ? (usuarioEtapaSelecionado?.setores.find(
        (setor) => setor.id === setorPrincipalEtapa,
      )?.nome ??
      setores.find((setor) => setor.id === setorPrincipalEtapa)?.nome ??
      '—')
    : '—';

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link
          href="/processos"
          className="inline-flex items-center gap-1 text-sm text-rota-800 hover:underline"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Voltar para processos
        </Link>
      </div>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <span
            className="mb-2 block h-1 w-9 rounded-full bg-sinal-500"
            aria-hidden="true"
          />
          <h1 className="text-[1.65rem] font-semibold leading-tight tracking-[-0.02em] text-tinta-950">
            {processo.nome || processo.numero}
          </h1>
          <p className="text-sm leading-relaxed text-tinta-600">
            Nº {processo.numero}
          </p>
          <p className="max-w-2xl text-sm leading-relaxed text-tinta-600">
            {processo.objeto}
          </p>
          <div className="mt-2 flex items-center gap-2">
            <Etiqueta tom={TOM_STATUS[status] ?? 'neutro'}>
              {ROTULOS_STATUS_PROCESSO[status] ?? status}
            </Etiqueta>
            {processo.fluxo ? (
              <span className="text-xs text-tinta-500">
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
              Atribuir ao processo
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
          <ol className="divide-y divide-papel-100">
            {processo.etapas.map((etapa) => {
              const ehAtual = etapa.id === etapaAtual?.id;
              const podeConcluir =
                ehAtual &&
                etapa.status === 'EM_ANDAMENTO' &&
                temPermissao('processos.advance');
              const temAnteriorConcluida = processo.etapas.some(
                (anterior) =>
                  anterior.sequencia < etapa.sequencia &&
                  anterior.status === 'CONCLUIDA',
              );
              const podeDevolver =
                ehAtual &&
                etapa.status === 'EM_ANDAMENTO' &&
                temPermissao('processos.return') &&
                temAnteriorConcluida;
              const podeAtribuirEtapa =
                !terminal &&
                temPermissao('processos.assign') &&
                !['CONCLUIDA', 'PULADA'].includes(etapa.status);
              const podeEditarPrazo =
                !terminal &&
                temPermissao('processos.update') &&
                !['CONCLUIDA', 'PULADA'].includes(etapa.status);
              const podeBloquear =
                emAndamento &&
                ehAtual &&
                etapa.status === 'EM_ANDAMENTO' &&
                temPermissao('processos.block');
              const podeDesbloquear =
                emAndamento &&
                ehAtual &&
                etapa.status === 'BLOQUEADA' &&
                temPermissao('processos.unblock');
              const podePular =
                emAndamento &&
                temPermissao('processos.skip') &&
                ['PENDENTE', 'EM_ANDAMENTO'].includes(etapa.status) &&
                (etapa.status !== 'EM_ANDAMENTO' || ehAtual) &&
                (!etapa.obrigatoria || etapa.permitePulo);
              const retorno = etapa.retornoParaEtapaId
                ? processo.etapas.find(
                    (item) => item.id === etapa.retornoParaEtapaId,
                  )
                : null;

              return (
                <li
                  key={etapa.id}
                  className={cn('px-4 py-3', ehAtual && 'bg-rota-50/60')}
                >
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-papel-100 text-xs font-semibold text-tinta-600">
                          {etapa.sequencia}
                        </span>
                        <p className="font-medium text-tinta-800">
                          {etapa.nome}
                        </p>
                        <Etiqueta tom={TOM_ETAPA[etapa.status] ?? 'neutro'}>
                          {ROTULOS_STATUS_ETAPA[etapa.status] ?? etapa.status}
                        </Etiqueta>
                      </div>
                      {etapa.faseNome ? (
                        <p className="mt-0.5 text-xs text-tinta-500">
                          {etapa.faseNome}
                        </p>
                      ) : null}
                      <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-tinta-500">
                        <span>
                          Responsável:{' '}
                          <strong className="font-medium text-tinta-700">
                            {etapa.responsavel?.nome ?? '—'}
                          </strong>
                        </span>
                        <span>Setor: {etapa.setor?.nome ?? '—'}</span>
                        <span>
                          Prazo: {formatarData(etapa.dataPrevista)}
                          {etapa.prazoGestaoDias !== null
                            ? ` (${etapa.prazoGestaoDias} dia${
                                etapa.prazoGestaoDias === 1 ? '' : 's'
                              })`
                            : ''}
                        </span>
                        <span>
                          Duração desde o início:{' '}
                          {duracaoEtapa(
                            etapa.dataInicio,
                            etapa.dataConclusao ?? etapa.puladaEm,
                          )}
                        </span>
                      </div>
                      {retorno ? (
                        <p className="mt-1 text-xs text-rota-800">
                          Após concluir, o processo retorna para a etapa{' '}
                          {retorno.sequencia}. {retorno.nome}.
                        </p>
                      ) : null}
                      {etapa.condicional && etapa.condicaoAplicabilidade ? (
                        <p className="mt-1 text-xs text-tinta-500">
                          Condição de aplicabilidade:{' '}
                          {etapa.condicaoAplicabilidade}
                        </p>
                      ) : null}
                      {etapa.status === 'BLOQUEADA' && etapa.motivoBloqueio ? (
                        <p className="mt-1 text-xs text-amber-800">
                          Motivo do bloqueio: {etapa.motivoBloqueio}
                        </p>
                      ) : null}
                      {etapa.status === 'PULADA' ? (
                        <p className="mt-1 text-xs text-tinta-600">
                          Pulada em {formatarDataHora(etapa.puladaEm)}
                          {etapa.motivoPulo
                            ? ` — ${etapa.motivoPulo}`
                            : ''}
                        </p>
                      ) : null}
                    </div>
                    <div className="flex flex-wrap gap-2 lg:justify-end">
                      {podeAtribuirEtapa ? (
                        <Botao
                          variante="secundario"
                          onClick={() => abrirAtribuirEtapa(etapa)}
                        >
                          Atribuir etapa
                        </Botao>
                      ) : null}
                      {podeEditarPrazo ? (
                        <Botao
                          variante="secundario"
                          onClick={() => abrirPrazo(etapa)}
                        >
                          Prazo
                        </Botao>
                      ) : null}
                      {podeDevolver ? (
                        <Botao
                          variante="secundario"
                          onClick={() => abrir('devolverEtapa', etapa.id)}
                        >
                          Devolver
                        </Botao>
                      ) : null}
                      {podeBloquear ? (
                        <Botao
                          variante="secundario"
                          onClick={() => abrir('bloquearEtapa', etapa.id)}
                        >
                          Bloquear
                        </Botao>
                      ) : null}
                      {podeDesbloquear ? (
                        <Botao
                          variante="secundario"
                          onClick={() => abrir('desbloquearEtapa', etapa.id)}
                        >
                          Desbloquear
                        </Botao>
                      ) : null}
                      {podePular ? (
                        <Botao
                          variante="secundario"
                          onClick={() => abrir('pularEtapa', etapa.id)}
                        >
                          Pular etapa
                        </Botao>
                      ) : null}
                      {podeConcluir ? (
                        <Botao
                          onClick={() => abrir('concluirEtapa', etapa.id)}
                        >
                          Concluir
                        </Botao>
                      ) : null}
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
        </Cartao>

        <Cartao>
          <CabecalhoCartao titulo="Resumo" />
          <dl className="flex flex-col gap-3 px-4 py-4 text-sm">
            <div>
              <dt className="text-tinta-500">Tipo</dt>
              <dd className="text-tinta-800">
                {processo.tipoProcesso?.nome ?? '—'}
              </dd>
            </div>
            <div>
              <dt className="text-tinta-500">Responsável do processo</dt>
              <dd className="text-tinta-800">
                {processo.responsavelAtual?.nome ?? '—'}
              </dd>
            </div>
            <div>
              <dt className="text-tinta-500">Setor responsável do processo</dt>
              <dd className="text-tinta-800">
                {processo.setorAtual?.nome ?? '—'}
              </dd>
            </div>
            <div>
              <dt className="text-tinta-500">Etapa atual</dt>
              <dd className="text-tinta-800">
                {processo.etapaAtual?.nome ?? '—'}
              </dd>
            </div>
            <div>
              <dt className="text-tinta-500">
                Responsável da etapa atual
              </dt>
              <dd className="text-tinta-800">
                {etapaAtual?.responsavel?.nome ?? '—'}
              </dd>
            </div>
            <div>
              <dt className="text-tinta-500">Setor da etapa atual</dt>
              <dd className="text-tinta-800">
                {etapaAtual?.setor?.nome ?? '—'}
              </dd>
            </div>
            <div>
              <dt className="text-tinta-500">Prazo da etapa atual</dt>
              <dd className="text-tinta-800">
                {formatarData(etapaAtual?.dataPrevista ?? null)}
                {etapaAtual?.prazoGestaoDias
                  ? ` (${etapaAtual.prazoGestaoDias} dias)`
                  : ''}
              </dd>
            </div>
            <div>
              <dt className="text-tinta-500">Iniciado em</dt>
              <dd className="text-tinta-800">
                {formatarDataHora(processo.iniciadoEm)}
              </dd>
            </div>
            <div>
              <dt className="text-tinta-500">Finalizado em</dt>
              <dd className="text-tinta-800">
                {formatarDataHora(processo.finalizadoEm)}
              </dd>
            </div>
          </dl>
        </Cartao>
      </div>

      <Cartao>
        <CabecalhoCartao titulo="Histórico de movimentações" />
        {processo.movimentacoes.length === 0 ? (
          <p className="px-4 py-4 text-sm text-tinta-500">
            Nenhuma movimentação registrada.
          </p>
        ) : (
          <ol className="divide-y divide-papel-100">
            {processo.movimentacoes.map((mov) => (
              <li key={mov.id} className="px-4 py-3 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-medium text-tinta-800">
                    {ROTULOS_MOVIMENTACAO[mov.tipo] ?? mov.tipo}
                  </span>
                  <span className="text-xs text-tinta-500">
                    {formatarDataHora(mov.criadoEm)}
                  </span>
                </div>
                {mov.descricao ? (
                  <p className="text-tinta-600">{mov.descricao}</p>
                ) : null}
                <p className="text-xs text-tinta-500">
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
          <p className="text-sm text-tinta-600">
            Ao concluir novamente a etapa de destino, o processo retornará
            diretamente para a etapa que fez a devolução, sem refazer as etapas
            intermediárias. Você pode escolher qualquer etapa já concluída.
          </p>
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
        aberto={modal === 'prazoEtapa'}
        titulo={
          etapaAlvo
            ? `Prazo da etapa — ${
                processo?.etapas.find((etapa) => etapa.id === etapaAlvo)?.nome ??
                ''
              }`
            : 'Prazo da etapa'
        }
        aoFechar={() => setModal(null)}
        rodape={
          <>
            <Botao variante="secundario" onClick={() => setModal(null)}>
              Cancelar
            </Botao>
            <Botao
              disabled={
                processando ||
                (prazoDias.trim() !== '' && Number(prazoDias) < 1)
              }
              onClick={() =>
                executar(() =>
                  api.patch(`/processos/${id}/etapas/${etapaAlvo}/prazo`, {
                    prazoGestaoDias: prazoDias.trim()
                      ? Number(prazoDias)
                      : null,
                  }),
                )
              }
            >
              Salvar prazo
            </Botao>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <p className="text-sm text-tinta-600">
            O prazo é copiado do fluxo na criação do processo, mas pode ser
            ajustado apenas para esta etapa.
          </p>
          <Campo
            rotulo="Prazo interno (dias)"
            htmlFor="prazo-dias"
            dica="Deixe em branco para remover o prazo desta etapa."
          >
            <Entrada
              id="prazo-dias"
              type="number"
              min={1}
              value={prazoDias}
              onChange={(evento) => setPrazoDias(evento.target.value)}
            />
          </Campo>
        </div>
      </Modal>

      <Modal
        aberto={modal === 'bloquearEtapa'}
        titulo={
          etapaAlvo
            ? `Bloquear etapa — ${
                processo?.etapas.find((etapa) => etapa.id === etapaAlvo)?.nome ??
                ''
              }`
            : 'Bloquear etapa'
        }
        aoFechar={() => setModal(null)}
        rodape={
          <>
            <Botao variante="secundario" onClick={() => setModal(null)}>
              Cancelar
            </Botao>
            <Botao
              variante="perigo"
              disabled={processando || texto.trim().length < 5}
              onClick={() =>
                executar(() =>
                  api.post(
                    `/processos/${id}/etapas/${etapaAlvo}/bloquear`,
                    { motivo: texto.trim() },
                  ),
                )
              }
            >
              Bloquear
            </Botao>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <p className="text-sm text-tinta-600">
            O bloqueio interrompe a etapa atual. Informe o motivo; a ação será
            registrada no histórico e na auditoria.
          </p>
          <Campo rotulo="Motivo do bloqueio" htmlFor="motivo-bloqueio" obrigatorio>
            <AreaTexto
              id="motivo-bloqueio"
              value={texto}
              onChange={(evento) => setTexto(evento.target.value)}
            />
          </Campo>
        </div>
      </Modal>

      <Modal
        aberto={modal === 'desbloquearEtapa'}
        titulo={
          etapaAlvo
            ? `Desbloquear etapa — ${
                processo?.etapas.find((etapa) => etapa.id === etapaAlvo)?.nome ??
                ''
              }`
            : 'Desbloquear etapa'
        }
        aoFechar={() => setModal(null)}
        rodape={
          <>
            <Botao variante="secundario" onClick={() => setModal(null)}>
              Cancelar
            </Botao>
            <Botao
              disabled={processando || texto.trim().length < 5}
              onClick={() =>
                executar(() =>
                  api.post(
                    `/processos/${id}/etapas/${etapaAlvo}/desbloquear`,
                    { justificativa: texto.trim() },
                  ),
                )
              }
            >
              Desbloquear
            </Botao>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <p className="text-sm text-tinta-600">
            A etapa voltará ao andamento. Informe a justificativa para o
            desbloqueio.
          </p>
          <Campo rotulo="Justificativa" htmlFor="justificativa-desbloqueio" obrigatorio>
            <AreaTexto
              id="justificativa-desbloqueio"
              value={texto}
              onChange={(evento) => setTexto(evento.target.value)}
            />
          </Campo>
        </div>
      </Modal>

      <Modal
        aberto={modal === 'pularEtapa'}
        titulo={
          etapaAlvo
            ? `Pular etapa — ${
                processo?.etapas.find((etapa) => etapa.id === etapaAlvo)?.nome ??
                ''
              }`
            : 'Pular etapa'
        }
        aoFechar={() => setModal(null)}
        rodape={
          <>
            <Botao variante="secundario" onClick={() => setModal(null)}>
              Cancelar
            </Botao>
            <Botao
              variante="perigo"
              disabled={processando || texto.trim().length < 5}
              onClick={() =>
                executar(() =>
                  api.post(`/processos/${id}/etapas/${etapaAlvo}/pular`, {
                    justificativa: texto.trim(),
                  }),
                )
              }
            >
              Pular etapa
            </Botao>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <p className="text-sm text-tinta-600">
            A etapa será registrada como pulada. Se for a etapa atual, o
            processo avança para a próxima etapa não finalizada. A justificativa
            é obrigatória e ficará no histórico.
          </p>
          <Campo rotulo="Justificativa do pulo" htmlFor="justificativa-pulo" obrigatorio>
            <AreaTexto
              id="justificativa-pulo"
              value={texto}
              onChange={(evento) => setTexto(evento.target.value)}
            />
          </Campo>
        </div>
      </Modal>

      <Modal
        aberto={modal === 'atribuir'}
        titulo="Atribuir responsável ao processo"
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
          <p className="text-sm text-tinta-600">
            A alteração vale apenas para o processo e não modifica o responsável
            das etapas. O setor do processo é independente do usuário escolhido.
          </p>
          <Campo rotulo="Setor do processo" htmlFor="setor">
            <Selecao
              id="setor"
              value={setorId}
              onChange={(evento) => setSetorId(evento.target.value)}
            >
              <option value="">Sem setor definido</option>
              {setores.map((setor) => (
                <option key={setor.id} value={setor.id}>
                  {setor.nome}
                </option>
              ))}
            </Selecao>
          </Campo>
          <Campo rotulo="Responsável do processo" htmlFor="responsavel">
            <Selecao
              id="responsavel"
              value={responsavelId}
              onChange={(evento) => setResponsavelId(evento.target.value)}
            >
              <option value="">Sem responsável definido</option>
              {usuarios.map((usuario) => (
                <option key={usuario.id} value={usuario.id}>
                  {usuario.nome}
                  {usuario.setores.length > 0
                    ? ` (${usuario.setores
                        .map((setor) => setor.nome)
                        .join(', ')})`
                    : ''}
                </option>
              ))}
            </Selecao>
          </Campo>
        </div>
      </Modal>

      <Modal
        aberto={etapaAtribuir !== null}
        titulo={
          etapaEmAtribuicao
            ? `Atribuir responsável — ${etapaEmAtribuicao.nome}`
            : 'Atribuir responsável à etapa'
        }
        aoFechar={() => setEtapaAtribuir(null)}
        rodape={
          <>
            <Botao
              variante="secundario"
              onClick={() => setEtapaAtribuir(null)}
            >
              Cancelar
            </Botao>
            <Botao
              disabled={processando}
              onClick={() =>
                executar(
                  () =>
                    api.post(
                      `/processos/${id}/etapas/${etapaAtribuir}/atribuir`,
                      {
                        responsavelId: responsavelEtapaId
                          ? Number(responsavelEtapaId)
                          : null,
                      },
                    ),
                  () => setEtapaAtribuir(null),
                )
              }
            >
              Salvar
            </Botao>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <p className="text-sm text-tinta-600">
            A atribuição vale apenas para esta etapa e não altera as demais
            etapas nem o responsável do processo. O setor da etapa acompanha
            automaticamente o setor principal do novo responsável.
          </p>
          <Campo
            rotulo="Responsável da etapa"
            htmlFor="responsavel-etapa"
            dica="Ao trocar o responsável, o setor da etapa passa a ser o setor principal dele."
          >
            <Selecao
              id="responsavel-etapa"
              value={responsavelEtapaId}
              onChange={(evento) =>
                setResponsavelEtapaId(evento.target.value)
              }
            >
              <option value="">Sem responsável</option>
              {usuarios.map((usuario) => (
                <option key={usuario.id} value={usuario.id}>
                  {usuario.nome}
                  {usuario.cargo ? ` — ${usuario.cargo}` : ''}
                  {usuario.setores.length > 0
                    ? ` (${usuario.setores
                        .map((setor) => setor.nome)
                        .join(', ')})`
                    : ''}
                </option>
              ))}
            </Selecao>
          </Campo>
          <div className="rounded-md border border-linha-200 bg-papel-50 px-3 py-2 text-sm">
            <p className="text-xs font-medium uppercase tracking-wide text-tinta-500">
              Setor da etapa após a atribuição
            </p>
            <p className="mt-0.5 text-tinta-800">
              {responsavelEtapaId ? nomeSetorPrincipalEtapa : 'Sem setor definido'}
            </p>
          </div>
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
        <p className="text-sm text-tinta-600">
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
              disabled={
                processando ||
                nome.trim().length === 0 ||
                objeto.trim().length === 0
              }
              onClick={() =>
                executar(() =>
                  api.patch(`/processos/${id}`, {
                    nome,
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
          <Campo rotulo="Nome do processo" htmlFor="nome" obrigatorio>
            <Entrada
              id="nome"
              value={nome}
              onChange={(evento) => setNome(evento.target.value)}
            />
          </Campo>
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
          <p className="text-xs text-tinta-500">
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
