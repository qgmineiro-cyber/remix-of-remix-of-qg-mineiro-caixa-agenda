import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Plus, Trash2, Edit2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import ConfirmDialog from "@/components/ConfirmDialog";

const Servicos = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const queryClient = useQueryClient();

  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [nome, setNome] = useState("");
  const [preco, setPreco] = useState("");
  const [duracao, setDuracao] = useState("30");

  const { data: servicos = [], isLoading } = useQuery({
    queryKey: ["servicos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("servicos")
        .select("*")
        .eq("ativo", true)
        .order("nome");
      if (error) throw error;
      return data;
    },
  });

  const addMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("servicos").insert({
        nome,
        preco: parseFloat(preco),
        duracao: parseInt(duracao),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["servicos"] });
      resetForm();
      toast({ title: "Serviço cadastrado com sucesso" });
    },
    onError: () => toast({ title: "Erro ao cadastrar serviço", variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!editId) return;
      const { error } = await supabase.from("servicos").update({
        nome,
        preco: parseFloat(preco),
        duracao: parseInt(duracao),
      }).eq("id", editId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["servicos"] });
      resetForm();
      toast({ title: "Serviço atualizado" });
    },
    onError: () => toast({ title: "Erro ao atualizar", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("servicos").update({ ativo: false }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["servicos"] });
      toast({ title: "Serviço removido" });
    },
  });

  const resetForm = () => {
    setShowForm(false);
    setEditId(null);
    setNome("");
    setPreco("");
    setDuracao("30");
  };

  const startEdit = (s: typeof servicos[0]) => {
    setEditId(s.id);
    setNome(s.nome);
    setPreco(s.preco.toString());
    setDuracao(s.duracao.toString());
    setShowForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editId) updateMutation.mutate();
    else addMutation.mutate();
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Serviços</h2>
        {isAdmin && !showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
          >
            <Plus size={16} />
            Novo
          </button>
        )}
      </div>

      {/* Form */}
      {showForm && isAdmin && (
        <form onSubmit={handleSubmit} className="rounded-lg border border-border p-4 bg-card space-y-4">
          <h3 className="font-medium">{editId ? "Editar Serviço" : "Novo Serviço"}</h3>
          <div>
            <label className="text-sm font-medium mb-1 block">Nome</label>
            <input
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="Ex: Corte masculino"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium mb-1 block">Preço (R$)</label>
              <input
                type="number"
                value={preco}
                onChange={(e) => setPreco(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="0,00"
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Duração (min)</label>
              <input
                type="number"
                value={duracao}
                onChange={(e) => setDuracao(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="30"
                required
              />
            </div>
          </div>
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

      {/* List */}
      {isLoading ? (
        <p className="text-sm text-muted-foreground text-center py-8">Carregando...</p>
      ) : servicos.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">Nenhum serviço cadastrado.</p>
      ) : (
        <div className="space-y-2">
          {servicos.map((s) => (
            <div key={s.id} className="flex items-center justify-between rounded-lg border border-border p-4 bg-card">
              <div>
                <p className="font-medium">{s.nome}</p>
                <p className="text-sm text-muted-foreground">{s.duracao} min</p>
              </div>
              <div className="flex items-center gap-2">
                <p className="font-semibold">R$ {Number(s.preco).toFixed(2)}</p>
                {isAdmin && (
                  <>
                    <button
                      onClick={() => startEdit(s)}
                      className="p-1.5 rounded hover:bg-accent transition-colors text-muted-foreground"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      onClick={() => setConfirmDeleteId(s.id)}
                      className="p-1.5 rounded hover:bg-accent transition-colors text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 size={14} />
                    </button>
                  </>
                )}
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

export default Servicos;
