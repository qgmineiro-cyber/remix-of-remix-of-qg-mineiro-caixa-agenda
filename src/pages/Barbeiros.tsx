import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Trash2, Edit2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import StatusBadge from "@/components/StatusBadge";
import ConfirmDialog from "@/components/ConfirmDialog";

const Barbeiros = () => {
  const queryClient = useQueryClient();

  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [nome, setNome] = useState("");
  const [usuario, setUsuario] = useState("");
  const [senha, setSenha] = useState("");
  const [telefone, setTelefone] = useState("");
  const [perfil, setPerfil] = useState<"barbeiro" | "admin">("barbeiro");
  const [ativo, setAtivo] = useState(true);
  const [comissao, setComissao] = useState("50");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const { data: barbeiros = [], isLoading } = useQuery({
    queryKey: ["barbeiros"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("barbeiros")
        .select("*")
        .eq("ativo", true)
        .order("nome");
      if (error) throw error;
      return data;
    },
  });

  const addMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("barbeiros").insert({
        nome,
        usuario,
        comissao: parseFloat(comissao),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["barbeiros"] });
      resetForm();
      toast({ title: "Barbeiro cadastrado com sucesso" });
    },
    onError: (err: any) =>
      toast({ title: err?.message || "Erro ao cadastrar", variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!editId) return;
      const { error } = await supabase
        .from("barbeiros")
        .update({ nome, usuario, comissao: parseFloat(comissao) })
        .eq("id", editId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["barbeiros"] });
      resetForm();
      toast({ title: "Barbeiro atualizado" });
    },
    onError: () => toast({ title: "Erro ao atualizar", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("barbeiros").update({ ativo: false }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["barbeiros"] });
      toast({ title: "Barbeiro removido" });
    },
  });

  const resetForm = () => {
    setShowForm(false);
    setEditId(null);
    setNome("");
    setUsuario("");
    setSenha("");
    setTelefone("");
    setPerfil("barbeiro");
    setAtivo(true);
    setComissao("50");
  };

  const startEdit = (b: typeof barbeiros[0]) => {
    setEditId(b.id);
    setNome(b.nome);
    setUsuario(b.usuario);
    setComissao(b.comissao.toString());
    setSenha("");
    setTelefone("");
    setPerfil("barbeiro");
    setAtivo(true);
    setShowForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim()) return toast({ title: "Nome obrigatório", variant: "destructive" });
    if (!usuario.trim()) return toast({ title: "Usuário obrigatório", variant: "destructive" });
    if (!editId && senha.length < 6)
      return toast({ title: "Senha mínima de 6 caracteres", variant: "destructive" });
    if (editId) updateMutation.mutate();
    else addMutation.mutate();
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Barbeiros</h2>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
          >
            <Plus size={16} />
            Novo
          </button>
        )}
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="rounded-lg border border-border p-4 bg-card space-y-4">
          <h3 className="font-medium">{editId ? "Editar Barbeiro" : "Novo Barbeiro"}</h3>

          <div>
            <label className="text-sm font-medium mb-1 block">Nome completo</label>
            <Input value={nome} onChange={(e) => setNome(e.target.value)} required />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium mb-1 block">Usuário (login)</label>
              <Input value={usuario} onChange={(e) => setUsuario(e.target.value)} required />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Telefone</label>
              <Input value={telefone} onChange={(e) => setTelefone(e.target.value)} placeholder="(00) 00000-0000" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium mb-1 block">
                Senha {editId && <span className="text-xs text-muted-foreground">(opcional ao editar)</span>}
              </label>
              <Input
                type="password"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                minLength={6}
                placeholder="Mínimo 6 caracteres"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Comissão (%)</label>
              <Input
                type="number"
                value={comissao}
                onChange={(e) => setComissao(e.target.value)}
                min="0"
                max="100"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium mb-1 block">Perfil</label>
              <Select value={perfil} onValueChange={(v) => setPerfil(v as "barbeiro" | "admin")}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="barbeiro">Barbeiro</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Status</label>
              <Select value={ativo ? "ativo" : "inativo"} onValueChange={(v) => setAtivo(v === "ativo")}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ativo">Ativo</SelectItem>
                  <SelectItem value="inativo">Inativo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            Senha, telefone, perfil e status serão persistidos quando o banco for atualizado.
          </p>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={resetForm}
              className="flex-1 py-3 rounded-lg border border-border font-medium hover:bg-accent transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 py-3 rounded-lg bg-primary text-primary-foreground font-medium hover:opacity-90 transition-opacity"
            >
              {editId ? "Salvar" : "Cadastrar"}
            </button>
          </div>
        </form>
      )}

      {isLoading ? (
        <p className="text-sm text-muted-foreground text-center py-8">Carregando...</p>
      ) : barbeiros.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">
          Nenhum barbeiro cadastrado ainda. Clique em + Novo para começar.
        </p>
      ) : (
        <div className="space-y-2">
          {barbeiros.map((b) => (
            <div
              key={b.id}
              className="flex items-center justify-between rounded-lg border border-border p-4 bg-card"
            >
              <div className="flex items-center gap-3">
                <div>
                  <p className="font-medium">{b.nome}</p>
                  <p className="text-sm text-muted-foreground">
                    @{b.usuario} · Comissão: {b.comissao}%
                  </p>
                </div>
                <StatusBadge tone="success">Ativo</StatusBadge>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => startEdit(b)}
                  className="p-1.5 rounded hover:bg-accent transition-colors text-muted-foreground"
                >
                  <Edit2 size={14} />
                </button>
                <button
                  onClick={() => setConfirmDeleteId(b.id)}
                  className="p-1.5 rounded hover:bg-accent transition-colors text-muted-foreground hover:text-destructive"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
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

export default Barbeiros;
