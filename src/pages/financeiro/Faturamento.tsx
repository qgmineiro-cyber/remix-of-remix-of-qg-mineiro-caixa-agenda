import { useState } from "react";
import { Download } from "lucide-react";
import { Input } from "@/components/ui/input";
import { formatBRL } from "./types";

type Periodo = "hoje" | "semana" | "mes" | "personalizado";

const MOCK_DIAS = [
  { dia: "01", valor: 320 },
  { dia: "05", valor: 480 },
  { dia: "10", valor: 410 },
  { dia: "15", valor: 620 },
  { dia: "20", valor: 540 },
  { dia: "25", valor: 700 },
  { dia: "30", valor: 880 },
];

const MOCK_BARBEIROS = [
  { barbeiro: "João", atendimentos: 38, total: 2850 },
  { barbeiro: "Pedro", atendimentos: 29, total: 2180 },
  { barbeiro: "Carlos", atendimentos: 22, total: 1640 },
];

const Faturamento = () => {
  const [periodo, setPeriodo] = useState<Periodo>("mes");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const total = MOCK_BARBEIROS.reduce((s, b) => s + b.total, 0);

  const max = Math.max(...MOCK_DIAS.map((d) => d.valor));
  const points = MOCK_DIAS.map((d, i) => {
    const x = (i / (MOCK_DIAS.length - 1)) * 100;
    const y = 100 - (d.valor / max) * 90;
    return `${x},${y}`;
  }).join(" ");

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

      <div className="rounded-lg border border-border p-6 bg-card text-center">
        <p className="text-sm text-muted-foreground">Faturamento total do período</p>
        <p className="text-4xl font-bold mt-2">{formatBRL(total)}</p>
      </div>

      <div className="rounded-lg border border-border p-4 bg-card">
        <h3 className="font-medium mb-4">Faturamento dia a dia</h3>
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-32">
          <polyline
            points={points}
            fill="none"
            stroke="hsl(var(--foreground))"
            strokeWidth="0.8"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
        <div className="flex justify-between text-xs text-muted-foreground mt-1">
          {MOCK_DIAS.map((d) => <span key={d.dia}>{d.dia}</span>)}
        </div>
      </div>

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
              {MOCK_BARBEIROS.map((b) => (
                <tr key={b.barbeiro} className="border-b border-border last:border-0 even:bg-muted/30">
                  <td className="p-3">{b.barbeiro}</td>
                  <td className="p-3 text-right">{b.atendimentos}</td>
                  <td className="p-3 text-right font-medium">{formatBRL(b.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Faturamento;
