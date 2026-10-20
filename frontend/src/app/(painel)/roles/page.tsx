'use client';

import { useCallback, useEffect, useState } from 'react';

import {
  AlertaErro,
  AreaTexto,
  Botao,
  CabecalhoPagina,
  Campo,
  Carregando,
  Cartao,
  Etiqueta,
  EstadoVazio,
  Modal,
} from '@/components/ui';
import { api, mensagemDeErro } from '@/lib/api';
import { agruparPermissoes } from '@/lib/rotulos';
import { useSessao } from '@/lib/session';
import type { Papel, Permissao } from '@/lib/tipos';

export default function RolesPage() {
  const { temPermissao } = useSessao();
  const podePermissoes = temPermissao('permissions.manage');
  const podeGerenciar = temPermissao('roles.manage');
  const podeEditar = podePermissoes || podeGerenciar;
  // Gerenciar papéis inclui atribuir/remover permissões do papel. A permissão
  // `permissions.manage` permanece aceita para compatibilidade.
  const podeAtribuirPermissoes = podeEditar;

  const [papels, setPapels] = useState<Papel[]>([]);
  const [permissoes, setPermissoes] = useState<Permissao[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const [editando, setEditando] = useState<Papel | null>(null);
  const [descricao, setDescricao] = useState('');
  const [selecionadas, setSelecionadas] = useState<number[]>([]);
  const [salvando, setSalvando] = useState(false);

  const carregar = useCallback(async () => {
    setCarregando(true);
    setErro('');
    try {
      const [roles, perms] = await Promise.all([
        api.get<Papel[]>('/roles'),
        api.get<Permissao[]>('/roles/permissoes'),
      ]);
      setPapels(roles.dados);
      setPermissoes(perms.dados);
    } catch (falha) {
      setErro(mensagemDeErro(falha));
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  function abrir(papel: Papel) {
    setSelecionadas(papel.permissoes.map((permissao) => permissao.id));
    setDescricao(papel.descricao ?? '');
    setEditando(papel);
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
      if (podeAtribuirPermissoes) {
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

      <Cartao className="px-4 py-3 text-sm text-slate-600">
        <p>
          <strong className="text-slate-800">Como funciona:</strong>{' '}
          <code className="rounded bg-slate-100 px-1 py-0.5 text-xs">
            roles.manage
          </code>{' '}
          permite editar a descrição do papel e atribuir ou remover permissões.
          A permissão{' '}
          <code className="rounded bg-slate-100 px-1 py-0.5 text-xs">
            permissions.manage
          </code>{' '}
          é um alias de compatibilidade para atribuir permissões; o catálogo de
          permissões é definido pelo sistema e não é editável pela interface.
        </p>
      </Cartao>

      {carregando ? (
        <Carregando />
      ) : papels.length === 0 ? (
        <Cartao>
          <EstadoVazio titulo="Nenhum papel cadastrado" />
        </Cartao>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {papels.map((papel) => (
            <Cartao key={papel.id}>
              <div className="flex items-start justify-between gap-3 border-b border-slate-200 px-4 py-3">
                <div className="min-w-0">
                  <h2 className="text-base font-semibold text-slate-800">
                    {papel.nome}
                  </h2>
                  <p className="text-sm text-slate-500">
                    {papel.descricao ?? 'Sem descrição.'}
                  </p>
                </div>
                <Etiqueta tom={papel.permissoes.length > 0 ? 'info' : 'neutro'}>
                  {papel.permissoes.length} permissõe
                  {papel.permissoes.length === 1 ? 'm' : 's'}
                </Etiqueta>
              </div>
              <div className="px-4 py-3">
                {papel.permissoes.length === 0 ? (
                  <p className="text-sm text-slate-500">
                    Nenhuma permissão concedida.
                  </p>
                ) : (
                  <div className="flex flex-col gap-2">
                    {agruparPermissoes(papel.permissoes).map((grupo) => (
                      <div key={grupo.modulo} className="flex flex-col gap-1">
                        <span className="text-xs font-medium uppercase tracking-wide text-slate-400">
                          {grupo.modulo}
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {grupo.itens.map((permissao) => (
                            <Etiqueta key={permissao.id} tom="neutro">
                              {permissao.descricao ?? permissao.codigo}
                            </Etiqueta>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {podeEditar ? (
                <div className="flex justify-end border-t border-slate-200 px-4 py-3">
                  <Botao variante="secundario" onClick={() => abrir(papel)}>
                    Editar
                  </Botao>
                </div>
              ) : null}
            </Cartao>
          ))}
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
            <Botao disabled={salvando} onClick={salvar}>
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

          <div className="flex flex-col gap-3">
            <span className="text-sm font-medium text-slate-700">
              Permissões concedidas
            </span>
            {agruparPermissoes(permissoes).map((grupo) => (
              <fieldset
                key={grupo.modulo}
                className="rounded-md border border-slate-200 p-3"
              >
                <legend className="px-1 text-xs font-medium uppercase tracking-wide text-slate-500">
                  {grupo.modulo}
                </legend>
                <ul className="flex flex-col gap-2">
                  {grupo.itens.map((permissao) => (
                    <li key={permissao.id}>
                      <label className="flex items-start gap-2 text-sm text-slate-700">
                        <input
                          type="checkbox"
                          className="mt-0.5 h-4 w-4 rounded border-slate-300"
                          checked={selecionadas.includes(permissao.id)}
                          disabled={!podeAtribuirPermissoes}
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
                          <span className="text-slate-800">
                            {permissao.descricao ?? permissao.codigo}
                          </span>
                          <span className="block font-mono text-xs text-slate-400">
                            {permissao.codigo}
                          </span>
                        </span>
                      </label>
                    </li>
                  ))}
                </ul>
              </fieldset>
            ))}
          </div>
        </div>
      </Modal>
    </div>
  );
}
