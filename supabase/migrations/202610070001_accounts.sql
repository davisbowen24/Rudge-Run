begin;
create extension if not exists pgcrypto with schema extensions;
create schema if not exists ridge_private;
revoke all on schema ridge_private from public, anon, authenticated;

create table ridge_private.accounts (
 id uuid primary key default gen_random_uuid(),
 username text not null check(username ~ '^[A-Za-z0-9_]{3,20}$'),
 username_key text generated always as (lower(username)) stored unique,
 password_hash text not null,
 created_at timestamptz not null default now()
);
create table ridge_private.sessions (
 token_hash text primary key check(token_hash ~ '^[a-f0-9]{64}$'),
 user_id uuid not null references ridge_private.accounts(id) on delete cascade,
 expires_at timestamptz not null default now()+interval '7 days'
);
create index on ridge_private.sessions(user_id);
create table ridge_private.saves (
 user_id uuid primary key references ridge_private.accounts(id) on delete cascade,
 save_version integer not null default 1 check(save_version=1),
 revision bigint not null default 1,
 last_updated timestamptz not null default now(),
 progression jsonb not null check(jsonb_typeof(progression)='object' and octet_length(progression::text)<=1048576)
);
create table ridge_private.rate_limits (bucket text primary key, window_start timestamptz not null, attempts integer not null);
alter table ridge_private.accounts enable row level security;
alter table ridge_private.sessions enable row level security;
alter table ridge_private.saves enable row level security;
alter table ridge_private.rate_limits enable row level security;
-- Deny all browser roles: no permissive policies, and private schema is not exposed.
revoke all on all tables in schema ridge_private from public, anon, authenticated;

create function public.ridge_limit(p_bucket text,p_limit integer,p_seconds integer) returns boolean
language plpgsql security definer set search_path='' as $$
declare n integer;
begin
 insert into ridge_private.rate_limits values(p_bucket,now(),1)
 on conflict(bucket) do update set
 attempts=case when ridge_private.rate_limits.window_start < now()-make_interval(secs=>p_seconds) then 1 else ridge_private.rate_limits.attempts+1 end,
 window_start=case when ridge_private.rate_limits.window_start < now()-make_interval(secs=>p_seconds) then now() else ridge_private.rate_limits.window_start end
 returning attempts into n;
 return n<=p_limit;
end $$;

create function public.ridge_auth(p_register boolean,p_username text,p_password text,p_token_hash text) returns jsonb
language plpgsql security definer set search_path='' as $$
declare a ridge_private.accounts; candidate text;
begin
 if p_username !~ '^[A-Za-z0-9_]{3,20}$' or length(p_password)<12 or octet_length(p_password)>72 or p_token_hash !~ '^[a-f0-9]{64}$' then return jsonb_build_object('error','Invalid credentials'); end if;
 if p_register then
   insert into ridge_private.accounts(username,password_hash) values(p_username,extensions.crypt(p_password,extensions.gen_salt('bf',12))) returning * into a;
 else
   select * into a from ridge_private.accounts where username_key=lower(p_username);
   -- A fixed valid bcrypt salt performs the same expensive hash for nonexistent accounts.
   candidate=extensions.crypt(p_password,coalesce(a.password_hash,'$2a$12$abcdefghijklmnopqrstuu'));
   if a.id is null or candidate<>a.password_hash then return jsonb_build_object('error','Invalid username or password'); end if;
 end if;
 delete from ridge_private.sessions where user_id=a.id and expires_at<now();
 insert into ridge_private.sessions(token_hash,user_id) values(p_token_hash,a.id);
 return jsonb_build_object('user',jsonb_build_object('id',a.id,'username',a.username));
exception when unique_violation then return jsonb_build_object('error','Username is unavailable');
end $$;

-- Identity is resolved only from the hash of a cryptographically random session token.
-- No username/user-id supplied by a browser is used to choose a save owner.
create function public.ridge_save(p_token_hash text,p_action text,p_expected bigint default null,p_version integer default 1,p_progression jsonb default null) returns jsonb
language plpgsql security definer set search_path='' as $$
declare uid uuid; uname text; s ridge_private.saves;
begin
 select a.id,a.username into uid,uname from ridge_private.sessions t join ridge_private.accounts a on a.id=t.user_id where t.token_hash=p_token_hash and t.expires_at>now();
 if uid is null then return jsonb_build_object('unauthorized',true); end if;
 if p_action='logout' then delete from ridge_private.sessions where token_hash=p_token_hash;return jsonb_build_object('ok',true);end if;
 -- Serialize even the first write, avoiding insert races and silent lost updates.
 perform 1 from ridge_private.accounts where id=uid for update;
 select * into s from ridge_private.saves where user_id=uid;
 if p_action='save' then
   if p_expected is distinct from coalesce(s.revision,0) then
     return jsonb_build_object('conflict',true,'save',case when s.user_id is null then null else jsonb_build_object('userId',uid,'username',uname,'saveVersion',s.save_version,'revision',s.revision,'lastUpdated',s.last_updated,'progression',s.progression) end);
   end if;
   if p_version<>1 or jsonb_typeof(p_progression) is distinct from 'object' or octet_length(p_progression::text)>1048576 then return jsonb_build_object('error','Invalid save');end if;
   insert into ridge_private.saves(user_id,save_version,progression) values(uid,p_version,p_progression)
   on conflict(user_id) do update set progression=excluded.progression,save_version=excluded.save_version,revision=ridge_private.saves.revision+1,last_updated=now() returning * into s;
 elsif p_action<>'load' then return jsonb_build_object('error','Invalid action');
 end if;
 return jsonb_build_object('save',case when s.user_id is null then null else jsonb_build_object('userId',uid,'username',uname,'saveVersion',s.save_version,'revision',s.revision,'lastUpdated',s.last_updated,'progression',s.progression) end);
end $$;
revoke all on function public.ridge_limit(text,integer,integer) from public,anon,authenticated;
revoke all on function public.ridge_auth(boolean,text,text,text) from public,anon,authenticated;
revoke all on function public.ridge_save(text,text,bigint,integer,jsonb) from public,anon,authenticated;
grant execute on function public.ridge_limit(text,integer,integer) to service_role;
grant execute on function public.ridge_auth(boolean,text,text,text) to service_role;
grant execute on function public.ridge_save(text,text,bigint,integer,jsonb) to service_role;
commit;
