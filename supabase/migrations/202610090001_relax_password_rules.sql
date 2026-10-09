begin;

create or replace function public.ridge_auth(
  p_register boolean,
  p_username text,
  p_password text,
  p_token_hash text
) returns jsonb
language plpgsql
security definer
set search_path=''
as $$
declare
  a ridge_private.accounts;
  candidate text;
begin
  if p_username is null
     or p_username !~ '^[A-Za-z0-9_]{3,20}$'
     or p_password is null
     or length(p_password)<1
     or octet_length(p_password)>72
     or p_token_hash is null
     or p_token_hash !~ '^[a-f0-9]{64}$'
  then
    return jsonb_build_object('error','Invalid credentials');
  end if;

  if p_register then
    insert into ridge_private.accounts(username,password_hash)
    values(p_username,extensions.crypt(p_password,extensions.gen_salt('bf',12)))
    returning * into a;
  else
    select * into a
    from ridge_private.accounts
    where username_key=lower(p_username);

    candidate=extensions.crypt(
      p_password,
      coalesce(a.password_hash,'$2a$12$abcdefghijklmnopqrstuu')
    );

    if a.id is null or candidate<>a.password_hash then
      return jsonb_build_object('error','Invalid username or password');
    end if;
  end if;

  delete from ridge_private.sessions
  where user_id=a.id and expires_at<now();

  insert into ridge_private.sessions(token_hash,user_id)
  values(p_token_hash,a.id);

  return jsonb_build_object(
    'user',
    jsonb_build_object('id',a.id,'username',a.username)
  );
exception
  when unique_violation then
    return jsonb_build_object('error','Username is unavailable');
end $$;

revoke all on function public.ridge_auth(boolean,text,text,text) from public,anon,authenticated;
grant execute on function public.ridge_auth(boolean,text,text,text) to service_role;

commit;
