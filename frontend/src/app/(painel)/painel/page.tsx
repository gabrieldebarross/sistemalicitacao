'use client';

import { useEffect, useState } from 'react';

import {
  AlertaErro,
  CabecalhoCartao,
  CabecalhoPagina,
  Campo,
  Carregando,
  Cartao,
  Etiqueta,
  Selecao,
} from '@/components/ui';
import { api, mensagemDeErro } from '@/lib/api';
import { ROTULOS_STATUS_PROCESSO } from '@/lib/format';
import { useSessao } from '@/lib/session';
import type { Setor, TipoProcesso } from '@/lib/tipos';

interface Resumo {
  totalProcessos: number;
  porStatus: Array<{ status: string; total: number }>;
  porTipoProcesso: Array<{ tipo: string; total: number }>;
  etapasAtrasadas: number;
  porEtapaAtual: Array<{ etapa: string; total: number }>;
  gargalos: Array<{
    etapa: string;
    total: number;
    mediaDias: number;
    maxDias: number;
  }>;
  processosSemMovimentacao: number;
  devolucoes: number;
  geradoEm: string;
}

interface Filtros {
  tipoProcessoId: string;
  setorId: string;
  status: string;
  periodo: string;
}

const FILTROS_VAZIOS: Filtros = {
  tipoProcessoId: '',
  setorId: '',
  status: '',
  periodo: '',
};

function totalDe(resumo: Resumo, status: string): number {
  return resumo.porStatus.find((item) => item.status === status)?.total ?? 0;
}

function consultaDe(filtros: Filtros): string {
  const params = new URLSearchParams();
  if (filtros.tipoProcessoId) {
    params.set('tipoProcessoId', filtros.tipoProcessoId);
  }
  if (filtros.setorId) {
    params.set('setorId', filtros.setorId);
  }
  if (filtros.status) {
    params.set('status', filtros.status);
  }
  if (filtros.periodo) {
    const desde = new Date();
    desde.setDate(desde.getDate() - Number(filtros.periodo));
    params.set('desde', desde.toISOString().slice(0, 10));
  }
  const consulta = params.toString();
  return consulta ? `?${consulta}` : '';
}

