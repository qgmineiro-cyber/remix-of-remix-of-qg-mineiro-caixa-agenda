import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import ThemeToggle from "@/components/ThemeToggle";
import { Scissors } from "lucide-react";

const Login = () => {
  const [usuario, setUsuario] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErro("");
    const ok = login(usuario, senha);
    if (ok) {
      navigate("/dashboard");
    } else {
      setErro("Usuário ou senha inválidos");
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-sm animate-fade-in">
        <div className="flex flex-col items-center mb-10">
          <Scissors size={40} className="text-foreground mb-3" />
          <h1 className="text-2xl font-bold tracking-tight">QG do Mineiro</h1>
          <p className="text-muted-foreground text-sm mt-1">Sistema de Gestão</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-1 block">Usuário</label>
            <input
              type="text"
              value={usuario}
              onChange={(e) => setUsuario(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all"
              placeholder="Digite seu usuário"
              autoComplete="username"
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Senha</label>
            <input
              type="password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all"
              placeholder="••••••••"
              autoComplete="current-password"
            />
          </div>

          {erro && <p className="text-destructive text-sm">{erro}</p>}

          <button
            type="submit"
            className="w-full py-3 rounded-lg bg-primary text-primary-foreground font-medium hover:opacity-90 transition-opacity"
          >
            Entrar
          </button>
        </form>

        <p className="text-center text-muted-foreground text-xs mt-6">
          Acesso restrito. Fale com o administrador.
        </p>
      </div>
    </div>
  );
};

export default Login;
