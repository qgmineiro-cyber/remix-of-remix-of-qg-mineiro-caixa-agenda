import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import {
  Plus,
  Trash2,
  Target,
  TrendingUp,
  Scissors,
  Package,
  DollarSign,
  Clock,
  Trophy,
  CalendarRange,
  ChevronDown,
  ChevronUp,
  Users,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import ConfirmDialog from "@/components/ConfirmDialog";
import { format, differenceInDays, parseISO, isAfter, isBefore, isToday } from "date-fns";
import { ptBR } from "date-fns/locale";

type TipoMeta = "dinheiro" | "cortes" | "produtos";

interface Meta {
  id: string;
  barbeiro_id: string;
  tipo: TipoMeta;
  titulo: string;
  descricao: string | null;
  valor_meta: number;
  data_inicio: string;
  data_fim: string;
  criado_por: string | null;
  created_at: string;
}

interface MetaComProgresso extends Meta {
  barbeiro_nome: string;
  progresso: number;
  percentual: number;
  status: "futura" | "em_andamento" | "concluida" | "expirada";
  dias_restantes: number;
}

function calcularStatus(meta: Meta, progresso: number): MetaComProgresso["status"] {
  const hoje = new Date();
  const inicio = parseISO(meta.data_inicio);
  const fim = parseISO(meta.data_fim);

  if (progresso >= meta.valor_meta) return "concluida";
  if (isAfter(inicio, hoje)) return "futura";
  if (isBefore(fim, hoje) && !isToday(fim)) return "expirada";
  return "em_andamento";
}

const tipoConfig = {
  dinheiro: {
    label: "Faturamento",
    icon: DollarSign,
    color: "text-emerald-500",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/20",
    gradient: "from-emerald-500/20 to-emerald-500/5",
    format: (v: number) =>
      v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }),
  },
  cortes: {
    label: "Cortes",
    icon: Scissors,
    color: "text-blue-500",
    bg: "bg-blue-500/10",
    border: "border-blue-500/20",
    gradient: "from-blue-500/20 to-blue-500/5",
    format: (v: number) => `${v} corte${v !== 1 ? "s" : ""}`,
  },
  produtos: {
    label: "Produtos",
    icon: Package,
    color: "text-purple-500",
    bg: "bg-purple-500/10",
    border: "border-purple-500/20",
    gradient: "from-purple-500/20 to-purple-500/5",
    format: (v: number) => `${v} item${v !== 1 ? "ns" : ""}`,
  },
};

