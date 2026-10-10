import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {PGlite} from '@electric-sql/pglite';
import {pgcrypto} from '@electric-sql/pglite/contrib/pgcrypto';

test('Chase Mode server owns health, escape, caught outcome and scoring',async()=>{
  const db=new PGlite({extensions:{pgcrypto}});
  try{
    await db.exec('create schema extensions;create role anon;create role authenticated;create role service_role;');
    for(const migration of [
      '202610070001_accounts.sql','202610070002_multiplayer.sql',
      '202610070004_multiplayer_races.sql','202610070005_multiplayer_rematches.sql',
      '202610100001_chase_live_sync.sql','202610100002_chase_damage.sql'
    ])await db.exec(await readFile(new URL('../supabase/migrations/'+migration,import.meta.url),'utf8'));
    const rid=(await db.query("insert into ridge_private.multiplayer_rooms(code,status,chase_mode_enabled) values('CHS42','racing',true) returning id")).rows[0].id;
    const add=async(token,name,pos,score)=>{
      return (await db.query(`insert into ridge_private.multiplayer_members
        (room_id,member_token_hash,display_name,vehicle_id,race_active,race_status,
         race_distance,live_position,live_velocity,live_sampled_at)
        values($1,$2,$3,'base',true,'racing',$4,$5,0,clock_timestamp()) returning id`,
        [rid,token.repeat(64),name,score,pos])).rows[0].id;
    };
    const leader=await add('a','Leader',1500,1500);
    const trailer=await add('b','Trailer',600,625);
    const tick=async()=>db.query('select public.ridge_mp_chase_tick($1)',[rid]);
    const advance=async()=>db.query("update ridge_private.multiplayer_rooms set chase_hazard_updated_at=clock_timestamp()-interval '1 second' where id=$1",[rid]);
    const get=async id=>(await db.query('select * from ridge_private.multiplayer_members where id=$1',[id])).rows[0];
    await tick();
    assert.equal(Math.round((await db.query('select chase_hazard_position as x from ridge_private.multiplayer_rooms where id=$1',[rid])).rows[0].x),750);
    await advance();await tick();
    const health=(await get(trailer)).chase_health;
    assert.ok(health<100&&health>0);
    await db.query('update ridge_private.multiplayer_members set live_position=850,live_sampled_at=clock_timestamp() where id=$1',[trailer]);
    await advance();await tick();
    assert.equal((await get(trailer)).chase_health,health);
    await db.query('update ridge_private.multiplayer_members set live_position=600,live_sampled_at=clock_timestamp(),chase_health=1 where id=$1',[trailer]);
    await advance();await tick();
    const caught=await get(trailer);
    assert.equal(caught.chase_health,0);
    assert.equal(caught.chase_caught,true);
    assert.equal(caught.race_status,'dead');
    assert.equal(caught.final_distance,625);
    await db.query('update ridge_private.multiplayer_rooms set chase_mode_enabled=false where id=$1',[rid]);
    await db.query('update ridge_private.multiplayer_members set chase_health=80 where id=$1',[leader]);
    await advance();await tick();
    assert.equal((await get(leader)).chase_health,80);
  }finally{await db.close();}
});
