'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { api } from './api';

export interface Perfil {
  id: number;
  nome: string;
  email: string;
  ativo: boolean;
  cargo: { id: number; nome: string } | null;
  senhaProvisoria: boolean;
  roles: string[];
  permissoes: string[];
}

interface ContextoSessao {
  perfil: Perfil | null;
  carregando: boolean;
  entrar: (email: string, senha: string) => Promise<Perfil>;
  sair: () => Promise<void>;
  recarregar: () => Promise<void>;
  temPermissao: (codigo: string) => boolean;
}

const SessaoContext = createContext<ContextoSessao | null>(null);

export function SessaoProvider({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [carregando, setCarregando] = useState(true);

  const recarregar = useCallback(async () => {
    try {
      const resposta = await api.get<Perfil>('/auth/me');
      setPerfil(resposta.dados);
    } catch {
      setPerfil(null);
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    void recarregar();
  }, [recarregar]);

  const entrar = useCallback(
    async (email: string, senha: string): Promise<Perfil> => {
      const resposta = await api.post<{ perfil: Perfil }>('/auth/login', {
        email,
        senha,
      });
      setPerfil(resposta.dados.perfil);
      return resposta.dados.perfil;
    },
    [],
  );

  const sair = useCallback(async () => {
    try {
      await api.post('/auth/logout');
    } finally {
      setPerfil(null);
    }
  }, []);

  const temPermissao = useCallback(
    (codigo: string) => perfil?.permissoes.includes(codigo) ?? false,
    [perfil],
  );

  const valor = useMemo<ContextoSessao>(
    () => ({ perfil, carregando, entrar, sair, recarregar, temPermissao }),
    [perfil, carregando, entrar, sair, recarregar, temPermissao],
  );

  return (
    <SessaoContext.Provider value={valor}>{children}</SessaoContext.Provider>
  );
}

export function useSessao(): ContextoSessao {
  const contexto = useContext(SessaoContext);
  if (!contexto) {
    throw new Error('useSessao deve ser usado dentro de SessaoProvider.');
  }
  return contexto;
}

export function temPermissao(
  perfil: Perfil | null,
  codigo: string,
): boolean {
  return perfil?.permissoes.includes(codigo) ?? false;
}
