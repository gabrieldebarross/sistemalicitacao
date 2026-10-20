'use client';

import { Plus } from 'lucide-react';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';

import {
  AlertaErro,
  Botao,
  Carregando,
  Cartao,
  Entrada,
  Etiqueta,
  EstadoVazio,
  Selecao,
} from '@/components/ui';
import { api, mensagemDeErro, type Paginacao } from '@/lib/api';
import { ROTULOS_STATUS_PROCESSO, formatarData } from '@/lib/format';
import { useSessao } from '@/lib/session';
import type { ProcessoResumo, TipoProcesso } from '@/lib/tipos';

const TOM_STATUS: Record<string, 'neutro' | 'info' | 'sucesso' | 'alerta' | 'perigo'> = {
  RASCUNHO: 'neutro',
  EM_ANDAMENTO: 'info',
  SUSPENSO: 'alerta',
  CONCLUIDO: 'sucesso',
  ANULADO: 'perigo',
  REVOGADO: 'perigo',
};

export default function ProcessosPage() {
  const { temPermissao } = useSessao();
  const [processos, setProcessos] = useState<ProcessoResumo[]>([]);
  const [tipos, setTipos] = useState<TipoProcesso[]>([]);
  const [paginacao, setPaginacao] = useState<Paginacao | null>(null);
  const [busca, setBusca] = useState('');
  const [status, setStatus] = useState('');
  const [tipoId, setTipoId] = useState('');
  const [pagina, setPagina] = useState(1);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');

  const carregar = useCallback(async () => {
    setCarregando(true);
    setErro('');
    const params = new URLSearchParams({ pagina: String(pagina), tamanhoPagina: '10' });
    if (busca) params.set('busca', busca);
    if (status) params.set('status', status);
    if (tipoId) params.set('tipoProcessoId', tipoId);
    try {
      const resposta = await api.get<ProcessoResumo[]>(`/processos?${params}`);
      setProcessos(resposta.dados);
      setPaginacao(resposta.paginacao ?? null);
    } catch (falha) {
      setErro(mensagemDeErro(falha));
    } finally {
      setCarregando(false);
    }
  }, [pagina, busca, status, tipoId]);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  useEffect(() => {
    api
      .get<TipoProcesso[]>('/tipos-processo?tamanhoPagina=100')
      .then((resposta) => setTipos(resposta.dados))
      .catch(() => setTipos([]));
  }, []);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-800">Processos</h1>
          <p className="text-sm text-slate-500">
            Acompanhamento dos processos de contratação.
          </p>
        </div>
        {temPermissao('processos.create') ? (
          <Link href="/processos/novo">
            <Botao>
              <Plus className="h-4 w-4" aria-hidden="true" />
              Novo processo
            </Botao>
          </Link>
        ) : null}
      </div>

      <Cartao>
        <div className="flex flex-wrap gap-3 border-b border-slate-200 px-4 py-3">
          <Entrada
            placeholder="Buscar por número ou objeto"
            aria-label="Buscar processos"
            value={busca}
            onChange={(evento) => {
              setBusca(evento.target.value);
              setPagina(1);
            }}
            className="max-w-xs"
          />
          <Selecao
            aria-label="Filtrar por situação"
            value={status}
            onChange={(evento) => {
              setStatus(evento.target.value);
              setPagina(1);
            }}
            className="max-w-48"
          >
            <option value="">Todas as situações</option>
            {Object.entries(ROTULOS_STATUS_PROCESSO).map(([valor, rotulo]) => (
              <option key={valor} value={valor}>
                {rotulo}
              </option>
            ))}
          </Selecao>
          <Selecao
            aria-label="Filtrar por tipo"
            value={tipoId}
            onChange={(evento) => {
              setTipoId(evento.target.value);
              setPagina(1);
            }}
            className="max-w-64"
          >
            <option value="">Todos os tipos</option>
            {tipos.map((tipo) => (
              <option key={tipo.id} value={tipo.id}>
                {tipo.nome}
              </option>
            ))}
          </Selecao>
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
              <thead className="border-b border-slate-200 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-2">Número</th>
                  <th className="px-4 py-2">Objeto</th>
                  <th className="px-4 py-2">Situação</th>
                  <th className="px-4 py-2">Etapa atual</th>
                  <th className="px-4 py-2">Criado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {processos.map((processo) => (
                  <tr key={processo.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <Link
                        href={`/processos/${processo.id}`}
                        className="font-medium text-sky-800 hover:underline"
                      >
                        {processo.numero}
                      </Link>
                    </td>
                    <td className="max-w-sm px-4 py-3 text-slate-700">
                      {processo.objeto}
                    </td>
                    <td className="px-4 py-3">
                      <Etiqueta tom={TOM_STATUS[processo.status] ?? 'neutro'}>
                        {ROTULOS_STATUS_PROCESSO[processo.status] ?? processo.status}
                      </Etiqueta>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {processo.etapaAtual?.nome ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {formatarData(processo.criadoEm)}
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
              Página {paginacao.pagina} de {paginacao.totalPaginas} ({paginacao.total} itens)
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
    </div>
  );
}
