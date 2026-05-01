-- =========================================
-- ENUMS
-- =========================================
DO $$ BEGIN
  CREATE TYPE public.payment_method AS ENUM ('dinheiro','pix','debito','credito','boleto');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.conta_pagar_status AS ENUM ('aberto','pago','vencido');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.conta_receber_status AS ENUM ('aberto','recebido','vencido');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.agendamento_status AS ENUM ('agendado','concluido','cancelado','faltou');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.comissao_status AS ENUM ('pendente','pago');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.categoria_pagar AS ENUM ('aluguel','fornecedores','salarios','energia','agua','internet','outros');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- =========================================
-- ALTER barbeiros: telefone
-- =========================================
ALTER TABLE public.barbeiros ADD COLUMN IF NOT EXISTS telefone text;

-- =========================================
-- HELPER FUNCTION
-- =========================================
CREATE OR REPLACE FUNCTION public.is_owner_barbeiro(_barbeiro_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.barbeiros
    WHERE id = _barbeiro_id AND user_id = auth.uid()
  );
$$;

-- =========================================
-- TABLES
-- =========================================

-- clientes
CREATE TABLE IF NOT EXISTS public.clientes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  telefone text,
  email text,
  observacoes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- agendamentos
CREATE TABLE IF NOT EXISTS public.agendamentos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  barbeiro_id uuid NOT NULL REFERENCES public.barbeiros(id) ON DELETE CASCADE,
  cliente_id uuid REFERENCES public.clientes(id) ON DELETE SET NULL,
  cliente_nome text,
  servico_id uuid REFERENCES public.servicos(id) ON DELETE SET NULL,
  data_hora timestamptz NOT NULL,
  duracao integer NOT NULL DEFAULT 30,
  valor numeric NOT NULL DEFAULT 0,
  status public.agendamento_status NOT NULL DEFAULT 'agendado',
  observacoes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- atendimentos (registros do caixa)
CREATE TABLE IF NOT EXISTS public.atendimentos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  barbeiro_id uuid NOT NULL REFERENCES public.barbeiros(id) ON DELETE CASCADE,
  servico_id uuid REFERENCES public.servicos(id) ON DELETE SET NULL,
  servico_nome text NOT NULL,
  valor numeric NOT NULL DEFAULT 0,
  forma_pagamento public.payment_method NOT NULL,
  observacao text,
  data_atendimento timestamptz NOT NULL DEFAULT now(),
  caixa_sessao_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- caixa_sessoes
CREATE TABLE IF NOT EXISTS public.caixa_sessoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  barbeiro_id uuid NOT NULL REFERENCES public.barbeiros(id) ON DELETE CASCADE,
  aberto_em timestamptz NOT NULL DEFAULT now(),
  fechado_em timestamptz,
  troco_inicial numeric NOT NULL DEFAULT 0,
  total_dinheiro numeric NOT NULL DEFAULT 0,
  total_pix numeric NOT NULL DEFAULT 0,
  total_debito numeric NOT NULL DEFAULT 0,
  total_credito numeric NOT NULL DEFAULT 0,
  total_geral numeric NOT NULL DEFAULT 0,
  observacoes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- contas_pagar
