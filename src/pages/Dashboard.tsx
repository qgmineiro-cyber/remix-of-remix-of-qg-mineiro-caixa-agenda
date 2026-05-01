import { useAuth } from "@/contexts/AuthContext";
import { useCaixa } from "@/contexts/CaixaContext";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DollarSign, Users, TrendingUp, Clock, Calendar } from "lucide-react";

const formatBRL = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const hoje = () => {
  const d = new Date();
  return d.toISOString().slice(0, 10);
};

const inicioMes = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
};

const Dashboard = () => {
  const { user } = useAuth();
  const { caixa } = useCaixa();
  const navigate = useNavigate();
  const isAdmin = user?.role === "admin";

  const { data: atendimentosHoje = [] } = useQuery({
    queryKey: ["atendimentos-hoje", user?.id, isAdmin],
    queryFn: async () => {
      let query = supabase
        .from("atendimentos")
        .select("valor, forma_pagamento, barbeiro_id, barbeiros(nome, comissao)")
        .gte("data_atendimento", `${hoje()}T00:00:00`)
        .lte("data_atendimento", `${hoje()}T23:59:59`);
      if (!isAdmin && user?.id) query = query.eq("barbeiro_id", user.id);
      const { data } = await query;
      return data || [];
    },
    enabled: !!user,
  });

  const { data: atendimentosMes = [] } = useQuery({
    queryKey: ["atendimentos-mes", isAdmin],
    queryFn: async () => {
      const { data } = await supabase
        .from("atendimentos")
        .select("valor, barbeiro_id, barbeiros(nome, comissao)")
        .gte("data_atendimento", `${inicioMes()}T00:00:00`);
      return data || [];
    },
    enabled: isAdmin,
  });

  const { data: proximosAgendamentos = [] } = useQuery({
    queryKey: ["proximos-agendamentos", user?.id, isAdmin],
    queryFn: async () => {
      let query = supabase
        .from("agendamentos")
        .select("id, cliente_nome, servico_id, data_hora, servicos(nome)")
        .gte("data_hora", new Date().toISOString())
        .eq("status", "agendado")
        .order("data_hora")
        .limit(5);
      if (!isAdmin && user?.id) query = query.eq("barbeiro_id", user.id);
      const { data } = await query;
      return data || [];
    },
    enabled: !!user,
  });

  const totalServicosHoje = caixa.aberto ? caixa.servicos.length : atendimentosHoje.length;
  const totalValorHoje = caixa.aberto
    ? caixa.servicos.reduce((s, sv) => s + sv.valor, 0)
    : atendimentosHoje.reduce((s: number, a: any) => s + Number(a.valor), 0);
  const comissaoEstimada = user ? totalValorHoje * (user.comissao / 100) : 0;

  const faturamentoMes = atendimentosMes.reduce((s: number, a: any) => s + Number(a.valor), 0);

  const faturamentoPorBarbeiro = atendimentosMes.reduce((acc: Record<string, { nome: string; valor: number; comissao: number }>, a: any) => {
    const id = a.barbeiro_id;
    const nome = (a.barbeiros as any)?.nome || "Desconhecido";
    const pct = (a.barbeiros as any)?.comissao || 50;
    if (!acc[id]) acc[id] = { nome, valor: 0, comissao: pct };
    acc[id].valor += Number(a.valor);
    return acc;
  }, {});

  const barbeirosStats = Object.values(faturamentoPorBarbeiro);
  const maxFat = Math.max(...barbeirosStats.map((b) => b.valor), 1);
  const comissoesPagar = barbeirosStats.reduce((s, b) => s + b.valor * (b.comissao / 100), 0);

  const Header = (
    <div>
      <h2 className="text-xl font-semibold">Olá, {user?.nome}{isAdmin ? " (Admin)" : ""}</h2>
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
    return (
      <div className="space-y-6 animate-fade-in">
        {Header}
        {StatusCaixa}
        {BotaoCaixa}

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg border border-border p-4 bg-card text-center">
            <p className="text-3xl font-bold">{totalServicosHoje}</p>
            <p className="text-xs text-muted-foreground mt-1">Atendimentos hoje</p>
          </div>
          <div className="rounded-lg border border-border p-4 bg-card text-center">
            <p className="text-3xl font-bold">R$ {comissaoEstimada.toFixed(0)}</p>
            <p className="text-xs text-muted-foreground mt-1">Comissão estimada</p>
          </div>
        </div>

        {proximosAgendamentos.length > 0 && (
          <div>
            <h3 className="font-medium mb-3 flex items-center gap-2">
              <Calendar size={16} /> Próximos agendamentos
            </h3>
            <div className="space-y-2">
              {proximosAgendamentos.map((a: any) => (
                <div key={a.id} className="flex items-center justify-between rounded-lg border border-border p-3 bg-card">
                  <div>
                    <p className="text-sm font-medium">{a.cliente_nome}</p>
                    <p className="text-xs text-muted-foreground">{(a.servicos as any)?.nome || "Serviço"}</p>
                  </div>
                  <span className="text-sm font-medium">
                    {new Date(a.data_hora).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {Header}
      {StatusCaixa}
      {BotaoCaixa}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="rounded-lg border border-border p-4 bg-card">
          <Users size={16} className="text-muted-foreground" />
          <p className="text-2xl font-bold mt-1">{totalServicosHoje}</p>
          <p className="text-xs text-muted-foreground">Atendimentos hoje</p>
        </div>
        <div className="rounded-lg border border-border p-4 bg-card">
          <DollarSign size={16} className="text-muted-foreground" />
          <p className="text-2xl font-bold mt-1">{formatBRL(totalValorHoje)}</p>
          <p className="text-xs text-muted-foreground">Faturamento hoje</p>
        </div>
        <div className="rounded-lg border border-border p-4 bg-card">
          <TrendingUp size={16} className="text-muted-foreground" />
          <p className="text-2xl font-bold mt-1">{formatBRL(faturamentoMes)}</p>
          <p className="text-xs text-muted-foreground">Faturamento do mês</p>
        </div>
        <div className="rounded-lg border border-border p-4 bg-card">
          <DollarSign size={16} className="text-muted-foreground" />
          <p className="text-2xl font-bold mt-1">{formatBRL(comissoesPagar)}</p>
          <p className="text-xs text-muted-foreground">Comissões do mês</p>
        </div>
      </div>

      {barbeirosStats.length > 0 && (
        <div className="rounded-lg border border-border p-4 bg-card">
          <h3 className="font-medium mb-4">Faturamento por barbeiro (mês)</h3>
          <div className="space-y-3">
            {barbeirosStats.sort((a, b) => b.valor - a.valor).map((b) => (
              <div key={b.nome}>
                <div className="flex justify-between text-sm mb-1">
                  <span>{b.nome}</span>
                  <span className="font-medium">{formatBRL(b.valor)}</span>
                </div>
                <div className="h-3 rounded-full bg-muted overflow-hidden">
                  <div className="h-full bg-foreground rounded-full transition-all" style={{ width: `${(b.valor / maxFat) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {barbeirosStats.length > 0 && (
        <div>
          <h3 className="font-medium mb-3">Comissões por barbeiro (mês)</h3>
          <div className="rounded-lg border border-border overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-card">
                <tr className="border-b border-border">
                  <th className="text-left p-3 font-medium">Barbeiro</th>
                  <th className="text-right p-3 font-medium">Faturamento</th>
                  <th className="text-right p-3 font-medium">Comissão</th>
                </tr>
              </thead>
              <tbody>
                {barbeirosStats.sort((a, b) => b.valor - a.valor).map((b) => (
                  <tr key={b.nome} className="border-b border-border last:border-0 even:bg-muted/30">
                    <td className="p-3">{b.nome}</td>
                    <td className="p-3 text-right">{formatBRL(b.valor)}</td>
                    <td className="p-3 text-right font-medium">{formatBRL(b.valor * (b.comissao / 100))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {proximosAgendamentos.length > 0 && (
        <div>
          <h3 className="font-medium mb-3 flex items-center gap-2">
            <Calendar size={16} /> Próximos agendamentos
          </h3>
          <div className="space-y-2">
            {proximosAgendamentos.map((a: any) => (
              <div key={a.id} className="flex items-center justify-between rounded-lg border border-border p-3 bg-card">
                <div>
                  <p className="text-sm font-medium">{a.cliente_nome}</p>
                  <p className="text-xs text-muted-foreground">{(a.servicos as any)?.nome || "Serviço"}</p>
                </div>
                <span className="text-sm font-medium">
                  {new Date(a.data_hora).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })} {new Date(a.data_hora).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
