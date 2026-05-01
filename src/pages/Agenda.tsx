import { useState } from "react";
import { ChevronLeft, ChevronRight, Plus, Edit2, Trash2 } from "lucide-react";
import ConfirmDialog from "@/components/ConfirmDialog";
import { toast } from "@/hooks/use-toast";

const HORARIOS = Array.from({ length: 12 }, (_, i) => `${(8 + i).toString().padStart(2, "0")}:00`);

interface Agendamento {
  id: string;
  cliente: string;
  servico: string;
  horario: string;
  status: "confirmado" | "aguardando" | "cancelado";
}

const SEED: Agendamento[] = [
  { id: "1", cliente: "Lucas", servico: "Corte", horario: "09:00", status: "confirmado" },
  { id: "2", cliente: "Rafael", servico: "Barba", horario: "10:00", status: "aguardando" },
  { id: "3", cliente: "Marcos", servico: "Corte + Barba", horario: "14:00", status: "confirmado" },
];

const statusLabel: Record<string, string> = {
  confirmado: "Confirmado",
  aguardando: "Aguardando",
  cancelado: "Cancelado",
};

const Agenda = () => {
  const [dataAtual] = useState(new Date());
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>(SEED);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const diasSemana = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(dataAtual);
    d.setDate(d.getDate() - d.getDay() + i);
    return d;
  });

  const [diaSelecionado, setDiaSelecionado] = useState(dataAtual.getDay());

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Agenda</h2>
        <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity">
          <Plus size={16} />
          Agendar
        </button>
      </div>

      <div className="flex items-center gap-2">
        <button className="p-1 rounded hover:bg-accent transition-colors">
          <ChevronLeft size={18} />
        </button>
        <div className="flex-1 grid grid-cols-7 gap-1">
          {diasSemana.map((d, i) => {
            const isHoje = d.toDateString() === new Date().toDateString();
            const isSelecionado = i === diaSelecionado;
            return (
              <button
                key={i}
                onClick={() => setDiaSelecionado(i)}
                className={`flex flex-col items-center py-2 rounded-lg text-xs transition-colors ${
                  isSelecionado
                    ? "bg-primary text-primary-foreground"
                    : isHoje
                    ? "bg-accent font-medium"
                    : "hover:bg-accent"
                }`}
              >
                <span className="uppercase">
                  {d.toLocaleDateString("pt-BR", { weekday: "short" }).slice(0, 3)}
                </span>
                <span className="text-lg font-semibold">{d.getDate()}</span>
              </button>
            );
          })}
        </div>
        <button className="p-1 rounded hover:bg-accent transition-colors">
          <ChevronRight size={18} />
        </button>
      </div>

      <div className="space-y-1">
        {HORARIOS.map((h) => {
          const agendamento = agendamentos.find((a) => a.horario === h);
          return (
            <div
              key={h}
              className={`flex items-center gap-4 p-3 rounded-lg border transition-colors ${
                agendamento ? "border-border bg-card" : "border-transparent"
              }`}
            >
              <span className="text-sm text-muted-foreground w-12 shrink-0">{h}</span>
              {agendamento ? (
                <>
                  <div className="flex-1">
                    <p className="text-sm font-medium">
                      {agendamento.cliente} — {agendamento.servico}
                    </p>
                    <p className="text-xs text-muted-foreground">{statusLabel[agendamento.status]}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => toast({ title: "Editar agendamento (em breve)" })}
                      className="p-1.5 rounded hover:bg-accent transition-colors text-muted-foreground"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      onClick={() => setConfirmDeleteId(agendamento.id)}
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

      <ConfirmDialog
        open={!!confirmDeleteId}
        onOpenChange={(v) => !v && setConfirmDeleteId(null)}
        onConfirm={() => {
          if (confirmDeleteId) {
            setAgendamentos((prev) => prev.filter((a) => a.id !== confirmDeleteId));
            toast({ title: "Agendamento removido" });
          }
          setConfirmDeleteId(null);
        }}
      />
    </div>
  );
};

export default Agenda;
