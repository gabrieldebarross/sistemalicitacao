'use client';

import { ArrowLeft, Copy, Plus, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
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
} from '@/components/ui';
import { api, mensagemDeErro, TAMANHO_PAGINA_MAX } from '@/lib/api';
import { ROTULOS_SITUACAO_FLUXO } from '@/lib/format';
import { useSessao } from '@/lib/session';
import type {
  Cargo,
  EtapaFluxo,
  FluxoDetalhe,
  Setor,
  UsuarioAtribuivel,
} from '@/lib/tipos';

const TOM_SITUACAO: Record<string, 'neutro' | 'sucesso' | 'alerta'> = {
  RASCUNHO: 'neutro',
  PUBLICADO: 'sucesso',
  ARQUIVADO: 'alerta',
};

interface FormFase {
  id: number | null;
  nome: string;
  ordem: string;
  descricao: string;
}

interface FormEtapa {
  id: number | null;
  faseId: number;
  nome: string;
  ordem: string;
  prazoGestaoDias: string;
  obrigatoria: boolean;
  responsavelSetorId: string;
  responsavelCargoId: string;
  responsavelUsuarioId: string;
  descricao: string;
  requisitos: string;
  referenciaLegal: string;
  condicional: boolean;
  condicaoAplicabilidade: string;
  permitePulo: boolean;
}

const FORM_ETAPA_VAZIO = (faseId: number): FormEtapa => ({
  id: null,
  faseId,
  nome: '',
  ordem: '',
  prazoGestaoDias: '',
  obrigatoria: true,
  responsavelSetorId: '',
  responsavelCargoId: '',
  responsavelUsuarioId: '',
  descricao: '',
  requisitos: '',
  referenciaLegal: '',
  condicional: false,
  condicaoAplicabilidade: '',
  permitePulo: false,
});

