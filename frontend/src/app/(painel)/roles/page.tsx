'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import {
  AlertaErro,
  AreaTexto,
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
import { api, mensagemDeErro } from '@/lib/api';
import { agruparPermissoes } from '@/lib/rotulos';
import { useSessao } from '@/lib/session';
import type { Papel, Permissao } from '@/lib/tipos';

type FiltroPermissoes = 'todos' | 'com' | 'sem';

const PERMISSOES_POR_PAPEL = 6;

export default function RolesPage() {
  const { temPermissao } = useSessao();
  const podePermissoes = temPermissao('permissions.manage');
  const podeGerenciar = temPermissao('roles.manage');
  const podeEditar = podePermissoes || podeGerenciar;
  // Gerenciar papéis inclui atribuir/remover permissões do papel. A permissão
  // `permissions.manage` permanece aceita para compatibilidade.
  const podeAtribuirPermissoes = podeEditar;

  const [papels, setPapels] = useState<Papel[]>([]);
  const [permissoes, setPermissoes] = useState<Permissao[] | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [carregandoPermissoes, setCarregandoPermissoes] = useState(false);
  const [erro, setErro] = useState('');
  const [busca, setBusca] = useState('');
  const [filtro, setFiltro] = useState<FiltroPermissoes>('todos');
  const [editando, setEditando] = useState<Papel | null>(null);
  const [descricao, setDescricao] = useState('');
  const [selecionadas, setSelecionadas] = useState<number[]>([]);
  const [salvando, setSalvando] = useState(false);

  const carregar = useCallback(async () => {
    setCarregando(true);
    setErro('');
    try {
      const roles = await api.get<Papel[]>('/roles');
      setPapels(roles.dados);
    } catch (falha) {
      setErro(mensagemDeErro(falha));
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  const papeisFiltrados = useMemo(() => {
    const termo = busca.trim().toLocaleLowerCase('pt-BR');
    return papels.filter((papel) => {
      const combinaBusca =
        termo.length === 0 ||
        papel.nome.toLocaleLowerCase('pt-BR').includes(termo) ||
        (papel.descricao ?? '').toLocaleLowerCase('pt-BR').includes(termo);
      if (!combinaBusca) {
        return false;
      }
      if (filtro === 'com') {
        return papel.permissoes.length > 0;
      }
      if (filtro === 'sem') {
        return papel.permissoes.length === 0;
      }
      return true;
    });
  }, [busca, filtro, papels]);

  async function abrir(papel: Papel) {
    setSelecionadas(papel.permissoes.map((permissao) => permissao.id));
    setDescricao(papel.descricao ?? '');
    setEditando(papel);
    if (!podeAtribuirPermissoes || permissoes !== null) {
      return;
    }
    setCarregandoPermissoes(true);
    setErro('');
    try {
      const resposta = await api.get<Permissao[]>('/roles/permissoes');
      setPermissoes(resposta.dados);
    } catch (falha) {
      setErro(mensagemDeErro(falha));
    } finally {
      setCarregandoPermissoes(false);
    }
  }

  async function salvar() {
    if (!editando) return;
    setSalvando(true);
    setErro('');
    try {
      if (podeGerenciar) {
        await api.patch(`/roles/${editando.id}`, {
          descricao: descricao.trim() ? descricao.trim() : null,
        });
      }
      if (podeAtribuirPermissoes && permissoes !== null) {
        await api.put(`/roles/${editando.id}/permissoes`, {
          permissionIds: selecionadas,
        });
      }
      setEditando(null);
      await carregar();
    } catch (falha) {
      setErro(mensagemDeErro(falha));
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <CabecalhoPagina
        titulo="Papéis"
        descricao="Perfis de acesso e as permissões que cada um concede. Negar por padrão: conceda apenas o necessário."
      />

      {erro ? <AlertaErro mensagem={erro} /> : null}

      <Cartao className="p-4 sm:p-5">
        <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_15rem_auto] md:items-end">
          <Campo rotulo="Buscar papel" htmlFor="busca-papeis">
            <Entrada
              id="busca-papeis"
              type="search"
              placeholder="Nome ou descrição"
              value={busca}
              onChange={(evento) => setBusca(evento.target.value)}
            />
          </Campo>
          <Campo rotulo="Permissões" htmlFor="filtro-permissoes">
            <Selecao
              id="filtro-permissoes"
              value={filtro}
              onChange={(evento) =>
                setFiltro(evento.target.value as FiltroPermissoes)
              }
            >
              <option value="todos">Todos os papéis</option>
              <option value="com">Com permissões</option>
              <option value="sem">Sem permissões</option>
            </Selecao>
          </Campo>
          <p
            className="pb-2 text-sm text-tinta-600 md:text-right"
            aria-live="polite"
          >
            {papeisFiltrados.length} de {papels.length}{' '}
            {papels.length === 1 ? 'papel' : 'papéis'}
          </p>
        </div>
      </Cartao>

      {carregando ? (
        <Carregando />
      ) : papels.length === 0 ? (
        <Cartao>
          <EstadoVazio
            titulo="Nenhum papel cadastrado"
            descricao="Os papéis disponíveis são definidos pelo sistema."
          />
        </Cartao>
      ) : papeisFiltrados.length === 0 ? (
        <Cartao>
          <EstadoVazio
            titulo="Nenhum papel encontrado"
            descricao="Ajuste a busca ou o filtro de permissões."
          />
        </Cartao>
      ) : (
        <div className="flex flex-col gap-3">
          {papeisFiltrados.map((papel) => {
            const total = papel.permissoes.length;
            const visiveis = papel.permissoes.slice(0, PERMISSOES_POR_PAPEL);
            const restantes = total - visiveis.length;
            return (
              <Cartao key={papel.id} className="p-4 sm:p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-base font-semibold text-tinta-900">
                        {papel.nome}
                      </h2>
                      <Etiqueta tom={total > 0 ? 'info' : 'neutro'}>
                        {total} {total === 1 ? 'permissão' : 'permissões'}
                      </Etiqueta>
                    </div>
                    <p className="mt-1 text-sm leading-relaxed text-tinta-600">
                      {papel.descricao ?? 'Sem descrição.'}
                    </p>
                  </div>
                  {podeEditar ? (
                    <Botao
                      variante="secundario"
                      className="shrink-0"
                      onClick={() => abrir(papel)}
                    >
                      Editar
                    </Botao>
                  ) : null}
                </div>

                <div className="mt-3 border-t border-linha-200 pt-3">
                  {total === 0 ? (
                    <p className="text-sm text-tinta-500">
                      Nenhuma permissão concedida.
                    </p>
                  ) : (
                    <div className="flex flex-wrap items-center gap-1.5">
                      {visiveis.map((permissao) => (
                        <Etiqueta key={permissao.id} tom="neutro">
                          {permissao.codigo}
                        </Etiqueta>
                      ))}
                      {restantes > 0 ? (
                        <span className="text-xs font-semibold text-tinta-500">
                          +{restantes}
                        </span>
                      ) : null}
                    </div>
                  )}
                </div>
              </Cartao>
            );
          })}
        </div>
      )}

      <Modal
        aberto={editando !== null}
        titulo={`Editar papel: ${editando?.nome ?? ''}`}
        aoFechar={() => setEditando(null)}
        rodape={
          <>
            <Botao variante="secundario" onClick={() => setEditando(null)}>
              Cancelar
            </Botao>
            <Botao
              disabled={salvando || carregandoPermissoes}
              onClick={salvar}
            >
              Salvar
            </Botao>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <Campo
            rotulo="Descrição"
            htmlFor="papel-descricao"
            dica="Explique o propósito do papel para facilitar a atribuição a usuários."
          >
            <AreaTexto
              id="papel-descricao"
              value={descricao}
              disabled={!podeGerenciar}
              onChange={(evento) => setDescricao(evento.target.value)}
            />
          </Campo>

          {podeAtribuirPermissoes ? (
            <div className="flex flex-col gap-3">
              <span className="text-sm font-medium text-tinta-700">
                Permissões concedidas
              </span>
              {carregandoPermissoes ? (
                <Carregando texto="Carregando permissões…" />
              ) : permissoes === null ? (
                <p className="text-sm text-tinta-600">
                  Não foi possível carregar o catálogo de permissões. Feche e
                  tente novamente.
                </p>
              ) : (
                agruparPermissoes(permissoes).map((grupo) => (
                  <fieldset
                    key={grupo.modulo}
                    className="rounded-md border border-linha-200 p-3"
                  >
                    <legend className="px-1 text-xs font-medium uppercase tracking-wide text-tinta-500">
                      {grupo.modulo}
                    </legend>
                    <ul className="flex flex-col gap-2">
                      {grupo.itens.map((permissao) => (
                        <li key={permissao.id}>
                          <label className="flex items-start gap-2 text-sm text-tinta-700">
                            <input
                              type="checkbox"
                              className="mt-0.5 h-4 w-4 rounded border-linha-300"
                              checked={selecionadas.includes(permissao.id)}
                              onChange={(evento) =>
                                setSelecionadas((atual) =>
                                  evento.target.checked
                                    ? [...atual, permissao.id]
                                    : atual.filter(
                                        (valor) => valor !== permissao.id,
                                      ),
                                )
                              }
                            />
                            <span>
                              <span className="text-tinta-800">
                                {permissao.descricao ?? permissao.codigo}
                              </span>
                              <span className="block font-mono text-xs text-tinta-400">
                                {permissao.codigo}
                              </span>
                            </span>
                          </label>
                        </li>
                      ))}
                    </ul>
                  </fieldset>
                ))
              )}
            </div>
          ) : null}
        </div>
      </Modal>
    </div>
  );
}
