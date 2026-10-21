'use client';

import { Plus } from 'lucide-react';
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
} from '@/components/ui';
import { api, mensagemDeErro, type Paginacao } from '@/lib/api';
import { useSessao } from '@/lib/session';
import type { Setor } from '@/lib/tipos';

interface Formulario {
  id: number | null;
  nome: string;
  sigla: string;
  ativo: boolean;
}

const VAZIO: Formulario = { id: null, nome: '', sigla: '', ativo: true };

export default function SetoresPage() {
  const { temPermissao } = useSessao();
  const podeEditar = temPermissao('setores.manage');
  const [itens, setItens] = useState<Setor[]>([]);
  const [paginacao, setPaginacao] = useState<Paginacao | null>(null);
  const [busca, setBusca] = useState('');
  const [pagina, setPagina] = useState(1);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const [form, setForm] = useState<Formulario | null>(null);
  const [salvando, setSalvando] = useState(false);

  const carregar = useCallback(async () => {
    setCarregando(true);
    setErro('');
    const params = new URLSearchParams({ pagina: String(pagina), tamanhoPagina: '10' });
    if (busca) params.set('busca', busca);
    try {
      const resposta = await api.get<Setor[]>(`/setores?${params}`);
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

  async function salvar() {
    if (!form) return;
    setSalvando(true);
    setErro('');
    try {
      const dados = {
        nome: form.nome,
        sigla: form.sigla || undefined,
        ativo: form.ativo,
      };
      if (form.id) {
        await api.patch(`/setores/${form.id}`, dados);
      } else {
        await api.post('/setores', dados);
      }
      setForm(null);
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
        titulo="Setores"
        descricao="Unidades administrativas responsáveis pelas etapas."
        acao={
          podeEditar ? (
            <Botao onClick={() => setForm({ ...VAZIO })}>
              <Plus className="h-4 w-4" aria-hidden="true" />
              Novo setor
            </Botao>
          ) : null
        }
      />

      <Cartao>
        <div className="border-b border-linha-200 px-4 py-3">
          <Entrada
            placeholder="Buscar por nome"
            aria-label="Buscar setores"
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
          <EstadoVazio titulo="Nenhum setor cadastrado" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-linha-200 text-xs uppercase text-tinta-500">
                <tr>
                  <th className="px-4 py-2">Nome</th>
                  <th className="px-4 py-2">Sigla</th>
                  <th className="px-4 py-2">Situação</th>
                  <th className="px-4 py-2" />
                </tr>
              </thead>
              <tbody className="divide-y divide-papel-100">
                {itens.map((item) => (
                  <tr key={item.id} className="hover:bg-papel-50">
                    <td className="px-4 py-3 font-medium text-tinta-800">
                      {item.nome}
                    </td>
                    <td className="px-4 py-3 text-tinta-600">{item.sigla ?? '—'}</td>
                    <td className="px-4 py-3">
                      <Etiqueta tom={item.ativo ? 'sucesso' : 'neutro'}>
                        {item.ativo ? 'Ativo' : 'Inativo'}
                      </Etiqueta>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {podeEditar ? (
                        <Botao
                          variante="secundario"
                          onClick={() =>
                            setForm({
                              id: item.id,
                              nome: item.nome,
                              sigla: item.sigla ?? '',
                              ativo: item.ativo,
                            })
                          }
                        >
                          Editar
                        </Botao>
                      ) : null}
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
        titulo={form?.id ? 'Editar setor' : 'Novo setor'}
        aoFechar={() => setForm(null)}
        rodape={
          <>
            <Botao variante="secundario" onClick={() => setForm(null)}>
              Cancelar
            </Botao>
            <Botao disabled={salvando || !form?.nome.trim()} onClick={salvar}>
              Salvar
            </Botao>
          </>
        }
      >
        {form ? (
          <div className="flex flex-col gap-4">
            <Campo rotulo="Nome" htmlFor="setor-nome" obrigatorio>
              <Entrada
                id="setor-nome"
                value={form.nome}
                onChange={(evento) =>
                  setForm({ ...form, nome: evento.target.value })
                }
              />
            </Campo>
            <Campo rotulo="Sigla" htmlFor="setor-sigla">
              <Entrada
                id="setor-sigla"
                maxLength={30}
                value={form.sigla}
                onChange={(evento) =>
                  setForm({ ...form, sigla: evento.target.value })
                }
              />
            </Campo>
            <label className="flex items-center gap-2 text-sm text-tinta-700">
              <input
                type="checkbox"
                checked={form.ativo}
                onChange={(evento) =>
                  setForm({ ...form, ativo: evento.target.checked })
                }
              />
              Ativo
            </label>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