CREATE TABLE IF NOT EXISTS public.contas_pagar (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  descricao text NOT NULL,
  categoria public.categoria_pagar NOT NULL DEFAULT 'outros',
  valor numeric NOT NULL DEFAULT 0,
  vencimento date NOT NULL,
  forma_pagamento public.payment_method,
  observacoes text,
  status public.conta_pagar_status NOT NULL DEFAULT 'aberto',
  pago_em timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- contas_receber
CREATE TABLE IF NOT EXISTS public.contas_receber (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  descricao text NOT NULL,
  origem text,
  valor numeric NOT NULL DEFAULT 0,
  vencimento date NOT NULL,
  forma_pagamento public.payment_method,
  observacoes text,
  status public.conta_receber_status NOT NULL DEFAULT 'aberto',
  recebido_em timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- comissoes
CREATE TABLE IF NOT EXISTS public.comissoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  barbeiro_id uuid NOT NULL REFERENCES public.barbeiros(id) ON DELETE CASCADE,
  periodo_inicio date NOT NULL,
  periodo_fim date NOT NULL,
  total_bruto numeric NOT NULL DEFAULT 0,
  percentual numeric NOT NULL DEFAULT 50,
  valor_comissao numeric NOT NULL DEFAULT 0,
  status public.comissao_status NOT NULL DEFAULT 'pendente',
  pago_em timestamptz,
  observacoes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- produtos
CREATE TABLE IF NOT EXISTS public.produtos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  descricao text,
  preco numeric NOT NULL DEFAULT 0,
  estoque integer NOT NULL DEFAULT 0,
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- =========================================
-- TRIGGERS updated_at
-- =========================================
DO $$ DECLARE t text; BEGIN
  FOR t IN SELECT unnest(ARRAY[
    'clientes','agendamentos','atendimentos','caixa_sessoes',
    'contas_pagar','contas_receber','comissoes','produtos'
  ]) LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS trg_%I_updated_at ON public.%I;', t, t);
    EXECUTE format(
      'CREATE TRIGGER trg_%I_updated_at BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();',
      t, t
    );
  END LOOP;
END $$;

-- =========================================
-- INDEXES
-- =========================================
CREATE INDEX IF NOT EXISTS idx_agendamentos_barbeiro_data ON public.agendamentos(barbeiro_id, data_hora);
CREATE INDEX IF NOT EXISTS idx_agendamentos_data ON public.agendamentos(data_hora);
CREATE INDEX IF NOT EXISTS idx_atendimentos_barbeiro_data ON public.atendimentos(barbeiro_id, data_atendimento);
CREATE INDEX IF NOT EXISTS idx_contas_pagar_venc ON public.contas_pagar(vencimento, status);
CREATE INDEX IF NOT EXISTS idx_contas_receber_venc ON public.contas_receber(vencimento, status);
CREATE INDEX IF NOT EXISTS idx_comissoes_barbeiro_per ON public.comissoes(barbeiro_id, periodo_inicio);
CREATE INDEX IF NOT EXISTS idx_caixa_sessoes_barbeiro ON public.caixa_sessoes(barbeiro_id, aberto_em);

-- =========================================
-- RLS ENABLE
-- =========================================
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agendamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.atendimentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.caixa_sessoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contas_pagar ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contas_receber ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comissoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.produtos ENABLE ROW LEVEL SECURITY;

-- =========================================
-- POLICIES: barbeiros (extra: barbeiro pode editar a si mesmo)
-- =========================================
DROP POLICY IF EXISTS "Barbeiro can update self" ON public.barbeiros;
CREATE POLICY "Barbeiro can update self" ON public.barbeiros
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- =========================================
-- POLICIES: clientes
-- =========================================
DROP POLICY IF EXISTS "Admins manage clientes" ON public.clientes;
CREATE POLICY "Admins manage clientes" ON public.clientes
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));

DROP POLICY IF EXISTS "Authenticated view clientes" ON public.clientes;
CREATE POLICY "Authenticated view clientes" ON public.clientes
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Authenticated insert clientes" ON public.clientes;
CREATE POLICY "Authenticated insert clientes" ON public.clientes
  FOR INSERT TO authenticated WITH CHECK (true);

-- =========================================
-- POLICIES: agendamentos
-- =========================================
DROP POLICY IF EXISTS "Admins manage agendamentos" ON public.agendamentos;
CREATE POLICY "Admins manage agendamentos" ON public.agendamentos
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));

DROP POLICY IF EXISTS "Barbeiro view own agendamentos" ON public.agendamentos;
CREATE POLICY "Barbeiro view own agendamentos" ON public.agendamentos
  FOR SELECT TO authenticated
  USING (public.is_owner_barbeiro(barbeiro_id));

DROP POLICY IF EXISTS "Barbeiro insert own agendamentos" ON public.agendamentos;
CREATE POLICY "Barbeiro insert own agendamentos" ON public.agendamentos
  FOR INSERT TO authenticated
  WITH CHECK (public.is_owner_barbeiro(barbeiro_id));

DROP POLICY IF EXISTS "Barbeiro update own agendamentos" ON public.agendamentos;
CREATE POLICY "Barbeiro update own agendamentos" ON public.agendamentos
  FOR UPDATE TO authenticated
  USING (public.is_owner_barbeiro(barbeiro_id))
  WITH CHECK (public.is_owner_barbeiro(barbeiro_id));

DROP POLICY IF EXISTS "Barbeiro delete own agendamentos" ON public.agendamentos;
CREATE POLICY "Barbeiro delete own agendamentos" ON public.agendamentos
  FOR DELETE TO authenticated
  USING (public.is_owner_barbeiro(barbeiro_id));