export default function PainelPage() {
  const { temPermissao } = useSessao();
  const podeVer = temPermissao('reports.read');
  const [resumo, setResumo] = useState<Resumo | null>(null);
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(true);
  const [filtros, setFiltros] = useState<Filtros>(FILTROS_VAZIOS);
  const [tipos, setTipos] = useState<TipoProcesso[]>([]);
  const [setores, setSetores] = useState<Setor[]>([]);

  useEffect(() => {
    api
      .get<TipoProcesso[]>('/tipos-processo?tamanhoPagina=100')
      .then((r) => setTipos(r.dados))
      .catch(() => setTipos([]));
    api
      .get<Setor[]>('/setores?ativo=true&tamanhoPagina=100')
      .then((r) => setSetores(r.dados))
      .catch(() => setSetores([]));
  }, []);

  useEffect(() => {
    if (!podeVer) {
      setCarregando(false);
      return;
    }
    let ativo = true;
    setCarregando(true);
    setErro('');
    api
      .get<Resumo>(`/relatorios/resumo${consultaDe(filtros)}`)
      .then((resposta) => {
        if (ativo) {
          setResumo(resposta.dados);
        }
      })
      .catch((falha) => {
        if (ativo) {
          setErro(mensagemDeErro(falha));
        }
      })
      .finally(() => {
        if (ativo) {
          setCarregando(false);
        }
      });
    return () => {
      ativo = false;
    };
  }, [podeVer, filtros]);

  if (!podeVer) {
    return (
      <Cartao>
        <CabecalhoCartao titulo="Painel" />
        <p className="px-4 py-6 text-sm text-tinta-600">
          Você não possui permissão para visualizar indicadores.
        </p>
      </Cartao>
    );
  }

  const indicadores = resumo
    ? [
        { rotulo: 'Total de processos', valor: resumo.totalProcessos },
        { rotulo: 'Em andamento', valor: totalDe(resumo, 'EM_ANDAMENTO') },
        { rotulo: 'Suspensos', valor: totalDe(resumo, 'SUSPENSO') },
        {
          rotulo: 'Etapas atrasadas',
          valor: resumo.etapasAtrasadas,
          destaque: resumo.etapasAtrasadas > 0,
        },
        {
          rotulo: 'Sem movimentação (7 dias)',
          valor: resumo.processosSemMovimentacao,
          destaque: resumo.processosSemMovimentacao > 0,
        },
        { rotulo: 'Devoluções registradas', valor: resumo.devolucoes },
      ]
    : [];

  return (
    <div className="flex flex-col gap-6">
      <CabecalhoPagina
        titulo="Painel"
        descricao="Visão gerencial dos processos de contratação. Os indicadores respeitam os filtros aplicados."
      />

      <Cartao className="px-5 py-5">
        <div className="mb-4 flex items-center gap-2">
          <span className="h-1 w-7 rounded-full bg-sinal-500" aria-hidden="true" />
          <h2 className="text-sm font-semibold text-tinta-900">Filtros do painel</h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Campo rotulo="Tipo de processo" htmlFor="filtro-tipo">
            <Selecao
              id="filtro-tipo"
              value={filtros.tipoProcessoId}
              onChange={(evento) =>
                setFiltros({ ...filtros, tipoProcessoId: evento.target.value })
              }
            >
              <option value="">Todos</option>
              {tipos.map((tipo) => (
                <option key={tipo.id} value={tipo.id}>
                  {tipo.nome}
                </option>
              ))}
            </Selecao>
          </Campo>
          <Campo rotulo="Setor atual" htmlFor="filtro-setor">
            <Selecao
              id="filtro-setor"
              value={filtros.setorId}
              onChange={(evento) =>
                setFiltros({ ...filtros, setorId: evento.target.value })
              }
            >
              <option value="">Todos</option>
              {setores.map((setor) => (
                <option key={setor.id} value={setor.id}>
                  {setor.nome}
                </option>
              ))}
            </Selecao>
          </Campo>
          <Campo rotulo="Situação" htmlFor="filtro-status">
            <Selecao
              id="filtro-status"
              value={filtros.status}
              onChange={(evento) =>
                setFiltros({ ...filtros, status: evento.target.value })
              }
            >
              <option value="">Todas</option>
              {Object.entries(ROTULOS_STATUS_PROCESSO).map(([valor, rotulo]) => (
                <option key={valor} value={valor}>
                  {rotulo}
                </option>
              ))}
            </Selecao>
          </Campo>
          <Campo rotulo="Criado nos últimos" htmlFor="filtro-periodo">
            <Selecao
              id="filtro-periodo"
              value={filtros.periodo}
              onChange={(evento) =>
                setFiltros({ ...filtros, periodo: evento.target.value })
              }
            >
              <option value="">Todo o período</option>
              <option value="30">30 dias</option>
              <option value="90">90 dias</option>
              <option value="365">12 meses</option>
            </Selecao>
          </Campo>
        </div>
      </Cartao>

      {erro ? <AlertaErro mensagem={erro} /> : null}

      {carregando ? (
        <Carregando />
      ) : !resumo ? (
        <AlertaErro mensagem="Não foi possível carregar o painel." />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {indicadores.map((item) => (
              <Cartao key={item.rotulo} className="relative px-5 py-4">
                <span
                  className={`absolute inset-x-0 top-0 h-[3px] ${
                    item.destaque ? 'bg-red-500' : 'bg-rota-600'
                  }`}
                  aria-hidden="true"
                />
                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-tinta-600">
                  {item.rotulo}
                </p>
                <p
                  className={
                    item.destaque
                      ? 'tabular mt-3 text-3xl font-semibold tracking-tight text-red-700'
                      : 'tabular mt-3 text-3xl font-semibold tracking-tight text-tinta-950'
                  }
                >
                  {item.valor}
                </p>
              </Cartao>
            ))}
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Cartao>
              <CabecalhoCartao titulo="Por situação" />
              <ul className="divide-y divide-papel-100">
                {resumo.porStatus.length === 0 ? (
                  <li className="px-4 py-4 text-sm text-tinta-500">
                    Nenhum processo no filtro atual.
                  </li>
                ) : (
                  resumo.porStatus.map((item) => (
                    <li
                      key={item.status}
                      className="flex items-center justify-between px-4 py-3 text-sm"
                    >
                      <span className="text-tinta-700">
                        {ROTULOS_STATUS_PROCESSO[item.status] ?? item.status}
                      </span>
                      <Etiqueta tom="info">{item.total}</Etiqueta>
                    </li>
                  ))
                )}
              </ul>
            </Cartao>

            <Cartao>
              <CabecalhoCartao titulo="Por tipo de processo" />
              <ul className="divide-y divide-papel-100">
                {resumo.porTipoProcesso.length === 0 ? (
                  <li className="px-4 py-4 text-sm text-tinta-500">
                    Nenhum tipo cadastrado.
                  </li>
                ) : (
                  resumo.porTipoProcesso.map((item) => (
                    <li
                      key={item.tipo}
                      className="flex items-center justify-between px-4 py-3 text-sm"
                    >
                      <span className="text-tinta-700">{item.tipo}</span>
                      <Etiqueta tom="neutro">{item.total}</Etiqueta>
                    </li>
                  ))
                )}
              </ul>
            </Cartao>

            <Cartao>
              <CabecalhoCartao titulo="Etapas atuais (estoque)" />
              <ul className="divide-y divide-papel-100">
                {resumo.porEtapaAtual.length === 0 ? (
                  <li className="px-4 py-4 text-sm text-tinta-500">
                    Nenhuma etapa em andamento no filtro atual.
                  </li>
                ) : (
                  resumo.porEtapaAtual.map((item) => (
                    <li
                      key={item.etapa}
                      className="flex items-center justify-between px-4 py-3 text-sm"
                    >
                      <span className="text-tinta-700">{item.etapa}</span>
                      <Etiqueta tom="info">{item.total}</Etiqueta>
                    </li>
                  ))
                )}
              </ul>
            </Cartao>

            <Cartao>
              <CabecalhoCartao titulo="Gargalos (tempo médio por etapa)" />
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-linha-200 text-xs uppercase text-tinta-500">
                    <tr>
                      <th className="px-4 py-2">Etapa</th>
                      <th className="px-4 py-2">Concluídas</th>
                      <th className="px-4 py-2">Média</th>
                      <th className="px-4 py-2">Máximo</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-papel-100">
                    {resumo.gargalos.length === 0 ? (
                      <tr>
                        <td
                          colSpan={4}
                          className="px-4 py-4 text-sm text-tinta-500"
                        >
                          Ainda não há etapas concluídas suficientes.
                        </td>
                      </tr>
                    ) : (
                      resumo.gargalos.map((item) => (
                        <tr key={item.etapa}>
                          <td className="px-4 py-3 text-tinta-700">
                            {item.etapa}
                          </td>
                          <td className="px-4 py-3 text-tinta-600">
                            {item.total}
                          </td>
                          <td className="px-4 py-3 text-tinta-600">
                            {item.mediaDias} d
                          </td>
                          <td className="px-4 py-3 text-tinta-600">
                            {item.maxDias} d
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </Cartao>
          </div>
        </>
      )}
    </div>
  );
}
