-- Revogar execução pública das funções SECURITY DEFINER
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.is_owner_barbeiro(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_owner_barbeiro(uuid) TO authenticated;

-- Restringir a policy de INSERT em clientes (era WITH CHECK (true))
DROP POLICY IF EXISTS "Authenticated insert clientes" ON public.clientes;
CREATE POLICY "Authenticated insert clientes" ON public.clientes
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);
