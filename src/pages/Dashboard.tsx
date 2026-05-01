import { useAuth } from "@/contexts/AuthContext";
import { useCaixa } from "@/contexts/CaixaContext";
import { useNavigate } from "react-router-dom";
import { DollarSign, Users, TrendingUp, Clock, Calendar } from "lucide-react";

const MOCK_AGENDAMENTOS = [
  { id: "1", hora: "09:00", cliente: "Lucas", servico: "Corte" },
  { id: "2", hora: "10:00", cliente: "Rafael", servico: "Barba" },
  { id: "3", hora: "11:30", cliente: "Marcos", servico: "Corte + Barba" },
  { id: "4", hora: "14:00", cliente: "Bruno", servico: "Corte" },
  { id: "5", hora: "15:30", cliente: "Diego", servico: "Barba" },
];

const MOCK_FATURAMENTO_BARBEIRO = [
  { barbeiro: "João", valor: 580 },
  { barbeiro: "Pedro", valor: 420 },
  { barbeiro: "Carlos", valor: 310 },
];

const MOCK_COMISSAO_BARBEIRO = [
  { barbeiro: "João", atendimentos: 8, comissao: 290 },
  { barbeiro: "Pedro", atendimentos: 6, comissao: 210 },
  { barbeiro: "Carlos", atendimentos: 4, comissao: 140 },
];

const formatBRL = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const Dashboard = () => {
  const { user } = useAuth();
  const { caixa } = useCaixa();
  const navigate = useNavigate();

  const totalServicos = caixa.servicos.length;
  const totalValor = caixa.servicos.reduce((sum, s) => sum + s.valor, 0);
  const comissaoEstimada = user ? totalValor * (user.comissao / 100) : 0;

  const isAdmin = user?.role === "admin";

  const Header = (
    <div>
      <h2 className="text-xl font-semibold">
        Olá, {user?.nome}{isAdmin ? " (Admin)" : ""}
      </h2>
      <p className="text-muted-foreground text-sm">
        {new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })}
      </p>
    </div>
  );

  const StatusCaixa = (
    <div className="rounded-lg border border-border p-4 bg-card">
      <div className="flex items-center gap-2 mb-2">
        <Clock size={16} className="text-muted-foreground" />
        <span className="text-sm text-muted-foreground">Status do caixa</span>
      </div>
      <p className="font-medium">
        {caixa.aberto ? `Caixa aberto desde ${caixa.abertoDesde}` : "Caixa fechado"}
      </p>
    </div>
  );

  const BotaoCaixa = (
    <button
      onClick={() => navigate("/caixa")}
      className="w-full py-4 rounded-lg bg-primary text-primary-foreground font-semibold text-lg hover:opacity-90 transition-opacity"
    >
      {caixa.aberto ? "Lançar Serviço" : "Abrir Caixa"}
    </button>
  );

  if (!isAdmin) {
    // Dashboard do Barbeiro
    return (
      <div className="space-y-6 animate-fade-in">
        {Header}
        {StatusCaixa}
        {BotaoCaixa}

        <div className="rounded-lg border border-border p-6 bg-card text-center">
          <Users size={20} className="mx-auto mb-2 text-muted-foreground" />
          <p className="text-4xl font-bold">{totalServicos}</p>
          <p className="text-sm text-muted-foreground mt-1">Atendimentos do dia</p>
        </div>

        <div>
          <h3 className="font-medium mb-3 flex items-center gap-2">
            <Calendar size={16} /> Meus próximos agendamentos
          </h3>
          <div className="space-y-2">
            {MOCK_AGENDAMENTOS.map((a) => (
              <div key={a.id} className="flex items-center justify-between rounded-lg border border-border p-3 bg-card">
                <div>
                  <p className="text-sm font-medium">{a.cliente}</p>
                  <p className="text-xs text-muted-foreground">{a.servico}</p>
                </div>
                <span className="text-sm font-medium">{a.hora}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Dashboard do Admin
  const faturamentoDia = totalValor || 1310;
  const faturamentoMes = 11500;
  const comissoesPagar = 640;
  const maxFat = Math.max(...MOCK_FATURAMENTO_BARBEIRO.map((m) => m.valor));

  return (
    <div className="space-y-6 animate-fade-in">
      {Header}
      {StatusCaixa}
      {BotaoCaixa}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="rounded-lg border border-border p-4 bg-card">
          <Users size={16} className="text-muted-foreground" />
          <p className="text-2xl font-bold mt-1">{totalServicos || 18}</p>
          <p className="text-xs text-muted-foreground">Atendimentos do dia</p>
        </div>
        <div className="rounded-lg border border-border p-4 bg-card">
          <DollarSign size={16} className="text-muted-foreground" />
          <p className="text-2xl font-bold mt-1">{formatBRL(faturamentoDia)}</p>
          <p className="text-xs text-muted-foreground">Faturamento do dia</p>
        </div>
        <div className="rounded-lg border border-border p-4 bg-card">
          <TrendingUp size={16} className="text-muted-foreground" />
          <p className="text-2xl font-bold mt-1">{formatBRL(faturamentoMes)}</p>
          <p className="text-xs text-muted-foreground">Faturamento do mês</p>
        </div>
        <div className="rounded-lg border border-border p-4 bg-card">
          <DollarSign size={16} className="text-muted-foreground" />
          <p className="text-2xl font-bold mt-1">{formatBRL(comissoesPagar)}</p>
          <p className="text-xs text-muted-foreground">Comissões a pagar</p>
        </div>
      </div>

      <div className="rounded-lg border border-border p-4 bg-card">
        <h3 className="font-medium mb-4">Faturamento por barbeiro</h3>
        <div className="space-y-3">
          {MOCK_FATURAMENTO_BARBEIRO.map((b) => (
            <div key={b.barbeiro}>
              <div className="flex justify-between text-sm mb-1">
                <span>{b.barbeiro}</span>
                <span className="font-medium">{formatBRL(b.valor)}</span>
              </div>
              <div className="h-3 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full bg-foreground rounded-full transition-all"
                  style={{ width: `${(b.valor / maxFat) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="font-medium mb-3">Comissões por barbeiro</h3>
        <div className="rounded-lg border border-border overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-card">
              <tr className="border-b border-border">
                <th className="text-left p-3 font-medium">Barbeiro</th>
                <th className="text-right p-3 font-medium">Atendimentos</th>
                <th className="text-right p-3 font-medium">Comissão a pagar</th>
              </tr>
            </thead>
            <tbody>
              {MOCK_COMISSAO_BARBEIRO.map((c) => (
                <tr key={c.barbeiro} className="border-b border-border last:border-0 even:bg-muted/30">
                  <td className="p-3">{c.barbeiro}</td>
                  <td className="p-3 text-right">{c.atendimentos}</td>
                  <td className="p-3 text-right font-medium">{formatBRL(c.comissao)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <h3 className="font-medium mb-3 flex items-center gap-2">
          <Calendar size={16} /> Próximos agendamentos
        </h3>
        <div className="space-y-2">
          {MOCK_AGENDAMENTOS.map((a) => (
            <div key={a.id} className="flex items-center justify-between rounded-lg border border-border p-3 bg-card">
              <div>
                <p className="text-sm font-medium">{a.cliente}</p>
                <p className="text-xs text-muted-foreground">{a.servico}</p>
              </div>
              <span className="text-sm font-medium">{a.hora}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
