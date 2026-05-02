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
  login: (email: string, senha: string) => Promise<boolean>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: async () => false,
  logout: async () => {},
});

async function fetchUserProfile(authId: string): Promise<User | null> {
  const { data: barbeiro, error } = await supabase
    .from("barbeiros")
    .select("id, nome, usuario, comissao, user_id")
    .eq("user_id", authId)
    .maybeSingle();

  if (error || !barbeiro) return null;

  const { data: roleData } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", authId)
    .maybeSingle();

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
    let mounted = true;

    const syncSessionUser = async (authUserId?: string | null) => {
      if (!mounted) return;

      if (!authUserId) {
        setUser(null);
        return;
      }

      await (supabase as any).rpc("ensure_current_user_profile");

      if (!mounted) return;
      const profile = await fetchUserProfile(authUserId);
      if (mounted) setUser(profile);
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      window.setTimeout(() => {
        void syncSessionUser(session?.user?.id ?? null);
      }, 0);
    });

    void supabase.auth.getSession().then(({ data: { session } }) => {
      void syncSessionUser(session?.user?.id ?? null).finally(() => {
        if (mounted) setLoading(false);
      });
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, senha: string): Promise<boolean> => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password: senha });

    if (error || !data.user) return false;

    await (supabase as any).rpc("ensure_current_user_profile");
    const profile = await fetchUserProfile(data.user.id);
    setUser(profile);

    return !!profile;
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
