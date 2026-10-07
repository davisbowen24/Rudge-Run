-- Run as postgres in a test project or SQL editor. All fixtures roll back.
begin;
do $$
declare a jsonb; b jsonb; r jsonb;
begin
 a=public.ridge_auth(true,'Test_Driver_A','Testing-password-123',repeat('a',64));
 b=public.ridge_auth(true,'Test_Driver_B','Testing-password-456',repeat('b',64));
 assert a ? 'user' and b ? 'user','Registration must work';
 r=public.ridge_auth(true,'test_driver_a','Testing-password-123',repeat('c',64));assert r ? 'error','Case-insensitive unique username';
 r=public.ridge_auth(false,'TEST_DRIVER_A','Testing-password-123',repeat('d',64));assert r->'user'->>'username'='Test_Driver_A','Case-insensitive login preserves display';
 r=public.ridge_auth(false,'TEST_DRIVER_A','wrong-password-123',repeat('e',64));assert r ? 'error','Wrong password rejected';
 r=public.ridge_save(repeat('a',64),'save',0,1,'{"balance":100}');assert (r->'save'->>'revision')::int=1,'First save';
 r=public.ridge_save(repeat('b',64),'load');assert r->'save'='null'::jsonb,'B cannot load A';
 r=public.ridge_save(repeat('a',64),'save',0,1,'{"balance":999}');assert r ? 'conflict','Stale write rejected';
 r=public.ridge_save(repeat('a',64),'load');assert (r->'save'->'progression'->>'balance')::int=100,'Conflict preserved data';
 r=public.ridge_save(repeat('a',64),'logout');r=public.ridge_save(repeat('a',64),'load');assert r ? 'unauthorized','Revocation';
 assert not has_function_privilege('anon','public.ridge_save(text,text,bigint,integer,jsonb)','execute'),'Anon RPC blocked';
 assert not has_function_privilege('authenticated','public.ridge_auth(boolean,text,text,text)','execute'),'Authenticated RPC blocked';
 assert not has_schema_privilege('anon','ridge_private','usage'),'Private schema blocked';
 assert not has_table_privilege('authenticated','ridge_private.saves','select'),'Direct reads blocked';
 assert (select bool_and(relrowsecurity) from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='ridge_private' and c.relkind='r'),'RLS enabled';
end $$;
rollback;
