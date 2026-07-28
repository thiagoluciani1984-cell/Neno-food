-- Restaurante pode ter, além do tipo principal (establishment_type), até
-- mais 2 categorias adicionais (ex.: "Restaurante" + "Lanches" + "Italiana").
alter table public.restaurants
  add column if not exists additional_establishment_types text[] not null default '{}'::text[];

do $$ begin
  alter table public.restaurants
    add constraint additional_establishment_types_max_2
    check (array_length(additional_establishment_types, 1) is null or array_length(additional_establishment_types, 1) <= 2);
exception when duplicate_object then null; end $$;

comment on column public.restaurants.additional_establishment_types is
  'Até 2 categorias extras além de establishment_type (o tipo principal).';
