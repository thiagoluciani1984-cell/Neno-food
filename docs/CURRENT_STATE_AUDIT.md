# Auditoria do estado atual — Neno Food

> Baseline: 05/08/2026, branch `chore/neno-master-plan`. Esta auditoria considera o repositório e o working tree local. Não valida o schema efetivamente aplicado no Supabase Cloud.

## Resumo executivo

O Neno Food é um marketplace multi-tenant com quatro superfícies principais: loja do cliente, operação do restaurante, portal do entregador e administração da plataforma. O produto já possui uma base funcional ampla, mas a maturidade varia: catálogo, checkout, pedidos e gestão operacional têm implementação substancial; social, logística, estoque e insumos estão parciais; suporte, reembolsos, auditoria e documentos têm schema/RLS, mas não uma experiência completa.

O repositório contém 47 migrations, 50 tabelas públicas, 44 páginas, 6 Route Handlers (incluindo o callback de autenticação) e 11 arquivos de testes unitários, além de um smoke E2E. O README e o guia do Supabase estão defasados quanto à quantidade e ao alcance das migrations.

## Estado do Git no início

- Branch original: `main`, acompanhando `origin/main`.
- Branch de trabalho criada: `chore/neno-master-plan`.
- Alterações locais preexistentes foram preservadas. Elas abrangem `scripts/print-agent`, o módulo `supplies`, `src/infra/supabase/middleware.ts` e arquivos novos relacionados a lote/impressão de insumos.
- Os documentos desta fase são as únicas alterações deliberadamente adicionadas pela auditoria.
- Nenhum commit ou merge foi realizado.

## Estrutura

| Caminho | Responsabilidade | Observação |
|---|---|---|
| `src/app` | App Router, layouts, páginas e Route Handlers | Route groups por persona |
| `src/features` | Fatias verticais de UI, actions, queries e schemas | Principal organização funcional |
| `src/core` | Entidades, value objects e contratos | Pequeno núcleo de domínio; adoção parcial |
| `src/infra/supabase` | Clientes browser/server/admin e middleware | Supabase é o backend efetivo |
| `src/lib` | Pagamentos, impressão, rate limit, monitoramento e utilitários | Serviços transversais |
| `src/types/database.types.ts` | Interfaces manuais do banco | Risco de drift em relação às migrations |
| `supabase/migrations` | Schema, funções, triggers, RLS, storage e realtime | 0001 a 0047 |
| `scripts` | Banco, seeds, Asaas, imagens e agente de impressão | Há scripts históricos/desatualizados |
| `e2e` | Smoke Playwright | Cobertura pequena |
| `public` | Marca, imagens de cardápio, sons e PWA | Assets locais e service worker |

## Stack confirmada

Versões abaixo são as instaladas em `node_modules`, não apenas os ranges do `package.json`.

| Camada | Tecnologia instalada |
|---|---|
| Runtime/framework | Next.js 16.2.12, React/React DOM 19.0.0, TypeScript 5.9.3 |
| UI | Tailwind CSS 3.4.19, Radix UI, shadcn-style local, Lucide, Framer Motion 12.42.2 |
| Formulários/validação | React Hook Form 7.79.0, Zod 3.25.76, Hookform Resolvers 3.10.0 |
| Estado/dados | Zustand 5.0.14, TanStack Query 5.101.0 |
| Backend | Supabase JS 2.110.7, Supabase SSR 0.12.3, PostgreSQL (`pg` 8.22.0) |
| Mapas | Leaflet 1.9.4, React Leaflet 5.0.0 |
| Pagamentos | Integração própria com Asaas; modo mock de desenvolvimento |
| Testes | Vitest 4.1.10, Playwright 1.61.1 |
| Deploy previsto | Vercel + Supabase Cloud |

Observações:

- O `package-lock.json` resolve versões superiores aos mínimos declarados em vários pacotes.
- `@tanstack/react-query` está instalado e o provider existe, mas a maior parte da leitura de dados usa Server Components/queries diretas.
- O projeto usa App Router e Server Actions; “Clean Architecture” é uma intenção parcial, pois a maior parte da regra está em `features` e acoplada ao Supabase.

## Rotas mapeadas

### Loja e cliente

| Método/rota | Implementação | Acesso |
|---|---|---|
| GET `/` | Marketplace, busca e destaques | Público |
| GET `/[restaurantSlug]` | Loja/cardápio por restaurante | Público |
| GET `/[restaurantSlug]/cart` | Carrinho contextual | Público |
| GET `/[restaurantSlug]/checkout` | Checkout contextual | Público/autenticado |
| GET `/cart` | Carrinho geral/legado | Público |
| GET `/checkout` | Checkout via slug padrão | Público/autenticado |
| GET `/feed` | Feed social | Público |
| GET `/account` | Conta, pedidos, endereços, avaliações/favoritos | Autenticado |
| GET `/order/[id]` | Rastreamento do pedido | Cliente ou token convidado |
| GET `/payment/pix` | QR Code e polling | Portador do identificador do pedido; revisar autorização |
| GET `/payment/success` | Confirmação | Público por query string |
| GET `/payment/pending` | Pendente | Público por query string |
| GET `/payment/failure` | Falha | Público por query string |
| GET `/privacy` | Política de privacidade | Público |
| GET `/terms` | Termos | Público |

