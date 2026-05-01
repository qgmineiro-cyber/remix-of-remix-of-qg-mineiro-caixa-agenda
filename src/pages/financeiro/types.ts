export type ContaStatus = "aberto" | "pago" | "vencido";
export type ReceberStatus = "aberto" | "recebido" | "vencido";

export const CATEGORIAS_PAGAR = [
  "Aluguel",
  "Fornecedores",
  "Salários",
  "Energia",
  "Água",
  "Internet",
  "Outros",
] as const;

export const FORMAS_PAGAMENTO = [
  "Dinheiro",
  "Pix",
  "Débito",
  "Crédito",
  "Boleto",
] as const;

export interface ContaPagar {
  id: string;
  descricao: string;
  categoria: (typeof CATEGORIAS_PAGAR)[number];
  valor: number;
  vencimento: string; // yyyy-mm-dd
  formaPagamento: (typeof FORMAS_PAGAMENTO)[number];
  observacoes?: string;
  status: ContaStatus;
}

export interface ContaReceber {
  id: string;
  descricao: string;
  origem: string;
  valor: number;
  vencimento: string;
  formaPagamento: (typeof FORMAS_PAGAMENTO)[number];
  observacoes?: string;
  status: ReceberStatus;
}

export const todayISO = () => new Date().toISOString().slice(0, 10);

export const formatBRL = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export const formatDateBR = (iso: string) => {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
};
