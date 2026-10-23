'use client';

import {
  Bookmark,
  Plus,
  RotateCcw,
  SlidersHorizontal,
  Trash2,
} from 'lucide-react';
import Link from 'next/link';
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
import { ROTULOS_STATUS_PROCESSO, formatarData } from '@/lib/format';
import { useSessao } from '@/lib/session';
import type {
  ProcessoResumo,
  Setor,
  TipoProcesso,
  UsuarioAtribuivel,
  VisaoSalva,
} from '@/lib/tipos';

const TOM_STATUS: Record<string, 'neutro' | 'info' | 'sucesso' | 'alerta' | 'perigo'> = {
  RASCUNHO: 'neutro',
  EM_ANDAMENTO: 'info',
  SUSPENSO: 'alerta',
  CONCLUIDO: 'sucesso',
  ANULADO: 'perigo',
  REVOGADO: 'perigo',
};

interface Filtros {
  busca: string;
  status: string;
  tipoId: string;
  setorId: string;
  responsavelId: string;
  atrasado: boolean;
  criadoDe: string;
  criadoAte: string;
  ordenarPor: string;
  direcao: string;
}

const FILTROS_VAZIOS: Filtros = {
  busca: '',
  status: '',
  tipoId: '',
  setorId: '',
  responsavelId: '',
  atrasado: false,
  criadoDe: '',
  criadoAte: '',
  ordenarPor: '',
  direcao: '',
};

function filtrosParaApi(filtros: Filtros): Record<string, unknown> {
  const dados: Record<string, unknown> = {};
  if (filtros.busca) dados.busca = filtros.busca;
  if (filtros.status) dados.status = filtros.status;
  if (filtros.tipoId) dados.tipoProcessoId = Number(filtros.tipoId);
  if (filtros.setorId) dados.setorAtualId = Number(filtros.setorId);
  if (filtros.responsavelId) {
    dados.responsavelAtualId = Number(filtros.responsavelId);
  }
  if (filtros.atrasado) dados.atrasado = true;
  if (filtros.criadoDe) dados.criadoDe = new Date(filtros.criadoDe).toISOString();
  if (filtros.criadoAte) {
    const fim = new Date(filtros.criadoAte);
    fim.setHours(23, 59, 59, 999);
    dados.criadoAte = fim.toISOString();
  }
  if (filtros.ordenarPor) dados.ordenarPor = filtros.ordenarPor;
  if (filtros.direcao) dados.direcao = filtros.direcao;
  return dados;
}

function filtrosDoBanco(filtros: Record<string, unknown>): Filtros {
  const texto = (valor: unknown): string =>
    typeof valor === 'string' || typeof valor === 'number'
      ? String(valor)
      : '';
  const data = (valor: unknown): string => {
    if (typeof valor !== 'string') {
      return '';
    }
    const parsed = new Date(valor);
    if (Number.isNaN(parsed.getTime())) {
      return '';
    }
    return parsed.toISOString().slice(0, 10);
  };
  return {
    busca: texto(filtros.busca),
    status: texto(filtros.status),
    tipoId: texto(filtros.tipoProcessoId),
    setorId: texto(filtros.setorAtualId),
    responsavelId: texto(filtros.responsavelAtualId),
    atrasado: filtros.atrasado === true,
    criadoDe: data(filtros.criadoDe),
    criadoAte: data(filtros.criadoAte),
    ordenarPor: texto(filtros.ordenarPor),
    direcao: texto(filtros.direcao),
  };
}

