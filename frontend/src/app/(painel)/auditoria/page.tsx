'use client';

import { useCallback, useEffect, useState } from 'react';

import {
  AlertaErro,
  Botao,
  CabecalhoPagina,
  Carregando,
  Cartao,
  Entrada,
  Etiqueta,
  EstadoVazio,
  ListaDescricao,
  Modal,
  Selecao,
} from '@/components/ui';
import { api, mensagemDeErro, type Paginacao } from '@/lib/api';
import { formatarDataHora } from '@/lib/format';
import {
  ACOES_AUDITORIA,
  RECURSOS_AUDITORIA,
  rotuloAcao,
  rotuloRecurso,
} from '@/lib/rotulos';
import { useSessao } from '@/lib/session';
import type { ItemAuditoria } from '@/lib/tipos';

function formatarValor(valor: unknown): string {
  if (valor === null || valor === undefined) {
    return '—';
  }
  if (typeof valor === 'boolean') {
    return valor ? 'Sim' : 'Não';
  }
  if (Array.isArray(valor)) {
    return valor.map((item) => formatarValor(item)).join(', ');
  }
  if (typeof valor === 'object') {
    return JSON.stringify(valor);
  }
  return String(valor);
}

function formatarRotuloMetadado(chave: string): string {
  const texto = chave
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/_/g, ' ')
    .toLowerCase();
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

interface AlteracaoAuditavel {
  anterior: unknown;
  novo: unknown;
}

function extrairAlteracoes(
  metadados: Record<string, unknown> | null,
): Array<[string, AlteracaoAuditavel]> {
  const bruto = metadados?.alteracoes;
  if (!bruto || typeof bruto !== 'object' || Array.isArray(bruto)) {
    return [];
  }
  return Object.entries(bruto).filter(
    (entrada): entrada is [string, AlteracaoAuditavel] => {
      const valor = entrada[1];
      return (
        valor !== null &&
        typeof valor === 'object' &&
        'anterior' in valor &&
        'novo' in valor
      );
    },
  );
}

/**
 * Extrai do registro o nome legível do alvo afetado. O `recurso` informa o
 * tipo de entidade; estes metadados informam qual registro específico.
 */
function alvoAuditoria(item: ItemAuditoria): string | null {
  const metadados = item.metadados;
  if (!metadados) {
    return null;
  }
  for (const chave of ['nome', 'papel', 'usuario', 'numero']) {
    const valor = metadados[chave];
    if (typeof valor === 'string' && valor.trim().length > 0) {
      return valor;
    }
  }
  return null;
}

