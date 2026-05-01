import { useState } from "react";
import VisaoGeral from "./financeiro/VisaoGeral";
import ContasPagar from "./financeiro/ContasPagar";
import ContasReceber from "./financeiro/ContasReceber";
import Faturamento from "./financeiro/Faturamento";
import Comissao from "./financeiro/Comissao";

const TABS = [
  { id: "visao", label: "Visão Geral" },
  { id: "pagar", label: "Contas a Pagar" },
  { id: "receber", label: "Contas a Receber" },
  { id: "faturamento", label: "Faturamento" },
  { id: "comissao", label: "Comissão" },
] as const;

type TabId = (typeof TABS)[number]["id"];

const Financeiro = () => {
  const [active, setActive] = useState<TabId>("visao");

  return (
    <div className="space-y-6 animate-fade-in">
      <h2 className="text-xl font-semibold">Financeiro</h2>

      <div className="border-b border-border overflow-x-auto -mx-4 px-4">
        <div className="flex gap-1 min-w-max">
          {TABS.map((t) => {
            const isActive = active === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setActive(t.id)}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px ${
                  isActive
                    ? "text-foreground border-foreground"
                    : "text-muted-foreground border-transparent hover:text-foreground"
                }`}
              >
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      {active === "visao" && <VisaoGeral />}
      {active === "pagar" && <ContasPagar />}
      {active === "receber" && <ContasReceber />}
      {active === "faturamento" && <Faturamento />}
      {active === "comissao" && <Comissao />}
    </div>
  );
};

export default Financeiro;
