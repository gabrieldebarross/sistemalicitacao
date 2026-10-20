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
import type {
  FluxoDisponivel,
  ProcessoDetalhe,
  TipoProcesso,
} from '@/lib/tipos';

export default function NovoProcessoPage() {
  const router = useRouter();
  const [tipos, setTipos] = useState<TipoProcesso[]>([]);
  const [fluxos, setFluxos] = useState<FluxoDisponivel[]>([]);
  const [nome, setNome] = useState('');
  const [numero, setNumero] = useState('');
  const [objeto, setObjeto] = useState('');
  const [descricao, setDescricao] = useState('');
  const [tipoProcessoId, setTipoProcessoId] = useState('');
  const [fluxoId, setFluxoId] = useState('');
  const [carregandoFluxos, setCarregandoFluxos] = useState(false);
  const [erro, setErro] = useState('');
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    api
      .get<TipoProcesso[]>('/tipos-processo?ativo=true&tamanhoPagina=100')
      .then((resposta) => setTipos(resposta.dados))
      .catch(() => setTipos([]));
  }, []);

  useEffect(() => {
    if (!tipoProcessoId) {
      setFluxos([]);
      setFluxoId('');
      setCarregandoFluxos(false);
      return;
    }
    let ativo = true;
    setCarregandoFluxos(true);
    setFluxoId('');
    api
      .get<FluxoDisponivel[]>(
        `/processos/fluxos-disponiveis?tipoProcessoId=${tipoProcessoId}`,
      )
      .then((resposta) => {
        if (!ativo) return;
        setFluxos(resposta.dados);
        // Com um único fluxo publicado, pré-seleciona; com vários, exige escolha.
        setFluxoId(
          resposta.dados.length === 1 ? String(resposta.dados[0].id) : '',
        );
      })
      .catch(() => {
        if (!ativo) return;
        setFluxos([]);
        setFluxoId('');
      })
      .finally(() => {
        if (ativo) setCarregandoFluxos(false);
      });
    return () => {
      ativo = false;
    };
  }, [tipoProcessoId]);

  async function submeter(evento: React.FormEvent) {
    evento.preventDefault();
    setErro('');
    if (!fluxoId) {
      setErro('Selecione o fluxo de trabalho que será usado no processo.');
      return;
    }
    setEnviando(true);
    try {
      const resposta = await api.post<ProcessoDetalhe>('/processos', {
        nome,
        numero,
        objeto,
        descricao: descricao || undefined,
        tipoProcessoId: Number(tipoProcessoId),
        fluxoId: Number(fluxoId),
      });
      router.replace(`/processos/${resposta.dados.id}`);
    } catch (falha) {
      setErro(mensagemDeErro(falha));
    } finally {
      setEnviando(false);
    }
  }

  const semFluxoPublicado =
    tipoProcessoId !== '' && !carregandoFluxos && fluxos.length === 0;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-800">Novo processo</h1>
        <p className="text-sm text-slate-500">
          O processo é instanciado a partir de um fluxo publicado do tipo
          escolhido.
        </p>
      </div>

      <Cartao className="max-w-2xl">
        <CabecalhoCartao titulo="Dados do processo" />
        <form onSubmit={submeter} className="flex flex-col gap-4 px-4 py-4">
          {erro ? <AlertaErro mensagem={erro} /> : null}
          <Campo
            rotulo="Nome do processo"
            htmlFor="nome"
            obrigatorio
            dica="Identificação gerencial usada nas listagens e na auditoria."
          >
            <Entrada
              id="nome"
              required
              maxLength={150}
              value={nome}
              onChange={(evento) => setNome(evento.target.value)}
            />
          </Campo>
          <Campo
            rotulo="Número"
            htmlFor="numero"
            obrigatorio
            dica="Identificador administrativo único do processo."
          >
            <Entrada
              id="numero"
              required
              maxLength={50}
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
          <Campo
            rotulo="Fluxo de trabalho"
            htmlFor="fluxo"
            obrigatorio
            dica="Somente fluxos publicados do tipo escolhido são exibidos."
            erro={
              semFluxoPublicado
                ? 'Este tipo não possui fluxo publicado. Publique um fluxo antes de criar o processo.'
                : undefined
            }
          >
            <Selecao
              id="fluxo"
              required
              disabled={!tipoProcessoId || carregandoFluxos}
              value={fluxoId}
              onChange={(evento) => setFluxoId(evento.target.value)}
            >
              <option value="">
                {carregandoFluxos ? 'Carregando fluxos…' : 'Selecione…'}
              </option>
              {fluxos.map((fluxo) => (
                <option key={fluxo.id} value={fluxo.id}>
                  {fluxo.nome} (v{fluxo.versao})
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
            <Botao
              type="submit"
              disabled={enviando || !fluxoId || semFluxoPublicado}
            >
              {enviando ? 'Criando…' : 'Criar processo'}
            </Botao>
          </div>
        </form>
      </Cartao>
    </div>
  );
}
