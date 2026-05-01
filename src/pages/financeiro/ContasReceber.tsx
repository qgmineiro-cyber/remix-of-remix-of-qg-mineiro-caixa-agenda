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

type ReceberStatus = "aberto" | "recebido" | "vencido";

const FORMAS = [
  { value: "dinheiro", label: "Dinheiro" },
  { value: "pix", label: "PIX" },
  { value: "debito", label: "Débito" },
  { value: "credito", label: "Crédito" },
  { value: "boleto", label: "Boleto" },
];

const STATUS_TONE: Record<ReceberStatus, "warning" | "success" | "danger"> = {
  aberto: "warning", recebido: "success", vencido: "danger",
};
const STATUS_LABEL: Record<ReceberStatus, string> = {
  aberto: "Em aberto", recebido: "Recebido", vencido: "Vencido",
};

const ContasReceber = () => {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState("todos");
  const [filterOrigem, setFilterOrigem] = useState("");
  const [filterFrom, setFilterFrom] = useState("");
  const [filterTo, setFilterTo] = useState("");

  const { data: contas = [], isLoading } = useQuery({
    queryKey: ["contas_receber"],
    queryFn: async () => {
      const { data, error } = await supabase.from("contas_receber").select("*").order("vencimento");
      if (error) throw error;
      return data || [];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (form: any) => {
      if (editing?.id) {
        const { error } = await supabase.from("contas_receber").update(form).eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("contas_receber").insert(form);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contas_receber"] });
      setOpen(false);
      setEditing(null);
      toast({ title: editing ? "Conta atualizada" : "Conta cadastrada" });
    },
    onError: (err: any) => toast({ title: err?.message || "Erro ao salvar", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("contas_receber").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contas_receber"] });
      toast({ title: "Conta removida" });
    },
  });

  const filtered = useMemo(() =>
    contas.filter((c: any) => {
      if (filterStatus !== "todos" && c.status !== filterStatus) return false;
      if (filterOrigem && !(c.origem || "").toLowerCase().includes(filterOrigem.toLowerCase())) return false;
      if (filterFrom && c.vencimento < filterFrom) return false;
      if (filterTo && c.vencimento > filterTo) return false;
      return true;
    }),
    [contas, filterStatus, filterOrigem, filterFrom, filterTo]
  );

  const totals = useMemo(() => ({
    aberto: contas.filter((c: any) => c.status === "aberto").reduce((s: number, c: any) => s + Number(c.valor), 0),
    recebido: contas.filter((c: any) => c.status === "recebido").reduce((s: number, c: any) => s + Number(c.valor), 0),
    vencido: contas.filter((c: any) => c.status === "vencido").reduce((s: number, c: any) => s + Number(c.valor), 0),
  }), [contas]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Contas a Receber</h3>
        <Button onClick={() => { setEditing(null); setOpen(true); }}>
          <Plus size={16} /> Nova conta
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-lg border border-border p-4 bg-card text-center">
          <p className="text-xs text-muted-foreground">Total a receber</p>
          <p className="text-lg font-bold mt-1">{formatBRL(totals.aberto)}</p>
        </div>
        <div className="rounded-lg border border-border p-4 bg-card text-center">
          <p className="text-xs text-muted-foreground">Recebido no mês</p>
          <p className="text-lg font-bold mt-1">{formatBRL(totals.recebido)}</p>
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
            <SelectItem value="recebido">Recebido</SelectItem>
            <SelectItem value="vencido">Vencido</SelectItem>
          </SelectContent>
        </Select>
        <Input placeholder="Origem / Cliente" value={filterOrigem} onChange={(e) => setFilterOrigem(e.target.value)} />
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
                <th className="text-left p-3 font-medium">Origem</th>
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
                  <td className="p-3">{c.origem || "—"}</td>
                  <td className="p-3">{formatDateBR(c.vencimento)}</td>
                  <td className="p-3 text-right">{formatBRL(Number(c.valor))}</td>
                  <td className="p-3">
                    <StatusBadge tone={STATUS_TONE[c.status as ReceberStatus] || "warning"}>
                      {STATUS_LABEL[c.status as ReceberStatus] || c.status}
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

      <ContaReceberDialog
        open={open}
        onOpenChange={(v) => { setOpen(v); if (!v) setEditing(null); }}
        initial={editing}
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
  formas: { value: string; label: string }[];
  onSave: (form: any) => void;
}

const ContaReceberDialog = ({ open, onOpenChange, initial, formas, onSave }: DialogProps) => {
  const isEdit = !!initial?.id;
  const [descricao, setDescricao] = useState(initial?.descricao ?? "");
  const [origem, setOrigem] = useState(initial?.origem ?? "");
  const [valor, setValor] = useState(initial?.valor?.toString() ?? "");
  const [vencimento, setVencimento] = useState(initial?.vencimento ?? "");
  const [forma, setForma] = useState(initial?.forma_pagamento ?? "pix");
  const [obs, setObs] = useState(initial?.observacoes ?? "");
  const [status, setStatus] = useState(initial?.status ?? "aberto");

  useMemo(() => {
    setDescricao(initial?.descricao ?? "");
    setOrigem(initial?.origem ?? "");
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
    if (!vencimento) return toast({ title: "Data prevista obrigatória", variant: "destructive" });
    onSave({
      descricao: descricao.trim(),
      origem: origem.trim() || null,
      valor: v,
      vencimento,
      forma_pagamento: forma,
      observacoes: obs.trim() || null,
      status,
      recebido_em: status === "recebido" ? new Date().toISOString() : null,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar conta a receber" : "Nova conta a receber"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-sm font-medium mb-1 block">Descrição</label>
            <Input value={descricao} onChange={(e) => setDescricao(e.target.value)} required />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Cliente / Origem</label>
            <Input value={origem} onChange={(e) => setOrigem(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium mb-1 block">Valor (R$)</label>
              <Input type="number" min="0.01" step="0.01" value={valor} onChange={(e) => setValor(e.target.value)} required />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Data prevista</label>
              <Input type="date" value={vencimento} onChange={(e) => setVencimento(e.target.value)} required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium mb-1 block">Forma de pagamento</label>
              <Select value={forma} onValueChange={setForma}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{formas.map((f) => <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Status</label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="aberto">Em aberto</SelectItem>
                  <SelectItem value="recebido">Recebido</SelectItem>
                  <SelectItem value="vencido">Vencido</SelectItem>
                </SelectContent>
              </Select>
            </div>
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

export default ContasReceber;
