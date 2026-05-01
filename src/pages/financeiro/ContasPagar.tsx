import { useMemo, useState } from "react";
import { Plus, Edit2, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import StatusBadge from "@/components/StatusBadge";
import ConfirmDialog from "@/components/ConfirmDialog";
import { toast } from "@/hooks/use-toast";
import {
  CATEGORIAS_PAGAR,
  ContaPagar,
  ContaStatus,
  FORMAS_PAGAMENTO,
  formatBRL,
  formatDateBR,
  todayISO,
} from "./types";

const SEED: ContaPagar[] = [
  {
    id: "1",
    descricao: "Aluguel da loja",
    categoria: "Aluguel",
    valor: 2500,
    vencimento: "2026-05-05",
    formaPagamento: "Boleto",
    status: "aberto",
  },
  {
    id: "2",
    descricao: "Conta de energia",
    categoria: "Energia",
    valor: 420,
    vencimento: "2026-04-25",
    formaPagamento: "Pix",
    status: "vencido",
  },
  {
    id: "3",
    descricao: "Internet",
    categoria: "Internet",
    valor: 150,
    vencimento: "2026-04-15",
    formaPagamento: "Débito",
    status: "pago",
  },
];

const STATUS_TONE: Record<ContaStatus, "warning" | "success" | "danger"> = {
  aberto: "warning",
  pago: "success",
  vencido: "danger",
};

const STATUS_LABEL: Record<ContaStatus, string> = {
  aberto: "Em aberto",
  pago: "Pago",
  vencido: "Vencido",
};

const ContasPagar = () => {
  const [contas, setContas] = useState<ContaPagar[]>(SEED);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ContaPagar | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const [filterStatus, setFilterStatus] = useState<string>("todos");
  const [filterCategoria, setFilterCategoria] = useState<string>("todas");
  const [filterFrom, setFilterFrom] = useState("");
  const [filterTo, setFilterTo] = useState("");

  const filtered = useMemo(
    () =>
      contas.filter((c) => {
        if (filterStatus !== "todos" && c.status !== filterStatus) return false;
        if (filterCategoria !== "todas" && c.categoria !== filterCategoria) return false;
        if (filterFrom && c.vencimento < filterFrom) return false;
        if (filterTo && c.vencimento > filterTo) return false;
        return true;
      }),
    [contas, filterStatus, filterCategoria, filterFrom, filterTo],
  );

  const totals = useMemo(() => {
    const aberto = contas.filter((c) => c.status === "aberto").reduce((s, c) => s + c.valor, 0);
    const pagoMes = contas.filter((c) => c.status === "pago").reduce((s, c) => s + c.valor, 0);
    const vencido = contas.filter((c) => c.status === "vencido").reduce((s, c) => s + c.valor, 0);
    return { aberto, pagoMes, vencido };
  }, [contas]);

  const handleSave = (c: ContaPagar) => {
    if (editing) {
      setContas((prev) => prev.map((x) => (x.id === c.id ? c : x)));
      toast({ title: "Conta atualizada" });
    } else {
      setContas((prev) => [...prev, { ...c, id: crypto.randomUUID() }]);
      toast({ title: "Conta cadastrada" });
    }
    setOpen(false);
    setEditing(null);
  };

  const handleDelete = () => {
    if (!confirmId) return;
    setContas((prev) => prev.filter((c) => c.id !== confirmId));
    setConfirmId(null);
    toast({ title: "Conta removida" });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Contas a Pagar</h3>
        <Button
          onClick={() => {
            setEditing(null);
            setOpen(true);
          }}
        >
          <Plus size={16} /> Nova conta
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-lg border border-border p-4 bg-card text-center">
          <p className="text-xs text-muted-foreground">Em aberto</p>
          <p className="text-lg font-bold mt-1">{formatBRL(totals.aberto)}</p>
        </div>
        <div className="rounded-lg border border-border p-4 bg-card text-center">
          <p className="text-xs text-muted-foreground">Pago no mês</p>
          <p className="text-lg font-bold mt-1">{formatBRL(totals.pagoMes)}</p>
        </div>
        <div className="rounded-lg border border-border p-4 bg-card text-center">
          <p className="text-xs text-muted-foreground">Vencido</p>
          <p className="text-lg font-bold mt-1">{formatBRL(totals.vencido)}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos status</SelectItem>
            <SelectItem value="aberto">Em aberto</SelectItem>
            <SelectItem value="pago">Pago</SelectItem>
            <SelectItem value="vencido">Vencido</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterCategoria} onValueChange={setFilterCategoria}>
          <SelectTrigger><SelectValue placeholder="Categoria" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todas categorias</SelectItem>
            {CATEGORIAS_PAGAR.map((c) => (
              <SelectItem key={c} value={c}>{c}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input type="date" value={filterFrom} onChange={(e) => setFilterFrom(e.target.value)} />
        <Input type="date" value={filterTo} onChange={(e) => setFilterTo(e.target.value)} />
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">
          Nenhuma conta cadastrada ainda. Clique em + Nova conta para começar.
        </p>
      ) : (
        <div className="rounded-lg border border-border overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-card">
              <tr className="border-b border-border">
                <th className="text-left p-3 font-medium">Descrição</th>
                <th className="text-left p-3 font-medium">Categoria</th>
                <th className="text-left p-3 font-medium">Vencimento</th>
                <th className="text-right p-3 font-medium">Valor</th>
                <th className="text-left p-3 font-medium">Status</th>
                <th className="p-3" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.id} className="border-b border-border last:border-0 even:bg-muted/30">
                  <td className="p-3">{c.descricao}</td>
                  <td className="p-3">{c.categoria}</td>
                  <td className="p-3">{formatDateBR(c.vencimento)}</td>
                  <td className="p-3 text-right">{formatBRL(c.valor)}</td>
                  <td className="p-3">
                    <StatusBadge tone={STATUS_TONE[c.status]}>{STATUS_LABEL[c.status]}</StatusBadge>
                  </td>
                  <td className="p-3 text-right whitespace-nowrap">
                    <button
                      onClick={() => { setEditing(c); setOpen(true); }}
                      className="p-1.5 rounded hover:bg-accent text-muted-foreground"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      onClick={() => setConfirmId(c.id)}
                      className="p-1.5 rounded hover:bg-accent text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ContaPagarDialog
        open={open}
        onOpenChange={(v) => { setOpen(v); if (!v) setEditing(null); }}
        initial={editing}
        onSave={handleSave}
      />

      <ConfirmDialog
        open={!!confirmId}
        onOpenChange={(v) => !v && setConfirmId(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
};

interface DialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  initial: ContaPagar | null;
  onSave: (c: ContaPagar) => void;
}

const ContaPagarDialog = ({ open, onOpenChange, initial, onSave }: DialogProps) => {
  const isEdit = !!initial;
  const [descricao, setDescricao] = useState(initial?.descricao ?? "");
  const [categoria, setCategoria] = useState<string>(initial?.categoria ?? "Outros");
  const [valor, setValor] = useState(initial?.valor?.toString() ?? "");
  const [vencimento, setVencimento] = useState(initial?.vencimento ?? "");
  const [forma, setForma] = useState<string>(initial?.formaPagamento ?? "Pix");
  const [observacoes, setObservacoes] = useState(initial?.observacoes ?? "");
  const [status, setStatus] = useState<ContaStatus>(initial?.status ?? "aberto");

  // reset on initial change
  useMemo(() => {
    setDescricao(initial?.descricao ?? "");
    setCategoria(initial?.categoria ?? "Outros");
    setValor(initial?.valor?.toString() ?? "");
    setVencimento(initial?.vencimento ?? "");
    setForma(initial?.formaPagamento ?? "Pix");
    setObservacoes(initial?.observacoes ?? "");
    setStatus(initial?.status ?? "aberto");
  }, [initial, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const v = parseFloat(valor);
    if (!descricao.trim()) return toast({ title: "Descrição obrigatória", variant: "destructive" });
    if (isNaN(v) || v <= 0) return toast({ title: "Valor inválido", variant: "destructive" });
    if (!vencimento) return toast({ title: "Vencimento obrigatório", variant: "destructive" });
    if (!isEdit && vencimento < todayISO())
      return toast({ title: "Vencimento não pode ser passado", variant: "destructive" });

    onSave({
      id: initial?.id ?? "",
      descricao: descricao.trim(),
      categoria: categoria as ContaPagar["categoria"],
      valor: v,
      vencimento,
      formaPagamento: forma as ContaPagar["formaPagamento"],
      observacoes: observacoes.trim() || undefined,
      status,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar conta a pagar" : "Nova conta a pagar"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-sm font-medium mb-1 block">Descrição</label>
            <Input value={descricao} onChange={(e) => setDescricao(e.target.value)} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium mb-1 block">Categoria</label>
              <Select value={categoria} onValueChange={setCategoria}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATEGORIAS_PAGAR.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Valor (R$)</label>
              <Input type="number" min="0.01" step="0.01" value={valor} onChange={(e) => setValor(e.target.value)} required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium mb-1 block">Vencimento</label>
              <Input
                type="date"
                value={vencimento}
                min={isEdit ? undefined : todayISO()}
                onChange={(e) => setVencimento(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Forma de pagamento</label>
              <Select value={forma} onValueChange={setForma}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {FORMAS_PAGAMENTO.map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Status</label>
            <Select value={status} onValueChange={(v) => setStatus(v as ContaStatus)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="aberto">Em aberto</SelectItem>
                <SelectItem value="pago">Pago</SelectItem>
                <SelectItem value="vencido">Vencido</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Observações</label>
            <Input value={observacoes} onChange={(e) => setObservacoes(e.target.value)} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit">Salvar</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ContasPagar;
