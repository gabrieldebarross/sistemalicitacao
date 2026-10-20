'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import {
  AlertaErro,
  AreaTexto,
  Botao,
  CabecalhoCartao,
  Campo,
  Cartao,
  Entrada,
  Selecao,
} from '@/components/ui';
import { api, mensagemDeErro } from '@/lib/api';
import type { ProcessoDetalhe, TipoProcesso } from '@/lib/tipos';

export default function NovoProcessoPage() {
  const router = useRouter();
  const [tipos, setTipos] = useState<TipoProcesso[]>([]);
  const [numero, setNumero] = useState('');
  const [objeto, setObjeto] = useState('');
  const [descricao, setDescricao] = useState('');
  const [tipoProcessoId, setTipoProcessoId] = useState('');
  const [erro, setErro] = useState('');
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    api
      .get<TipoProcesso[]>('/tipos-processo?ativo=true&tamanhoPagina=100')
      .then((resposta) => setTipos(resposta.dados))
      .catch(() => setTipos([]));
  }, []);

  async function submeter(evento: React.FormEvent) {
    evento.preventDefault();
    setErro('');
    setEnviando(true);
    try {
      const resposta = await api.post<ProcessoDetalhe>('/processos', {
        numero,
        objeto,
        descricao: descricao || undefined,
        tipoProcessoId: Number(tipoProcessoId),
      });
      router.replace(`/processos/${resposta.dados.id}`);
    } catch (falha) {
      setErro(mensagemDeErro(falha));
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-800">Novo processo</h1>
        <p className="text-sm text-slate-500">
          O processo é instanciado a partir do fluxo publicado do tipo escolhido.
        </p>
      </div>

      <Cartao className="max-w-2xl">
        <CabecalhoCartao titulo="Dados do processo" />
        <form onSubmit={submeter} className="flex flex-col gap-4 px-4 py-4">
          {erro ? <AlertaErro mensagem={erro} /> : null}
          <Campo rotulo="Número" htmlFor="numero" obrigatorio>
            <Entrada
              id="numero"
              required
              value={numero}
              onChange={(evento) => setNumero(evento.target.value)}
            />
          </Campo>
          <Campo rotulo="Tipo de processo" htmlFor="tipo" obrigatorio>
            <Selecao
              id="tipo"
              required
              value={tipoProcessoId}
              onChange={(evento) => setTipoProcessoId(evento.target.value)}
            >
              <option value="">Selecione…</option>
              {tipos.map((tipo) => (
                <option key={tipo.id} value={tipo.id}>
                  {tipo.nome}
                </option>
              ))}
            </Selecao>
          </Campo>
          <Campo rotulo="Objeto" htmlFor="objeto" obrigatorio>
            <Entrada
              id="objeto"
              required
              maxLength={500}
              value={objeto}
              onChange={(evento) => setObjeto(evento.target.value)}
            />
          </Campo>
          <Campo rotulo="Descrição" htmlFor="descricao">
            <AreaTexto
              id="descricao"
              value={descricao}
              onChange={(evento) => setDescricao(evento.target.value)}
            />
          </Campo>
          <div className="flex justify-end gap-2">
            <Botao
              variante="secundario"
              onClick={() => router.back()}
              disabled={enviando}
            >
              Cancelar
            </Botao>
            <Botao type="submit" disabled={enviando}>
              {enviando ? 'Criando…' : 'Criar processo'}
            </Botao>
          </div>
        </form>
      </Cartao>
    </div>
  );
}
