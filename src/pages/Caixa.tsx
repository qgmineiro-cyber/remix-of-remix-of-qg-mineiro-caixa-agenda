import { useState } from "react";
import { useCaixa } from "@/contexts/CaixaContext";
import { useAuth } from "@/contexts/AuthContext";
import { Trash2, Plus } from "lucide-react";

const SERVICOS_CATALOGO = [
  { nome: "Corte", valor: 45 },
  { nome: "Barba", valor: 30 },
  { nome: "Corte + Barba", valor: 65 },
  { nome: "Sobrancelha", valor: 15 },
  { nome: "Progressiva", valor: 120 },
  { nome: "Hidratação", valor: 80 },
  { nome: "Outro", valor: 0 },
];

const FORMAS_PAGAMENTO = ["Dinheiro", "PIX", "Crédito", "Débito"];

const Caixa = () => {
  const { caixa, abrirCaixa, fecharCaixa, adicionarServico, removerUltimoServico } = useCaixa();
  const { user } = useAuth();

  // Abertura
  const [troco, setTroco] = useState("");

  // Lançamento
  const [showLancamento, setShowLancamento] = useState(false);
  const [servicoSelecionado, setServicoSelecionado] = useState<string | null>(null);
  const [valor, setValor] = useState("");
  const [formaPagamento, setFormaPagamento] = useState("Dinheiro");
  const [observacao, setObservacao] = useState("");

  // Fechamento
  const [showFechamento, setShowFechamento] = useState(false);

  const handleAbrirCaixa = () => {
    abrirCaixa(parseFloat(troco) || 0);
    setTroco("");
  };

  const handleLancar = () => {
    if (!servicoSelecionado || !valor) return;
    adicionarServico({
      nome: servicoSelecionado,
      valor: parseFloat(valor),
      formaPagamento,
      observacao: observacao || undefined,
    });
    setShowLancamento(false);
    setServicoSelecionado(null);
    setValor("");
    setObservacao("");
  };

  const totalBruto = caixa.servicos.reduce((s, sv) => s + sv.valor, 0);
  const comissaoPerc = user?.comissao || 50;
  const comissaoValor = totalBruto * (comissaoPerc / 100);
  const liquido = totalBruto - comissaoValor;

  // Resumo por forma de pagamento
  const resumoPagamento = FORMAS_PAGAMENTO.map((fp) => ({
    forma: fp,
    total: caixa.servicos.filter((s) => s.formaPagamento === fp).reduce((sum, s) => sum + s.valor, 0),
    qtd: caixa.servicos.filter((s) => s.formaPagamento === fp).length,
  })).filter((r) => r.qtd > 0);

  // Caixa fechado - tela de abertura
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
          className="w-full py-3 rounded-lg bg-primary text-primary-foreground font-medium hover:opacity-90 transition-opacity"
        >
          Abrir Caixa
        </button>
      </div>
    );
  }

  // Tela de fechamento
  if (showFechamento) {
    return (
      <div className="space-y-6 animate-fade-in max-w-md mx-auto">
        <h2 className="text-xl font-semibold">Fechar Caixa</h2>

        <div className="space-y-3">
          <div className="rounded-lg border border-border p-4 bg-card">
            <p className="text-sm text-muted-foreground mb-2">Resumo por pagamento</p>
            {resumoPagamento.map((r) => (
              <div key={r.forma} className="flex justify-between text-sm py-1">
                <span>{r.forma} ({r.qtd})</span>
                <span className="font-medium">R$ {r.total.toFixed(2)}</span>
              </div>
            ))}
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
          <button
            onClick={() => setShowFechamento(false)}
            className="flex-1 py-3 rounded-lg border border-border font-medium hover:bg-accent transition-colors"
          >
            Voltar
          </button>
          <button
            onClick={() => {
              fecharCaixa();
              setShowFechamento(false);
            }}
            className="flex-1 py-3 rounded-lg bg-primary text-primary-foreground font-medium hover:opacity-90 transition-opacity"
          >
            Fechar Caixa
          </button>
        </div>
      </div>
    );
  }

  // Modal de lançamento
  if (showLancamento) {
    return (
      <div className="space-y-6 animate-fade-in max-w-md mx-auto">
        <h2 className="text-xl font-semibold">Lançar Serviço</h2>

        <div>
          <label className="text-sm font-medium mb-2 block">Serviço</label>
          <div className="grid grid-cols-2 gap-2">
            {SERVICOS_CATALOGO.map((s) => (
              <button
                key={s.nome}
                onClick={() => {
                  setServicoSelecionado(s.nome);
                  if (s.valor > 0) setValor(s.valor.toString());
                  else setValor("");
                }}
                className={`py-3 px-4 rounded-lg border text-sm font-medium transition-colors ${
                  servicoSelecionado === s.nome
                    ? "bg-primary text-primary-foreground border-primary"
                    : "border-border hover:bg-accent"
                }`}
              >
                {s.nome}
                {s.valor > 0 && <span className="block text-xs mt-0.5 opacity-70">R$ {s.valor}</span>}
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
                  formaPagamento === fp
                    ? "bg-primary text-primary-foreground border-primary"
                    : "border-border hover:bg-accent"
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
            onClick={() => setShowLancamento(false)}
            className="flex-1 py-3 rounded-lg border border-border font-medium hover:bg-accent transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleLancar}
            disabled={!servicoSelecionado || !valor}
            className="flex-1 py-3 rounded-lg bg-primary text-primary-foreground font-medium hover:opacity-90 transition-opacity disabled:opacity-40"
          >
            Confirmar
          </button>
        </div>
      </div>
    );
  }

  // Caixa aberto - tela principal
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Caixa Aberto</h2>
          <p className="text-sm text-muted-foreground">Desde {caixa.abertoDesde}</p>
        </div>
        <button
          onClick={() => setShowFechamento(true)}
          className="px-4 py-2 rounded-lg border border-border text-sm font-medium hover:bg-accent transition-colors"
        >
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

      {/* Resumo rápido */}
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

      {/* Lista de lançamentos */}
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
                    {s.hora} · {s.formaPagamento}
                    {s.observacao && ` · ${s.observacao}`}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-sm">R$ {s.valor.toFixed(2)}</p>
                  {i === 0 && (
                    <button
                      onClick={removerUltimoServico}
                      className="p-1 rounded hover:bg-accent transition-colors text-muted-foreground hover:text-destructive"
                      title="Remover último"
                    >
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
