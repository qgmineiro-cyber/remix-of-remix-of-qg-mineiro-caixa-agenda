import { ReactNode } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";
import ThemeToggle from "./ThemeToggle";
import {
  ArrowLeft,
  LogOut,
  Scissors,
  LayoutDashboard,
  DollarSign,
  Calendar,
  ClipboardList,
  Users,
  Target,
} from "lucide-react";

const Layout = ({ children }: { children: ReactNode }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  const isAdmin = user?.role === "admin";
  const isDashboard = location.pathname === "/dashboard";

  const handleBack = () => {
    if (window.history.length > 1) navigate(-1);
    else navigate("/dashboard");
  };

  const navItems = [
    { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { path: "/caixa", label: "Caixa", icon: DollarSign },
    { path: "/servicos", label: "Serviços", icon: ClipboardList },
    { path: "/agenda", label: "Agenda", icon: Calendar },
    { path: "/metas", label: "Metas", icon: Target },
    ...(isAdmin
      ? [
          { path: "/financeiro", label: "Financeiro", icon: DollarSign },
          { path: "/barbeiros", label: "Barbeiros", icon: Users },
        ]
      : []),
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border px-4 py-3 flex items-center justify-between sticky top-0 bg-background z-50">
        <div className="flex items-center gap-3">
          {!isDashboard && (
            <button
              onClick={handleBack}
              className="p-1.5 -ml-1.5 rounded-lg hover:bg-accent transition-colors"
              aria-label="Voltar"
            >
              <ArrowLeft size={20} />
            </button>
          )}
          <Scissors size={20} className="text-foreground" />
          <h1 className="font-semibold text-lg tracking-tight">QG do Mineiro</h1>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground hidden sm:block">{user?.nome}</span>
          <ThemeToggle />
          <button
            onClick={handleLogout}
            className="p-2 rounded-lg border border-border hover:bg-accent transition-colors"
            aria-label="Sair"
          >
            <LogOut size={18} />
          </button>
        </div>
      </header>

      <div className="flex flex-1 flex-col">
        <main className="flex-1 p-4 pb-20 md:pb-4 max-w-5xl mx-auto w-full">{children}</main>

        <nav className="fixed bottom-0 left-0 right-0 md:relative border-t border-border bg-background flex justify-around md:justify-center md:gap-4 py-2 md:py-3 z-50">
          {navItems.map((item) => {
            const active = location.pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`flex flex-col items-center gap-1 px-2 py-1 rounded-lg transition-colors text-xs ${
                  active ? "text-foreground font-medium" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <item.icon size={18} />
                <span className="truncate max-w-[56px]">{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
};

export default Layout;
