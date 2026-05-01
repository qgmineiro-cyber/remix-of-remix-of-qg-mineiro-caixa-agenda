import { formatBRL } from "./types";

const MOCK_MESES = [
  { mes: "Nov", receita: 8400, despesa: 5200 },
  { mes: "Dez", receita: 9100, despesa: 5600 },
  { mes: "Jan", receita: 7800, despesa: 5400 },
  { mes: "Fev", receita: 8900, despesa: 5800 },
  { mes: "Mar", receita: 10200, despesa: 6100 },
  { mes: "Abr", receita: 11500, despesa: 6400 },
];

const MOCK_PROXIMAS = [
  { id: "1", descricao: "Aluguel", tipo: "pagar" as const, data: "2026-05-05", valor: 2500 },
  { id: "2", descricao: "Mensalista — Cliente João", tipo: "receber" as const, data: "2026-05-06", valor: 180 },
  { id: "3", descricao: "Energia", tipo: "pagar" as const, data: "2026-05-08", valor: 420 },
  { id: "4", descricao: "Pacote 10 cortes — Pedro", tipo: "receber" as const, data: "2026-05-10", valor: 350 },
  { id: "5", descricao: "Internet", tipo: "pagar" as const, data: "2026-05-12", valor: 150 },
];

const VisaoGeral = () => {
  const faturamentoMes = 11500;
  const totalReceber = 1240;
  const totalPagar = 3070;
  const saldo = faturamentoMes + totalReceber - totalPagar;

  const max = Math.max(...MOCK_MESES.flatMap((m) => [m.receita, m.despesa]));

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
          <p className="text-xl font-bold mt-1">{formatBRL(saldo)}</p>
        </div>
      </div>

      <div className="rounded-lg border border-border p-4 bg-card">
        <h3 className="font-medium mb-4">Receitas vs Despesas — últimos 6 meses</h3>
        <div className="space-y-3">
          {MOCK_MESES.map((m) => (
            <div key={m.mes} className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="font-medium w-10">{m.mes}</span>
                <span className="text-muted-foreground">
                  R$ {m.receita} / R$ {m.despesa}
                </span>
              </div>
              <div className="space-y-1">
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full bg-foreground rounded-full"
                    style={{ width: `${(m.receita / max) * 100}%` }}
                  />
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full bg-muted-foreground rounded-full"
                    style={{ width: `${(m.despesa / max) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
          <div className="flex gap-4 text-xs text-muted-foreground pt-2">
            <span className="flex items-center gap-1">
              <span className="w-3 h-2 bg-foreground rounded-full inline-block" /> Receitas
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-2 bg-muted-foreground rounded-full inline-block" /> Despesas
            </span>
          </div>
        </div>
      </div>

      <div>
        <h3 className="font-medium mb-3">Próximas contas a vencer</h3>
        <div className="space-y-2">
          {MOCK_PROXIMAS.map((c) => (
            <div
              key={c.id}
              className="flex items-center justify-between rounded-lg border border-border p-3 bg-card"
            >
              <div>
                <p className="text-sm font-medium">{c.descricao}</p>
                <p className="text-xs text-muted-foreground">
                  {c.tipo === "pagar" ? "A pagar" : "A receber"} ·{" "}
                  {new Date(c.data).toLocaleDateString("pt-BR")}
                </p>
              </div>
              <p
                className={`font-semibold ${
                  c.tipo === "pagar" ? "text-foreground" : "text-foreground"
                }`}
              >
                {c.tipo === "pagar" ? "-" : "+"} {formatBRL(c.valor)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default VisaoGeral;