export default function ProcessosPage() {
  const { temPermissao } = useSessao();
  const [processos, setProcessos] = useState<ProcessoResumo[]>([]);
  const [tipos, setTipos] = useState<TipoProcesso[]>([]);
  const [setores, setSetores] = useState<Setor[]>([]);
  const [usuarios, setUsuarios] = useState<UsuarioAtribuivel[]>([]);
  const [visoes, setVisoes] = useState<VisaoSalva[]>([]);
  const [visaoSelecionada, setVisaoSelecionada] = useState('');
  const [paginacao, setPaginacao] = useState<Paginacao | null>(null);
  const [filtros, setFiltros] = useState<Filtros>(FILTROS_VAZIOS);
  const [pagina, setPagina] = useState(1);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const [modalVisao, setModalVisao] = useState(false);
  const [nomeVisao, setNomeVisao] = useState('');
  const [salvandoVisao, setSalvandoVisao] = useState(false);
  const [erroVisao, setErroVisao] = useState('');

  const carregar = useCallback(async () => {
    setCarregando(true);
    setErro('');
    const params = new URLSearchParams({
      pagina: String(pagina),
      tamanhoPagina: '10',
    });
    for (const [chave, valor] of Object.entries(filtrosParaApi(filtros))) {
      params.set(chave, String(valor));
    }
    try {
      const resposta = await api.get<ProcessoResumo[]>(`/processos?${params}`);
      setProcessos(resposta.dados);
      setPaginacao(resposta.paginacao ?? null);
    } catch (falha) {
      setErro(mensagemDeErro(falha));
    } finally {
      setCarregando(false);
    }
  }, [pagina, filtros]);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  const carregarVisoes = useCallback(async () => {
    try {
      const resposta = await api.get<VisaoSalva[]>('/visoes');
      setVisoes(resposta.dados);
    } catch {
      setVisoes([]);
    }
  }, []);

  useEffect(() => {
    api
      .get<TipoProcesso[]>('/tipos-processo?tamanhoPagina=100')
      .then((resposta) => setTipos(resposta.dados))
      .catch(() => setTipos([]));
    api
      .get<Setor[]>('/setores?ativo=true&tamanhoPagina=100')
      .then((resposta) => setSetores(resposta.dados))
      .catch(() => setSetores([]));
    api
      .get<UsuarioAtribuivel[]>('/usuarios/atribuiveis')
      .then((resposta) => setUsuarios(resposta.dados))
      .catch(() => setUsuarios([]));
    void carregarVisoes();
  }, [carregarVisoes]);

  function atualizarFiltro<K extends keyof Filtros>(
    chave: K,
    valor: Filtros[K],
  ) {
    setFiltros((atual) => ({ ...atual, [chave]: valor }));
    setPagina(1);
  }

  function limparFiltros() {
    setFiltros(FILTROS_VAZIOS);
    setVisaoSelecionada('');
    setPagina(1);
  }

  function aplicarVisao(id: string) {
    setVisaoSelecionada(id);
    const visao = visoes.find((item) => String(item.id) === id);
    if (visao) {
      setFiltros(filtrosDoBanco(visao.filtros));
      setPagina(1);
    }
  }

  async function salvarVisao(evento: React.FormEvent) {
    evento.preventDefault();
    setSalvandoVisao(true);
    setErroVisao('');
    try {
      await api.post('/visoes', {
        nome: nomeVisao,
        filtros: filtrosParaApi(filtros),
      });
      setModalVisao(false);
      setNomeVisao('');
      await carregarVisoes();
    } catch (falha) {
      setErroVisao(mensagemDeErro(falha));
    } finally {
      setSalvandoVisao(false);
    }
  }

  async function excluirVisao() {
    if (!visaoSelecionada) {
      return;
    }
    setErro('');
    try {
      await api.del(`/visoes/${visaoSelecionada}`);
      setVisaoSelecionada('');
      await carregarVisoes();
    } catch (falha) {
      setErro(mensagemDeErro(falha));
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <CabecalhoPagina
        titulo="Processos"
        descricao="Acompanhe etapas, responsáveis e prazos de cada contratação."
        acao={
          temPermissao('processos.create') ? (
            <Link href="/processos/novo">
              <Botao>
                <Plus className="h-4 w-4" aria-hidden="true" />
                Novo processo
              </Botao>
            </Link>
          ) : null
        }
      />

      <Cartao>
        <div className="border-b border-linha-200 bg-papel-50/50 px-5 py-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <SlidersHorizontal
                className="h-4 w-4 text-tinta-500"
                aria-hidden="true"
              />
              <h2 className="text-sm font-semibold text-tinta-900">Filtros</h2>
            </div>
            <Botao variante="sutil" onClick={limparFiltros}>
              <RotateCcw className="h-4 w-4" aria-hidden="true" />
              Limpar filtros
            </Botao>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-x-3 gap-y-4 sm:grid-cols-2 lg:grid-cols-12">
            <div className="sm:col-span-2 lg:col-span-4">
              <Campo rotulo="Buscar" htmlFor="filtro-busca">
                <Entrada
                  id="filtro-busca"
                  placeholder="Nome, número ou objeto"
                  value={filtros.busca}
                  onChange={(evento) =>
                    atualizarFiltro('busca', evento.target.value)
                  }
                />
              </Campo>
            </div>
            <div className="lg:col-span-2">
              <Campo rotulo="Situação" htmlFor="filtro-status">
                <Selecao
                  id="filtro-status"
                  value={filtros.status}
                  onChange={(evento) =>
                    atualizarFiltro('status', evento.target.value)
                  }
                >
                  <option value="">Todas</option>
                  {Object.entries(ROTULOS_STATUS_PROCESSO).map(
                    ([valor, rotulo]) => (
                      <option key={valor} value={valor}>
                        {rotulo}
                      </option>
                    ),
                  )}
                </Selecao>
              </Campo>
            </div>
            <div className="lg:col-span-3">
              <Campo rotulo="Tipo de processo" htmlFor="filtro-tipo">
                <Selecao
                  id="filtro-tipo"
                  value={filtros.tipoId}
                  onChange={(evento) =>
                    atualizarFiltro('tipoId', evento.target.value)
                  }
                >
                  <option value="">Todos os tipos</option>
                  {tipos.map((tipo) => (
                    <option key={tipo.id} value={tipo.id}>
                      {tipo.nome}
                    </option>
                  ))}
                </Selecao>
              </Campo>
            </div>
            <div className="lg:col-span-3">
              <Campo rotulo="Setor atual" htmlFor="filtro-setor">
                <Selecao
                  id="filtro-setor"
                  value={filtros.setorId}
                  onChange={(evento) =>
                    atualizarFiltro('setorId', evento.target.value)
                  }
                >
                  <option value="">Todos os setores</option>
                  {setores.map((setor) => (
                    <option key={setor.id} value={setor.id}>
                      {setor.nome}
                    </option>
                  ))}
                </Selecao>
              </Campo>
            </div>
            <div className="lg:col-span-3">
              <Campo rotulo="Responsável atual" htmlFor="filtro-responsavel">
                <Selecao
                  id="filtro-responsavel"
                  value={filtros.responsavelId}
                  onChange={(evento) =>
                    atualizarFiltro('responsavelId', evento.target.value)
                  }
                >
                  <option value="">Todos os responsáveis</option>
                  {usuarios.map((usuario) => (
                    <option key={usuario.id} value={usuario.id}>
                      {usuario.nome}
                    </option>
                  ))}
                </Selecao>
              </Campo>
            </div>
            <div className="lg:col-span-2">
              <Campo rotulo="Criado de" htmlFor="criado-de">
                <Entrada
                  id="criado-de"
                  type="date"
                  value={filtros.criadoDe}
                  onChange={(evento) =>
                    atualizarFiltro('criadoDe', evento.target.value)
                  }
                />
              </Campo>
            </div>
            <div className="lg:col-span-2">
              <Campo rotulo="Criado até" htmlFor="criado-ate">
                <Entrada
                  id="criado-ate"
                  type="date"
                  value={filtros.criadoAte}
                  onChange={(evento) =>
                    atualizarFiltro('criadoAte', evento.target.value)
                  }
                />
              </Campo>
            </div>
            <div className="lg:col-span-3">
              <Campo rotulo="Ordenar por" htmlFor="filtro-ordenar">
                <Selecao
                  id="filtro-ordenar"
                  value={filtros.ordenarPor}
                  onChange={(evento) =>
                    atualizarFiltro('ordenarPor', evento.target.value)
                  }
                >
                  <option value="">Ordem padrão</option>
                  <option value="numero">Número</option>
                  <option value="nome">Nome</option>
                  <option value="created_at">Data de criação</option>
                  <option value="data_prevista">Prazo da etapa atual</option>
                  <option value="status">Situação</option>
                </Selecao>
              </Campo>
            </div>
            <div className="lg:col-span-2">
              <Campo rotulo="Direção" htmlFor="filtro-direcao">
                <Selecao
                  id="filtro-direcao"
                  value={filtros.direcao}
                  onChange={(evento) =>
                    atualizarFiltro('direcao', evento.target.value)
                  }
                >
                  <option value="">Padrão</option>
                  <option value="asc">Crescente</option>
                  <option value="desc">Decrescente</option>
                </Selecao>
              </Campo>
            </div>
            <div className="flex items-end pb-1 lg:col-span-3">
              <label className="flex min-h-10 cursor-pointer items-center gap-2.5 rounded-lg border border-linha-200 bg-white px-3 text-sm font-medium text-tinta-800">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-linha-300 accent-rota-700"
                  checked={filtros.atrasado}
                  onChange={(evento) =>
                    atualizarFiltro('atrasado', evento.target.checked)
                  }
                />
                Somente atrasados
              </label>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-end gap-3 border-t border-linha-200 pt-4">
            <div className="w-full sm:max-w-sm">
              <label
                htmlFor="filtro-visao"
                className="mb-1.5 flex items-center gap-1.5 text-[0.8rem] font-semibold tracking-wide text-tinta-800"
              >
                <Bookmark
                  className="h-4 w-4 text-tinta-500"
                  aria-hidden="true"
                />
                Visões salvas
              </label>
              <Selecao
                id="filtro-visao"
                value={visaoSelecionada}
                onChange={(evento) => aplicarVisao(evento.target.value)}
                className="w-full"
              >
                <option value="">Selecione uma visão salva</option>
                {visoes.map((visao) => (
                  <option key={visao.id} value={visao.id}>
                    {visao.nome}
                  </option>
                ))}
              </Selecao>
            </div>
            <Botao
              variante="secundario"
              onClick={() => {
                setNomeVisao('');
                setErroVisao('');
                setModalVisao(true);
              }}
            >
              Salvar visão atual
            </Botao>
            {visaoSelecionada ? (
              <Botao variante="sutil" onClick={excluirVisao}>
                <Trash2 className="h-4 w-4" aria-hidden="true" />
                Excluir visão
              </Botao>
            ) : null}
          </div>
        </div>

        {erro ? (
          <div className="px-4 py-4">
            <AlertaErro mensagem={erro} />
          </div>
        ) : carregando ? (
          <Carregando />
        ) : processos.length === 0 ? (
          <EstadoVazio
            titulo="Nenhum processo encontrado"
            descricao="Ajuste os filtros ou cadastre um novo processo."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-linha-200 text-xs uppercase text-tinta-500">
                <tr>
                  <th className="px-4 py-2">Processo</th>
                  <th className="px-4 py-2">Situação</th>
                  <th className="px-4 py-2">Responsável / setor do processo</th>
                  <th className="px-4 py-2">Etapa atual</th>
                  <th className="px-4 py-2">Responsável / setor da etapa</th>
                  <th className="px-4 py-2">Prazo</th>
                  <th className="px-4 py-2">Criado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-papel-100">
                {processos.map((processo) => (
                  <tr key={processo.id} className="hover:bg-papel-50">
                    <td className="px-4 py-3">
                      <Link
                        href={`/processos/${processo.id}`}
                        className="font-medium text-rota-800 hover:underline"
                      >
                        {processo.nome || processo.numero}
                      </Link>
                      <p className="text-xs text-tinta-500">
                        Nº {processo.numero}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <Etiqueta tom={TOM_STATUS[processo.status] ?? 'neutro'}>
                        {ROTULOS_STATUS_PROCESSO[processo.status] ??
                          processo.status}
                      </Etiqueta>
                    </td>
                    <td className="px-4 py-3 text-tinta-600">
                      <p>{processo.responsavelAtual?.nome ?? '—'}</p>
                      <p className="text-xs text-tinta-500">
                        {processo.setorAtual?.nome ?? 'Sem setor'}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-tinta-600">
                      {processo.etapaAtual?.nome ??
                        (processo.status === 'EM_ANDAMENTO'
                          ? 'Aguardando conclusão do processo'
                          : processo.status === 'RASCUNHO'
                            ? 'Não iniciado'
                            : '—')}
                    </td>
                    <td className="px-4 py-3 text-tinta-600">
                      <p>{processo.etapaAtual?.responsavel?.nome ?? '—'}</p>
                      <p className="text-xs text-tinta-500">
                        {processo.etapaAtual?.setor?.nome ?? 'Sem setor'}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-tinta-600">
                      {formatarData(processo.etapaAtual?.dataPrevista ?? null)}
                    </td>
                    <td className="px-4 py-3 text-tinta-600">
                      {formatarData(processo.criadoEm)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {paginacao && paginacao.totalPaginas > 1 ? (
          <div className="flex items-center justify-between border-t border-linha-200 px-4 py-3 text-sm">
            <span className="text-tinta-500">
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
        aberto={modalVisao}
        titulo="Salvar visão de filtros"
        aoFechar={() => setModalVisao(false)}
        rodape={
          <>
            <Botao variante="secundario" onClick={() => setModalVisao(false)}>
              Cancelar
            </Botao>
            <Botao
              type="submit"
              form="form-visao"
              disabled={salvandoVisao || nomeVisao.trim().length === 0}
            >
              {salvandoVisao ? 'Salvando…' : 'Salvar visão'}
            </Botao>
          </>
        }
      >
        <form id="form-visao" onSubmit={salvarVisao}>
          {erroVisao ? <AlertaErro mensagem={erroVisao} /> : null}
          <Campo rotulo="Nome da visão" htmlFor="nome-visao" obrigatorio>
            <Entrada
              id="nome-visao"
              value={nomeVisao}
              maxLength={80}
              onChange={(evento) => setNomeVisao(evento.target.value)}
            />
          </Campo>
          <p className="mt-2 text-xs text-tinta-500">
            A visão é privada e armazena apenas os filtros atuais.
          </p>
        </form>
      </Modal>
    </div>
  );
}
