import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import StatusBadge from "@/components/StatusBadge";
import { toast } from "@/hooks/use-toast";
import { formatBRL } from "./types";

type Periodo = "mes" | "personalizado";

const inicioMes = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
};
const hoje = () => new Date().toISOString().slice(0, 10);

const Comissao = () => {
  const queryClient = useQueryClient();
  const [periodo, setPeriodo] = useState<Periodo>("mes");
  const [from, setFrom] = useState(inicioMes());
  const [to, setTo] = useState(hoje());

  const { inicio, fim } = useMemo(() => {
    if (periodo === "mes") return { inicio: inicioMes(), fim: hoje() };
    return { inicio: from, fim: to };
  }, [periodo, from, to]);

  const { data: atendimentos = [], isLoading } = useQuery({
    queryKey: ["atendimentos-comissao", inicio, fim],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("atendimentos")
        .select("valor, barbeiro_id, barbeiros(id, nome, comissao)")
        .gte("data_atendimento", `${inicio}T00:00:00`)
        .lte("data_atendimento", `${fim}T23:59:59`);
      if (error) throw error;
      return data || [];
    },
  });

  const { data: comissoesPagas = [] } = useQuery({
    queryKey: ["comissoes-pagas", inicio, fim],
    queryFn: async () => {
      const { data } = await supabase
        .from("comissoes")
        .select("barbeiro_id, valor_comissao, status")
        .gte("periodo_inicio", inicio)
        .lte("periodo_fim", fim)
        .eq("status", "pago");
      return data || [];
    },
  });

  const pagarMutation = useMutation({
    mutationFn: async ({ barbeiroId, totalBruto, pct, valorComissao }: { barbeiroId: string; totalBruto: number; pct: number; valorComissao: number }) => {
      const { error } = await supabase.from("comissoes").insert({
        barbeiro_id: barbeiroId,
        periodo_inicio: inicio,
        periodo_fim: fim,
        total_bruto: totalBruto,
        percentual: pct,
        valor_comissao: valorComissao,
        status: "pago",
        pago_em: new Date().toISOString(),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comissoes-pagas"] });
      toast({ title: "Comissão marcada como paga" });
    },
    onError: () => toast({ title: "Erro ao registrar pagamento", variant: "destructive" }),
  });

  const rows = useMemo(() => {
    const map: Record<string, { nome: string; totalBruto: number; pct: number; atendimentos: number }> = {};
    for (const a of atendimentos) {
      const b = a.barbeiros as any;
      if (!b) continue;
      if (!map[b.id]) map[b.id] = { nome: b.nome, totalBruto: 0, pct: b.comissao || 50, atendimentos: 0 };
      map[b.id].totalBruto += Number(a.valor);
      map[b.id].atendimentos++;
    }
    return Object.entries(map).map(([id, v]) => ({
      barbeiroId: id,
      ...v,
      valorComissao: v.totalBruto * (v.pct / 100),
      pago: comissoesPagas.some((c: any) => c.barbeiro_id === id),
    }));
  }, [atendimentos, comissoesPagas]);

  const totalPago = rows.filter((r) => r.pago).reduce((s, r) => s + r.valorComissao, 0);
  const totalPendente = rows.filter((r) => !r.pago).reduce((s, r) => s + r.valorComissao, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex gap-1 rounded-lg border border-border p-1 bg-card">
          {(["mes", "personalizado"] as Periodo[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriodo(p)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${periodo === p ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
            >
              {p === "mes" ? "Mês atual" : "Personalizado"}
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

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-lg border border-border p-6 bg-card text-center">
          <p className="text-sm text-muted-foreground">Comissão total paga</p>
          <p className="text-3xl font-bold mt-2">{formatBRL(totalPago)}</p>
        </div>
        <div className="rounded-lg border border-border p-6 bg-card text-center">
          <p className="text-sm text-muted-foreground">Comissão a pagar</p>
          <p className="text-3xl font-bold mt-2">{formatBRL(totalPendente)}</p>
        </div>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground text-center py-8">Carregando...</p>
      ) : rows.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">Nenhum atendimento no período.</p>
      ) : (
        <div>
          <h3 className="font-medium mb-3">Comissão por barbeiro</h3>
          <div className="rounded-lg border border-border overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-card">
                <tr className="border-b border-border">
                  <th className="text-left p-3 font-medium">Barbeiro</th>
                  <th className="text-right p-3 font-medium">Atend.</th>
                  <th className="text-right p-3 font-medium">Total bruto</th>
                  <th className="text-right p-3 font-medium">% comissão</th>
                  <th className="text-right p-3 font-medium">Valor</th>
                  <th className="text-left p-3 font-medium">Status</th>
                  <th className="p-3" />
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.barbeiroId} className="border-b border-border last:border-0 even:bg-muted/30">
                    <td className="p-3">{r.nome}</td>
                    <td className="p-3 text-right">{r.atendimentos}</td>
                    <td className="p-3 text-right">{formatBRL(r.totalBruto)}</td>
                    <td className="p-3 text-right">{r.pct}%</td>
                    <td className="p-3 text-right font-medium">{formatBRL(r.valorComissao)}</td>
                    <td className="p-3">
                      <StatusBadge tone={r.pago ? "success" : "warning"}>
                        {r.pago ? "Pago" : "Pendente"}
                      </StatusBadge>
                    </td>
                    <td className="p-3 text-right">
                      {!r.pago && (
                        <button
                          onClick={() => pagarMutation.mutate({ barbeiroId: r.barbeiroId, totalBruto: r.totalBruto, pct: r.pct, valorComissao: r.valorComissao })}
                          className="px-3 py-1 rounded-md bg-primary text-primary-foreground text-xs font-medium hover:opacity-90"
                        >
                          Marcar como pago
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default Comissao;