const statusConfig = {
  futura: { label: "Futura", color: "bg-slate-500/10 text-slate-400 border-slate-500/20" },
  em_andamento: { label: "Em andamento", color: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
  concluida: { label: "Concluída", color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
  expirada: { label: "Expirada", color: "bg-red-500/10 text-red-400 border-red-500/20" },
};

function MetaCard({
  meta,
  isAdmin,
  onDelete,
}: {
  meta: MetaComProgresso;
  isAdmin: boolean;
  onDelete: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const tipo = tipoConfig[meta.tipo];
  const st = statusConfig[meta.status];
  const Icon = tipo.icon;
  const clamp = Math.min(meta.percentual, 100);

  const diasLabel = () => {
    if (meta.status === "futura") {
      const d = differenceInDays(parseISO(meta.data_inicio), new Date());
      return `começa em ${d} dia${d !== 1 ? "s" : ""}`;
    }
    if (meta.status === "em_andamento") {
      if (meta.dias_restantes === 0) return "último dia!";
      return `${meta.dias_restantes} dia${meta.dias_restantes !== 1 ? "s" : ""} restante${meta.dias_restantes !== 1 ? "s" : ""}`;
    }
    if (meta.status === "concluida") return "Meta batida!";
    return "encerrada";
  };

  return (
    <div
      className={`rounded-xl border bg-card overflow-hidden transition-all duration-200 hover:shadow-md ${
        meta.status === "concluida"
          ? "border-emerald-500/30"
          : meta.status === "expirada"
          ? "border-red-500/20 opacity-75"
          : "border-border"
      }`}
    >
      {/* Gradient top bar */}
      <div className={`h-1 w-full bg-gradient-to-r ${tipo.gradient}`} />

      <div className="p-4 space-y-3">
        {/* Header row */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className={`p-2 rounded-lg ${tipo.bg} shrink-0`}>
              <Icon size={16} className={tipo.color} />
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-sm leading-tight truncate">{meta.titulo}</p>
              {isAdmin && (
                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                  <Users size={10} />
                  {meta.barbeiro_nome}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <span
              className={`text-xs px-2 py-0.5 rounded-full border font-medium ${st.color}`}
            >
              {st.label}
            </span>
            {isAdmin && (
              <button
                onClick={() => onDelete(meta.id)}
                className="p-1 rounded hover:bg-destructive/10 hover:text-destructive text-muted-foreground transition-colors"
              >
                <Trash2 size={13} />
              </button>
            )}
          </div>
        </div>

        {/* Progress section */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className={`font-bold text-base ${tipo.color}`}>
              {tipo.format(meta.progresso)}
            </span>
            <span className="text-muted-foreground">
              meta: {tipo.format(meta.valor_meta)}
            </span>
          </div>

          {/* Progress bar */}
          <div className="h-2.5 rounded-full bg-muted overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ${
                meta.status === "concluida"
                  ? "bg-emerald-500"
                  : meta.status === "expirada"
                  ? "bg-red-400"
                  : meta.status === "futura"
                  ? "bg-slate-400"
                  : "bg-blue-500"
              }`}
              style={{ width: `${clamp}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="font-medium">{meta.percentual.toFixed(0)}% concluído</span>
            <span
              className={`flex items-center gap-1 ${
                meta.status === "concluida"
                  ? "text-emerald-500 font-semibold"
                  : meta.status === "expirada"
                  ? "text-red-400"
                  : meta.dias_restantes <= 3 && meta.status === "em_andamento"
                  ? "text-amber-400 font-medium"
                  : ""
              }`}
            >
              {meta.status === "concluida" ? (
                <Trophy size={11} />
              ) : (
                <Clock size={11} />
              )}
              {diasLabel()}
            </span>
          </div>
        </div>

        {/* Expandable details */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center justify-between text-xs text-muted-foreground hover:text-foreground transition-colors pt-1 border-t border-border"
        >
          <span className="flex items-center gap-1">
            <CalendarRange size={11} />
            {format(parseISO(meta.data_inicio), "dd/MM/yy", { locale: ptBR })} →{" "}
            {format(parseISO(meta.data_fim), "dd/MM/yy", { locale: ptBR })}
          </span>
          {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        </button>

        {expanded && meta.descricao && (
          <p className="text-xs text-muted-foreground bg-muted/40 rounded-lg p-2.5 leading-relaxed">
            {meta.descricao}
          </p>
        )}
      </div>
    </div>
  );
}

const Metas = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const isAdmin = user?.role === "admin";

  const [showDialog, setShowDialog] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [filterBarbeiro, setFilterBarbeiro] = useState<string>("todos");
  const [filterStatus, setFilterStatus] = useState<string>("todos");

  // Form state
  const [fBarbeiroId, setFBarbeiroId] = useState("");
  const [fTipo, setFTipo] = useState<TipoMeta>("dinheiro");
  const [fTitulo, setFTitulo] = useState("");
  const [fDescricao, setFDescricao] = useState("");
  const [fValor, setFValor] = useState("");
  const [fInicio, setFInicio] = useState("");
  const [fFim, setFFim] = useState("");

  const resetForm = () => {
    setFBarbeiroId("");
    setFTipo("dinheiro");
    setFTitulo("");
    setFDescricao("");
    setFValor("");
    setFInicio("");
    setFFim("");
  };

  // Fetch barbeiros
  const { data: barbeiros = [] } = useQuery({
    queryKey: ["barbeiros"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("barbeiros")
        .select("id, nome")
        .eq("ativo", true)
        .order("nome");
      if (error) throw error;
      return data;
    },
  });

  // Fetch metas
  const { data: metas = [], isLoading } = useQuery({
    queryKey: ["metas", user?.id, isAdmin],
    queryFn: async () => {
      let query = supabase
        .from("metas" as any)
        .select("*")
        .order("data_fim", { ascending: true });

      if (!isAdmin && user?.id) {
        query = query.eq("barbeiro_id", user.id);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as Meta[];
    },
  });

  // Fetch atendimentos for progress calculation (within all meta periods)
  const barbeiroIds = useMemo(() => {
    if (isAdmin) return barbeiros.map((b) => b.id);
    return user?.id ? [user.id] : [];
  }, [barbeiros, isAdmin, user?.id]);

  const { data: atendimentos = [] } = useQuery({
    queryKey: ["atendimentos-metas", barbeiroIds],
    enabled: barbeiroIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("atendimentos")
        .select("id, barbeiro_id, valor, data_atendimento, servico_id")
        .in("barbeiro_id", barbeiroIds);
      if (error) throw error;
      return data ?? [];
    },
  });

  // Calculate progress for each meta
  const metasComProgresso = useMemo((): MetaComProgresso[] => {
    return metas.map((meta) => {
      const metaInicio = new Date(meta.data_inicio + "T00:00:00");
      const metaFim = new Date(meta.data_fim + "T23:59:59");

      const atendimentosMeta = atendimentos.filter((a) => {
        const d = new Date(a.data_atendimento);
        return (
          a.barbeiro_id === meta.barbeiro_id &&
          d >= metaInicio &&
          d <= metaFim
        );
      });

      let progresso = 0;
      if (meta.tipo === "dinheiro") {
        progresso = atendimentosMeta.reduce((sum, a) => sum + (a.valor ?? 0), 0);
      } else if (meta.tipo === "cortes") {
        progresso = atendimentosMeta.length;
      } else if (meta.tipo === "produtos") {
        progresso = atendimentosMeta.filter((a) => a.servico_id === null).length;
      }

      const percentual = meta.valor_meta > 0 ? (progresso / meta.valor_meta) * 100 : 0;
      const status = calcularStatus(meta, progresso);
      const hoje = new Date();
      const fim = parseISO(meta.data_fim);
      const dias_restantes = Math.max(0, differenceInDays(fim, hoje));

      const barbeiro = barbeiros.find((b) => b.id === meta.barbeiro_id);

      return {
        ...meta,
        barbeiro_nome: barbeiro?.nome ?? "—",
        progresso,
        percentual,
        status,
        dias_restantes,
      };
    });
  }, [metas, atendimentos, barbeiros]);

  // Filtered metas
  const metasFiltradas = useMemo(() => {
    return metasComProgresso.filter((m) => {
      if (filterBarbeiro !== "todos" && m.barbeiro_id !== filterBarbeiro) return false;
      if (filterStatus !== "todos" && m.status !== filterStatus) return false;
      return true;
    });
  }, [metasComProgresso, filterBarbeiro, filterStatus]);

  // Stats
  const stats = useMemo(() => {
    const ativas = metasComProgresso.filter((m) => m.status === "em_andamento");
    const concluidas = metasComProgresso.filter((m) => m.status === "concluida");
    const expiradas = metasComProgresso.filter((m) => m.status === "expirada");
    return { ativas: ativas.length, concluidas: concluidas.length, expiradas: expiradas.length, total: metasComProgresso.length };
  }, [metasComProgresso]);

  // Create meta mutation
  const createMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("metas" as any).insert({
        barbeiro_id: fBarbeiroId,
        tipo: fTipo,
        titulo: fTitulo.trim(),
        descricao: fDescricao.trim() || null,
        valor_meta: parseFloat(fValor),
        data_inicio: fInicio,
        data_fim: fFim,
        criado_por: user?.id ?? null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["metas"] });
      setShowDialog(false);
      resetForm();
      toast({ title: "Meta criada com sucesso!" });
    },
    onError: (err: any) =>
      toast({ title: err?.message ?? "Erro ao criar meta", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("metas" as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["metas"] });
      toast({ title: "Meta removida" });
    },
    onError: () => toast({ title: "Erro ao remover meta", variant: "destructive" }),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fBarbeiroId) return toast({ title: "Selecione um barbeiro", variant: "destructive" });
    if (!fTitulo.trim()) return toast({ title: "Título obrigatório", variant: "destructive" });
    const val = parseFloat(fValor);
    if (isNaN(val) || val <= 0) return toast({ title: "Valor da meta inválido", variant: "destructive" });
    if (!fInicio || !fFim) return toast({ title: "Período obrigatório", variant: "destructive" });
    if (fInicio > fFim) return toast({ title: "Data de início deve ser antes do fim", variant: "destructive" });
    createMutation.mutate();
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Target size={20} className="text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-semibold leading-none">Metas</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {isAdmin ? "Gerencie as metas da equipe" : "Acompanhe suas metas"}
            </p>
          </div>
        </div>
        {isAdmin && (
          <button
            onClick={() => setShowDialog(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
          >
            <Plus size={16} />
            Nova Meta
          </button>
        )}
      </div>

      {/* Stats cards */}
      {metasComProgresso.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Total", value: stats.total, icon: Target, color: "text-foreground", bg: "bg-muted" },
            { label: "Ativas", value: stats.ativas, icon: TrendingUp, color: "text-blue-500", bg: "bg-blue-500/10" },
            { label: "Concluídas", value: stats.concluidas, icon: Trophy, color: "text-emerald-500", bg: "bg-emerald-500/10" },
            { label: "Expiradas", value: stats.expiradas, icon: Clock, color: "text-red-400", bg: "bg-red-500/10" },
          ].map((s) => (
            <div key={s.label} className="rounded-xl border border-border bg-card p-3 flex items-center gap-3">
              <div className={`p-2 rounded-lg ${s.bg} shrink-0`}>
                <s.icon size={16} className={s.color} />
              </div>
              <div>
                <p className={`text-xl font-bold leading-none ${s.color}`}>{s.value}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      {(isAdmin || metasComProgresso.length > 2) && (
        <div className="flex gap-3 flex-wrap">
          {isAdmin && (
            <Select value={filterBarbeiro} onValueChange={setFilterBarbeiro}>
              <SelectTrigger className="w-44 h-9 text-sm">
                <SelectValue placeholder="Todos os barbeiros" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os barbeiros</SelectItem>
                {barbeiros.map((b) => (
                  <SelectItem key={b.id} value={b.id}>{b.nome}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-44 h-9 text-sm">
              <SelectValue placeholder="Todos os status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os status</SelectItem>
              <SelectItem value="em_andamento">Em andamento</SelectItem>
              <SelectItem value="concluida">Concluídas</SelectItem>
              <SelectItem value="futura">Futuras</SelectItem>
              <SelectItem value="expirada">Expiradas</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Metas grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-48 rounded-xl border border-border bg-card animate-pulse" />
          ))}
        </div>
      ) : metasFiltradas.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
          <div className="p-4 rounded-full bg-muted">
            <Target size={32} className="text-muted-foreground" />
          </div>
          <div>
            <p className="font-medium text-muted-foreground">
              {metasComProgresso.length === 0
                ? isAdmin
                  ? "Nenhuma meta criada ainda"
                  : "Você ainda não tem metas"
                : "Nenhuma meta encontrada com esses filtros"}
            </p>
            {isAdmin && metasComProgresso.length === 0 && (
              <p className="text-sm text-muted-foreground mt-1">
                Clique em "Nova Meta" para criar a primeira
              </p>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {metasFiltradas.map((meta) => (
            <MetaCard
              key={meta.id}
              meta={meta}
              isAdmin={isAdmin}
              onDelete={(id) => setConfirmDeleteId(id)}
            />
          ))}
        </div>
      )}

      {/* Create Meta Dialog */}
      {isAdmin && (
        <Dialog open={showDialog} onOpenChange={(v) => { setShowDialog(v); if (!v) resetForm(); }}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Target size={18} className="text-primary" />
                Nova Meta
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4 mt-2">
              {/* Barbeiro */}
              <div>
                <label className="text-sm font-medium mb-1.5 block">Barbeiro</label>
                <Select value={fBarbeiroId} onValueChange={setFBarbeiroId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o barbeiro" />
                  </SelectTrigger>
                  <SelectContent>
                    {barbeiros.map((b) => (
                      <SelectItem key={b.id} value={b.id}>{b.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Tipo */}
              <div>
                <label className="text-sm font-medium mb-1.5 block">Tipo de Meta</label>
                <div className="grid grid-cols-3 gap-2">
                  {(["dinheiro", "cortes", "produtos"] as TipoMeta[]).map((t) => {
                    const cfg = tipoConfig[t];
                    const Icon = cfg.icon;
                    return (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setFTipo(t)}
                        className={`flex flex-col items-center gap-1.5 p-3 rounded-lg border text-xs font-medium transition-all ${
                          fTipo === t
                            ? `${cfg.bg} ${cfg.border} ${cfg.color} border-2`
                            : "border-border text-muted-foreground hover:bg-muted"
                        }`}
                      >
                        <Icon size={18} />
                        {cfg.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Título */}
              <div>
                <label className="text-sm font-medium mb-1.5 block">Título</label>
                <Input
                  value={fTitulo}
                  onChange={(e) => setFTitulo(e.target.value)}
                  placeholder="Ex: Meta de outubro"
                  required
                />
              </div>

              {/* Valor */}
              <div>
                <label className="text-sm font-medium mb-1.5 block">
                  {fTipo === "dinheiro" ? "Valor da meta (R$)" : fTipo === "cortes" ? "Número de cortes" : "Número de produtos"}
                </label>
                <Input
                  type="number"
                  value={fValor}
                  onChange={(e) => setFValor(e.target.value)}
                  placeholder={fTipo === "dinheiro" ? "5000.00" : "30"}
                  min="0.01"
                  step={fTipo === "dinheiro" ? "0.01" : "1"}
                  required
                />
              </div>

              {/* Período */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Data de início</label>
                  <Input
                    type="date"
                    value={fInicio}
                    onChange={(e) => setFInicio(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Data de fim</label>
                  <Input
                    type="date"
                    value={fFim}
                    onChange={(e) => setFFim(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Descrição */}
              <div>
                <label className="text-sm font-medium mb-1.5 block">
                  Descrição <span className="text-muted-foreground font-normal">(opcional)</span>
                </label>
                <Input
                  value={fDescricao}
                  onChange={(e) => setFDescricao(e.target.value)}
                  placeholder="Adicione detalhes ou observações..."
                />
              </div>

              {/* Preview valor */}
              {fValor && parseFloat(fValor) > 0 && (
                <div className={`rounded-lg border p-3 flex items-center gap-2 ${tipoConfig[fTipo].bg} ${tipoConfig[fTipo].border}`}>
                  <div className={tipoConfig[fTipo].color}>
                    {(() => { const I = tipoConfig[fTipo].icon; return <I size={16} />; })()}
                  </div>
                  <p className={`text-sm font-medium ${tipoConfig[fTipo].color}`}>
                    Meta: {tipoConfig[fTipo].format(parseFloat(fValor))}
                  </p>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setShowDialog(false); resetForm(); }}
                  className="flex-1 py-2.5 rounded-lg border border-border font-medium hover:bg-accent transition-colors text-sm"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="flex-1 py-2.5 rounded-lg bg-primary text-primary-foreground font-medium hover:opacity-90 transition-opacity text-sm disabled:opacity-60"
                >
                  {createMutation.isPending ? "Criando..." : "Criar Meta"}
                </button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}

      <ConfirmDialog
        open={!!confirmDeleteId}
        onOpenChange={(v) => !v && setConfirmDeleteId(null)}
        onConfirm={() => {
          if (confirmDeleteId) deleteMutation.mutate(confirmDeleteId);
          setConfirmDeleteId(null);
        }}
      />
    </div>
  );
};

export default Metas;
