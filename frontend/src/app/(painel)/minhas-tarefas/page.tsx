'use client';

import { AlertTriangle, CalendarClock, ListTodo, UserCheck } from 'lucide-react';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';

import {
  AlertaErro,
  Botao,
  CabecalhoPagina,
  Carregando,
  Cartao,
  Entrada,
  EstadoVazio,
  Etiqueta,
  Selecao,
} from '@/components/ui';
import { api, mensagemDeErro, type Paginacao } from '@/lib/api';
import {
  ROTULOS_STATUS_ETAPA,
  formatarData,
} from '@/lib/format';
import type { ResumoTarefas, Tarefa } from '@/lib/tipos';

const TOM_ETAPA: Record<string, 'neutro' | 'info' | 'sucesso' | 'alerta'> = {
  PENDENTE: 'neutro',
  EM_ANDAMENTO: 'info',
  CONCLUIDA: 'sucesso',
  BLOQUEADA: 'alerta',
  PULADA: 'neutro',
};

export default function MinhasTarefasPage() {
  const [tarefas, setTarefas] = useState<Tarefa[]>([]);
  const [resumo, setResumo] = useState<ResumoTarefas | null>(null);
  const [paginacao, setPaginacao] = useState<Paginacao | null>(null);
  const [status, setStatus] = useState('');
  const [atrasado, setAtrasado] = useState(false);
  const [pagina, setPagina] = useState(1);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');

  const carregar = useCallback(async () => {
    setCarregando(true);
    setErro('');
    const params = new URLSearchParams({
      pagina: String(pagina),
      tamanhoPagina: '15',
    });
    if (status) params.set('status', status);
    if (atrasado) params.set('atrasado', 'true');
    try {
      const resposta = await api.get<Tarefa[]>(
        `/tarefas?${params.toString()}`,
      );
      setTarefas(resposta.dados);
      setPaginacao(resposta.paginacao ?? null);
      setResumo((resposta.resumo as ResumoTarefas | undefined) ?? null);
    } catch (falha) {
      setErro(mensagemDeErro(falha));
    } finally {
      setCarregando(false);
    }
  }, [pagina, status, atrasado]);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  const cartoes = [
    {
      rotulo: 'Total de tarefas',
      valor: resumo?.total ?? 0,
      icone: ListTodo,
      classe: 'text-rota-800 bg-rota-50 border-rota-200',
    },
    {
      rotulo: 'Atrasadas',
      valor: resumo?.atrasadas ?? 0,
      icone: AlertTriangle,
      classe: 'text-red-800 bg-red-50 border-red-200',
    },
    {
      rotulo: 'Com prazo hoje',
      valor: resumo?.hoje ?? 0,
      icone: CalendarClock,
      classe: 'text-amber-800 bg-amber-50 border-amber-200',
    },
    {
      rotulo: 'Sem prazo definido',
      valor: resumo?.semPrazo ?? 0,
      icone: UserCheck,
      classe: 'text-tinta-700 bg-papel-50 border-linha-200',
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <CabecalhoPagina
        titulo="Minhas tarefas"
        descricao="Etapas ativas atribuídas a você, com prazo e próxima ação."
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {cartoes.map((cartao) => {
          const Icone = cartao.icone;
          return (
            <div
              key={cartao.rotulo}
              className={`rounded-lg border p-4 ${cartao.classe}`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-medium uppercase tracking-wide">
                  {cartao.rotulo}
                </span>
                <Icone className="h-4 w-4" aria-hidden="true" />
              </div>
              <p className="mt-2 text-2xl font-semibold">{cartao.valor}</p>
            </div>
          );
        })}
      </div>

      <Cartao>
        <div className="flex flex-wrap items-center gap-3 border-b border-linha-200 px-4 py-3">
          <Selecao
            aria-label="Filtrar por situação da etapa"
            value={status}
            onChange={(evento) => {
              setStatus(evento.target.value);
              setPagina(1);
            }}
            className="max-w-56"
          >
            <option value="">Todas as situações</option>
            <option value="PENDENTE">Pendentes</option>
            <option value="EM_ANDAMENTO">Em andamento</option>
            <option value="BLOQUEADA">Bloqueadas</option>
          </Selecao>
          <label className="flex items-center gap-2 text-sm text-tinta-700">
            <Entrada
              type="checkbox"
              checked={atrasado}
              onChange={(evento) => {
                setAtrasado(evento.target.checked);
                setPagina(1);
              }}
              className="h-4 w-4"
            />
            Somente atrasadas
          </label>
        </div>

        {erro ? (
          <div className="px-4 py-4">
            <AlertaErro mensagem={erro} />
          </div>
        ) : carregando ? (
          <Carregando texto="Carregando tarefas…" />
        ) : tarefas.length === 0 ? (
          <EstadoVazio
            titulo="Nenhuma tarefa encontrada"
            descricao="Você não possui etapas atribuídas com os filtros atuais."
          />
        ) : (
          <ul className="divide-y divide-papel-100">
            {tarefas.map((tarefa) => (
              <li
                key={`${tarefa.processo.id}-${tarefa.id}`}
                className="flex flex-col gap-3 px-4 py-4 lg:flex-row lg:items-start lg:justify-between"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      href={`/processos/${tarefa.processo.id}`}
                      className="font-medium text-rota-800 hover:underline"
                    >
                      {tarefa.processo.nome || tarefa.processo.numero}
                    </Link>
                    <Etiqueta
                      tom={TOM_ETAPA[tarefa.etapa.status] ?? 'neutro'}
                    >
                      {ROTULOS_STATUS_ETAPA[tarefa.etapa.status] ??
                        tarefa.etapa.status}
                    </Etiqueta>
                    {tarefa.etapa.obrigatoria ? (
                      <Etiqueta tom="info">Obrigatória</Etiqueta>
                    ) : null}
                    {tarefa.atrasada ? (
                      <Etiqueta tom="perigo">
                        Atrasada{tarefa.diasAtraso ? ` há ${tarefa.diasAtraso} dia(s)` : ''}
                      </Etiqueta>
                    ) : null}
                  </div>
                  <p className="mt-1 text-sm text-tinta-700">
                    {tarefa.etapa.nome}
                  </p>
                  <p className="mt-1 text-xs text-tinta-500">
                    Nº {tarefa.processo.numero} · Prazo:{' '}
                    {formatarData(tarefa.etapa.dataPrevista)} ·{' '}
                    {tarefa.setor?.nome ?? 'Sem setor'}
                    {tarefa.responsavel
                      ? ` · Responsável: ${tarefa.responsavel.nome}`
                      : ''}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Link href={`/processos/${tarefa.processo.id}`}>
                    <Botao variante="secundario">
                      {tarefa.proximaAcao === 'INICIAR'
                        ? 'Abrir processo'
                        : tarefa.proximaAcao === 'CONCLUIR'
                          ? 'Abrir para concluir'
                          : 'Abrir para desbloquear'}
                    </Botao>
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}

        {paginacao && paginacao.totalPaginas > 1 ? (
          <div className="flex items-center justify-between border-t border-linha-200 px-4 py-3 text-sm">
            <span className="text-tinta-500">
              Página {paginacao.pagina} de {paginacao.totalPaginas} ({paginacao.total} itens)
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
    </div>
  );
}
