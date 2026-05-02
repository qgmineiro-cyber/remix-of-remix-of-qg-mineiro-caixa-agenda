
## Problema

Os logs do backend mostram repetidos `invalid_credentials` para `heitorolmo2006@gmail.com`. O sistema tem tela de login funcional, mas:

1. Nenhum usuário foi criado ainda no auth
2. Não existe tela de cadastro (signup)
3. O `AuthContext` exige que cada usuário tenha um registro vinculado em `barbeiros` + `user_roles`, então só "criar usuário no auth" não basta — sem esses registros o login completa mas o perfil fica `null` e o app trava na tela de login mesmo assim.

## Solução

### 1. Criar tela de cadastro (`/signup`)
- Formulário: nome, email, senha
- Usa `supabase.auth.signUp` com `emailRedirectTo: window.location.origin`
- **Desativar confirmação de email** nas configurações de auth (você está testando — sem isso precisaria abrir email a cada cadastro)
- Após signup bem-sucedido, redireciona para `/dashboard`

### 2. Criar trigger no banco para auto-popular `barbeiros` + `user_roles`
Quando um usuário se cadastra em `auth.users`, um trigger cria automaticamente:
- Linha em `public.barbeiros` com `user_id`, `nome` (vindo de `raw_user_meta_data.nome`), `usuario` (= email), `comissao = 50`
- Linha em `public.user_roles` com role `admin` **se for o primeiro usuário do sistema**, senão `barbeiro`

Isso garante que o `fetchUserProfile` no `AuthContext` sempre encontre o perfil logo após o login.

### 3. Adicionar link "Criar conta" na tela de Login
Pequeno link abaixo do botão "Entrar" → leva para `/signup`.

### 4. Corrigir race condition do `onAuthStateChange`
Reordenar o `useEffect` no `AuthContext`: registrar o listener **antes** do `getSession`, e usar `setTimeout(0)` na chamada do `fetchUserProfile` dentro do listener para evitar deadlock do cliente Supabase (padrão recomendado).

### 5. Rota pública `/signup`
Adicionar em `App.tsx` ao lado da rota `/` de login.

## Resultado esperado

Você abre `/signup`, cria sua conta com `heitorolmo2006@gmail.com` + uma senha, e cai direto no Dashboard como **admin** (por ser o primeiro usuário). Logins seguintes funcionam normalmente em `/`.

## Detalhes técnicos

**Migration SQL:**
```sql
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  is_first boolean;
begin
  select count(*) = 0 into is_first from public.barbeiros;

  insert into public.barbeiros (user_id, nome, usuario, comissao)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'nome', split_part(new.email, '@', 1)),
    new.email,
    50
  );

  insert into public.user_roles (user_id, role)
  values (new.id, case when is_first then 'admin'::app_role else 'barbeiro'::app_role end);

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
```

**Configuração de auth:** desabilitar `confirm email` (auto-confirm ON) para o ambiente de desenvolvimento.

**Arquivos alterados/criados:**
- `src/pages/Signup.tsx` (novo)
- `src/App.tsx` (rota `/signup`)
- `src/pages/Login.tsx` (link para cadastro)
- `src/contexts/AuthContext.tsx` (corrigir ordem do listener, usar setTimeout)
- Migration no banco com a função e trigger acima
- Configuração de auth: auto-confirm email habilitado

Confirma que posso seguir com esse plano?
