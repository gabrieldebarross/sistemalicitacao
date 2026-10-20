'use client';

import { Plus } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

import {
  AlertaErro,
  AreaTexto,
  Botao,
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
import { ROTULOS_SITUACAO_FLUXO, formatarData } from '@/lib/format';
import { useSessao } from '@/lib/session';
import type { FluxoDetalhe, FluxoResumo, TipoProcesso } from '@/lib/tipos';

const TOM_SITUACAO: Record<string, 'neutro' | 'sucesso' | 'alerta'> = {
  RASCUNHO: 'neutro',
  PUBLICADO: 'sucesso',
  ARQUIVADO: 'alerta',
};

export default function FluxosPage() {
  const { temPermissao } = useSessao();
  const router = useRouter();
  const [fluxos, setFluxos] = useState<FluxoResumo[]>([]);
  const [tipos, setTipos] = useState<TipoProcesso[]>([]);
  const [paginacao, setPaginacao] = useState<Paginacao | null>(null);
  const [tipoId, setTipoId] = useState('');
  const [situacao, setSituacao] = useState('');
  const [pagina, setPagina] = useState(1);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const [novoAberto, setNovoAberto] = useState(false);
  const [novoTipo, setNovoTipo] = useState('');
  const [novoNome, setNovoNome] = useState('');
  const [novaDescricao, setNovaDescricao] = useState('');
  const [criando, setCriando] = useState(false);

  const carregar = useCallback(async () => {
    setCarregando(true);
    setErro('');
    const params = new URLSearchParams({
      pagina: String(pagina),
      tamanhoPagina: '10',
    });
    if (tipoId) params.set('tipoProcessoId', tipoId);
    if (situacao) params.set('situacao', situacao);
    try {
      const resposta = await api.get<FluxoResumo[]>(`/fluxos?${params}`);
      setFluxos(resposta.dados);
      setPaginacao(resposta.paginacao ?? null);
    } catch (falha) {
      setErro(mensagemDeErro(falha));
    } finally {
      setCarregando(false);
    }
  }, [pagina, tipoId, situacao]);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  useEffect(() => {
    api
      .get<TipoProcesso[]>('/tipos-processo?tamanhoPagina=100')
      .then((resposta) => setTipos(resposta.dados))
      .catch(() => setTipos([]));
  }, []);

  async function criar(evento: React.FormEvent) {
    evento.preventDefault();
    setErro('');
    setCriando(true);
    try {
      const resposta = await api.post<FluxoDetalhe>('/fluxos', {
        tipoProcessoId: Number(novoTipo),
        nome: novoNome,
        descricao: novaDescricao || undefined,
      });
      router.push(`/fluxos/${resposta.dados.id}`);
    } catch (falha) {
      setErro(mensagemDeErro(falha));
    } finally {
      setCriando(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-800">Fluxos</h1>
          <p className="text-sm text-slate-500">
            Versões de fluxo de trabalho por tipo de processo.
          </p>
        </div>
        {temPermissao('fluxos.create') ? (
          <Botao onClick={() => setNovoAberto(true)}>
            <Plus className="h-4 w-4" aria-hidden="true" />
            Novo fluxo
          </Botao>
        ) : null}
      </div>

      <Cartao>
        <div className="flex flex-wrap gap-3 border-b border-slate-200 px-4 py-3">
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
          <Selecao
            aria-label="Filtrar por situação"
            value={situacao}
            onChange={(evento) => {
              setSituacao(evento.target.value);
              setPagina(1);
            }}
            className="max-w-48"
          >
            <option value="">Todas as situações</option>
            <option value="RASCUNHO">Rascunho</option>
            <option value="PUBLICADO">Publicado</option>
            <option value="ARQUIVADO">Arquivado</option>
          </Selecao>
        </div>

        {erro ? (
          <div className="px-4 py-4">
            <AlertaErro mensagem={erro} />
          </div>
        ) : carregando ? (
          <Carregando />
        ) : fluxos.length === 0 ? (
          <EstadoVazio
            titulo="Nenhum fluxo encontrado"
            descricao="Crie um fluxo para um tipo de processo."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-2">Nome</th>
                  <th className="px-4 py-2">Tipo</th>
                  <th className="px-4 py-2">Versão</th>
                  <th className="px-4 py-2">Situação</th>
                  <th className="px-4 py-2">Publicado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {fluxos.map((fluxo) => (
                  <tr key={fluxo.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <Link
                        href={`/fluxos/${fluxo.id}`}
                        className="font-medium text-sky-800 hover:underline"
                      >
                        {fluxo.nome}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {fluxo.tipoProcessoNome ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-slate-600">v{fluxo.versao}</td>
                    <td className="px-4 py-3">
                      <Etiqueta tom={TOM_SITUACAO[fluxo.situacao] ?? 'neutro'}>
                        {ROTULOS_SITUACAO_FLUXO[fluxo.situacao] ?? fluxo.situacao}
                      </Etiqueta>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {formatarData(fluxo.publicadoEm)}
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
              Página {paginacao.pagina} de {paginacao.totalPaginas}
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
        aberto={novoAberto}
        titulo="Novo fluxo"
        aoFechar={() => setNovoAberto(false)}
      >
        <form onSubmit={criar} className="flex flex-col gap-4">
          <Campo rotulo="Tipo de processo" htmlFor="novo-tipo" obrigatorio>
            <Selecao
              id="novo-tipo"
              required
              value={novoTipo}
              onChange={(evento) => setNovoTipo(evento.target.value)}
            >
              <option value="">Selecione…</option>
              {tipos.map((tipo) => (
                <option key={tipo.id} value={tipo.id}>
                  {tipo.nome}
                </option>
              ))}
            </Selecao>
          </Campo>
          <Campo rotulo="Nome" htmlFor="novo-nome" obrigatorio>
            <Entrada
              id="novo-nome"
              required
              value={novoNome}
              onChange={(evento) => setNovoNome(evento.target.value)}
            />
          </Campo>
          <Campo rotulo="Descrição" htmlFor="nova-descricao">
            <AreaTexto
              id="nova-descricao"
              value={novaDescricao}
              onChange={(evento) => setNovaDescricao(evento.target.value)}
            />
          </Campo>
          <div className="flex justify-end gap-2">
            <Botao
              variante="secundario"
              onClick={() => setNovoAberto(false)}
              disabled={criando}
            >
              Cancelar
            </Botao>
            <Botao type="submit" disabled={criando}>
              {criando ? 'Criando…' : 'Criar'}
            </Botao>
          </div>
        </form>
      </Modal>
    </div>
  );
}