export default function FluxoDetalhePage() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);
  const router = useRouter();
  const { temPermissao } = useSessao();

  const [fluxo, setFluxo] = useState<FluxoDetalhe | null>(null);
  const [setores, setSetores] = useState<Setor[]>([]);
  const [cargos, setCargos] = useState<Cargo[]>([]);
  const [usuarios, setUsuarios] = useState<UsuarioAtribuivel[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const [processando, setProcessando] = useState(false);
  const [confirmacao, setConfirmacao] = useState<'clonar' | 'arquivar' | null>(
    null,
  );

  const [formFase, setFormFase] = useState<FormFase | null>(null);
  const [formEtapa, setFormEtapa] = useState<FormEtapa | null>(null);
  const [ediFluxo, setEdiFluxo] = useState(false);
  const [fluxoNome, setFluxoNome] = useState('');
  const [fluxoDescricao, setFluxoDescricao] = useState('');

  const podeEditar = temPermissao('fluxos.update') && fluxo?.situacao === 'RASCUNHO';
  const podeClonar = temPermissao('fluxos.clone');
  const podeAtribuir = temPermissao('fluxos.assign');
  const podeArquivar =
    temPermissao('fluxos.archive') && fluxo?.situacao !== 'ARQUIVADO';

  const carregar = useCallback(async () => {
    setCarregando(true);
    setErro('');
    try {
      const resposta = await api.get<FluxoDetalhe>(`/fluxos/${id}`);
      setFluxo(resposta.dados);
    } catch (falha) {
      setErro(mensagemDeErro(falha));
    } finally {
      setCarregando(false);
    }
  }, [id]);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  useEffect(() => {
    api
      .get<Setor[]>(`/setores?ativo=true&tamanhoPagina=${TAMANHO_PAGINA_MAX}`)
      .then((r) => setSetores(r.dados))
      .catch(() => setSetores([]));
    api
      .get<Cargo[]>(`/cargos?tamanhoPagina=${TAMANHO_PAGINA_MAX}`)
      .then((r) => setCargos(r.dados))
      .catch(() => setCargos([]));
    api
      .get<UsuarioAtribuivel[]>('/usuarios/atribuiveis')
      .then((r) => setUsuarios(r.dados))
      .catch(() => setUsuarios([]));
  }, []);

  async function executar(acao: () => Promise<unknown>) {
    setProcessando(true);
    setErro('');
    try {
      await acao();
      setFormFase(null);
      setFormEtapa(null);
      setEdiFluxo(false);
      await carregar();
    } catch (falha) {
      setErro(mensagemDeErro(falha));
    } finally {
      setProcessando(false);
    }
  }

  async function confirmarAcao() {
    if (!confirmacao) {
      return;
    }
    setProcessando(true);
    setErro('');
    try {
      if (confirmacao === 'clonar') {
        const resposta = await api.post<FluxoDetalhe>(
          `/fluxos/${id}/clonar`,
          {},
        );
        setConfirmacao(null);
        router.push(`/fluxos/${resposta.dados.id}`);
        return;
      }
      await api.post(`/fluxos/${id}/arquivar`);
      setConfirmacao(null);
      await carregar();
    } catch (falha) {
      setErro(mensagemDeErro(falha));
    } finally {
      setProcessando(false);
    }
  }

  if (carregando) {
    return <Carregando />;
  }
  if (!fluxo) {
    return <AlertaErro mensagem={erro || 'Fluxo não encontrado.'} />;
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link
          href="/fluxos"
          className="inline-flex items-center gap-1 text-sm text-rota-800 hover:underline"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Voltar para fluxos
        </Link>
      </div>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <span
            className="mb-2 block h-1 w-9 rounded-full bg-sinal-500"
            aria-hidden="true"
          />
          <h1 className="text-[1.65rem] font-semibold leading-tight tracking-[-0.02em] text-tinta-950">
            {fluxo.nome}
          </h1>
          <p className="text-sm leading-relaxed text-tinta-600">
            {fluxo.tipoProcessoNome ?? '—'} · versão {fluxo.versao}
          </p>
          <div className="mt-2">
            <Etiqueta tom={TOM_SITUACAO[fluxo.situacao] ?? 'neutro'}>
              {ROTULOS_SITUACAO_FLUXO[fluxo.situacao] ?? fluxo.situacao}
            </Etiqueta>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {podeEditar ? (
            <Botao
              variante="secundario"
              onClick={() => {
                setFluxoNome(fluxo.nome);
                setFluxoDescricao(fluxo.descricao ?? '');
                setEdiFluxo(true);
              }}
            >
              Editar dados
            </Botao>
          ) : null}
          {podeEditar && temPermissao('fluxos.update') ? (
            <Botao
              variante="secundario"
              onClick={() =>
                setFormFase({ id: null, nome: '', ordem: '', descricao: '' })
              }
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              Nova fase
            </Botao>
          ) : null}
          {fluxo.situacao === 'RASCUNHO' && temPermissao('fluxos.publish') ? (
            <Botao
              disabled={processando}
              onClick={() =>
                executar(() => api.post(`/fluxos/${id}/publicar`))
              }
            >
              Publicar
            </Botao>
          ) : null}
          {podeClonar ? (
            <Botao
              variante="secundario"
              disabled={processando}
              onClick={() => setConfirmacao('clonar')}
            >
              <Copy className="h-4 w-4" aria-hidden="true" />
              Clonar
            </Botao>
          ) : null}
          {podeArquivar ? (
            <Botao
              variante="perigo"
              disabled={processando}
              onClick={() => setConfirmacao('arquivar')}
            >
              Arquivar
            </Botao>
          ) : null}
        </div>
      </div>

      {erro ? <AlertaErro mensagem={erro} /> : null}

      {fluxo.fases.length === 0 ? (
        <Cartao>
          <CabecalhoCartao titulo="Fases e etapas" />
          <p className="px-4 py-6 text-sm text-tinta-500">
            Nenhuma fase cadastrada. Adicione fases e etapas para poder publicar.
          </p>
        </Cartao>
      ) : (
        fluxo.fases.map((fase) => (
          <Cartao key={fase.id}>
            <CabecalhoCartao
              titulo={`${fase.ordem}. ${fase.nome}`}
              descricao={fase.descricao ?? undefined}
              acao={
                podeEditar ? (
                  <div className="flex gap-2">
                    <Botao
                      variante="secundario"
                      onClick={() =>
                        setFormFase({
                          id: fase.id,
                          nome: fase.nome,
                          ordem: String(fase.ordem),
                          descricao: fase.descricao ?? '',
                        })
                      }
                    >
                      Editar
                    </Botao>
                    <Botao
                      variante="secundario"
                      onClick={() => setFormEtapa(FORM_ETAPA_VAZIO(fase.id))}
                    >
                      <Plus className="h-4 w-4" aria-hidden="true" />
                      Etapa
                    </Botao>
                    <Botao
                      variante="perigo"
                      aria-label="Remover fase"
                      onClick={() =>
                        executar(() => api.del(`/fluxos/fases/${fase.id}`))
                      }
                    >
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                    </Botao>
                  </div>
                ) : undefined
              }
            />
            {fase.etapas.length === 0 ? (
              <p className="px-4 py-4 text-sm text-tinta-500">
                Nenhuma etapa nesta fase.
              </p>
            ) : (
              <ul className="divide-y divide-papel-100">
                {fase.etapas.map((etapa) => (
                  <li
                    key={etapa.id}
                    className="flex flex-wrap items-start justify-between gap-2 px-4 py-3"
                  >
                    <div>
                      <p className="text-sm font-medium text-tinta-800">
                        {etapa.ordem}. {etapa.nome}
                      </p>
                      <p className="text-xs text-tinta-500">
                        {etapa.obrigatoria ? 'Obrigatória' : 'Opcional'}
                        {etapa.obrigatoria && etapa.permitePulo
                          ? ' · permite pulo'
                          : ''}
                        {etapa.condicional ? ' · condicional' : ''}
                        {etapa.prazoGestaoDias
                          ? ` · prazo ${etapa.prazoGestaoDias} dias`
                          : ''}
                        {etapa.referenciaLegal
                          ? ` · ${etapa.referenciaLegal}`
                          : ''}
                        {etapa.responsavelUsuarioId
                          ? ` · responsável: ${
                              usuarios.find(
                                (usuario) =>
                                  usuario.id === etapa.responsavelUsuarioId,
                              )?.nome ?? 'usuário'
                            }`
                          : ''}
                      </p>
                      {etapa.condicional && etapa.condicaoAplicabilidade ? (
                        <p className="text-xs text-tinta-500">
                          Condição: {etapa.condicaoAplicabilidade}
                        </p>
                      ) : null}
                      {etapa.descricao ? (
                        <p className="text-xs text-tinta-500">
                          {etapa.descricao}
                        </p>
                      ) : null}
                    </div>
                    {podeEditar ? (
                      <div className="flex gap-2">
                        <Botao
                          variante="secundario"
                          onClick={() => setFormEtapa(paraFormEtapa(etapa, fase.id))}
                        >
                          Editar
                        </Botao>
                        <Botao
                          variante="perigo"
                          aria-label="Remover etapa"
                          onClick={() =>
                            executar(() => api.del(`/fluxos/etapas/${etapa.id}`))
                          }
                        >
                          <Trash2 className="h-4 w-4" aria-hidden="true" />
                        </Botao>
                      </div>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </Cartao>
        ))
      )}

      <Modal
        aberto={ediFluxo}
        titulo="Editar fluxo"
        aoFechar={() => setEdiFluxo(false)}
        rodape={
          <>
            <Botao variante="secundario" onClick={() => setEdiFluxo(false)}>
              Cancelar
            </Botao>
            <Botao
              disabled={processando}
              onClick={() =>
                executar(() =>
                  api.patch(`/fluxos/${id}`, {
                    nome: fluxoNome,
                    descricao: fluxoDescricao || null,
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
          <Campo rotulo="Nome" htmlFor="fluxo-nome" obrigatorio>
            <Entrada
              id="fluxo-nome"
              value={fluxoNome}
              onChange={(evento) => setFluxoNome(evento.target.value)}
            />
          </Campo>
          <Campo rotulo="Descrição" htmlFor="fluxo-descricao">
            <AreaTexto
              id="fluxo-descricao"
              value={fluxoDescricao}
              onChange={(evento) => setFluxoDescricao(evento.target.value)}
            />
          </Campo>
        </div>
      </Modal>

      <Modal
        aberto={formFase !== null}
        titulo={formFase?.id ? 'Editar fase' : 'Nova fase'}
        aoFechar={() => setFormFase(null)}
        rodape={
          <>
            <Botao variante="secundario" onClick={() => setFormFase(null)}>
              Cancelar
            </Botao>
            <Botao
              disabled={processando || !formFase?.nome.trim()}
              onClick={() => {
                if (!formFase) return;
                const dados = {
                  nome: formFase.nome,
                  ordem: formFase.ordem ? Number(formFase.ordem) : undefined,
                  descricao: formFase.descricao || undefined,
                };
                return executar(() =>
                  formFase.id
                    ? api.patch(`/fluxos/fases/${formFase.id}`, dados)
                    : api.post(`/fluxos/${id}/fases`, dados),
                );
              }}
            >
              Salvar
            </Botao>
          </>
        }
      >
        {formFase ? (
          <div className="flex flex-col gap-4">
            <Campo rotulo="Nome" htmlFor="fase-nome" obrigatorio>
              <Entrada
                id="fase-nome"
                value={formFase.nome}
                onChange={(evento) =>
                  setFormFase({ ...formFase, nome: evento.target.value })
                }
              />
            </Campo>
            <Campo rotulo="Ordem" htmlFor="fase-ordem" dica="Deixe vazio para usar a próxima ordem.">
              <Entrada
                id="fase-ordem"
                type="number"
                min={1}
                value={formFase.ordem}
                onChange={(evento) =>
                  setFormFase({ ...formFase, ordem: evento.target.value })
                }
              />
            </Campo>
            <Campo rotulo="Descrição" htmlFor="fase-descricao">
              <AreaTexto
                id="fase-descricao"
                value={formFase.descricao}
                onChange={(evento) =>
                  setFormFase({ ...formFase, descricao: evento.target.value })
                }
              />
            </Campo>
          </div>
        ) : null}
      </Modal>

      <Modal
        aberto={formEtapa !== null}
        titulo={formEtapa?.id ? 'Editar etapa' : 'Nova etapa'}
        aoFechar={() => setFormEtapa(null)}
        rodape={
          <>
            <Botao variante="secundario" onClick={() => setFormEtapa(null)}>
              Cancelar
            </Botao>
            <Botao
              disabled={
                processando ||
                !formEtapa?.nome.trim() ||
                (formEtapa?.condicional === true &&
                  !formEtapa.condicaoAplicabilidade.trim())
              }
              onClick={() => {
                if (!formEtapa) return;
                const dados = {
                  nome: formEtapa.nome,
                  ordem: formEtapa.ordem ? Number(formEtapa.ordem) : undefined,
                  obrigatoria: formEtapa.obrigatoria,
                  prazoGestaoDias: formEtapa.prazoGestaoDias
                    ? Number(formEtapa.prazoGestaoDias)
                    : null,
                  responsavelSetorId: formEtapa.responsavelSetorId
                    ? Number(formEtapa.responsavelSetorId)
                    : null,
                  responsavelCargoId: formEtapa.responsavelCargoId
                    ? Number(formEtapa.responsavelCargoId)
                    : null,
                  ...(podeAtribuir
                    ? {
                        responsavelUsuarioId:
                          formEtapa.responsavelUsuarioId
                            ? Number(formEtapa.responsavelUsuarioId)
                            : null,
                      }
                    : {}),
                  descricao: formEtapa.descricao || undefined,
                  requisitos: formEtapa.requisitos || undefined,
                  referenciaLegal: formEtapa.referenciaLegal || undefined,
                  condicional: formEtapa.condicional,
                  condicaoAplicabilidade: formEtapa.condicional
                    ? formEtapa.condicaoAplicabilidade || undefined
                    : undefined,
                  permitePulo: formEtapa.permitePulo,
                };
                return executar(() =>
                  formEtapa.id
                    ? api.patch(`/fluxos/etapas/${formEtapa.id}`, dados)
                    : api.post(`/fluxos/fases/${formEtapa.faseId}/etapas`, dados),
                );
              }}
            >
              Salvar
            </Botao>
          </>
        }
      >
        {formEtapa ? (
          <div className="flex flex-col gap-4">
            <Campo rotulo="Nome" htmlFor="etapa-nome" obrigatorio>
              <Entrada
                id="etapa-nome"
                value={formEtapa.nome}
                onChange={(evento) =>
                  setFormEtapa({ ...formEtapa, nome: evento.target.value })
                }
              />
            </Campo>
            <div className="grid grid-cols-2 gap-3">
              <Campo rotulo="Ordem" htmlFor="etapa-ordem">
                <Entrada
                  id="etapa-ordem"
                  type="number"
                  min={1}
                  value={formEtapa.ordem}
                  onChange={(evento) =>
                    setFormEtapa({ ...formEtapa, ordem: evento.target.value })
                  }
                />
              </Campo>
              <Campo
                rotulo="Prazo (dias)"
                htmlFor="etapa-prazo"
                dica="Copiado para novos processos. Pode ser ajustado em cada processo."
              >
                <Entrada
                  id="etapa-prazo"
                  type="number"
                  min={1}
                  value={formEtapa.prazoGestaoDias}
                  onChange={(evento) =>
                    setFormEtapa({
                      ...formEtapa,
                      prazoGestaoDias: evento.target.value,
                    })
                  }
                />
              </Campo>
            </div>
            <Campo rotulo="Setor responsável" htmlFor="etapa-setor">
              <Selecao
                id="etapa-setor"
                value={formEtapa.responsavelSetorId}
                onChange={(evento) =>
                  setFormEtapa({
                    ...formEtapa,
                    responsavelSetorId: evento.target.value,
                  })
                }
              >
                <option value="">Não definido</option>
                {setores.map((setor) => (
                  <option key={setor.id} value={setor.id}>
                    {setor.nome}
                  </option>
                ))}
              </Selecao>
            </Campo>
            <Campo rotulo="Cargo responsável" htmlFor="etapa-cargo">
              <Selecao
                id="etapa-cargo"
                value={formEtapa.responsavelCargoId}
                onChange={(evento) =>
                  setFormEtapa({
                    ...formEtapa,
                    responsavelCargoId: evento.target.value,
                  })
                }
              >
                <option value="">Não definido</option>
                {cargos.map((cargo) => (
                  <option key={cargo.id} value={cargo.id}>
                    {cargo.nome}
                  </option>
                ))}
              </Selecao>
            </Campo>
            {podeAtribuir ? (
              <Campo
                rotulo="Usuário responsável"
                htmlFor="etapa-usuario"
                dica="Opcional. Ao criar o processo, a etapa será atribuída a este usuário."
              >
                <Selecao
                  id="etapa-usuario"
                  value={formEtapa.responsavelUsuarioId}
                  onChange={(evento) =>
                    setFormEtapa({
                      ...formEtapa,
                      responsavelUsuarioId: evento.target.value,
                    })
                  }
                >
                  <option value="">Não definido</option>
                  {usuarios.map((usuario) => (
                    <option key={usuario.id} value={usuario.id}>
                      {usuario.nome}
                      {usuario.cargo ? ` — ${usuario.cargo}` : ''}
                    </option>
                  ))}
                </Selecao>
              </Campo>
            ) : null}
            <label className="flex items-center gap-2 text-sm text-tinta-700">
              <input
                type="checkbox"
                checked={formEtapa.obrigatoria}
                onChange={(evento) =>
                  setFormEtapa({
                    ...formEtapa,
                    obrigatoria: evento.target.checked,
                  })
                }
              />
              Etapa obrigatória
            </label>
            <label className="flex items-center gap-2 text-sm text-tinta-700">
              <input
                type="checkbox"
                checked={formEtapa.permitePulo}
                disabled={!formEtapa.obrigatoria}
                onChange={(evento) =>
                  setFormEtapa({
                    ...formEtapa,
                    permitePulo: evento.target.checked,
                  })
                }
              />
              Permite pulo com justificativa (etapa obrigatória)
            </label>
            <label className="flex items-center gap-2 text-sm text-tinta-700">
              <input
                type="checkbox"
                checked={formEtapa.condicional}
                onChange={(evento) =>
                  setFormEtapa({
                    ...formEtapa,
                    condicional: evento.target.checked,
                  })
                }
              />
              Etapa condicional
            </label>
            {formEtapa.condicional ? (
              <Campo
                rotulo="Condição de aplicabilidade"
                htmlFor="etapa-condicao"
                obrigatorio
                dica="Descreva a condição que torna a etapa aplicável. Na criação do processo, a escolha é feita explicitamente."
              >
                <AreaTexto
                  id="etapa-condicao"
                  value={formEtapa.condicaoAplicabilidade}
                  onChange={(evento) =>
                    setFormEtapa({
                      ...formEtapa,
                      condicaoAplicabilidade: evento.target.value,
                    })
                  }
                />
              </Campo>
            ) : null}
            <Campo rotulo="Descrição" htmlFor="etapa-descricao">
              <AreaTexto
                id="etapa-descricao"
                value={formEtapa.descricao}
                onChange={(evento) =>
                  setFormEtapa({ ...formEtapa, descricao: evento.target.value })
                }
              />
            </Campo>
            <Campo rotulo="Requisitos" htmlFor="etapa-requisitos">
              <AreaTexto
                id="etapa-requisitos"
                value={formEtapa.requisitos}
                onChange={(evento) =>
                  setFormEtapa({ ...formEtapa, requisitos: evento.target.value })
                }
              />
            </Campo>
            <Campo
              rotulo="Referência normativa"
              htmlFor="etapa-referencia"
              dica="Informe apenas referências verificadas."
            >
              <Entrada
                id="etapa-referencia"
                value={formEtapa.referenciaLegal}
                onChange={(evento) =>
                  setFormEtapa({
                    ...formEtapa,
                    referenciaLegal: evento.target.value,
                  })
                }
              />
            </Campo>
          </div>
        ) : null}
      </Modal>

      <Modal
        aberto={confirmacao !== null}
        titulo={confirmacao === 'clonar' ? 'Clonar fluxo' : 'Arquivar fluxo'}
        aoFechar={() => setConfirmacao(null)}
        rodape={
          <>
            <Botao
              variante="secundario"
              onClick={() => setConfirmacao(null)}
              disabled={processando}
            >
              Cancelar
            </Botao>
            <Botao
              variante={confirmacao === 'arquivar' ? 'perigo' : 'primario'}
              onClick={confirmarAcao}
              disabled={processando}
            >
              {processando
                ? 'Processando…'
                : confirmacao === 'clonar'
                  ? 'Clonar'
                  : 'Arquivar'}
            </Botao>
          </>
        }
      >
        {confirmacao === 'clonar' ? (
          <p className="text-sm text-tinta-600">
            Será criada uma nova versão em rascunho deste fluxo, com as mesmas
            fases e etapas. A versão atual não é alterada. Deseja continuar?
          </p>
        ) : (
          <p className="text-sm text-tinta-600">
            O fluxo será arquivado e não poderá ser usado em novos processos.
            Processos existentes preservam o histórico. O arquivamento é
            bloqueado se houver processos em rascunho, em andamento ou
            suspensos vinculados a este fluxo.
          </p>
        )}
      </Modal>
    </div>
  );

  function paraFormEtapa(etapa: EtapaFluxo, faseId: number): FormEtapa {
    return {
      id: etapa.id,
      faseId,
      nome: etapa.nome,
      ordem: String(etapa.ordem),
      prazoGestaoDias: etapa.prazoGestaoDias ? String(etapa.prazoGestaoDias) : '',
      obrigatoria: etapa.obrigatoria,
      responsavelSetorId: etapa.responsavelSetorId
        ? String(etapa.responsavelSetorId)
        : '',
      responsavelCargoId: etapa.responsavelCargoId
        ? String(etapa.responsavelCargoId)
        : '',
      responsavelUsuarioId: etapa.responsavelUsuarioId
        ? String(etapa.responsavelUsuarioId)
        : '',
      descricao: etapa.descricao ?? '',
      requisitos: etapa.requisitos ?? '',
      referenciaLegal: etapa.referenciaLegal ?? '',
      condicional: etapa.condicional,
      condicaoAplicabilidade: etapa.condicaoAplicabilidade ?? '',
      permitePulo: etapa.permitePulo,
    };
  }
}
