create extension if not exists pgcrypto;

create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null check (char_length(display_name) between 2 and 48),
  avatar_id text not null default 'avatar_1',
  tone text not null default 'neutral' check (tone in ('neutral', 'spiritual', 'discipline')),
  share_logs_to_community boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.checkins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  date date not null,
  items_json jsonb not null default '{}'::jsonb,
  note text not null default '',
  inspiration_added text not null default '',
  mood integer,
  missed_notes_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, date)
);

create table if not exists public.feed_posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  checkin_id uuid references public.checkins(id) on delete set null,
  date date not null,
  summary text not null default '',
  note text not null default '',
  inspiration text not null default '',
  mood integer,
  visibility text not null default 'public' check (visibility in ('public', 'private')),
  is_hidden boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, checkin_id)
);

create table if not exists public.post_supports (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.feed_posts(id) on delete cascade,
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(post_id, user_id)
);

create table if not exists public.post_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.feed_posts(id) on delete cascade,
  parent_comment_id uuid references public.post_comments(id) on delete cascade,
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  content text not null check (char_length(content) between 1 and 220),
  is_hidden boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.content_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_user_id uuid not null references public.profiles(user_id) on delete cascade,
  post_id uuid references public.feed_posts(id) on delete cascade,
  comment_id uuid references public.post_comments(id) on delete cascade,
  reason text not null check (char_length(reason) between 4 and 160),
  details text not null default '',
  created_at timestamptz not null default now(),
  check (post_id is not null or comment_id is not null)
);

create index if not exists idx_feed_posts_date on public.feed_posts(date desc, updated_at desc);
create index if not exists idx_post_supports_post_id on public.post_supports(post_id);
create index if not exists idx_post_comments_post_id on public.post_comments(post_id, created_at asc);
create index if not exists idx_post_comments_parent on public.post_comments(parent_comment_id);
create index if not exists idx_content_reports_created_at on public.content_reports(created_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists trg_checkins_updated_at on public.checkins;
create trigger trg_checkins_updated_at before update on public.checkins
for each row execute function public.set_updated_at();

drop trigger if exists trg_feed_posts_updated_at on public.feed_posts;
create trigger trg_feed_posts_updated_at before update on public.feed_posts
for each row execute function public.set_updated_at();

drop trigger if exists trg_post_comments_updated_at on public.post_comments;
create trigger trg_post_comments_updated_at before update on public.post_comments
for each row execute function public.set_updated_at();

create or replace function public.enforce_comment_rate_limit()
returns trigger
language plpgsql
security definer
as $$
declare
  recent_count integer;
begin
  select count(*) into recent_count
  from public.post_comments
  where user_id = new.user_id
    and created_at > now() - interval '60 seconds';

  if recent_count >= 8 then
    raise exception 'Rate limit exceeded. Please wait before posting again.';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_comment_rate_limit on public.post_comments;
create trigger trg_comment_rate_limit before insert on public.post_comments
for each row execute function public.enforce_comment_rate_limit();

alter table public.profiles enable row level security;
alter table public.checkins enable row level security;
alter table public.feed_posts enable row level security;
alter table public.post_supports enable row level security;
alter table public.post_comments enable row level security;
alter table public.content_reports enable row level security;

drop policy if exists "profiles_read_all" on public.profiles;
create policy "profiles_read_all" on public.profiles
for select using (true);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles
for insert with check (auth.uid() = user_id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "checkins_manage_own" on public.checkins;
create policy "checkins_manage_own" on public.checkins
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "feed_posts_read_public" on public.feed_posts;
create policy "feed_posts_read_public" on public.feed_posts
for select using (visibility = 'public' and not is_hidden);

drop policy if exists "feed_posts_insert_own" on public.feed_posts;
create policy "feed_posts_insert_own" on public.feed_posts
for insert with check (auth.uid() = user_id);

drop policy if exists "feed_posts_update_own" on public.feed_posts;
create policy "feed_posts_update_own" on public.feed_posts
for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "feed_posts_delete_own" on public.feed_posts;
create policy "feed_posts_delete_own" on public.feed_posts
for delete using (auth.uid() = user_id);

drop policy if exists "post_supports_read_public" on public.post_supports;
create policy "post_supports_read_public" on public.post_supports
for select using (
  exists (
    select 1 from public.feed_posts p
    where p.id = post_supports.post_id
      and p.visibility = 'public'
      and not p.is_hidden
  )
);

drop policy if exists "post_supports_insert_own" on public.post_supports;
create policy "post_supports_insert_own" on public.post_supports
for insert with check (
  auth.uid() = user_id
  and exists (
    select 1 from public.feed_posts p
    where p.id = post_supports.post_id
      and p.visibility = 'public'
      and not p.is_hidden
  )
);

drop policy if exists "post_supports_delete_own" on public.post_supports;
create policy "post_supports_delete_own" on public.post_supports
for delete using (auth.uid() = user_id);

drop policy if exists "post_comments_read_public" on public.post_comments;
create policy "post_comments_read_public" on public.post_comments
for select using (
  not is_hidden
  and exists (
    select 1 from public.feed_posts p
    where p.id = post_comments.post_id
      and p.visibility = 'public'
      and not p.is_hidden
  )
);

drop policy if exists "post_comments_insert_own_with_support" on public.post_comments;
create policy "post_comments_insert_own_with_support" on public.post_comments
for insert with check (
  auth.uid() = user_id
  and exists (
    select 1 from public.feed_posts p
    where p.id = post_comments.post_id
      and p.visibility = 'public'
      and not p.is_hidden
  )
  and exists (
    select 1 from public.post_supports s
    where s.post_id = post_comments.post_id
      and s.user_id = auth.uid()
  )
);

drop policy if exists "post_comments_delete_own" on public.post_comments;
create policy "post_comments_delete_own" on public.post_comments
for delete using (auth.uid() = user_id);

drop policy if exists "content_reports_insert_own" on public.content_reports;
create policy "content_reports_insert_own" on public.content_reports
for insert with check (auth.uid() = reporter_user_id);

drop policy if exists "content_reports_read_own" on public.content_reports;
create policy "content_reports_read_own" on public.content_reports
for select using (auth.uid() = reporter_user_id);
