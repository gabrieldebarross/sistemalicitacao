'use client';

import { Plus } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

import {
  AlertaErro,
  AlertaSucesso,
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
import { api, mensagemDeErro, TAMANHO_PAGINA_MAX, type Paginacao } from '@/lib/api';
import { formatarDataHora } from '@/lib/format';
import { agruparPermissoes } from '@/lib/rotulos';
import { useSessao } from '@/lib/session';
import type {
  Cargo,
  Papel,
  SessaoUsuario,
  Setor,
  Usuario,
  UsuarioAtribuivel,
} from '@/lib/tipos';

interface Formulario {
  id: number | null;
  nome: string;
  email: string;
  senha: string;
  cargoId: string;
  ativo: boolean;
}

const VAZIO: Formulario = {
  id: null,
  nome: '',
  email: '',
  senha: '',
  cargoId: '',
  ativo: true,
};

export default function UsuariosPage() {
  const { temPermissao } = useSessao();
  const podeCriar = temPermissao('usuarios.create');
  const podeEditar = temPermissao('usuarios.update');
  const podeGerenciarRoles = temPermissao('roles.manage');
  const podeDesativar = temPermissao('usuarios.deactivate');

  const [itens, setItens] = useState<Usuario[]>([]);
  const [cargos, setCargos] = useState<Cargo[]>([]);
  const [setores, setSetores] = useState<Setor[]>([]);
  const [papels, setPapels] = useState<Papel[]>([]);
  const [paginacao, setPaginacao] = useState<Paginacao | null>(null);
  const [busca, setBusca] = useState('');
  const [pagina, setPagina] = useState(1);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const [form, setForm] = useState<Formulario | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [rolesUsuario, setRolesUsuario] = useState<Usuario | null>(null);
  const [rolesSelecionados, setRolesSelecionados] = useState<number[]>([]);
  const [setoresUsuario, setSetoresUsuario] = useState<Usuario | null>(null);
  const [setoresSelecionados, setSetoresSelecionados] = useState<number[]>([]);
  const [setorPrincipalId, setSetorPrincipalId] = useState('');
  const [salvandoSetores, setSalvandoSetores] = useState(false);
  const [desativando, setDesativando] = useState<Usuario | null>(null);
  const [processandoDesativar, setProcessandoDesativar] = useState(false);
  const [destinoDesativarId, setDestinoDesativarId] = useState('');
  const [usuariosAtribuiveis, setUsuariosAtribuiveis] = useState<
    UsuarioAtribuivel[]
  >([]);
  const [sessoesUsuario, setSessoesUsuario] = useState<Usuario | null>(null);
  const [sessoes, setSessoes] = useState<SessaoUsuario[]>([]);
  const [carregandoSessoes, setCarregandoSessoes] = useState(false);
  const [revogandoSessao, setRevogandoSessao] = useState<string | null>(null);
  const [resetandoMfa, setResetandoMfa] = useState<Usuario | null>(null);
  const [processandoAcao, setProcessandoAcao] = useState(false);
  const [sucesso, setSucesso] = useState('');

  const carregar = useCallback(async () => {
    setCarregando(true);
    setErro('');
    const params = new URLSearchParams({ pagina: String(pagina), tamanhoPagina: '10' });
    if (busca) params.set('busca', busca);
    try {
      const resposta = await api.get<Usuario[]>(`/usuarios?${params}`);
      setItens(resposta.dados);
      setPaginacao(resposta.paginacao ?? null);
    } catch (falha) {
      setErro(mensagemDeErro(falha));
    } finally {
      setCarregando(false);
    }
  }, [pagina, busca]);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  useEffect(() => {
    api
      .get<Cargo[]>(`/cargos?tamanhoPagina=${TAMANHO_PAGINA_MAX}`)
      .then((r) => setCargos(r.dados))
      .catch(() => setCargos([]));
    if (podeEditar) {
      api
        .get<Setor[]>(`/setores?tamanhoPagina=${TAMANHO_PAGINA_MAX}`)
        .then((r) => setSetores(r.dados))
        .catch(() => setSetores([]));
    }
    if (podeGerenciarRoles) {
      api
        .get<Papel[]>('/roles')
        .then((r) => setPapels(r.dados))
        .catch(() => setPapels([]));
    }
  }, [podeEditar, podeGerenciarRoles]);

  function abrirNovo() {
    setForm({ ...VAZIO });
  }

  function abrirEdicao(usuario: Usuario) {
    setForm({
      id: usuario.id,
      nome: usuario.nome,
      email: usuario.email,
      senha: '',
      cargoId: usuario.cargo ? String(usuario.cargo.id) : '',
      ativo: usuario.ativo,
    });
  }

  async function salvar() {
    if (!form) return;
    setSalvando(true);
    setErro('');
    try {
      if (form.id) {
        await api.patch(`/usuarios/${form.id}`, {
          nome: form.nome,
          email: form.email,
          cargoId: form.cargoId ? Number(form.cargoId) : null,
          ativo: form.ativo,
          ...(form.senha ? { senha: form.senha } : {}),
        });
      } else {
        await api.post('/usuarios', {
          nome: form.nome,
          email: form.email,
          senha: form.senha,
          cargoId: form.cargoId ? Number(form.cargoId) : null,
          ativo: form.ativo,
        });
      }
      setForm(null);
      await carregar();
    } catch (falha) {
      setErro(mensagemDeErro(falha));
    } finally {
      setSalvando(false);
    }
  }

  async function salvarRoles() {
    if (!rolesUsuario) return;
    setSalvando(true);
    setErro('');
    try {
      await api.put(`/usuarios/${rolesUsuario.id}/roles`, {
        roleIds: rolesSelecionados,
      });
      setRolesUsuario(null);
      await carregar();
    } catch (falha) {
      setErro(mensagemDeErro(falha));
    } finally {
      setSalvando(false);
    }
  }

  function abrirDesativar(usuario: Usuario) {
    setDestinoDesativarId('');
    setDesativando(usuario);
    api
      .get<UsuarioAtribuivel[]>('/usuarios/atribuiveis')
      .then((resposta) =>
        setUsuariosAtribuiveis(
          resposta.dados.filter((item) => item.id !== usuario.id),
        ),
      )
      .catch(() => setUsuariosAtribuiveis([]));
  }

  async function desativar() {
    if (!desativando) return;
    setProcessandoDesativar(true);
    setErro('');
    setSucesso('');
    try {
      await api.post(`/usuarios/${desativando.id}/desativar`, {
        destinoUsuarioId: destinoDesativarId
          ? Number(destinoDesativarId)
          : undefined,
      });
      setDesativando(null);
      setSucesso('Usuário desativado e atribuições transferidas.');
      await carregar();
    } catch (falha) {
      setErro(mensagemDeErro(falha));
    } finally {
      setProcessandoDesativar(false);
    }
  }

  function abrirSessoes(usuario: Usuario) {
    setSessoesUsuario(usuario);
    setSessoes([]);
    setCarregandoSessoes(true);
    api
      .get<SessaoUsuario[]>(`/usuarios/${usuario.id}/sessoes`)
      .then((resposta) => setSessoes(resposta.dados))
      .catch((falha) => setErro(mensagemDeErro(falha)))
      .finally(() => setCarregandoSessoes(false));
  }

  async function revogarSessao(sessaoId: string) {
    if (!sessoesUsuario) return;
    setRevogandoSessao(sessaoId);
    setErro('');
    try {
      await api.del(`/usuarios/${sessoesUsuario.id}/sessoes/${sessaoId}`);
      setSessoes((atual) => atual.filter((item) => item.id !== sessaoId));
    } catch (falha) {
      setErro(mensagemDeErro(falha));
    } finally {
      setRevogandoSessao(null);
    }
  }

  async function desbloquear(usuario: Usuario) {
    setProcessandoAcao(true);
    setErro('');
    setSucesso('');
    try {
      await api.post(`/usuarios/${usuario.id}/desbloquear`);
      setSucesso('Tentativas de login zeradas e bloqueio removido.');
    } catch (falha) {
      setErro(mensagemDeErro(falha));
    } finally {
      setProcessandoAcao(false);
    }
  }

  async function confirmarResetMfa() {
    if (!resetandoMfa) return;
    setProcessandoAcao(true);
    setErro('');
    setSucesso('');
    try {
      await api.post(`/usuarios/${resetandoMfa.id}/mfa/reset`);
      setResetandoMfa(null);
      setSucesso(
        'MFA redefinido. O usuário deverá configurar novamente no próximo acesso.',
      );
    } catch (falha) {
      setErro(mensagemDeErro(falha));
    } finally {
      setProcessandoAcao(false);
    }
  }

  function abrirRoles(usuario: Usuario) {
    const nomes = new Set(usuario.roles);
    setRolesSelecionados(
      papels.filter((papel) => nomes.has(papel.nome)).map((papel) => papel.id),
    );
    setRolesUsuario(usuario);
  }

  function abrirSetores(usuario: Usuario) {
    const ids = usuario.setores.map((setor) => setor.id);
    setSetoresSelecionados(ids);
    setSetorPrincipalId(
      usuario.setores.find((setor) => setor.principal)
        ? String(usuario.setores.find((setor) => setor.principal)?.id)
        : ids[0]
          ? String(ids[0])
          : '',
    );
    setSetoresUsuario(usuario);
  }

  function alternarSetor(setorId: number, marcado: boolean) {
    setSetoresSelecionados((atual) => {
      const proximo = marcado
        ? [...atual, setorId]
        : atual.filter((id) => id !== setorId);
      if (!marcado && setorPrincipalId === String(setorId)) {
        setSetorPrincipalId(proximo[0] ? String(proximo[0]) : '');
      }
      if (marcado && !setorPrincipalId) {
        setSetorPrincipalId(String(setorId));
      }
      return proximo;
    });
  }

  async function salvarSetores() {
    if (!setoresUsuario) return;
    setSalvandoSetores(true);
    setErro('');
    try {
      await api.put(`/usuarios/${setoresUsuario.id}/setores`, {
        setorIds: setoresSelecionados,
        setorPrincipalId: setorPrincipalId
          ? Number(setorPrincipalId)
          : null,
      });
      setSetoresUsuario(null);
      await carregar();
    } catch (falha) {
      setErro(mensagemDeErro(falha));
    } finally {
      setSalvandoSetores(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-800">Usuários</h1>
          <p className="text-sm text-slate-500">
            Contas de acesso e papéis atribuídos.
          </p>
        </div>
        {podeCriar ? (
          <Botao onClick={abrirNovo}>
            <Plus className="h-4 w-4" aria-hidden="true" />
            Novo usuário
          </Botao>
        ) : null}
      </div>

      {sucesso ? <AlertaSucesso mensagem={sucesso} /> : null}

      <Cartao>
        <div className="border-b border-slate-200 px-4 py-3">
          <Entrada
            placeholder="Buscar por nome ou e-mail"
            aria-label="Buscar usuários"
            value={busca}
            onChange={(evento) => {
              setBusca(evento.target.value);
              setPagina(1);
            }}
            className="max-w-xs"
          />
        </div>

        {erro ? (
          <div className="px-4 py-4">
            <AlertaErro mensagem={erro} />
          </div>
        ) : carregando ? (
          <Carregando />
        ) : itens.length === 0 ? (
          <EstadoVazio titulo="Nenhum usuário encontrado" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-2">Nome</th>
                  <th className="px-4 py-2">E-mail</th>
                  <th className="px-4 py-2">Cargo</th>
                  <th className="px-4 py-2">Setores</th>
                  <th className="px-4 py-2">Papéis</th>
                  <th className="px-4 py-2">Situação</th>
                  <th className="px-4 py-2" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {itens.map((usuario) => (
                  <tr key={usuario.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-800">
                      {usuario.nome}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{usuario.email}</td>
                    <td className="px-4 py-3 text-slate-600">
                      {usuario.cargo?.nome ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {usuario.setores.length > 0
                        ? usuario.setores
                            .map(
                              (setor) =>
                                `${setor.nome}${setor.principal ? ' (principal)' : ''}`,
                            )
                            .join(', ')
                        : '—'}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {usuario.roles.length > 0 ? usuario.roles.join(', ') : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <Etiqueta tom={usuario.ativo ? 'sucesso' : 'neutro'}>
                        {usuario.ativo ? 'Ativo' : 'Inativo'}
                      </Etiqueta>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        {podeEditar ? (
                          <Botao
                            variante="secundario"
                            onClick={() => abrirSetores(usuario)}
                          >
                            Setores
                          </Botao>
                        ) : null}
                        {podeGerenciarRoles ? (
                          <Botao
                            variante="secundario"
                            onClick={() => abrirRoles(usuario)}
                          >
                            Papéis
                          </Botao>
                        ) : null}
                        {podeEditar ? (
                          <Botao
                            variante="secundario"
                            onClick={() => abrirSessoes(usuario)}
                          >
                            Sessões
                          </Botao>
                        ) : null}
                        {podeEditar ? (
                          <Botao
                            variante="secundario"
                            disabled={processandoAcao}
                            onClick={() => desbloquear(usuario)}
                          >
                            Desbloquear
                          </Botao>
                        ) : null}
                        {podeEditar ? (
                          <Botao
                            variante="secundario"
                            onClick={() => setResetandoMfa(usuario)}
                          >
                            Resetar MFA
                          </Botao>
                        ) : null}
                        {podeEditar ? (
                          <Botao
                            variante="secundario"
                            onClick={() => abrirEdicao(usuario)}
                          >
                            Editar
                          </Botao>
                        ) : null}
                        {podeDesativar && usuario.ativo ? (
                          <Botao
                            variante="perigo"
                            onClick={() => abrirDesativar(usuario)}
                          >
                            Desativar
                          </Botao>
                        ) : null}
                      </div>
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
        aberto={form !== null}
        titulo={form?.id ? 'Editar usuário' : 'Novo usuário'}
        aoFechar={() => setForm(null)}
        rodape={
          <>
            <Botao variante="secundario" onClick={() => setForm(null)}>
              Cancelar
            </Botao>
            <Botao
              disabled={
                salvando ||
                !form?.nome.trim() ||
                !form?.email.trim() ||
                (!form?.id && form.senha.length < 12) ||
                (!!form?.id && form.senha.length > 0 && form.senha.length < 12)
              }
              onClick={salvar}
            >
              Salvar
            </Botao>
          </>
        }
      >
        {form ? (
          <div className="flex flex-col gap-4">
            <Campo rotulo="Nome" htmlFor="usuario-nome" obrigatorio>
              <Entrada
                id="usuario-nome"
                value={form.nome}
                onChange={(evento) =>
                  setForm({ ...form, nome: evento.target.value })
                }
              />
            </Campo>
            <Campo rotulo="E-mail" htmlFor="usuario-email" obrigatorio>
              <Entrada
                id="usuario-email"
                type="email"
                value={form.email}
                onChange={(evento) =>
                  setForm({ ...form, email: evento.target.value })
                }
              />
            </Campo>
            {form.id === null ? (
              <Campo
                rotulo="Senha"
                htmlFor="usuario-senha"
                obrigatorio
                dica="Mínimo de 12 caracteres. O usuário deverá alterá-la no primeiro acesso."
              >
                <Entrada
                  id="usuario-senha"
                  type="password"
                  autoComplete="new-password"
                  value={form.senha}
                  onChange={(evento) =>
                    setForm({ ...form, senha: evento.target.value })
                  }
                />
              </Campo>
            ) : (
              <Campo
                rotulo="Redefinir senha (opcional)"
                htmlFor="usuario-senha"
                dica="Mínimo de 12 caracteres. Ao redefinir, o usuário deverá alterá-la no próximo acesso e todas as sessões serão encerradas."
              >
                <Entrada
                  id="usuario-senha"
                  type="password"
                  autoComplete="new-password"
                  value={form.senha}
                  onChange={(evento) =>
                    setForm({ ...form, senha: evento.target.value })
                  }
                />
              </Campo>
            )}
            <Campo rotulo="Cargo" htmlFor="usuario-cargo">
              <Selecao
                id="usuario-cargo"
                value={form.cargoId}
                onChange={(evento) =>
                  setForm({ ...form, cargoId: evento.target.value })
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
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={form.ativo}
                disabled={form.id !== null && form.ativo}
                onChange={(evento) =>
                  setForm({ ...form, ativo: evento.target.checked })
                }
              />
              Ativo
            </label>
            {form.id !== null && form.ativo ? (
              <p className="text-xs text-slate-500">
                Para desativar, use a ação “Desativar” na lista, informando o
                usuário de destino das atribuições.
              </p>
            ) : null}
          </div>
        ) : null}
      </Modal>

      <Modal
        aberto={rolesUsuario !== null}
        titulo={`Papéis de ${rolesUsuario?.nome ?? ''}`}
        aoFechar={() => setRolesUsuario(null)}
        rodape={
          <>
            <Botao variante="secundario" onClick={() => setRolesUsuario(null)}>
              Cancelar
            </Botao>
            <Botao disabled={salvando} onClick={salvarRoles}>
              Salvar
            </Botao>
          </>
        }
      >
        <p className="mb-3 text-sm text-slate-500">
          Selecione os papéis do usuário. Cada papel concede as permissões
          listadas.
        </p>
        {papels.length === 0 ? (
          <p className="text-sm text-slate-500">Nenhum papel cadastrado.</p>
        ) : (
          <ul className="flex max-h-96 flex-col gap-2 overflow-y-auto pr-1">
            {papels.map((papel) => {
              const marcado = rolesSelecionados.includes(papel.id);
              return (
                <li
                  key={papel.id}
                  className="rounded-md border border-slate-200 p-3"
                >
                  <label className="flex items-start gap-2">
                    <input
                      type="checkbox"
                      className="mt-0.5 h-4 w-4 rounded border-slate-300"
                      checked={marcado}
                      onChange={(evento) =>
                        setRolesSelecionados((atual) =>
                          evento.target.checked
                            ? [...atual, papel.id]
                            : atual.filter((valor) => valor !== papel.id),
                        )
                      }
                    />
                    <span className="flex-1">
                      <span className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-medium text-slate-800">
                          {papel.nome}
                        </span>
                        <Etiqueta
                          tom={papel.permissoes.length > 0 ? 'info' : 'neutro'}
                        >
                          {papel.permissoes.length} permissõe
                          {papel.permissoes.length === 1 ? 'm' : 's'}
                        </Etiqueta>
                      </span>
                      <span className="mt-1 block text-xs text-slate-500">
                        {papel.descricao ? (
                          <span className="block italic">
                            {papel.descricao}
                          </span>
                        ) : null}
                        {papel.permissoes.length === 0
                          ? 'Nenhuma permissão concedida.'
                          : agruparPermissoes(papel.permissoes)
                              .map(
                                (grupo) =>
                                  `${grupo.modulo}: ${grupo.itens
                                    .map(
                                      (permissao) =>
                                        permissao.descricao ??
                                        permissao.codigo,
                                    )
                                    .join(', ')}`,
                              )
                              .join(' • ')}
                      </span>
                    </span>
                  </label>
                </li>
              );
            })}
          </ul>
        )}
      </Modal>

      <Modal
        aberto={setoresUsuario !== null}
        titulo={`Setores de ${setoresUsuario?.nome ?? ''}`}
        aoFechar={() => setSetoresUsuario(null)}
        rodape={
          <>
            <Botao
              variante="secundario"
              onClick={() => setSetoresUsuario(null)}
            >
              Cancelar
            </Botao>
            <Botao disabled={salvandoSetores} onClick={salvarSetores}>
              {salvandoSetores ? 'Salvando…' : 'Salvar'}
            </Botao>
          </>
        }
      >
        <p className="mb-3 text-sm text-slate-500">
          Selecione os setores do usuário e indique o setor principal. O setor
          principal é sugerido automaticamente ao atribuir o usuário a uma
          etapa do processo.
        </p>
        {setores.length === 0 ? (
          <p className="text-sm text-slate-500">Nenhum setor cadastrado.</p>
        ) : (
          <ul className="flex max-h-96 flex-col gap-2 overflow-y-auto pr-1">
            {setores.map((setor) => {
              const marcado = setoresSelecionados.includes(setor.id);
              const jaVinculado = setoresUsuario?.setores.some(
                (vinculo) => vinculo.id === setor.id,
              );
              const disponivel = setor.ativo || jaVinculado;
              return (
                <li
                  key={setor.id}
                  className="rounded-md border border-slate-200 p-3"
                >
                  <div className="flex flex-wrap items-center gap-3">
                    <label className="flex flex-1 items-center gap-2">
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-slate-300"
                        checked={marcado}
                        disabled={!disponivel}
                        onChange={(evento) =>
                          alternarSetor(setor.id, evento.target.checked)
                        }
                      />
                      <span className="text-sm font-medium text-slate-800">
                        {setor.nome}
                      </span>
                      {!setor.ativo ? (
                        <Etiqueta tom="neutro">Inativo</Etiqueta>
                      ) : null}
                    </label>
                    <label className="flex items-center gap-2 text-xs text-slate-600">
                      <input
                        type="radio"
                        name="setor-principal"
                        className="h-4 w-4 border-slate-300"
                        checked={setorPrincipalId === String(setor.id)}
                        disabled={!marcado}
                        onChange={() => setSetorPrincipalId(String(setor.id))}
                      />
                      Principal
                    </label>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Modal>

      <Modal
        aberto={desativando !== null}
        titulo="Desativar usuário"
        aoFechar={() => setDesativando(null)}
        rodape={
          <>
            <Botao variante="secundario" onClick={() => setDesativando(null)}>
              Cancelar
            </Botao>
            <Botao
              variante="perigo"
              disabled={processandoDesativar}
              onClick={desativar}
            >
              {processandoDesativar ? 'Desativando…' : 'Desativar'}
            </Botao>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <p className="text-sm text-slate-600">
            Desativar <strong>{desativando?.nome}</strong>? O usuário perderá o
            acesso imediatamente, as sessões serão revogadas, as delegações
            serão canceladas e as atribuições serão transferidas.
          </p>
          <Campo
            rotulo="Usuário de destino das atribuições"
            htmlFor="destino-desativar"
            dica="Obrigatório quando o usuário possuir processos ou etapas atribuídos. As etapas assumem o setor principal do destino."
          >
            <Selecao
              id="destino-desativar"
              value={destinoDesativarId}
              onChange={(evento) => setDestinoDesativarId(evento.target.value)}
            >
              <option value="">Sem transferência</option>
              {usuariosAtribuiveis.map((usuario) => (
                <option key={usuario.id} value={usuario.id}>
                  {usuario.nome}
                </option>
              ))}
            </Selecao>
          </Campo>
          <p className="text-xs text-slate-500">
            O histórico e as movimentações são preservados.
          </p>
        </div>
      </Modal>

      <Modal
        aberto={sessoesUsuario !== null}
        titulo={`Sessões de ${sessoesUsuario?.nome ?? ''}`}
        aoFechar={() => setSessoesUsuario(null)}
        rodape={
          <Botao variante="secundario" onClick={() => setSessoesUsuario(null)}>
            Fechar
          </Botao>
        }
      >
        {carregandoSessoes ? (
          <Carregando texto="Carregando sessões…" />
        ) : sessoes.length === 0 ? (
          <p className="text-sm text-slate-500">Nenhuma sessão ativa.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {sessoes.map((sessao) => (
              <li
                key={sessao.id}
                className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="text-sm">
                  <p className="font-medium text-slate-800">
                    {sessao.userAgent
                      ? sessao.userAgent.slice(0, 90)
                      : 'Dispositivo não identificado'}
                    {sessao.atual ? ' (sessão atual)' : ''}
                  </p>
                  <p className="text-xs text-slate-500">
                    IP {sessao.ip ?? '—'} · Início{' '}
                    {formatarDataHora(sessao.criadaEm)} · Expira{' '}
                    {formatarDataHora(sessao.expiraEm)}
                  </p>
                </div>
                <Botao
                  variante="secundario"
                  disabled={revogandoSessao === sessao.id}
                  onClick={() => revogarSessao(sessao.id)}
                >
                  {revogandoSessao === sessao.id ? 'Revogando…' : 'Revogar'}
                </Botao>
              </li>
            ))}
          </ul>
        )}
      </Modal>

      <Modal
        aberto={resetandoMfa !== null}
        titulo="Redefinir MFA"
        aoFechar={() => setResetandoMfa(null)}
        rodape={
          <>
            <Botao variante="secundario" onClick={() => setResetandoMfa(null)}>
              Cancelar
            </Botao>
            <Botao
              variante="perigo"
              disabled={processandoAcao}
              onClick={confirmarResetMfa}
            >
              {processandoAcao ? 'Redefinindo…' : 'Redefinir MFA'}
            </Botao>
          </>
        }
      >
        <p className="text-sm text-slate-600">
          Redefinir o MFA de <strong>{resetandoMfa?.nome}</strong>? As sessões
          serão revogadas e o usuário deverá configurar um novo autenticador no
          próximo acesso. Esta ação fica registrada na auditoria.
        </p>
      </Modal>
    </div>
  );
}
