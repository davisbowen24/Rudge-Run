begin;
create index if not exists multiplayer_members_account_idx
  on ridge_private.multiplayer_members(account_id)
  where account_id is not null;
create index if not exists multiplayer_rooms_host_member_idx
  on ridge_private.multiplayer_rooms(host_member_id)
  where host_member_id is not null;
commit;