-- =========================================
-- POLICIES: atendimentos
-- =========================================
DROP POLICY IF EXISTS "Admins manage atendimentos" ON public.atendimentos;
CREATE POLICY "Admins manage atendimentos" ON public.atendimentos
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));

DROP POLICY IF EXISTS "Barbeiro view own atendimentos" ON public.atendimentos;
CREATE POLICY "Barbeiro view own atendimentos" ON public.atendimentos
  FOR SELECT TO authenticated USING (public.is_owner_barbeiro(barbeiro_id));

DROP POLICY IF EXISTS "Barbeiro insert own atendimentos" ON public.atendimentos;
CREATE POLICY "Barbeiro insert own atendimentos" ON public.atendimentos
  FOR INSERT TO authenticated WITH CHECK (public.is_owner_barbeiro(barbeiro_id));

DROP POLICY IF EXISTS "Barbeiro update own atendimentos" ON public.atendimentos;
CREATE POLICY "Barbeiro update own atendimentos" ON public.atendimentos
  FOR UPDATE TO authenticated
  USING (public.is_owner_barbeiro(barbeiro_id))
  WITH CHECK (public.is_owner_barbeiro(barbeiro_id));

DROP POLICY IF EXISTS "Barbeiro delete own atendimentos" ON public.atendimentos;
CREATE POLICY "Barbeiro delete own atendimentos" ON public.atendimentos
  FOR DELETE TO authenticated USING (public.is_owner_barbeiro(barbeiro_id));

-- =========================================
-- POLICIES: caixa_sessoes
-- =========================================
DROP POLICY IF EXISTS "Admins manage caixa" ON public.caixa_sessoes;
CREATE POLICY "Admins manage caixa" ON public.caixa_sessoes
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));

DROP POLICY IF EXISTS "Barbeiro view own caixa" ON public.caixa_sessoes;
CREATE POLICY "Barbeiro view own caixa" ON public.caixa_sessoes
  FOR SELECT TO authenticated USING (public.is_owner_barbeiro(barbeiro_id));

DROP POLICY IF EXISTS "Barbeiro insert own caixa" ON public.caixa_sessoes;
CREATE POLICY "Barbeiro insert own caixa" ON public.caixa_sessoes
  FOR INSERT TO authenticated WITH CHECK (public.is_owner_barbeiro(barbeiro_id));

DROP POLICY IF EXISTS "Barbeiro update own caixa" ON public.caixa_sessoes;
CREATE POLICY "Barbeiro update own caixa" ON public.caixa_sessoes
  FOR UPDATE TO authenticated
  USING (public.is_owner_barbeiro(barbeiro_id))
  WITH CHECK (public.is_owner_barbeiro(barbeiro_id));

DROP POLICY IF EXISTS "Barbeiro delete own caixa" ON public.caixa_sessoes;
CREATE POLICY "Barbeiro delete own caixa" ON public.caixa_sessoes
  FOR DELETE TO authenticated USING (public.is_owner_barbeiro(barbeiro_id));

-- =========================================
-- POLICIES: contas_pagar (somente admin)
-- =========================================
DROP POLICY IF EXISTS "Admins manage contas_pagar" ON public.contas_pagar;
CREATE POLICY "Admins manage contas_pagar" ON public.contas_pagar
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));

-- =========================================
-- POLICIES: contas_receber (somente admin)
-- =========================================
DROP POLICY IF EXISTS "Admins manage contas_receber" ON public.contas_receber;
CREATE POLICY "Admins manage contas_receber" ON public.contas_receber
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));

-- =========================================
-- POLICIES: comissoes
-- =========================================
DROP POLICY IF EXISTS "Admins manage comissoes" ON public.comissoes;
CREATE POLICY "Admins manage comissoes" ON public.comissoes
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));

DROP POLICY IF EXISTS "Barbeiro view own comissoes" ON public.comissoes;
CREATE POLICY "Barbeiro view own comissoes" ON public.comissoes
  FOR SELECT TO authenticated USING (public.is_owner_barbeiro(barbeiro_id));

-- =========================================
-- POLICIES: produtos
-- =========================================
DROP POLICY IF EXISTS "Admins manage produtos" ON public.produtos;
CREATE POLICY "Admins manage produtos" ON public.produtos
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));

DROP POLICY IF EXISTS "Authenticated view produtos" ON public.produtos;
CREATE POLICY "Authenticated view produtos" ON public.produtos
  FOR SELECT TO authenticated USING (true);
