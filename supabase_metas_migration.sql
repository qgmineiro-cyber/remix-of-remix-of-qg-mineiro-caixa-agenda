-- =============================================
-- MIGRATION: Criação da tabela de Metas
-- Execute este SQL no Supabase SQL Editor
-- =============================================

-- 1. Criar tabela de metas
CREATE TABLE IF NOT EXISTS public.metas (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  barbeiro_id UUID NOT NULL REFERENCES public.barbeiros(id) ON DELETE CASCADE,
  tipo        TEXT NOT NULL CHECK (tipo IN ('dinheiro', 'cortes', 'produtos')),
  titulo      TEXT NOT NULL,
  descricao   TEXT,
  valor_meta  NUMERIC(12, 2) NOT NULL CHECK (valor_meta > 0),
  data_inicio DATE NOT NULL,
  data_fim    DATE NOT NULL,
  criado_por  UUID REFERENCES public.barbeiros(id),
  created_at  TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at  TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  CONSTRAINT metas_periodo_check CHECK (data_fim >= data_inicio)
);

-- 2. Índices para performance
CREATE INDEX IF NOT EXISTS metas_barbeiro_id_idx ON public.metas(barbeiro_id);
CREATE INDEX IF NOT EXISTS metas_data_fim_idx ON public.metas(data_fim);

-- 3. Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER metas_updated_at
  BEFORE UPDATE ON public.metas
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 4. Habilitar Row Level Security
ALTER TABLE public.metas ENABLE ROW LEVEL SECURITY;

-- 5. Políticas de segurança

-- Admin pode fazer tudo
CREATE POLICY "admin_full_access_metas"
  ON public.metas
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Barbeiro pode apenas VER suas próprias metas
CREATE POLICY "barbeiro_read_own_metas"
  ON public.metas
  FOR SELECT
  TO authenticated
  USING (
    barbeiro_id IN (
      SELECT id FROM public.barbeiros WHERE user_id = auth.uid()
    )
  );

-- =============================================
-- VERIFICAÇÃO: rode esta query para confirmar
-- SELECT * FROM public.metas LIMIT 5;
-- =============================================
