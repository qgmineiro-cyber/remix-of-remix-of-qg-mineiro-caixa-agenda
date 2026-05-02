CREATE OR REPLACE FUNCTION public.ensure_current_user_profile()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_id uuid := auth.uid();
  current_email text;
  current_name text;
  has_any_role boolean;
BEGIN
  IF current_user_id IS NULL THEN
    RETURN;
  END IF;

  SELECT email, COALESCE(raw_user_meta_data ->> ''nome'', split_part(email, ''@'', 1))
    INTO current_email, current_name
  FROM auth.users
  WHERE id = current_user_id;

  IF current_email IS NULL THEN
    RETURN;
  END IF;

  INSERT INTO public.barbeiros (user_id, nome, usuario, comissao, ativo)
  VALUES (current_user_id, current_name, current_email, 50, true)
  ON CONFLICT (usuario) DO NOTHING;

  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
  ) INTO has_any_role;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (
    current_user_id,
    CASE WHEN has_any_role THEN ''barbeiro''::app_role ELSE ''admin''::app_role END
  )
  ON CONFLICT (user_id, role) DO NOTHING;
END;
$$;