### Autenticação e onboarding

| Rota | Finalidade |
|---|---|
| `/login` | Login por senha e OAuth disponível na UI |
| `/forgot-password` | Solicitação de recuperação |
| `/auth/reset-password` | Definição de nova senha |
| `/signup` | Escolha de perfil |
| `/signup/customer` | Cadastro de cliente |
| `/signup/restaurant` | Cadastro de restaurante |
| `/signup/driver` | Cadastro de entregador |
| `/auth/callback` | Troca de code por sessão |
| `/onboarding` | Resolutor da etapa atual |
| `/onboarding/[step]` | Wizard de quatro etapas |
| `/onboarding/aguardando` | Status de aprovação |

### Restaurante

| Rota | Módulo |
|---|---|
| `/dashboard` | KPIs e receita |
| `/dashboard/orders` | KDS/gestão de pedidos |
| `/dashboard/menu` | Categorias, produtos e opções |
| `/dashboard/coupons` | Cupons |
| `/dashboard/customers` | Visão agregada de clientes |
| `/dashboard/delivery` | Entrega e mapa |
| `/dashboard/reports` | Relatórios e CSV |
| `/dashboard/profile` | Perfil público |
| `/dashboard/settings` | Operação, horários, pagamentos e endereço |
| `/dashboard/social` | Posts do restaurante |
| `/dashboard/staff` | Equipe |
| `/dashboard/studio` | Biblioteca de imagens |
| `/dashboard/supplies` | Lançamentos de insumos e lotes |
| `/dashboard/estoque` | Itens, movimentos, fichas e relatório de estoque |

### Entregador e administração

| Rota | Acesso/finalidade |
|---|---|
| `/driver` | Entregador: disponibilidade, entregas e rota |
| `/driver/onboarding` | Dados, veículo e documentos |
| `/admin` | Master admin: restaurantes e métricas |
| `/admin/drivers` | Master admin: aprovação de entregadores |
| `/admin/moderation` | Master admin: denúncias de posts |

O middleware aceita `moderator` em `/admin`, mas as páginas verificam somente `master_admin`; a permissão efetiva é, portanto, inconsistente.

### APIs

| Método/rota | Finalidade | Nota |
|---|---|---|
| GET `/api/orders/[id]/status` | Polling de status, inclusive convidado | Rate limit; token opcional |
| POST `/api/payments/asaas/webhook` | Eventos Asaas | Token obrigatório e fail-closed |
| GET `/api/payments/asaas/sync?order=` | Sincronização ativa | Revisar autenticação e vínculo com pedido |
| POST `/api/payments/asaas/mock-confirm` | Confirmação mock | Somente com mock habilitado; revisar autorização |
| POST `/api/supplies/print-batch` | Aciona agente local | Working tree; revisar autenticação e execução local |
| GET `/auth/callback` | Callback Supabase | Validar destino interno |

## Módulos existentes

- Core comercial: catálogo, opções, carrinho, checkout, cupons, pedidos, pagamentos e relatórios.
- Cliente: cadastro/login, conta, endereços, favoritos, avaliações, feed e notificações.
- Restaurante: onboarding, perfil, configurações, dashboard, equipe, social, Studio, estoque e insumos.
- Logística: cadastro/aprovação de entregador, pool de entregas, claim, GPS, rota e PIN.
- Plataforma: aprovação de restaurantes/entregadores, moderação e métricas de negócio.
- Infra: RLS, Realtime, Storage, PWA, impressão ESC/POS, rate limiting e integração Asaas.

## Qualidade e cobertura

- Testes unitários cobrem carrinho, rota, horário, status de pedido, dinheiro, Asaas, roteamento e partes novas de insumos/impressão.
- O smoke E2E cobre homepage, login, páginas legais, recuperação de senha e carrinho vazio.
- Não há testes automatizados de RLS/migrations, checkout completo, webhook, autorização por persona, KDS, onboarding, driver ou fluxos administrativos.
- `database.types.ts` é manual e não há verificação automática de drift.
- O lint limita-se a `src/**/*.{ts,tsx}`; scripts Node, E2E e configs ficam fora.

## Limites desta auditoria

- Não houve acesso ao Supabase Cloud, Vercel, Asaas ou dados reais.
- “Completo” significa que o fluxo está representado no código e no schema, não que foi homologado em produção.
- Arquivos locais não commitados podem mudar antes de eventual commit destes documentos.