export default function AuditoriaPage() {
  const { temPermissao } = useSessao();
  const podeVer = temPermissao('audit.read');
  const [itens, setItens] = useState<ItemAuditoria[]>([]);
  const [paginacao, setPaginacao] = useState<Paginacao | null>(null);
  const [acao, setAcao] = useState('');
  const [recurso, setRecurso] = useState('');
  const [desde, setDesde] = useState('');
  const [ate, setAte] = useState('');
  const [pagina, setPagina] = useState(1);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const [detalhe, setDetalhe] = useState<ItemAuditoria | null>(null);

  const carregar = useCallback(async () => {
    if (!podeVer) {
      setCarregando(false);
      return;
    }
    setCarregando(true);
    setErro('');
    const params = new URLSearchParams({
      pagina: String(pagina),
      tamanhoPagina: '20',
    });
    if (acao) params.set('acao', acao);
    if (recurso) params.set('recurso', recurso);
    if (desde) params.set('desde', desde);
    if (ate) params.set('ate', ate);
    try {
      const resposta = await api.get<ItemAuditoria[]>(`/auditoria?${params}`);
      setItens(resposta.dados);
      setPaginacao(resposta.paginacao ?? null);
    } catch (falha) {
      setErro(mensagemDeErro(falha));
    } finally {
      setCarregando(false);
    }
  }, [podeVer, pagina, acao, recurso, desde, ate]);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  if (!podeVer) {
    return (
      <Cartao className="px-4 py-6 text-sm text-tinta-600">
        Você não possui permissão para visualizar a auditoria.
      </Cartao>
    );
  }

  const entradasMetadados = detalhe?.metadados
    ? Object.entries(detalhe.metadados).filter(
        ([chave]) => chave !== 'alteracoes',
      )
    : [];
  const alteracoes = extrairAlteracoes(detalhe?.metadados ?? null);

  return (
    <div className="flex flex-col gap-6">
      <CabecalhoPagina
        titulo="Auditoria"
        descricao="Registro imutável das ações relevantes: quem, o quê, quando, sobre qual recurso e com qual resultado."
      />

      <Cartao>
        <div className="flex flex-wrap items-end gap-3 border-b border-linha-200 px-4 py-3">
          <div className="flex flex-col gap-1">
            <label
              htmlFor="filtro-acao"
              className="text-xs font-medium text-tinta-500"
            >
              Ação
            </label>
            <Selecao
              id="filtro-acao"
              value={acao}
              onChange={(evento) => {
                setAcao(evento.target.value);
                setPagina(1);
              }}
              className="max-w-52"
            >
              <option value="">Todas</option>
              {Object.entries(ACOES_AUDITORIA).map(([codigo, rotulo]) => (
                <option key={codigo} value={codigo}>
                  {rotulo}
                </option>
              ))}
            </Selecao>
          </div>
          <div className="flex flex-col gap-1">
            <label
              htmlFor="filtro-recurso"
              className="text-xs font-medium text-tinta-500"
            >
              Recurso
            </label>
            <Selecao
              id="filtro-recurso"
              value={recurso}
              onChange={(evento) => {
                setRecurso(evento.target.value);
                setPagina(1);
              }}
              className="max-w-52"
            >
              <option value="">Todos</option>
              {Object.entries(RECURSOS_AUDITORIA).map(([codigo, rotulo]) => (
                <option key={codigo} value={codigo}>
                  {rotulo}
                </option>
              ))}
            </Selecao>
          </div>
          <div className="flex flex-col gap-1">
            <label
              htmlFor="filtro-desde"
              className="text-xs font-medium text-tinta-500"
            >
              Desde
            </label>
            <Entrada
              id="filtro-desde"
              type="date"
              value={desde}
              onChange={(evento) => {
                setDesde(evento.target.value);
                setPagina(1);
              }}
              className="max-w-44"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label
              htmlFor="filtro-ate"
              className="text-xs font-medium text-tinta-500"
            >
              Até
            </label>
            <Entrada
              id="filtro-ate"
              type="date"
              value={ate}
              onChange={(evento) => {
                setAte(evento.target.value);
                setPagina(1);
              }}
              className="max-w-44"
            />
          </div>
        </div>

        {erro ? (
          <div className="px-4 py-4">
            <AlertaErro mensagem={erro} />
          </div>
        ) : carregando ? (
          <Carregando />
        ) : itens.length === 0 ? (
          <EstadoVazio titulo="Nenhum registro encontrado" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-linha-200 text-xs uppercase text-tinta-500">
                <tr>
                  <th className="px-4 py-2">Data</th>
                  <th className="px-4 py-2">Usuário</th>
                  <th className="px-4 py-2">Ação</th>
                  <th className="px-4 py-2">Recurso</th>
                  <th className="px-4 py-2">Resultado</th>
                  <th className="px-4 py-2" />
                </tr>
              </thead>
              <tbody className="divide-y divide-papel-100">
                {itens.map((item) => (
                  <tr key={item.id} className="hover:bg-papel-50">
                    <td className="whitespace-nowrap px-4 py-3 text-tinta-600">
                      {formatarDataHora(item.criadoEm)}
                    </td>
                    <td className="px-4 py-3 text-tinta-700">
                      {item.usuario?.nome ?? 'Sistema'}
                    </td>
                    <td className="px-4 py-3 font-medium text-tinta-800">
                      {rotuloAcao(item.acao)}
                    </td>
                    <td className="px-4 py-3 text-tinta-600">
                      {rotuloRecurso(item.recurso)}
                      {alvoAuditoria(item)
                        ? ` · ${alvoAuditoria(item)}`
                        : item.recursoId
                          ? ` #${item.recursoId}`
                          : ''}
                    </td>
                    <td className="px-4 py-3">
                      <Etiqueta
                        tom={
                          item.resultado === 'SUCESSO' ? 'sucesso' : 'perigo'
                        }
                      >
                        {item.resultado === 'SUCESSO'
                          ? 'Sucesso'
                          : item.resultado === 'FALHA'
                            ? 'Falha'
                            : item.resultado}
                      </Etiqueta>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Botao
                        variante="sutil"
                        onClick={() => setDetalhe(item)}
                      >
                        Detalhes
                      </Botao>
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
              {paginacao.total} registros)
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
        aberto={detalhe !== null}
        titulo="Detalhes do registro"
        aoFechar={() => setDetalhe(null)}
        rodape={
          <Botao variante="secundario" onClick={() => setDetalhe(null)}>
            Fechar
          </Botao>
        }
      >
        {detalhe ? (
          <div className="flex flex-col gap-4">
            <ListaDescricao
              itens={[
                { rotulo: 'Data', valor: formatarDataHora(detalhe.criadoEm) },
                { rotulo: 'Usuário', valor: detalhe.usuario?.nome ?? 'Sistema' },
                { rotulo: 'Ação', valor: rotuloAcao(detalhe.acao) },
                {
                  rotulo: 'Recurso',
                  valor: `${rotuloRecurso(detalhe.recurso)}${
                    detalhe.recursoId ? ` #${detalhe.recursoId}` : ''
                  }${alvoAuditoria(detalhe) ? ` — ${alvoAuditoria(detalhe)}` : ''}`,
                },
                { rotulo: 'Resultado', valor: detalhe.resultado },
                {
                  rotulo: 'Endereço IP',
                  valor: detalhe.ip ?? '—',
                },
                {
                  rotulo: 'Correlação',
                  valor: (
                    <span className="font-mono text-xs">
                      {detalhe.correlacaoId ?? '—'}
                    </span>
                  ),
                },
              ]}
            />

            {detalhe.justificativa ? (
              <div>
                <h3 className="text-xs font-medium uppercase tracking-wide text-tinta-500">
                  Justificativa
                </h3>
                <p className="mt-1 text-sm text-tinta-800">
                  {detalhe.justificativa}
                </p>
              </div>
            ) : null}

            {alteracoes.length > 0 ? (
              <div>
                <h3 className="text-xs font-medium uppercase tracking-wide text-tinta-500">
                  Alterações
                </h3>
                <div className="mt-1 overflow-x-auto rounded border border-linha-200">
                  <table className="min-w-full divide-y divide-linha-200 text-sm">
                    <caption className="sr-only">
                      Valores anteriores e novos dos campos alterados
                    </caption>
                    <thead className="bg-papel-50">
                      <tr>
                        <th
                          scope="col"
                          className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wide text-tinta-500"
                        >
                          Campo
                        </th>
                        <th
                          scope="col"
                          className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wide text-tinta-500"
                        >
                          Antes
                        </th>
                        <th
                          scope="col"
                          className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wide text-tinta-500"
                        >
                          Depois
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-papel-100 bg-white">
                      {alteracoes.map(([chave, alteracao]) => (
                        <tr key={chave}>
                          <th
                            scope="row"
                            className="whitespace-nowrap px-3 py-2 text-left text-xs font-medium text-tinta-600"
                          >
                            {formatarRotuloMetadado(chave)}
                          </th>
                          <td className="break-words px-3 py-2 text-tinta-700">
                            {formatarValor(alteracao.anterior)}
                          </td>
                          <td className="break-words px-3 py-2 text-tinta-950">
                            {formatarValor(alteracao.novo)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : null}

            <div>
              <h3 className="text-xs font-medium uppercase tracking-wide text-tinta-500">
                Detalhes adicionais
              </h3>
              {entradasMetadados.length === 0 ? (
                <p className="mt-1 text-sm text-tinta-500">
                  Sem informações adicionais.
                </p>
              ) : (
                <dl className="mt-1 flex flex-col gap-1">
                  {entradasMetadados.map(([chave, valor]) => (
                    <div
                      key={chave}
                      className="flex flex-col rounded border border-papel-100 bg-papel-50 px-3 py-2 sm:flex-row sm:items-baseline sm:gap-3"
                    >
                      <dt className="text-xs font-medium text-tinta-500 sm:w-40 sm:shrink-0">
                        {formatarRotuloMetadado(chave)}
                      </dt>
                      <dd className="break-words text-sm text-tinta-800">
                        {formatarValor(valor)}
                      </dd>
                    </div>
                  ))}
                </dl>
              )}
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
