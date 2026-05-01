import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCaixa } from "@/contexts/CaixaContext";
import { useAuth } from "@/contexts/AuthContext";
import { Trash2, Plus } from "lucide-react";

const FORMAS_PAGAMENTO = ["Dinheiro", "PIX", "Crédito", "Débito"];

const Caixa = () => {
  const { caixa, loadingCaixa, abrirCaixa, fecharCaixa, adicionarServico, removerUltimoServico } = useCaixa();
  const { user } = useAuth();

  const [troco, setTroco] = useState("");
  const [showLancamento, setShowLancamento] = useState(false);
  const [showFechamento, setShowFechamento] = useState(false);
  const [servicoSelecionado, setServicoSelecionado] = useState<{ id: string; nome: string; preco: number } | null>(null);
  const [valor, setValor] = useState("");
  const [formaPagamento, setFormaPagamento] = useState("Dinheiro");
  const [observacao, setObservacao] = useState("");
  const [loading, setLoading] = useState(false);

  const { data: servicos = [] } = useQuery({
    queryKey: ["servicos"],
    queryFn: async () => {
      const { data, error } = await supabase.from("servicos").select("*").eq("ativo", true).order("nome");
      if (error) throw error;
      return data;
    },
  });

  const handleAbrirCaixa = async () => {
    setLoading(true);
    await abrirCaixa(parseFloat(troco) || 0);
    setTroco("");
    setLoading(false);
  };

  const handleLancar = async () => {
    if (!servicoSelecionado || !valor) return;
    setLoading(true);
    await adicionarServico({
      nome: servicoSelecionado.nome,
      valor: parseFloat(valor),
      formaPagamento,
      observacao: observacao || undefined,
      servicoId: servicoSelecionado.id !== "outro" ? servicoSelecionado.id : null,
    });
    setShowLancamento(false);
    setServicoSelecionado(null);
    setValor("");
    setObservacao("");
    setLoading(false);
  };

  const handleFechar = async () => {
    setLoading(true);
    await fecharCaixa();
    setShowFechamento(false);
    setLoading(false);
  };

  const totalBruto = caixa.servicos.reduce((s, sv) => s + sv.valor, 0);
  const comissaoPerc = user?.comissao || 50;
  const comissaoValor = totalBruto * (comissaoPerc / 100);
  const liquido = totalBruto - comissaoValor;

  const resumoPagamento = FORMAS_PAGAMENTO.map((fp) => ({
    forma: fp,
    total: caixa.servicos
      .filter((s) => s.formaPagamento === fp || s.formaPagamento === fp.toLowerCase())
      .reduce((sum, s) => sum + s.valor, 0),
    qtd: caixa.servicos.filter((s) => s.formaPagamento === fp || s.formaPagamento === fp.toLowerCase()).length,
  })).filter((r) => r.qtd > 0);

  if (loadingCaixa) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-muted-foreground text-sm">Carregando caixa...</p>
      </div>
    );
  }

  if (!caixa.aberto) {
    return (
      <div className="space-y-6 animate-fade-in max-w-md mx-auto">
        <h2 className="text-xl font-semibold">Abrir Caixa</h2>
        <p className="text-muted-foreground text-sm">Informe o valor de troco inicial para abrir o caixa.</p>
        <div>
          <label className="text-sm font-medium mb-1 block">Troco inicial (R$)</label>
          <input
            type="number"
            value={troco}
            onChange={(e) => setTroco(e.target.value)}
            className="w-full px-4 py-3 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder="0,00"
          />
        </div>
        <div className="text-sm text-muted-foreground">
          <p>Data: {new Date().toLocaleDateString("pt-BR")}</p>
          <p>Hora: {new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</p>
        </div>
        <button
          onClick={handleAbrirCaixa}
          disabled={loading}
          className="w-full py-3 rounded-lg bg-primary text-primary-foreground font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {loading ? "Abrindo..." : "Abrir Caixa"}
        </button>
      </div>
    );
  }

  if (showFechamento) {
    return (
      <div className="space-y-6 animate-fade-in max-w-md mx-auto">
        <h2 className="text-xl font-semibold">Fechar Caixa</h2>
        <div className="space-y-3">
          <div className="rounded-lg border border-border p-4 bg-card">
            <p className="text-sm text-muted-foreground mb-2">Resumo por pagamento</p>
            {resumoPagamento.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum lançamento.</p>
            ) : (
              resumoPagamento.map((r) => (
                <div key={r.forma} className="flex justify-between text-sm py-1">
                  <span>{r.forma} ({r.qtd})</span>
                  <span className="font-medium">R$ {r.total.toFixed(2)}</span>
                </div>
              ))
            )}
          </div>
          <div className="rounded-lg border border-border p-4 bg-card space-y-2">
            <div className="flex justify-between text-sm">
              <span>Total bruto</span>
              <span className="font-bold">R$ {totalBruto.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Comissão ({comissaoPerc}%)</span>
              <span>R$ {comissaoValor.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm border-t border-border pt-2">
              <span>Líquido barbearia</span>
              <span className="font-bold">R$ {liquido.toFixed(2)}</span>
            </div>
          </div>
        </div>
        <div className="flex gap-3">
          <button onClick={() => setShowFechamento(false)} className="flex-1 py-3 rounded-lg border border-border font-medium hover:bg-accent transition-colors">
            Voltar
          </button>
          <button onClick={handleFechar} disabled={loading} className="flex-1 py-3 rounded-lg bg-primary text-primary-foreground font-medium hover:opacity-90 transition-opacity disabled:opacity-50">
            {loading ? "Fechando..." : "Fechar Caixa"}
          </button>
        </div>
      </div>
    );
  }

  if (showLancamento) {
    const servicosLista = [
      ...servicos.map((s) => ({ id: s.id, nome: s.nome, preco: Number(s.preco) })),
      { id: "outro", nome: "Outro", preco: 0 },
    ];

    return (
      <div className="space-y-6 animate-fade-in max-w-md mx-auto">
        <h2 className="text-xl font-semibold">Lançar Serviço</h2>
        <div>
          <label className="text-sm font-medium mb-2 block">Serviço</label>
          <div className="grid grid-cols-2 gap-2">
            {servicosLista.map((s) => (
              <button
                key={s.id}
                onClick={() => { setServicoSelecionado(s); setValor(s.preco > 0 ? s.preco.toString() : ""); }}
                className={`py-3 px-4 rounded-lg border text-sm font-medium transition-colors ${
                  servicoSelecionado?.id === s.id ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-accent"
                }`}
              >
                {s.nome}
                {s.preco > 0 && <span className="block text-xs mt-0.5 opacity-70">R$ {s.preco.toFixed(2)}</span>}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="text-sm font-medium mb-1 block">Valor (R$)</label>
          <input
            type="number"
            value={valor}
            onChange={(e) => setValor(e.target.value)}
            className="w-full px-4 py-3 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div>
          <label className="text-sm font-medium mb-2 block">Pagamento</label>
          <div className="grid grid-cols-4 gap-2">
            {FORMAS_PAGAMENTO.map((fp) => (
              <button
                key={fp}
                onClick={() => setFormaPagamento(fp)}
                className={`py-2 px-3 rounded-lg border text-xs font-medium transition-colors ${
                  formaPagamento === fp ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-accent"
                }`}
              >
                {fp}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="text-sm font-medium mb-1 block">Observação (opcional)</label>
          <input
            type="text"
            value={observacao}
            onChange={(e) => setObservacao(e.target.value)}
            className="w-full px-4 py-3 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder="Ex: desconto, cortesia..."
          />
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => { setShowLancamento(false); setServicoSelecionado(null); setValor(""); setObservacao(""); }}
            className="flex-1 py-3 rounded-lg border border-border font-medium hover:bg-accent transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleLancar}
            disabled={!servicoSelecionado || !valor || loading}
            className="flex-1 py-3 rounded-lg bg-primary text-primary-foreground font-medium hover:opacity-90 transition-opacity disabled:opacity-40"
          >
            {loading ? "Salvando..." : "Confirmar"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Caixa Aberto</h2>
          <p className="text-sm text-muted-foreground">Desde {caixa.abertoDesde}</p>
        </div>
        <button onClick={() => setShowFechamento(true)} className="px-4 py-2 rounded-lg border border-border text-sm font-medium hover:bg-accent transition-colors">
          Fechar Caixa
        </button>
      </div>

      <button
        onClick={() => setShowLancamento(true)}
        className="w-full py-4 rounded-lg bg-primary text-primary-foreground font-semibold text-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
      >
        <Plus size={20} />
        Lançar Serviço
      </button>

      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-lg border border-border p-3 bg-card text-center">
          <p className="text-xl font-bold">{caixa.servicos.length}</p>
          <p className="text-xs text-muted-foreground">Serviços</p>
        </div>
        <div className="rounded-lg border border-border p-3 bg-card text-center">
          <p className="text-xl font-bold">R$ {totalBruto.toFixed(0)}</p>
          <p className="text-xs text-muted-foreground">Total</p>
        </div>
        <div className="rounded-lg border border-border p-3 bg-card text-center">
          <p className="text-xl font-bold">R$ {comissaoValor.toFixed(0)}</p>
          <p className="text-xs text-muted-foreground">Comissão</p>
        </div>
      </div>

      <div>
        <h3 className="font-medium mb-3">Lançamentos do dia</h3>
        {caixa.servicos.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">Nenhum lançamento ainda.</p>
        ) : (
          <div className="space-y-2">
            {[...caixa.servicos].reverse().map((s, i) => (
              <div key={s.id} className="flex items-center justify-between rounded-lg border border-border p-3 bg-card">
                <div>
                  <p className="font-medium text-sm">{s.nome}</p>
                  <p className="text-xs text-muted-foreground">
                    {s.hora} · {s.formaPagamento}{s.observacao && ` · ${s.observacao}`}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-sm">R$ {s.valor.toFixed(2)}</p>
                  {i === 0 && (
                    <button onClick={removerUltimoServico} className="p-1 rounded hover:bg-accent transition-colors text-muted-foreground hover:text-destructive">
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Caixa;
