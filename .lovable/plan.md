## Plano: Criar todo o banco de dados no Supabase

Vou gerar **um único script SQL** com todo o esquema planejado e executá-lo via migração no Supabase. Como já existem 3 tabelas (`barbeiros`, `servicos`, `user_roles`), o script será **idempotente** (`if not exists`, `create or replace`, `drop policy if exists`) e respeitará o que já está lá.

### 1. Extensões e tipos (enums)
- `pgcrypto` (já presente, garantir)
- Enums novos:
  - `payment_method` — dinheiro, pix, debito, credito, boleto
  - `conta_pagar_status` — aberto, pago, vencido
  - `conta_receber_status` — aberto, recebido, vencido
  - `agendamento_status` — agendado, concluido, cancelado, faltou
  - `comissao_status` — pendente, pago
  - `categoria_pagar` — aluguel, fornecedores, salarios, energia, agua, internet, outros

### 2. Tabelas a criar
- `clientes` — cadastro simples (nome, telefone, email, observacoes)
- `agendamentos` — barbeiro_id, cliente_id (nullable), servico_id, data_hora, duracao, valor, status, observacoes
- `atendimentos` (caixa fechado por dia) — barbeiro_id, servico_id, valor, forma_pagamento, observacao, data_atendimento
- `caixa_sessoes` — barbeiro_id, aberto_em, fechado_em, troco_inicial, total_dinheiro, total_pix, total_debito, total_credito, total_geral
- `contas_pagar` — descricao, categoria, valor, vencimento, forma_pagamento, observacoes, status, pago_em
- `contas_receber` — descricao, origem, valor, vencimento, forma_pagamento, observacoes, status, recebido_em
- `comissoes` — barbeiro_id, periodo_inicio, periodo_fim, total_bruto, percentual, valor_comissao, status, pago_em
- `produtos` (opcional, deixar pronto) — nome, preco, estoque, ativo

Todas com `id uuid pk default gen_random_uuid()`, `created_at`, `updated_at` + trigger `update_updated_at_column` (já existe).

### 3. Adicionar coluna `telefone` na tabela `barbeiros`
- `alter table barbeiros add column if not exists telefone text;`

### 4. Triggers
- `updated_at` automático em todas as tabelas novas (reusar função existente `public.update_updated_at_column`).

### 5. Índices
- `agendamentos(barbeiro_id, data_hora)`, `agendamentos(data_hora)`
- `atendimentos(barbeiro_id, data_atendimento)`
- `contas_pagar(vencimento, status)`, `contas_receber(vencimento, status)`
- `comissoes(barbeiro_id, periodo_inicio)`
- `caixa_sessoes(barbeiro_id, aberto_em)`

### 6. Função auxiliar
- `public.is_owner_barbeiro(_barbeiro_id uuid)` — security definer, retorna `true` se existe linha em `barbeiros` onde `id = _barbeiro_id` e `user_id = auth.uid()`. Usada nas policies para "é meu".

### 7. RLS — habilitar em todas as tabelas novas e aplicar políticas

**Regra de ouro:**
- **Admin** → tudo, em todas as tabelas (`has_role(auth.uid(), 'admin')`)
- **Barbeiro** → CRUD apenas no que é dele (linhas com `barbeiro_id` que pertence ao seu `user_id`)
- **Tabelas globais sem dono** (contas_pagar, contas_receber, produtos, clientes) → **somente admin** faz CRUD; barbeiro não vê nem mexe

Detalhamento por tabela:

| Tabela | Admin | Barbeiro |
|---|---|---|
| `barbeiros` | ALL (já existe) | SELECT all (já existe), UPDATE/INSERT/DELETE só nele mesmo (novas policies) |
| `servicos` | ALL (já existe) | SELECT (já existe). Sem write |
| `agendamentos` | ALL | CRUD onde `barbeiro_id` é dele |
| `atendimentos` | ALL | CRUD onde `barbeiro_id` é dele |
| `caixa_sessoes` | ALL | CRUD onde `barbeiro_id` é dele |
| `comissoes` | ALL | SELECT onde `barbeiro_id` é dele (não pode editar/marcar como pago) |
| `contas_pagar` | ALL | sem acesso |
| `contas_receber` | ALL | sem acesso |
| `clientes` | ALL | SELECT (para usar na agenda); INSERT permitido (cadastrar cliente novo); sem UPDATE/DELETE |
| `produtos` | ALL | SELECT |

### 8. Como executar
- Vou rodar **um migration** com todo o SQL acima.
- O migration tool pede aprovação automaticamente — você confirma e eu executo.
- Após rodar, `src/integrations/supabase/types.ts` será regenerado automaticamente e as novas tabelas ficarão tipadas.

### O que NÃO faço nesta etapa
- Não conecto o frontend às novas tabelas (Contas a Pagar/Receber, Agenda real, Comissões reais ainda usam mock). Isso é o próximo passo separado.
- Não crio usuário admin nem insiro dados de seed — você faz isso pelo painel de Authentication + um INSERT em `user_roles` depois (te passo o snippet).
- Não mexo em `auth`, `storage`, nem em `supabase/config.toml`.

### Próximo passo após aprovar
1. Rodo o migration (você aprova no popup).
2. Te entrego o snippet de SQL para inserir o admin em `user_roles` depois de criar o usuário no Authentication.
3. Em mensagem futura, conectamos o frontend (Financeiro, Agenda, Dashboard) às novas tabelas.

Aprove para eu executar o migration.