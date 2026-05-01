import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatBRL } from "./types";

const inicioMes = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
};

const ultimos6Meses = () => {
  const meses = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    meses.push({
      label: d.toLocaleDateString("pt-BR", { month: "short" }).replace(".", ""),
      inicio: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`,
      fim: new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().slice(0, 10),
    });
  }
  return meses;
};

const VisaoGeral = () => {
  const meses = ultimos6Meses();

  const { data: atendimentosMes = [] } = useQuery({
    queryKey: ["atendimentos-mes-visao"],
    queryFn: async () => {
      const { data } = await supabase
        .from("atendimentos")
        .select("valor, data_atendimento")
        .gte("data_atendimento", `${meses[0].inicio}T00:00:00`);
      return data || [];
    },
  });

  const { data: contasPagar = [] } = useQuery({
    queryKey: ["contas_pagar_visao"],
    queryFn: async () => {
      const { data } = await supabase.from("contas_pagar").select("valor, status, vencimento");
      return data || [];
    },
  });

  const { data: contasReceber = [] } = useQuery({
    queryKey: ["contas_receber_visao"],
    queryFn: async () => {
      const { data } = await supabase.from("contas_receber").select("valor, status, vencimento");
      return data || [];
    },
  });

  const faturamentoMes = atendimentosMes
    .filter((a: any) => a.data_atendimento >= `${inicioMes()}T00:00:00`)
    .reduce((s: number, a: any) => s + Number(a.valor), 0);

  const totalReceber = contasReceber
    .filter((c: any) => c.status === "aberto")
    .reduce((s: number, c: any) => s + Number(c.valor), 0);

  const totalPagar = contasPagar
    .filter((c: any) => c.status === "aberto")
    .reduce((s: number, c: any) => s + Number(c.valor), 0);

  const saldo = faturamentoMes + totalReceber - totalPagar;

  const dadosMeses = meses.map((m) => {
    const receita = atendimentosMes
      .filter((a: any) => a.data_atendimento >= `${m.inicio}T00:00:00` && a.data_atendimento <= `${m.fim}T23:59:59`)
      .reduce((s: number, a: any) => s + Number(a.valor), 0);
    const despesa = contasPagar
      .filter((c: any) => c.vencimento >= m.inicio && c.vencimento <= m.fim && c.status !== "aberto")
      .reduce((s: number, c: any) => s + Number(c.valor), 0);
    return { mes: m.label, receita, despesa };
  });

  const maxVal = Math.max(...dadosMeses.flatMap((m) => [m.receita, m.despesa]), 1);

  const proximasContas = [
    ...contasPagar
      .filter((c: any) => c.status === "aberto")
      .map((c: any) => ({ ...c, tipo: "pagar" as const })),
    ...contasReceber
      .filter((c: any) => c.status === "aberto")
      .map((c: any) => ({ ...c, tipo: "receber" as const })),
  ]
    .sort((a, b) => a.vencimento.localeCompare(b.vencimento))
    .slice(0, 6);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="rounded-lg border border-border p-4 bg-card">
          <p className="text-xs text-muted-foreground">Faturamento (mês)</p>
          <p className="text-xl font-bold mt-1">{formatBRL(faturamentoMes)}</p>
        </div>
        <div className="rounded-lg border border-border p-4 bg-card">
          <p className="text-xs text-muted-foreground">Total a Receber</p>
          <p className="text-xl font-bold mt-1">{formatBRL(totalReceber)}</p>
        </div>
        <div className="rounded-lg border border-border p-4 bg-card">
          <p className="text-xs text-muted-foreground">Total a Pagar</p>
          <p className="text-xl font-bold mt-1">{formatBRL(totalPagar)}</p>
        </div>
        <div className="rounded-lg border border-border p-4 bg-card">
          <p className="text-xs text-muted-foreground">Saldo Projetado</p>
          <p className={`text-xl font-bold mt-1 ${saldo < 0 ? "text-destructive" : ""}`}>{formatBRL(saldo)}</p>
        </div>
      </div>

      <div className="rounded-lg border border-border p-4 bg-card">
        <h3 className="font-medium mb-4">Receitas vs Despesas — últimos 6 meses</h3>
        <div className="space-y-3">
          {dadosMeses.map((m) => (
            <div key={m.mes} className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="font-medium w-10 capitalize">{m.mes}</span>
                <span className="text-muted-foreground">{formatBRL(m.receita)} / {formatBRL(m.despesa)}</span>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div className="h-full bg-foreground rounded-full" style={{ width: `${(m.receita / maxVal) * 100}%` }} />
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div className="h-full bg-muted-foreground rounded-full" style={{ width: `${(m.despesa / maxVal) * 100}%` }} />
              </div>
            </div>
          ))}
          <div className="flex gap-4 text-xs text-muted-foreground pt-2">
            <span className="flex items-center gap-1"><span className="w-3 h-2 bg-foreground rounded-full inline-block" /> Receitas</span>
            <span className="flex items-center gap-1"><span className="w-3 h-2 bg-muted-foreground rounded-full inline-block" /> Despesas</span>
          </div>
        </div>
      </div>

      {proximasContas.length > 0 && (
        <div>
          <h3 className="font-medium mb-3">Próximas contas a vencer</h3>
          <div className="space-y-2">
            {proximasContas.map((c: any) => (
              <div key={`${c.tipo}-${c.id}`} className="flex items-center justify-between rounded-lg border border-border p-3 bg-card">
                <div>
                  <p className="text-sm font-medium">{c.descricao}</p>
                  <p className="text-xs text-muted-foreground">
                    {c.tipo === "pagar" ? "A pagar" : "A receber"} · {new Date(c.vencimento + "T00:00:00").toLocaleDateString("pt-BR")}
                  </p>
                </div>
                <p className="font-semibold text-sm">
                  {c.tipo === "pagar" ? "-" : "+"} {formatBRL(Number(c.valor))}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default VisaoGeral;
