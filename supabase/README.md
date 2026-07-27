# Banco de dados — Nenos Food

Guia para configurar o PostgreSQL (Supabase) do projeto.

## Estrutura

```
supabase/
  migrations/     # 22 arquivos SQL versionados (0001 → 0022)
  seed.sql        # Restaurante Luciani's + cardápio inicial
  full_setup.sql  # GERADO — concatena migrations + seed (npm run db:build)
  config.toml     # Config Supabase CLI (local)
```

> **Não use** `sprint1_product_options.sql` — conteúdo duplicado em `0016_catalog_extended.sql`.

---

## Opção A — Projeto novo (recomendado)

### Via script (Supabase Cloud)

1. Obtenha a senha do banco em **Supabase Dashboard → Settings → Database**
2. Defina no terminal:

```powershell
$env:PGPW = "sua-senha-aqui"
$env:PROJECT_REF = "seu-project-ref"   # opcional
npm run db:apply
```

3. (Opcional) Popule restaurantes adicionais:

```bash
node scripts/seed-poit-pizza.js
node scripts/seed-pizza-options.js
node scripts/seed-poit-images.js
node scripts/cleanup-lucianis-menu.js
```

### Via Supabase CLI (local)

```bash
supabase start
supabase db reset        # aplica migrations + seed
```

> `database.types.ts` é mantido à mão (veja seção abaixo) — não depende do `supabase start`.

---

## Opção B — Projeto existente (só migrations pendentes)

Se o banco já tem 0001–0010 mas falta o restante:

```powershell
$env:PGPW = "sua-senha"
npm run db:apply
```

As migrations usam `IF NOT EXISTS` — seguro rodar em banco parcialmente atualizado.

---

## Opção C — Setup completo em um arquivo

Regenera e aplica tudo de uma vez (projeto **vazio**):

```bash
npm run db:build          # gera full_setup.sql
$env:PGPW = "sua-senha"
npm run db:apply:full     # aplica full_setup.sql
```

> **Atenção:** em banco já populado, `full_setup.sql` pode falhar em enums/tabelas
> existentes. Prefira `npm run db:apply` para bancos em uso.

---

## Migrations — referência

| Arquivo | Conteúdo |
|---------|----------|
| 0001–0010 | Schema base: auth, catálogo, pedidos, RLS, storage, realtime |
| 0011 | Enums estendidos (`payment_pending`, onboarding, driver approval) |
| 0012 | Restaurantes: rating, onboarding, registration_step |
| 0013 | Social: posts, likes, comments, saves |
| 0014 | Entregadores: veículos, documentos, localização |
| 0015 | Entrega: tracking GPS, códigos PIN |
| 0016 | Catálogo: product_options, order_item_options |
| 0017 | Admin: audit logs, feature flags |
| 0018 | RLS estendido (social, drivers, delivery) |
| 0019 | Índices adicionais |
| 0020 | Favoritos de restaurante, features de usuário |
| 0021 | Onboarding de entregador (trigger auto-create) |
| 0022 | Pagar.me (histórico): recipient_id, provider_payload, PIX online |
| 0023–0032 | Realtime de entrega, pedidos de convidado, ajustes de driver, tema do restaurante |
| 0033 | Migração para Asaas: remove `pagarme_recipient_id`, adiciona `asaas_wallet_id` |

---

## Tipos TypeScript

**`src/types/database.types.ts` é mantido à mão** — interfaces limpas
(`Restaurant`, `Order`, `Coupon`...) espelhando as migrations. Ao mudar o
schema, edite as interfaces relevantes nesse arquivo manualmente.

`npm run db:types` existe só como conferência: gera o formato bruto da
Supabase CLI em `src/types/database.types.generated.ts` (gitignored, não
usado pelo app) pra você comparar campo a campo. **Não redirecione a saída
pra `database.types.ts`** — o formato da CLI substitui as interfaces por um
único tipo `Database` aninhado, quebrando todos os imports do projeto.

O projeto usa Supabase Cloud em todos os ambientes (não há stack local via
Docker). Autentique a CLI uma vez com `npx supabase login`, ou gere um
personal access token em supabase.com/dashboard/account/tokens e exporte
como `SUPABASE_ACCESS_TOKEN`.

---

## Scripts úteis

| Comando | Descrição |
|---------|-----------|
| `npm run db:build` | Gera `full_setup.sql` |
| `npm run db:apply` | Aplica todas as migrations em `supabase/migrations/` (ordem numérica) |
| `npm run db:apply:full` | Aplica `full_setup.sql` inteiro |
| `npm run db:types` | Gera tipos brutos em `database.types.generated.ts` (conferência apenas) |
| `npm run db:verify` | Testa conexão Pagar.me |
| `node scripts/verify-pagarme.js` | Idem |

---

## Troubleshooting

| Erro | Solução |
|------|---------|
| `type "user_role" already exists` | Banco já tem schema — use `db:apply`, não `full_setup` |
| `product_options does not exist` | Rode migration 0016 (`npm run db:apply`) |
| `payment_pending` inválido | Rode migration 0011 |
| Conexão recusada ao pooler | Verifique região (sa-east-1) e senha em Database Settings |
| Projeto pausado | Restaure em supabase.com/dashboard |
