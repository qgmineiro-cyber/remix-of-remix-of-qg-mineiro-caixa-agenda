import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./AuthContext";
import { toast } from "@/hooks/use-toast";

export interface Servico {
  id: string;
  atendimentoId: string;
  nome: string;
  valor: number;
  formaPagamento: string;
  observacao?: string;
  hora: string;
}

interface CaixaState {
  sessaoId: string | null;
  aberto: boolean;
  abertoDesde: string | null;
  trocoInicial: number;
  servicos: Servico[];
}

interface CaixaContextType {
  caixa: CaixaState;
  loadingCaixa: boolean;
  abrirCaixa: (troco: number) => Promise<void>;
  fecharCaixa: () => Promise<CaixaState>;
  adicionarServico: (s: { nome: string; valor: number; formaPagamento: string; observacao?: string; servicoId?: string | null }) => Promise<void>;
  removerUltimoServico: () => Promise<void>;
}

const EMPTY: CaixaState = { sessaoId: null, aberto: false, abertoDesde: null, trocoInicial: 0, servicos: [] };

const CaixaContext = createContext<CaixaContextType>({
  caixa: EMPTY,
  loadingCaixa: false,
  abrirCaixa: async () => {},
  fecharCaixa: async () => EMPTY,
  adicionarServico: async () => {},
  removerUltimoServico: async () => {},
});

const PAY_MAP: Record<string, string> = {
  Dinheiro: "dinheiro", PIX: "pix", Pix: "pix",
  "Crédito": "credito", "Débito": "debito", Boleto: "boleto",
  dinheiro: "dinheiro", pix: "pix", credito: "credito", debito: "debito", boleto: "boleto",
};

export const CaixaProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [caixa, setCaixa] = useState<CaixaState>(EMPTY);
  const [loadingCaixa, setLoadingCaixa] = useState(false);

  useEffect(() => {
    if (!user?.id) { setCaixa(EMPTY); return; }
    setLoadingCaixa(true);

    supabase
      .from("caixa_sessoes")
      .select("*")
      .eq("barbeiro_id", user.id)
      .is("fechado_em", null)
      .order("aberto_em", { ascending: false })
      .limit(1)
      .single()
      .then(async ({ data: sessao }) => {
        if (!sessao) { setLoadingCaixa(false); return; }
        const { data: atendimentos } = await supabase
          .from("atendimentos")
          .select("*")
          .eq("caixa_sessao_id", sessao.id)
          .order("created_at");

        setCaixa({
          sessaoId: sessao.id,
          aberto: true,
          abertoDesde: new Date(sessao.aberto_em).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
          trocoInicial: sessao.troco_inicial,
          servicos: (atendimentos || []).map((a) => ({
            id: crypto.randomUUID(),
            atendimentoId: a.id,
            nome: a.servico_nome,
            valor: a.valor,
            formaPagamento: a.forma_pagamento,
            observacao: a.observacao || undefined,
            hora: new Date(a.data_atendimento).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
          })),
        });
        setLoadingCaixa(false);
      });
  }, [user?.id]);

  const abrirCaixa = async (troco: number) => {
    if (!user?.id) return;
    const { data, error } = await supabase
      .from("caixa_sessoes")
      .insert({ barbeiro_id: user.id, troco_inicial: troco })
      .select("id, aberto_em")
      .single();
    if (error) { toast({ title: "Erro ao abrir caixa", variant: "destructive" }); return; }
    setCaixa({
      sessaoId: data.id,
      aberto: true,
      abertoDesde: new Date(data.aberto_em).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
      trocoInicial: troco,
      servicos: [],
    });
  };

  const fecharCaixa = async (): Promise<CaixaState> => {
    const snapshot = { ...caixa };
    if (!caixa.sessaoId) { setCaixa(EMPTY); return snapshot; }

    const totals = { total_dinheiro: 0, total_pix: 0, total_debito: 0, total_credito: 0, total_geral: 0 };
    for (const s of caixa.servicos) {
      const k = PAY_MAP[s.formaPagamento] || "dinheiro";
      if (k === "dinheiro") totals.total_dinheiro += s.valor;
      else if (k === "pix") totals.total_pix += s.valor;
      else if (k === "debito") totals.total_debito += s.valor;
      else if (k === "credito") totals.total_credito += s.valor;
      totals.total_geral += s.valor;
    }

    await supabase
      .from("caixa_sessoes")
      .update({ ...totals, fechado_em: new Date().toISOString() })
      .eq("id", caixa.sessaoId);

    setCaixa(EMPTY);
    return snapshot;
  };

  const adicionarServico = async (s: { nome: string; valor: number; formaPagamento: string; observacao?: string; servicoId?: string | null }) => {
    if (!user?.id || !caixa.sessaoId) return;
    const { data, error } = await supabase
      .from("atendimentos")
      .insert({
        barbeiro_id: user.id,
        servico_id: s.servicoId || null,
        servico_nome: s.nome,
        valor: s.valor,
        forma_pagamento: (PAY_MAP[s.formaPagamento] || "dinheiro") as "dinheiro" | "pix" | "debito" | "credito" | "boleto",
        observacao: s.observacao || null,
        caixa_sessao_id: caixa.sessaoId,
      })
      .select("id, data_atendimento")
      .single();
    if (error) { toast({ title: "Erro ao lançar serviço", variant: "destructive" }); return; }
    setCaixa((prev) => ({
      ...prev,
      servicos: [...prev.servicos, {
        id: crypto.randomUUID(),
        atendimentoId: data.id,
        nome: s.nome,
        valor: s.valor,
        formaPagamento: s.formaPagamento,
        observacao: s.observacao,
        hora: new Date(data.data_atendimento).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
      }],
    }));
  };

  const removerUltimoServico = async () => {
    const last = caixa.servicos[caixa.servicos.length - 1];
    if (!last) return;
    const { error } = await supabase.from("atendimentos").delete().eq("id", last.atendimentoId);
    if (error) { toast({ title: "Erro ao remover", variant: "destructive" }); return; }
    setCaixa((prev) => ({ ...prev, servicos: prev.servicos.slice(0, -1) }));
  };

  return (
    <CaixaContext.Provider value={{ caixa, loadingCaixa, abrirCaixa, fecharCaixa, adicionarServico, removerUltimoServico }}>
      {children}
    </CaixaContext.Provider>
  );
};

export const useCaixa = () => useContext(CaixaContext);
