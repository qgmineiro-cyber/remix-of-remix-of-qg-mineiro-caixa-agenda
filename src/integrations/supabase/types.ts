export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      agendamentos: {
        Row: {
          barbeiro_id: string
          cliente_id: string | null
          cliente_nome: string | null
          created_at: string
          data_hora: string
          duracao: number
          id: string
          observacoes: string | null
          servico_id: string | null
          status: Database["public"]["Enums"]["agendamento_status"]
          updated_at: string
          valor: number
        }
        Insert: {
          barbeiro_id: string
          cliente_id?: string | null
          cliente_nome?: string | null
          created_at?: string
          data_hora: string
          duracao?: number
          id?: string
          observacoes?: string | null
          servico_id?: string | null
          status?: Database["public"]["Enums"]["agendamento_status"]
          updated_at?: string
          valor?: number
        }
        Update: {
          barbeiro_id?: string
          cliente_id?: string | null
          cliente_nome?: string | null
          created_at?: string
          data_hora?: string
          duracao?: number
          id?: string
          observacoes?: string | null
          servico_id?: string | null
          status?: Database["public"]["Enums"]["agendamento_status"]
          updated_at?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "agendamentos_barbeiro_id_fkey"
            columns: ["barbeiro_id"]
            isOneToOne: false
            referencedRelation: "barbeiros"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agendamentos_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agendamentos_servico_id_fkey"
            columns: ["servico_id"]
            isOneToOne: false
            referencedRelation: "servicos"
            referencedColumns: ["id"]
          },
        ]
      }
      atendimentos: {
        Row: {
          barbeiro_id: string
          caixa_sessao_id: string | null
          created_at: string
          data_atendimento: string
          forma_pagamento: Database["public"]["Enums"]["payment_method"]
          id: string
          observacao: string | null
          servico_id: string | null
          servico_nome: string
          updated_at: string
          valor: number
        }
        Insert: {
          barbeiro_id: string
          caixa_sessao_id?: string | null
          created_at?: string
          data_atendimento?: string
          forma_pagamento: Database["public"]["Enums"]["payment_method"]
          id?: string
          observacao?: string | null
          servico_id?: string | null
          servico_nome: string
          updated_at?: string
          valor?: number
        }
        Update: {
          barbeiro_id?: string
          caixa_sessao_id?: string | null
          created_at?: string
          data_atendimento?: string
          forma_pagamento?: Database["public"]["Enums"]["payment_method"]
          id?: string
          observacao?: string | null
          servico_id?: string | null
          servico_nome?: string
          updated_at?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "atendimentos_barbeiro_id_fkey"
            columns: ["barbeiro_id"]
            isOneToOne: false
            referencedRelation: "barbeiros"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "atendimentos_servico_id_fkey"
            columns: ["servico_id"]
            isOneToOne: false
            referencedRelation: "servicos"
            referencedColumns: ["id"]
          },
        ]
      }
      barbeiros: {
        Row: {
          ativo: boolean
          comissao: number
          created_at: string
          id: string
          nome: string
          telefone: string | null
          updated_at: string
          user_id: string | null
          usuario: string
        }
        Insert: {
          ativo?: boolean
          comissao?: number
          created_at?: string
          id?: string
          nome: string
          telefone?: string | null
          updated_at?: string
          user_id?: string | null
          usuario: string
        }
        Update: {
          ativo?: boolean
          comissao?: number
          created_at?: string
          id?: string
          nome?: string
          telefone?: string | null
          updated_at?: string
          user_id?: string | null
          usuario?: string
        }
        Relationships: []
      }
      caixa_sessoes: {
        Row: {
          aberto_em: string
          barbeiro_id: string
          created_at: string
          fechado_em: string | null
          id: string
          observacoes: string | null
          total_credito: number
          total_debito: number
          total_dinheiro: number
          total_geral: number
          total_pix: number
          troco_inicial: number
          updated_at: string
        }
        Insert: {
          aberto_em?: string
          barbeiro_id: string
          created_at?: string
          fechado_em?: string | null
          id?: string
          observacoes?: string | null
          total_credito?: number
          total_debito?: number
          total_dinheiro?: number
          total_geral?: number
          total_pix?: number
          troco_inicial?: number
          updated_at?: string
        }
        Update: {
          aberto_em?: string
          barbeiro_id?: string
          created_at?: string
          fechado_em?: string | null
          id?: string
          observacoes?: string | null
          total_credito?: number
          total_debito?: number
          total_dinheiro?: number
          total_geral?: number
          total_pix?: number
          troco_inicial?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "caixa_sessoes_barbeiro_id_fkey"
            columns: ["barbeiro_id"]
            isOneToOne: false
            referencedRelation: "barbeiros"
            referencedColumns: ["id"]
          },
        ]
      }
      clientes: {
        Row: {
          created_at: string
          email: string | null
          id: string
          nome: string
          observacoes: string | null
          telefone: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          nome: string
          observacoes?: string | null
          telefone?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          nome?: string
          observacoes?: string | null
          telefone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      comissoes: {
        Row: {
          barbeiro_id: string
          created_at: string
          id: string
          observacoes: string | null
          pago_em: string | null
          percentual: number
          periodo_fim: string
          periodo_inicio: string
          status: Database["public"]["Enums"]["comissao_status"]
          total_bruto: number
          updated_at: string
          valor_comissao: number
        }
        Insert: {
          barbeiro_id: string
          created_at?: string
          id?: string
          observacoes?: string | null
          pago_em?: string | null
          percentual?: number
          periodo_fim: string
          periodo_inicio: string
          status?: Database["public"]["Enums"]["comissao_status"]
          total_bruto?: number
          updated_at?: string
          valor_comissao?: number
        }
        Update: {
          barbeiro_id?: string
          created_at?: string
          id?: string
          observacoes?: string | null
          pago_em?: string | null
          percentual?: number
          periodo_fim?: string
          periodo_inicio?: string
          status?: Database["public"]["Enums"]["comissao_status"]
          total_bruto?: number
          updated_at?: string
          valor_comissao?: number
        }
        Relationships: [
          {
            foreignKeyName: "comissoes_barbeiro_id_fkey"
            columns: ["barbeiro_id"]
            isOneToOne: false
            referencedRelation: "barbeiros"
            referencedColumns: ["id"]
          },
        ]
      }
      contas_pagar: {
        Row: {
          categoria: Database["public"]["Enums"]["categoria_pagar"]
          created_at: string
          descricao: string
          forma_pagamento: Database["public"]["Enums"]["payment_method"] | null
          id: string
          observacoes: string | null
          pago_em: string | null
          status: Database["public"]["Enums"]["conta_pagar_status"]
          updated_at: string
          valor: number
          vencimento: string
        }
        Insert: {
          categoria?: Database["public"]["Enums"]["categoria_pagar"]
          created_at?: string
          descricao: string
          forma_pagamento?: Database["public"]["Enums"]["payment_method"] | null
          id?: string
          observacoes?: string | null
          pago_em?: string | null
          status?: Database["public"]["Enums"]["conta_pagar_status"]
          updated_at?: string
          valor?: number
          vencimento: string
        }
        Update: {
          categoria?: Database["public"]["Enums"]["categoria_pagar"]
          created_at?: string
          descricao?: string
          forma_pagamento?: Database["public"]["Enums"]["payment_method"] | null
          id?: string
          observacoes?: string | null
          pago_em?: string | null
          status?: Database["public"]["Enums"]["conta_pagar_status"]
          updated_at?: string
          valor?: number
          vencimento?: string
        }
        Relationships: []
      }
      contas_receber: {
        Row: {
          created_at: string
          descricao: string
          forma_pagamento: Database["public"]["Enums"]["payment_method"] | null
          id: string
          observacoes: string | null
          origem: string | null
          recebido_em: string | null
          status: Database["public"]["Enums"]["conta_receber_status"]
          updated_at: string
          valor: number
          vencimento: string
        }
        Insert: {
          created_at?: string
          descricao: string
          forma_pagamento?: Database["public"]["Enums"]["payment_method"] | null
          id?: string
          observacoes?: string | null
          origem?: string | null
          recebido_em?: string | null
          status?: Database["public"]["Enums"]["conta_receber_status"]
          updated_at?: string
          valor?: number
          vencimento: string
        }
        Update: {
          created_at?: string
          descricao?: string
          forma_pagamento?: Database["public"]["Enums"]["payment_method"] | null
          id?: string
          observacoes?: string | null
          origem?: string | null
          recebido_em?: string | null
          status?: Database["public"]["Enums"]["conta_receber_status"]
          updated_at?: string
          valor?: number
          vencimento?: string
        }
        Relationships: []
      }
      produtos: {
        Row: {
          ativo: boolean
          created_at: string
          descricao: string | null
          estoque: number
          id: string
          nome: string
          preco: number
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          descricao?: string | null
          estoque?: number
          id?: string
          nome: string
          preco?: number
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          descricao?: string | null
          estoque?: number
          id?: string
          nome?: string
          preco?: number
          updated_at?: string
        }
        Relationships: []
      }
      servicos: {
        Row: {
          ativo: boolean
          created_at: string
          duracao: number
          id: string
          nome: string
          preco: number
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          duracao?: number
          id?: string
          nome: string
          preco?: number
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          duracao?: number
          id?: string
          nome?: string
          preco?: number
          updated_at?: string
        }
        Relationships: []
      }
      metas: {
        Row: {
          id: string
          barbeiro_id: string
          tipo: "dinheiro" | "cortes" | "produtos"
          titulo: string
          descricao: string | null
          valor_meta: number
          data_inicio: string
          data_fim: string
          criado_por: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          barbeiro_id: string
          tipo: "dinheiro" | "cortes" | "produtos"
          titulo: string
          descricao?: string | null
          valor_meta: number
          data_inicio: string
          data_fim: string
          criado_por?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          barbeiro_id?: string
          tipo?: "dinheiro" | "cortes" | "produtos"
          titulo?: string
          descricao?: string | null
          valor_meta?: number
          data_inicio?: string
          data_fim?: string
          criado_por?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "metas_barbeiro_id_fkey"
            columns: ["barbeiro_id"]
            isOneToOne: false
            referencedRelation: "barbeiros"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_owner_barbeiro: { Args: { _barbeiro_id: string }; Returns: boolean }
    }
    Enums: {
      agendamento_status: "agendado" | "concluido" | "cancelado" | "faltou"
      app_role: "admin" | "barbeiro"
      categoria_pagar:
        | "aluguel"
        | "fornecedores"
        | "salarios"
        | "energia"
        | "agua"
        | "internet"
        | "outros"
      comissao_status: "pendente" | "pago"
      conta_pagar_status: "aberto" | "pago" | "vencido"
      conta_receber_status: "aberto" | "recebido" | "vencido"
      payment_method: "dinheiro" | "pix" | "debito" | "credito" | "boleto"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      agendamento_status: ["agendado", "concluido", "cancelado", "faltou"],
      app_role: ["admin", "barbeiro"],
      categoria_pagar: [
        "aluguel",
        "fornecedores",
        "salarios",
        "energia",
        "agua",
        "internet",
        "outros",
      ],
      comissao_status: ["pendente", "pago"],
      conta_pagar_status: ["aberto", "pago", "vencido"],
      conta_receber_status: ["aberto", "recebido", "vencido"],
      payment_method: ["dinheiro", "pix", "debito", "credito", "boleto"],
    },
  },
} as const
