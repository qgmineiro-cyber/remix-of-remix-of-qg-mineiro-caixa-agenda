import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { ChevronLeft, ChevronRight, Plus, Edit2, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import StatusBadge from "@/components/StatusBadge";
import ConfirmDialog from "@/components/ConfirmDialog";
import { toast } from "@/hooks/use-toast";

const HORARIOS = Array.from({ length: 13 }, (_, i) => `${(8 + i).toString().padStart(2, "0")}:00`);

const STATUS_TONE: Record<string, "warning" | "success" | "danger" | "muted"> = {
  agendado: "warning",
  concluido: "success",
  cancelado: "danger",
  faltou: "danger",
};

const STATUS_LABEL: Record<string, string> = {
  agendado: "Agendado",
  concluido: "Concluído",
  cancelado: "Cancelado",
  faltou: "Faltou",
};

const addDays = (date: Date, days: number) => {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
};

const startOfWeek = (date: Date) => {
  const d = new Date(date);
  d.setDate(d.getDate() - d.getDay());
  d.setHours(0, 0, 0, 0);
  return d;
};

const Agenda = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const queryClient = useQueryClient();

  const [semanaBase, setSemanaBase] = useState(() => startOfWeek(new Date()));
  const [diaSelecionado, setDiaSelecionado] = useState(new Date().getDay());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editando, setEditando] = useState<any | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const diasSemana = useMemo(() =>
    Array.from({ length: 7 }, (_, i) => addDays(semanaBase, i)),
    [semanaBase]
  );

  const diaAtual = diasSemana[diaSelecionado];
  const dataInicio = diaAtual.toISOString().slice(0, 10) + "T00:00:00";
  const dataFim = diaAtual.toISOString().slice(0, 10) + "T23:59:59";

  const { data: barbeiros = [] } = useQuery({
    queryKey: ["barbeiros"],
    queryFn: async () => {
      const { data, error } = await supabase.from("barbeiros").select("id, nome").eq("ativo", true).order("nome");
      if (error) throw error;
      return data;
    },
    enabled: isAdmin,
  });

  const { data: servicos = [] } = useQuery({
    queryKey: ["servicos"],
    queryFn: async () => {
      const { data, error } = await supabase.from("servicos").select("id, nome, preco, duracao").eq("ativo", true).order("nome");
      if (error) throw error;
      return data;
    },
  });

  const { data: agendamentos = [], isLoading } = useQuery({
    queryKey: ["agendamentos", diaAtual.toISOString().slice(0, 10), user?.id, isAdmin],
    queryFn: async () => {
      let query = supabase
        .from("agendamentos")
        .select("*, barbeiros(nome)")
        .gte("data_hora", dataInicio)
        .lte("data_hora", dataFim)
        .order("data_hora");

      if (!isAdmin && user?.id) {
        query = query.eq("barbeiro_id", user.id);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  const saveMutation = useMutation({
    mutationFn: async (form: any) => {
      if (editando?.id) {
        const { error } = await supabase.from("agendamentos").update(form).eq("id", editando.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("agendamentos").insert(form);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agendamentos"] });
      setDialogOpen(false);
      setEditando(null);
      toast({ title: editando ? "Agendamento atualizado" : "Agendamento criado" });
    },
    onError: (err: any) => toast({ title: err?.message || "Erro ao salvar", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("agendamentos").update({ status: "cancelado" }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agendamentos"] });
      toast({ title: "Agendamento cancelado" });
    },
  });

  const getAgendamentoByHora = (hora: string) =>
    agendamentos.find((a) => {
      const h = new Date(a.data_hora).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
      return h === hora && a.status !== "cancelado";
    });

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Agenda</h2>
        <button
          onClick={() => { setEditando(null); setDialogOpen(true); }}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
        >
          <Plus size={16} /> Agendar
        </button>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => { setSemanaBase((d) => addDays(d, -7)); }}
          className="p-1 rounded hover:bg-accent transition-colors"
        >
          <ChevronLeft size={18} />
        </button>
        <div className="flex-1 grid grid-cols-7 gap-1">
          {diasSemana.map((d, i) => {
            const isHoje = d.toDateString() === new Date().toDateString();
            const isSel = i === diaSelecionado;
            return (
              <button
                key={i}
                onClick={() => setDiaSelecionado(i)}
                className={`flex flex-col items-center py-2 rounded-lg text-xs transition-colors ${
                  isSel ? "bg-primary text-primary-foreground" : isHoje ? "bg-accent font-medium" : "hover:bg-accent"
                }`}
              >
                <span className="uppercase">{d.toLocaleDateString("pt-BR", { weekday: "short" }).slice(0, 3)}</span>
                <span className="text-lg font-semibold">{d.getDate()}</span>
              </button>
            );
          })}
        </div>
        <button
          onClick={() => { setSemanaBase((d) => addDays(d, 7)); }}
          className="p-1 rounded hover:bg-accent transition-colors"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground text-center py-8">Carregando...</p>
      ) : (
        <div className="space-y-1">
          {HORARIOS.map((h) => {
            const ag = getAgendamentoByHora(h);
            return (
              <div
                key={h}
                className={`flex items-center gap-4 p-3 rounded-lg border transition-colors ${ag ? "border-border bg-card" : "border-transparent"}`}
              >
                <span className="text-sm text-muted-foreground w-12 shrink-0">{h}</span>
                {ag ? (
                  <>
                    <div className="flex-1">
                      <p className="text-sm font-medium">
                        {ag.cliente_nome} — {ag.servico_id ? servicos.find((s) => s.id === ag.servico_id)?.nome || "Serviço" : "Serviço"}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <StatusBadge tone={STATUS_TONE[ag.status] || "muted"}>
                          {STATUS_LABEL[ag.status] || ag.status}
                        </StatusBadge>
                        {isAdmin && ag.barbeiros && (
                          <span className="text-xs text-muted-foreground">· {(ag.barbeiros as any).nome}</span>
                        )}
                        {ag.valor > 0 && (
                          <span className="text-xs text-muted-foreground">· R$ {Number(ag.valor).toFixed(2)}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => { setEditando(ag); setDialogOpen(true); }}
                        className="p-1.5 rounded hover:bg-accent transition-colors text-muted-foreground"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={() => setConfirmDeleteId(ag.id)}
                        className="p-1.5 rounded hover:bg-accent transition-colors text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="flex-1 border-b border-border" />
                )}
              </div>
            );
          })}
        </div>
      )}

      <AgendamentoDialog
        open={dialogOpen}
        onOpenChange={(v) => { setDialogOpen(v); if (!v) setEditando(null); }}
        initial={editando}
        barbeiros={barbeiros}
        servicos={servicos}
        isAdmin={isAdmin}
        barbeiroId={user?.id || ""}
        dataDefault={diaAtual.toISOString().slice(0, 10)}
        onSave={(form) => saveMutation.mutate(form)}
      />

      <ConfirmDialog
        open={!!confirmDeleteId}
        onOpenChange={(v) => !v && setConfirmDeleteId(null)}
        onConfirm={() => { if (confirmDeleteId) deleteMutation.mutate(confirmDeleteId); setConfirmDeleteId(null); }}
      />
    </div>
  );
};

interface AgendamentoDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  initial: any | null;
  barbeiros: { id: string; nome: string }[];
  servicos: { id: string; nome: string; preco: number; duracao: number }[];
  isAdmin: boolean;
  barbeiroId: string;
  dataDefault: string;
  onSave: (form: any) => void;
}

const AgendamentoDialog = ({ open, onOpenChange, initial, barbeiros, servicos, isAdmin, barbeiroId, dataDefault, onSave }: AgendamentoDialogProps) => {
  const isEdit = !!initial?.id;
  const [clienteNome, setClienteNome] = useState(initial?.cliente_nome ?? "");
  const [barbeiroSel, setBarbeiroSel] = useState(initial?.barbeiro_id ?? barbeiroId);
  const [servicoSel, setServicoSel] = useState(initial?.servico_id ?? "");
  const [data, setData] = useState(initial ? new Date(initial.data_hora).toISOString().slice(0, 10) : dataDefault);
  const [hora, setHora] = useState(initial ? new Date(initial.data_hora).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }) : "09:00");
  const [valor, setValor] = useState(initial?.valor?.toString() ?? "");
  const [status, setStatus] = useState(initial?.status ?? "agendado");
  const [obs, setObs] = useState(initial?.observacoes ?? "");

  useMemo(() => {
    setClienteNome(initial?.cliente_nome ?? "");
    setBarbeiroSel(initial?.barbeiro_id ?? barbeiroId);
    setServicoSel(initial?.servico_id ?? "");
    setData(initial ? new Date(initial.data_hora).toISOString().slice(0, 10) : dataDefault);
    setHora(initial ? new Date(initial.data_hora).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }) : "09:00");
    setValor(initial?.valor?.toString() ?? "");
    setStatus(initial?.status ?? "agendado");
    setObs(initial?.observacoes ?? "");
  }, [initial, open, barbeiroId, dataDefault]);

  const handleServicoChange = (id: string) => {
    setServicoSel(id);
    const s = servicos.find((s) => s.id === id);
    if (s && !valor) setValor(String(s.preco));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clienteNome.trim()) return toast({ title: "Nome do cliente obrigatório", variant: "destructive" });
    if (!barbeiroSel) return toast({ title: "Selecione o barbeiro", variant: "destructive" });
    if (!data || !hora) return toast({ title: "Data e hora obrigatórias", variant: "destructive" });

    const dataHora = new Date(`${data}T${hora}:00`).toISOString();
    onSave({
      barbeiro_id: barbeiroSel,
      cliente_nome: clienteNome.trim(),
      servico_id: servicoSel || null,
      data_hora: dataHora,
      duracao: servicos.find((s) => s.id === servicoSel)?.duracao || 30,
      valor: parseFloat(valor) || 0,
      status,
      observacoes: obs.trim() || null,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar agendamento" : "Novo agendamento"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-sm font-medium mb-1 block">Cliente</label>
            <Input value={clienteNome} onChange={(e) => setClienteNome(e.target.value)} placeholder="Nome do cliente" required />
          </div>
          {isAdmin && (
            <div>
              <label className="text-sm font-medium mb-1 block">Barbeiro</label>
              <Select value={barbeiroSel} onValueChange={setBarbeiroSel}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {barbeiros.map((b) => <SelectItem key={b.id} value={b.id}>{b.nome}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}
          <div>
            <label className="text-sm font-medium mb-1 block">Serviço</label>
            <Select value={servicoSel} onValueChange={handleServicoChange}>
              <SelectTrigger><SelectValue placeholder="Selecione o serviço" /></SelectTrigger>
              <SelectContent>
                {servicos.map((s) => <SelectItem key={s.id} value={s.id}>{s.nome} — R$ {Number(s.preco).toFixed(2)}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium mb-1 block">Data</label>
              <Input type="date" value={data} onChange={(e) => setData(e.target.value)} required />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Hora</label>
              <Input type="time" value={hora} onChange={(e) => setHora(e.target.value)} required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium mb-1 block">Valor (R$)</label>
              <Input type="number" min="0" step="0.01" value={valor} onChange={(e) => setValor(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Status</label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="agendado">Agendado</SelectItem>
                  <SelectItem value="concluido">Concluído</SelectItem>
                  <SelectItem value="cancelado">Cancelado</SelectItem>
                  <SelectItem value="faltou">Faltou</SelectItem>
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

export default Agenda;
