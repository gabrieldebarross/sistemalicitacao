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
  EstadoVazio,
  Modal,
} from '@/components/ui';
import { api, mensagemDeErro, type Paginacao } from '@/lib/api';
import { useSessao } from '@/lib/session';
import type { Cargo } from '@/lib/tipos';

interface Formulario {
  id: number | null;
  nome: string;
  nomeOriginal: string;
}

const VAZIO: Formulario = { id: null, nome: '', nomeOriginal: '' };

export default function CargosPage() {
  const { temPermissao } = useSessao();
  const podeEditar = temPermissao('cargos.manage');
  const [itens, setItens] = useState<Cargo[]>([]);
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
      const resposta = await api.get<Cargo[]>(`/cargos?${params}`);
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
        nomeOriginal: form.nomeOriginal || undefined,
      };
      if (form.id) {
        await api.patch(`/cargos/${form.id}`, dados);
      } else {
        await api.post('/cargos', dados);
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
        titulo="Cargos"
        descricao="Cargos usados na definição de responsáveis."
        acao={
          podeEditar ? (
            <Botao onClick={() => setForm({ ...VAZIO })}>
              <Plus className="h-4 w-4" aria-hidden="true" />
              Novo cargo
            </Botao>
          ) : null
        }
      />

      <Cartao>
        <div className="border-b border-linha-200 px-4 py-3">
          <Entrada
            placeholder="Buscar por nome"
            aria-label="Buscar cargos"
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
          <EstadoVazio titulo="Nenhum cargo cadastrado" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-linha-200 text-xs uppercase text-tinta-500">
                <tr>
                  <th className="px-4 py-2">Nome</th>
                  <th className="px-4 py-2">Nome original</th>
                  <th className="px-4 py-2" />
                </tr>
              </thead>
              <tbody className="divide-y divide-papel-100">
                {itens.map((item) => (
                  <tr key={item.id} className="hover:bg-papel-50">
                    <td className="px-4 py-3 font-medium text-tinta-800">
                      {item.nome}
                    </td>
                    <td className="px-4 py-3 text-tinta-600">
                      {item.nomeOriginal ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {podeEditar ? (
                        <Botao
                          variante="secundario"
                          onClick={() =>
                            setForm({
                              id: item.id,
                              nome: item.nome,
                              nomeOriginal: item.nomeOriginal ?? '',
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
        titulo={form?.id ? 'Editar cargo' : 'Novo cargo'}
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
            <Campo rotulo="Nome" htmlFor="cargo-nome" obrigatorio>
              <Entrada
                id="cargo-nome"
                value={form.nome}
                onChange={(evento) =>
                  setForm({ ...form, nome: evento.target.value })
                }
              />
            </Campo>
            <Campo
              rotulo="Nome original"
              htmlFor="cargo-original"
              dica="Mantido para rastreabilidade do nome de origem."
            >
              <Entrada
                id="cargo-original"
                value={form.nomeOriginal}
                onChange={(evento) =>
                  setForm({ ...form, nomeOriginal: evento.target.value })
                }
              />
            </Campo>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
