-- =====================================================================
-- 0013 · Rede Social (Nenos Comunidade)
--   • posts            — publicações dos restaurantes
--   • post_images      — galeria de imagens do post
--   • post_likes       — curtidas (M:N profile <-> post)
--   • post_comments    — comentários (com suporte a respostas)
--   • post_saves       — posts salvos pelo cliente
--   • post_reports     — denúncias de conteúdo
-- =====================================================================

create table if not exists public.posts (
  id              uuid primary key default gen_random_uuid(),
  restaurant_id   uuid not null references public.restaurants (id) on delete cascade,
  author_id       uuid not null references public.profiles (id) on delete cascade,
  type            public.post_type not null default 'photo',
  caption         text,
  is_pinned       boolean not null default false,
  likes_count     integer not null default 0 check (likes_count >= 0),
  comments_count  integer not null default 0 check (comments_count >= 0),
  saves_count     integer not null default 0 check (saves_count >= 0),
  deleted_at      timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create table if not exists public.post_images (
  id          uuid primary key default gen_random_uuid(),
  post_id     uuid not null references public.posts (id) on delete cascade,
  url         text not null,
  alt         text,
  width       integer,
  height      integer,
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now()
);

-- M:N: um profile curte um post (one row per like)
create table if not exists public.post_likes (
  post_id     uuid not null references public.posts (id) on delete cascade,
  profile_id  uuid not null references public.profiles (id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (post_id, profile_id)
);

create table if not exists public.post_comments (
  id            uuid primary key default gen_random_uuid(),
  post_id       uuid not null references public.posts (id) on delete cascade,
  author_id     uuid not null references public.profiles (id) on delete cascade,
  parent_id     uuid references public.post_comments (id) on delete cascade, -- resposta
  body          text not null,
  likes_count   integer not null default 0 check (likes_count >= 0),
  deleted_at    timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- Posts salvos pelo usuário (bookmarks)
create table if not exists public.post_saves (
  post_id     uuid not null references public.posts (id) on delete cascade,
  profile_id  uuid not null references public.profiles (id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (post_id, profile_id)
);

create table if not exists public.post_reports (
  id          uuid primary key default gen_random_uuid(),
  post_id     uuid not null references public.posts (id) on delete cascade,
  reporter_id uuid not null references public.profiles (id) on delete cascade,
  reason      text not null,       -- spam, inappropriate, fake...
  detail      text,
  resolved_at timestamptz,
  resolved_by uuid references public.profiles (id) on delete set null,
  created_at  timestamptz not null default now(),
  unique (post_id, reporter_id)    -- 1 denúncia por pessoa por post
);

-- ─── Triggers ────────────────────────────────────────────────────────
drop trigger if exists trg_posts_updated_at on public.posts;
create trigger trg_posts_updated_at
  before update on public.posts
  for each row execute function public.set_updated_at();

drop trigger if exists trg_post_comments_updated_at on public.post_comments;
create trigger trg_post_comments_updated_at
  before update on public.post_comments
  for each row execute function public.set_updated_at();

-- ─── Counters denormalizados (via trigger) ────────────────────────────
-- likes_count em posts
create or replace function public.sync_post_likes_count()
returns trigger language plpgsql as $$
begin
  if tg_op = 'INSERT' then
    update public.posts set likes_count = likes_count + 1 where id = new.post_id;
  elsif tg_op = 'DELETE' then
    update public.posts set likes_count = greatest(0, likes_count - 1) where id = old.post_id;
  end if;
  return null;
end;
$$;

drop trigger if exists trg_post_likes_count on public.post_likes;
create trigger trg_post_likes_count
  after insert or delete on public.post_likes
  for each row execute function public.sync_post_likes_count();

-- comments_count em posts
create or replace function public.sync_post_comments_count()
returns trigger language plpgsql as $$
begin
  if tg_op = 'INSERT' then
    update public.posts set comments_count = comments_count + 1 where id = new.post_id;
  elsif tg_op = 'DELETE' or (tg_op = 'UPDATE' and new.deleted_at is not null and old.deleted_at is null) then
    update public.posts set comments_count = greatest(0, comments_count - 1) where id = coalesce(new.post_id, old.post_id);
  end if;
  return null;
end;
$$;

drop trigger if exists trg_post_comments_count on public.post_comments;
create trigger trg_post_comments_count
  after insert or delete or update of deleted_at on public.post_comments
  for each row execute function public.sync_post_comments_count();

-- saves_count em posts
create or replace function public.sync_post_saves_count()
returns trigger language plpgsql as $$
begin
  if tg_op = 'INSERT' then
    update public.posts set saves_count = saves_count + 1 where id = new.post_id;
  elsif tg_op = 'DELETE' then
    update public.posts set saves_count = greatest(0, saves_count - 1) where id = old.post_id;
  end if;
  return null;
end;
$$;

drop trigger if exists trg_post_saves_count on public.post_saves;
create trigger trg_post_saves_count
  after insert or delete on public.post_saves
  for each row execute function public.sync_post_saves_count();
