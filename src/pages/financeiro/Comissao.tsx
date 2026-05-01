import { useState } from "react";
import { Download } from "lucide-react";
import { Input } from "@/components/ui/input";
import StatusBadge from "@/components/StatusBadge";
import { toast } from "@/hooks/use-toast";
import { formatBRL } from "./types";

type Periodo = "hoje" | "semana" | "mes" | "personalizado";

interface ComissaoRow {
  id: string;
  barbeiro: string;
  totalBruto: number;
  pct: number;
  pago: boolean;
}

const SEED: ComissaoRow[] = [
  { id: "1", barbeiro: "João", totalBruto: 2850, pct: 50, pago: false },
  { id: "2", barbeiro: "Pedro", totalBruto: 2180, pct: 50, pago: true },
  { id: "3", barbeiro: "Carlos", totalBruto: 1640, pct: 45, pago: false },
];

const Comissao = () => {
  const [periodo, setPeriodo] = useState<Periodo>("mes");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [rows, setRows] = useState<ComissaoRow[]>(SEED);

  const totalPago = rows.filter((r) => r.pago).reduce((s, r) => s + r.totalBruto * (r.pct / 100), 0);
  const totalPendente = rows.filter((r) => !r.pago).reduce((s, r) => s + r.totalBruto * (r.pct / 100), 0);

  const togglePago = (id: string) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, pago: true } : r)));
    toast({ title: "Comissão marcada como paga" });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex gap-1 rounded-lg border border-border p-1 bg-card">
          {(["hoje", "semana", "mes", "personalizado"] as Periodo[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriodo(p)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                periodo === p ? "bg-primary text-primary-foreground" : "text-muted-foreground"
              }`}
            >
              {p === "hoje" ? "Hoje" : p === "semana" ? "Semana" : p === "mes" ? "Mês" : "Personalizado"}
            </button>
          ))}
        </div>
        <button className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-sm font-medium hover:bg-accent transition-colors">
          <Download size={16} /> Exportar
        </button>
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

      <div>
        <h3 className="font-medium mb-3">Comissão por barbeiro</h3>
        <div className="rounded-lg border border-border overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-card">
              <tr className="border-b border-border">
                <th className="text-left p-3 font-medium">Barbeiro</th>
                <th className="text-right p-3 font-medium">Total bruto</th>
                <th className="text-right p-3 font-medium">% comissão</th>
                <th className="text-right p-3 font-medium">Valor</th>
                <th className="text-left p-3 font-medium">Status</th>
                <th className="p-3" />
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const valor = r.totalBruto * (r.pct / 100);
                return (
                  <tr key={r.id} className="border-b border-border last:border-0 even:bg-muted/30">
                    <td className="p-3">{r.barbeiro}</td>
                    <td className="p-3 text-right">{formatBRL(r.totalBruto)}</td>
                    <td className="p-3 text-right">{r.pct}%</td>
                    <td className="p-3 text-right font-medium">{formatBRL(valor)}</td>
                    <td className="p-3">
                      <StatusBadge tone={r.pago ? "success" : "warning"}>
                        {r.pago ? "Pago" : "Pendente"}
                      </StatusBadge>
                    </td>
                    <td className="p-3 text-right">
                      {!r.pago && (
                        <button
                          onClick={() => togglePago(r.id)}
                          className="px-3 py-1 rounded-md bg-primary text-primary-foreground text-xs font-medium hover:opacity-90"
                        >
                          Marcar como pago
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Comissao;
