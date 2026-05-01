import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User as SupabaseUser } from "@supabase/supabase-js";

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

// Mock users for initial demo (will work alongside Supabase auth)
const MOCK_USERS: (User & { senha: string; authId: string })[] = [
  { id: "1", nome: "Carlos (Admin)", usuario: "admin", senha: "admin123", role: "admin", comissao: 0, authId: "" },
  { id: "2", nome: "João", usuario: "joao", senha: "1234", role: "barbeiro", comissao: 50, authId: "" },
  { id: "3", nome: "Pedro", usuario: "pedro", senha: "1234", role: "barbeiro", comissao: 50, authId: "" },
];

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing session
    setLoading(false);
  }, []);

  const login = async (usuario: string, senha: string): Promise<boolean> => {
    // Try mock users first (for demo)
    const found = MOCK_USERS.find((u) => u.usuario === usuario && u.senha === senha);
    if (found) {
      const { senha: _, ...userData } = found;
      setUser(userData);
      return true;
    }
    return false;
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
