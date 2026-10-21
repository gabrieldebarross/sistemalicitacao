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

interface SelecaoCondicional {
  aplicavel: '' | 'SIM' | 'NAO';
  justificativa: string;
}

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
  const [selecoesCondicionais, setSelecoesCondicionais] = useState<
    Record<number, SelecaoCondicional>
  >({});
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
      setSelecoesCondicionais({});
      setCarregandoFluxos(false);
      return;
    }
    let ativo = true;
    setCarregandoFluxos(true);
    setFluxoId('');
    setSelecoesCondicionais({});
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

  useEffect(() => {
    setSelecoesCondicionais({});
  }, [fluxoId]);

  async function submeter(evento: React.FormEvent) {
    evento.preventDefault();
    setErro('');
    if (!fluxoId) {
      setErro('Selecione o fluxo de trabalho que será usado no processo.');
      return;
    }
    const fluxoSelecionado = fluxos.find(
      (fluxo) => String(fluxo.id) === fluxoId,
    );
    const etapasCondicionais =
      fluxoSelecionado?.etapasCondicionais ?? [];
    for (const etapa of etapasCondicionais) {
      const selecao = selecoesCondicionais[etapa.id];
      if (!selecao?.aplicavel) {
        setErro(
          `Informe se a etapa condicional "${etapa.nome}" é aplicável.`,
        );
        return;
      }
      if (
        selecao.aplicavel === 'NAO' &&
        selecao.justificativa.trim().length < 5
      ) {
        setErro(
          `Justifique por que a etapa condicional "${etapa.nome}" não é aplicável.`,
        );
        return;
      }
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
        etapasCondicionais: etapasCondicionais.map((etapa) => {
          const selecao = selecoesCondicionais[etapa.id];
          return {
            etapaId: etapa.id,
            aplicavel: selecao.aplicavel === 'SIM',
            justificativa:
              selecao.aplicavel === 'NAO'
                ? selecao.justificativa.trim()
                : undefined,
          };
        }),
      });
      router.replace(`/processos/${resposta.dados.id}`);
    } catch (falha) {
      setErro(mensagemDeErro(falha));
    } finally {
      setEnviando(false);
    }
  }

  const fluxoSelecionado = fluxos.find(
    (fluxo) => String(fluxo.id) === fluxoId,
  );
  const etapasCondicionais = fluxoSelecionado?.etapasCondicionais ?? [];

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
              onChange={(evento) => {
                setFluxoId(evento.target.value);
                setSelecoesCondicionais({});
              }}
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
          {etapasCondicionais.length > 0 ? (
            <div className="flex flex-col gap-4 rounded-lg border border-sky-200 bg-sky-50/60 px-4 py-4">
              <div>
                <h2 className="text-sm font-semibold text-slate-800">
                  Etapas condicionais
                </h2>
                <p className="text-xs text-slate-600">
                  O fluxo possui etapas cuja aplicabilidade depende do caso
                  concreto. Informe explicitamente cada uma. As etapas não
                  aplicáveis serão registradas como puladas com a justificativa.
                </p>
              </div>
              {etapasCondicionais.map((etapa) => {
                const selecao = selecoesCondicionais[etapa.id] ?? {
                  aplicavel: '',
                  justificativa: '',
                };
                return (
                  <div
                    key={etapa.id}
                    className="flex flex-col gap-2 rounded border border-sky-100 bg-white px-3 py-3"
                  >
                    <p className="text-sm font-medium text-slate-800">
                      {etapa.sequencia}. {etapa.nome}
                      {etapa.faseNome ? (
                        <span className="font-normal text-slate-500">
                          {' '}
                          · {etapa.faseNome}
                        </span>
                      ) : null}
                    </p>
                    {etapa.condicaoAplicabilidade ? (
                      <p className="text-xs text-slate-600">
                        Condição: {etapa.condicaoAplicabilidade}
                      </p>
                    ) : null}
                    <Campo
                      rotulo="Aplicável?"
                      htmlFor={`condicional-${etapa.id}`}
                      obrigatorio
                    >
                      <Selecao
                        id={`condicional-${etapa.id}`}
                        required
                        value={selecao.aplicavel}
                        onChange={(evento) =>
                          setSelecoesCondicionais((atuais) => ({
                            ...atuais,
                            [etapa.id]: {
                              ...selecao,
                              aplicavel: evento.target.value as
                                | ''
                                | 'SIM'
                                | 'NAO',
                            },
                          }))
                        }
                      >
                        <option value="">Selecione…</option>
                        <option value="SIM">Sim, é aplicável</option>
                        <option value="NAO">Não é aplicável</option>
                      </Selecao>
                    </Campo>
                    {selecao.aplicavel === 'NAO' ? (
                      <Campo
                        rotulo="Justificativa da não aplicabilidade"
                        htmlFor={`condicional-justificativa-${etapa.id}`}
                        obrigatorio
                      >
                        <AreaTexto
                          id={`condicional-justificativa-${etapa.id}`}
                          required
                          value={selecao.justificativa}
                          onChange={(evento) =>
                            setSelecoesCondicionais((atuais) => ({
                              ...atuais,
                              [etapa.id]: {
                                ...selecao,
                                justificativa: evento.target.value,
                              },
                            }))
                          }
                        />
                      </Campo>
                    ) : null}
                  </div>
                );
              })}
            </div>
          ) : null}
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
