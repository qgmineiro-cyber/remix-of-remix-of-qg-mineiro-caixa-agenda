import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { formatBRL } from "./types";

type Periodo = "hoje" | "semana" | "mes" | "personalizado";

const hoje = () => new Date().toISOString().slice(0, 10);
const inicioSemana = () => {
  const d = new Date();
  d.setDate(d.getDate() - d.getDay());
  return d.toISOString().slice(0, 10);
};
const inicioMes = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
};

const Faturamento = () => {
  const [periodo, setPeriodo] = useState<Periodo>("mes");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const { inicio, fim } = useMemo(() => {
    if (periodo === "hoje") return { inicio: hoje(), fim: hoje() };
    if (periodo === "semana") return { inicio: inicioSemana(), fim: hoje() };
    if (periodo === "mes") return { inicio: inicioMes(), fim: hoje() };
    return { inicio: from, fim: to };
  }, [periodo, from, to]);

  const { data: atendimentos = [], isLoading } = useQuery({
    queryKey: ["atendimentos-fat", inicio, fim],
    queryFn: async () => {
      if (!inicio || !fim) return [];
      const { data, error } = await supabase
        .from("atendimentos")
        .select("valor, data_atendimento, barbeiro_id, barbeiros(nome)")
        .gte("data_atendimento", `${inicio}T00:00:00`)
        .lte("data_atendimento", `${fim}T23:59:59`)
        .order("data_atendimento");
      if (error) throw error;
      return data || [];
    },
    enabled: !!(inicio && fim),
  });

  const total = atendimentos.reduce((s: number, a: any) => s + Number(a.valor), 0);

  const porDia = useMemo(() => {
    const map: Record<string, number> = {};
    for (const a of atendimentos) {
      const dia = a.data_atendimento.slice(0, 10);
      map[dia] = (map[dia] || 0) + Number(a.valor);
    }
    return Object.entries(map).sort(([a], [b]) => a.localeCompare(b)).map(([dia, valor]) => ({
      dia: new Date(dia + "T12:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
      valor,
    }));
  }, [atendimentos]);

  const porBarbeiro = useMemo(() => {
    const map: Record<string, { nome: string; atendimentos: number; total: number }> = {};
    for (const a of atendimentos) {
      const id = a.barbeiro_id;
      const nome = (a.barbeiros as any)?.nome || "Desconhecido";
      if (!map[id]) map[id] = { nome, atendimentos: 0, total: 0 };
      map[id].atendimentos++;
      map[id].total += Number(a.valor);
    }
    return Object.values(map).sort((a, b) => b.total - a.total);
  }, [atendimentos]);

  const maxDia = Math.max(...porDia.map((d) => d.valor), 1);

  const points = porDia.length > 1
    ? porDia.map((d, i) => {
        const x = (i / (porDia.length - 1)) * 100;
        const y = 100 - (d.valor / maxDia) * 90;
        return `${x},${y}`;
      }).join(" ")
    : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex gap-1 rounded-lg border border-border p-1 bg-card">
          {(["hoje", "semana", "mes", "personalizado"] as Periodo[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriodo(p)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${periodo === p ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
            >
              {p === "hoje" ? "Hoje" : p === "semana" ? "Semana" : p === "mes" ? "Mês" : "Personalizado"}
            </button>
          ))}
        </div>
      </div>

      {periodo === "personalizado" && (
        <div className="grid grid-cols-2 gap-2">
          <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
      )}

      <div className="rounded-lg border border-border p-6 bg-card text-center">
        <p className="text-sm text-muted-foreground">Faturamento total do período</p>
        <p className="text-4xl font-bold mt-2">{isLoading ? "..." : formatBRL(total)}</p>
        <p className="text-sm text-muted-foreground mt-1">{atendimentos.length} atendimento{atendimentos.length !== 1 ? "s" : ""}</p>
      </div>

      {porDia.length > 1 && points && (
        <div className="rounded-lg border border-border p-4 bg-card">
          <h3 className="font-medium mb-4">Faturamento por dia</h3>
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-32">
            <polyline
              points={points}
              fill="none"
              stroke="hsl(var(--foreground))"
              strokeWidth="0.8"
              vectorEffect="non-scaling-stroke"
            />
          </svg>
          <div className="flex justify-between text-xs text-muted-foreground mt-1 overflow-hidden">
            {porDia.map((d) => <span key={d.dia}>{d.dia}</span>)}
          </div>
        </div>
      )}

      {porBarbeiro.length > 0 && (
        <div>
          <h3 className="font-medium mb-3">Faturamento por barbeiro</h3>
          <div className="rounded-lg border border-border overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-card">
                <tr className="border-b border-border">
                  <th className="text-left p-3 font-medium">Barbeiro</th>
                  <th className="text-right p-3 font-medium">Atendimentos</th>
                  <th className="text-right p-3 font-medium">Total bruto</th>
                </tr>
              </thead>
              <tbody>
                {porBarbeiro.map((b) => (
                  <tr key={b.nome} className="border-b border-border last:border-0 even:bg-muted/30">
                    <td className="p-3">{b.nome}</td>
                    <td className="p-3 text-right">{b.atendimentos}</td>
                    <td className="p-3 text-right font-medium">{formatBRL(b.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!isLoading && atendimentos.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-8">Nenhum atendimento no período.</p>
      )}
    </div>
  );
};

export default Faturamento;
