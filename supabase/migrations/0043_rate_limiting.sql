-- Rate limiting basico, sem depender de servico externo (Redis/Upstash):
-- contador por janela de tempo direto no Postgres que ja temos. Suficiente
-- pra frear scripts (login, cadastro, checkout de convidado, polling de
-- status) sem adicionar mais uma peca de infraestrutura.
create table if not exists public.rate_limit_hits (
  key          text not null,
  window_start timestamptz not null,
  count        integer not null default 1,
  primary key (key, window_start)
);

-- Limpeza incidental: linhas de janelas antigas nao servem mais pra nada.
create index if not exists idx_rate_limit_hits_window on public.rate_limit_hits (window_start);

create or replace function public.check_rate_limit(
  p_key text,
  p_max_count int,
  p_window_seconds int
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_window_start timestamptz;
  v_count int;
begin
  v_window_start := to_timestamp(floor(extract(epoch from now()) / p_window_seconds) * p_window_seconds);

  insert into public.rate_limit_hits (key, window_start, count)
  values (p_key, v_window_start, 1)
  on conflict (key, window_start)
    do update set count = rate_limit_hits.count + 1
  returning count into v_count;

  -- limpeza oportunista de janelas velhas (evita crescer pra sempre)
  delete from public.rate_limit_hits where window_start < now() - interval '1 day';

  return v_count <= p_max_count;
end;
$$;

grant execute on function public.check_rate_limit(text, int, int) to authenticated, anon;

alter table public.rate_limit_hits enable row level security;
-- Ninguem le/escreve essa tabela diretamente — so via a funcao security definer acima.
