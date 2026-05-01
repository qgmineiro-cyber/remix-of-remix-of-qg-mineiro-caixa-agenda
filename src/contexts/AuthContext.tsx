import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";

export type UserRole = "barbeiro" | "admin";

export interface User {
  id: string;
  nome: string;
  usuario: string;
  role: UserRole;
  comissao: number;
  authId: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (usuario: string, senha: string) => Promise<boolean>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: async () => false,
  logout: async () => {},
});

const EMAIL_DOMAIN = "qgmineiro.app";

async function fetchUserProfile(authId: string): Promise<User | null> {
  const { data: barbeiro, error } = await supabase
    .from("barbeiros")
    .select("id, nome, usuario, comissao, user_id")
    .eq("user_id", authId)
    .single();

  if (error || !barbeiro) return null;

  const { data: roleData } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", authId)
    .single();

  return {
    id: barbeiro.id,
    nome: barbeiro.nome,
    usuario: barbeiro.usuario,
    comissao: barbeiro.comissao,
    role: (roleData?.role as UserRole) ?? "barbeiro",
    authId,
  };
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        const profile = await fetchUserProfile(session.user.id);
        setUser(profile);
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        const profile = await fetchUserProfile(session.user.id);
        setUser(profile);
      } else {
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (usuario: string, senha: string): Promise<boolean> => {
    const email = `${usuario}@${EMAIL_DOMAIN}`;
    const { error } = await supabase.auth.signInWithPassword({ email, password: senha });
    return !error;
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
