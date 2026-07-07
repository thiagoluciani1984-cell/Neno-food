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
npm run db:types         # regenera tipos TypeScript
```

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
| 0022 | Pagar.me: recipient_id, provider_payload, PIX online |

---

## Regenerar tipos TypeScript

**Local (Supabase CLI):**
```bash
npm run db:types
```

**Cloud:**
```bash
npx supabase gen types typescript --project-id SEU_REF > src/types/database.types.ts
```

---

## Scripts úteis

| Comando | Descrição |
|---------|-----------|
| `npm run db:build` | Gera `full_setup.sql` |
| `npm run db:apply` | Aplica migrations 0001–0022 |
| `npm run db:apply:full` | Aplica `full_setup.sql` inteiro |
| `npm run db:types` | Regenera `database.types.ts` (local) |
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
