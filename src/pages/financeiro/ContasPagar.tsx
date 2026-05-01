import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Edit2, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import StatusBadge from "@/components/StatusBadge";
import ConfirmDialog from "@/components/ConfirmDialog";
import { toast } from "@/hooks/use-toast";
import { formatBRL, formatDateBR } from "./types";

type ContaStatus = "aberto" | "pago" | "vencido";

const CATEGORIAS = [
  { value: "aluguel", label: "Aluguel" },
  { value: "fornecedores", label: "Fornecedores" },
  { value: "salarios", label: "Salários" },
  { value: "energia", label: "Energia" },
  { value: "agua", label: "Água" },
  { value: "internet", label: "Internet" },
  { value: "outros", label: "Outros" },
];

const FORMAS = [
  { value: "dinheiro", label: "Dinheiro" },
  { value: "pix", label: "PIX" },
  { value: "debito", label: "Débito" },
  { value: "credito", label: "Crédito" },
  { value: "boleto", label: "Boleto" },
];

const STATUS_TONE: Record<ContaStatus, "warning" | "success" | "danger"> = {
  aberto: "warning", pago: "success", vencido: "danger",
};
const STATUS_LABEL: Record<ContaStatus, string> = {
  aberto: "Em aberto", pago: "Pago", vencido: "Vencido",
};

const ContasPagar = () => {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState("todos");
  const [filterCategoria, setFilterCategoria] = useState("todas");
  const [filterFrom, setFilterFrom] = useState("");
  const [filterTo, setFilterTo] = useState("");

  const { data: contas = [], isLoading } = useQuery({
    queryKey: ["contas_pagar"],
    queryFn: async () => {
      const { data, error } = await supabase.from("contas_pagar").select("*").order("vencimento");
      if (error) throw error;
      return data || [];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (form: any) => {
      if (editing?.id) {
        const { error } = await supabase.from("contas_pagar").update(form).eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("contas_pagar").insert(form);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contas_pagar"] });
      setOpen(false);
      setEditing(null);
      toast({ title: editing ? "Conta atualizada" : "Conta cadastrada" });
    },
    onError: (err: any) => toast({ title: err?.message || "Erro ao salvar", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("contas_pagar").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contas_pagar"] });
      toast({ title: "Conta removida" });
    },
  });

  const filtered = useMemo(() =>
    contas.filter((c: any) => {
      if (filterStatus !== "todos" && c.status !== filterStatus) return false;
      if (filterCategoria !== "todas" && c.categoria !== filterCategoria) return false;
      if (filterFrom && c.vencimento < filterFrom) return false;
      if (filterTo && c.vencimento > filterTo) return false;
      return true;
    }),
    [contas, filterStatus, filterCategoria, filterFrom, filterTo]
  );

  const totals = useMemo(() => ({
    aberto: contas.filter((c: any) => c.status === "aberto").reduce((s: number, c: any) => s + Number(c.valor), 0),
    pago: contas.filter((c: any) => c.status === "pago").reduce((s: number, c: any) => s + Number(c.valor), 0),
    vencido: contas.filter((c: any) => c.status === "vencido").reduce((s: number, c: any) => s + Number(c.valor), 0),
  }), [contas]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Contas a Pagar</h3>
        <Button onClick={() => { setEditing(null); setOpen(true); }}>
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
          <p className="text-lg font-bold mt-1">{formatBRL(totals.pago)}</p>
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
            {CATEGORIAS.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <Input type="date" value={filterFrom} onChange={(e) => setFilterFrom(e.target.value)} />
        <Input type="date" value={filterTo} onChange={(e) => setFilterTo(e.target.value)} />
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground text-center py-8">Carregando...</p>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">Nenhuma conta encontrada.</p>
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
              {filtered.map((c: any) => (
                <tr key={c.id} className="border-b border-border last:border-0 even:bg-muted/30">
                  <td className="p-3">{c.descricao}</td>
                  <td className="p-3 capitalize">{CATEGORIAS.find((k) => k.value === c.categoria)?.label || c.categoria}</td>
                  <td className="p-3">{formatDateBR(c.vencimento)}</td>
                  <td className="p-3 text-right">{formatBRL(Number(c.valor))}</td>
                  <td className="p-3">
                    <StatusBadge tone={STATUS_TONE[c.status as ContaStatus] || "warning"}>
                      {STATUS_LABEL[c.status as ContaStatus] || c.status}
                    </StatusBadge>
                  </td>
                  <td className="p-3 text-right whitespace-nowrap">
                    <button onClick={() => { setEditing(c); setOpen(true); }} className="p-1.5 rounded hover:bg-accent text-muted-foreground">
                      <Edit2 size={14} />
                    </button>
                    <button onClick={() => setConfirmId(c.id)} className="p-1.5 rounded hover:bg-accent text-muted-foreground hover:text-destructive">
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
        categorias={CATEGORIAS}
        formas={FORMAS}
        onSave={(form) => saveMutation.mutate(form)}
      />

      <ConfirmDialog
        open={!!confirmId}
        onOpenChange={(v) => !v && setConfirmId(null)}
        onConfirm={() => { if (confirmId) deleteMutation.mutate(confirmId); setConfirmId(null); }}
      />
    </div>
  );
};

interface DialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  initial: any | null;
  categorias: { value: string; label: string }[];
  formas: { value: string; label: string }[];
  onSave: (form: any) => void;
}

const ContaPagarDialog = ({ open, onOpenChange, initial, categorias, formas, onSave }: DialogProps) => {
  const isEdit = !!initial?.id;
  const [descricao, setDescricao] = useState(initial?.descricao ?? "");
  const [categoria, setCategoria] = useState(initial?.categoria ?? "outros");
  const [valor, setValor] = useState(initial?.valor?.toString() ?? "");
  const [vencimento, setVencimento] = useState(initial?.vencimento ?? "");
  const [forma, setForma] = useState(initial?.forma_pagamento ?? "pix");
  const [obs, setObs] = useState(initial?.observacoes ?? "");
  const [status, setStatus] = useState(initial?.status ?? "aberto");

  useMemo(() => {
    setDescricao(initial?.descricao ?? "");
    setCategoria(initial?.categoria ?? "outros");
    setValor(initial?.valor?.toString() ?? "");
    setVencimento(initial?.vencimento ?? "");
    setForma(initial?.forma_pagamento ?? "pix");
    setObs(initial?.observacoes ?? "");
    setStatus(initial?.status ?? "aberto");
  }, [initial, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const v = parseFloat(valor);
    if (!descricao.trim()) return toast({ title: "Descrição obrigatória", variant: "destructive" });
    if (isNaN(v) || v <= 0) return toast({ title: "Valor inválido", variant: "destructive" });
    if (!vencimento) return toast({ title: "Vencimento obrigatório", variant: "destructive" });
    onSave({
      descricao: descricao.trim(),
      categoria,
      valor: v,
      vencimento,
      forma_pagamento: forma,
      observacoes: obs.trim() || null,
      status,
      pago_em: status === "pago" ? new Date().toISOString() : null,
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
                <SelectContent>{categorias.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent>
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
              <Input type="date" value={vencimento} onChange={(e) => setVencimento(e.target.value)} required />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Forma de pagamento</label>
              <Select value={forma} onValueChange={setForma}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{formas.map((f) => <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Status</label>
            <Select value={status} onValueChange={setStatus}>
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
            <Input value={obs} onChange={(e) => setObs(e.target.value)} />
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
