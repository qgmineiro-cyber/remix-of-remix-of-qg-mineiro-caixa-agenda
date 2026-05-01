import { createContext, useContext, useState, ReactNode } from "react";

export interface Servico {
  id: string;
  nome: string;
  valor: number;
  formaPagamento: string;
  observacao?: string;
  hora: string;
}

interface CaixaState {
  aberto: boolean;
  abertoDesde: string | null;
  trocoInicial: number;
  servicos: Servico[];
}

interface CaixaContextType {
  caixa: CaixaState;
  abrirCaixa: (troco: number) => void;
  fecharCaixa: () => CaixaState;
  adicionarServico: (servico: Omit<Servico, "id" | "hora">) => void;
  removerUltimoServico: () => void;
}

const CaixaContext = createContext<CaixaContextType>({
  caixa: { aberto: false, abertoDesde: null, trocoInicial: 0, servicos: [] },
  abrirCaixa: () => {},
  fecharCaixa: () => ({ aberto: false, abertoDesde: null, trocoInicial: 0, servicos: [] }),
  adicionarServico: () => {},
  removerUltimoServico: () => {},
});

export const CaixaProvider = ({ children }: { children: ReactNode }) => {
  const [caixa, setCaixa] = useState<CaixaState>({
    aberto: false,
    abertoDesde: null,
    trocoInicial: 0,
    servicos: [],
  });

  const abrirCaixa = (troco: number) => {
    setCaixa({
      aberto: true,
      abertoDesde: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
      trocoInicial: troco,
      servicos: [],
    });
  };

  const fecharCaixa = () => {
    const snapshot = { ...caixa };
    setCaixa({ aberto: false, abertoDesde: null, trocoInicial: 0, servicos: [] });
    return snapshot;
  };

  const adicionarServico = (servico: Omit<Servico, "id" | "hora">) => {
    setCaixa((prev) => ({
      ...prev,
      servicos: [
        ...prev.servicos,
        {
          ...servico,
          id: crypto.randomUUID(),
          hora: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
        },
      ],
    }));
  };

  const removerUltimoServico = () => {
    setCaixa((prev) => ({
      ...prev,
      servicos: prev.servicos.slice(0, -1),
    }));
  };

  return (
    <CaixaContext.Provider value={{ caixa, abrirCaixa, fecharCaixa, adicionarServico, removerUltimoServico }}>
      {children}
    </CaixaContext.Provider>
  );
};

export const useCaixa = () => useContext(CaixaContext);
