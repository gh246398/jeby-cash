-- Candidate ONLY.
-- No changes to existing financial tables,
-- routines, policies or balances.

begin;

create schema if not exists jeby_auth_private;

revoke all on schema jeby_auth_private
from public,anon,authenticated;

create table jeby_auth_private.accounts (
 user_id uuid primary key
  references public.jeby_profiles(user_id),

 phone text unique not null
  check(phone ~ '^\+9677[0-9]{8}$'),

 must_change boolean not null,

 state text not null
  check(state in ('pending','activating','active')),

 created_by uuid not null,
 created_at timestamptz not null default now()
);

create table jeby_auth_private.provisions (
 request_id uuid primary key,
 actor_id uuid not null,
 user_id uuid unique not null,

 phone text unique not null
  check(phone ~ '^\+9677[0-9]{8}$'),

 full_name text not null,

 operation text not null
  check(operation in ('create','bind')),

 finished boolean not null default false,
 created_at timestamptz not null default now()
);

create table jeby_auth_private.challenges (
 token uuid primary key,

 user_id uuid not null unique
  references jeby_auth_private.accounts(user_id),

 expires_at timestamptz not null
);

create table jeby_auth_private.attempts (
 phone text primary key,
 window_start timestamptz not null default now(),
 attempts integer not null default 0
);

alter table jeby_auth_private.accounts
 enable row level security;

alter table jeby_auth_private.provisions
 enable row level security;

alter table jeby_auth_private.challenges
 enable row level security;

alter table jeby_auth_private.attempts
 enable row level security;

revoke all on all tables
in schema jeby_auth_private
from public,anon,authenticated;

create function public.jeby_participant_auth_service(
 p_action text,
 p_input jsonb
)
returns jsonb
language plpgsql
security definer
set search_path=''
as $$
declare
 v_actor uuid;
 v_id uuid;
 v_phone text;
 v_req uuid;
 v_row jeby_auth_private.accounts%rowtype;
 v_prov jeby_auth_private.provisions%rowtype;
 v_count integer;
 v_token uuid;
 v_name text;
 v_op text;

begin

 if p_action in ('list','reserve','finalize') then

  v_actor:=(p_input->>'actor_id')::uuid;

  if not exists(
   select 1
   from public.jeby_admin_identities i

   join public.jeby_admin_role_assignments a
    on a.user_id=i.user_id

   join public.jeby_admin_role_permissions p
    on p.role_code=a.role_code

   where i.user_id=v_actor
    and i.active
    and p.permission_code='admin.manage'
  ) then
   raise exception 'Account administration denied';
  end if;

 end if;

 if p_action='list' then

  return coalesce(
   (
    select jsonb_agg(
     jsonb_build_object(
      'user_id',p.user_id,
      'full_name',p.full_name,
      'wallet_number',p.wallet_number,
      'phone',a.phone,
      'must_change',a.must_change
     )
     order by p.wallet_number
    )

    from public.jeby_profiles p

    left join jeby_auth_private.accounts a
     using(user_id)

    where not exists(
     select 1
     from public.jeby_admin_identities i
     where i.user_id=p.user_id
    )

    and not exists(
     select 1
     from public.jeby_admins i
     where i.user_id=p.user_id
    )
   ),
   '[]'::jsonb
  );

 elsif p_action='reserve' then

  v_req:=(p_input->>'request_id')::uuid;
  v_phone:=p_input->>'phone';
  v_name:=btrim(p_input->>'name');
  v_op:=p_input->>'operation';

  v_id:=case
   when v_op='create' then v_req
   else (p_input->>'user_id')::uuid
  end;

  if
   v_phone !~ '^\+9677[0-9]{8}$'
   or v_phone is null
   or char_length(v_name) not between 3 and 120
   or v_name is null
   or v_op not in ('create','bind')
   or v_id is null
  then
   raise exception 'Invalid account input';
  end if;

  if v_op='bind' and (
   not exists(
    select 1
    from public.jeby_profiles
    where user_id=v_id
   )

   or exists(
    select 1
    from public.jeby_admin_identities
    where user_id=v_id
   )

   or exists(
    select 1
    from public.jeby_admins
    where user_id=v_id
   )
  ) then
   raise exception 'Subscriber account required';
  end if;

  insert into jeby_auth_private.provisions(
   request_id,
   actor_id,
   user_id,
   phone,
   full_name,
   operation
  )
  values(
   v_req,
   v_actor,
   v_id,
   v_phone,
   v_name,
   v_op
  )
  on conflict(request_id) do nothing;

  select *
  into v_prov
  from jeby_auth_private.provisions
  where request_id=v_req
  for update;

  if
   v_prov.actor_id<>v_actor
   or v_prov.user_id<>v_id
   or v_prov.phone<>v_phone
   or v_prov.full_name<>v_name
   or v_prov.operation<>v_op
  then
   raise exception 'Request payload mismatch';
  end if;

  return to_jsonb(v_prov);

 elsif p_action='finalize' then

  select *
  into v_prov
  from jeby_auth_private.provisions

  where request_id=
   (p_input->>'request_id')::uuid

  for update;

  if not found or v_prov.actor_id<>v_actor then
   raise exception 'Provision not found';
  end if;

  if v_prov.finished then
   return jsonb_build_object(
    'user_id',v_prov.user_id,
    'finished',true
   );
  end if;

  if not exists(
   select 1
   from public.jeby_profiles
   where user_id=v_prov.user_id
  ) then
   raise exception 'Profile not created';
  end if;

  insert into jeby_auth_private.accounts(
   user_id,
   phone,
   must_change,
   state,
   created_by
  )
  values(
   v_prov.user_id,
   v_prov.phone,
   v_prov.operation='create',

   case
    when v_prov.operation='create'
     then 'pending'
    else 'active'
   end,

   v_actor
  );

  update public.jeby_profiles
  set phone_number=v_prov.phone
  where user_id=v_prov.user_id;

  update jeby_auth_private.provisions
  set finished=true
  where request_id=v_prov.request_id;

  return jsonb_build_object(
   'user_id',v_prov.user_id,
   'finished',true
  );

 elsif p_action='rate' then

  v_phone:=p_input->>'phone';

  if
   v_phone is null
   or v_phone !~ '^\+9677[0-9]{8}$'
  then
   return 'false'::jsonb;
  end if;

  delete from jeby_auth_private.attempts
  where window_start<
   now()-interval '1 day';

  insert into jeby_auth_private.attempts(
   phone,
   attempts
  )
  values(v_phone,1)

  on conflict(phone)
  do update set

   attempts=case
    when attempts.window_start<
     now()-interval '15 minutes'
    then 1

    else attempts.attempts+1
   end,

   window_start=case
    when attempts.window_start<
     now()-interval '15 minutes'
    then now()

    else attempts.window_start
   end

  returning attempts into v_count;

  return to_jsonb(v_count<=8);

 elsif p_action='lookup' then

  select a.*
  into v_row
  from jeby_auth_private.accounts a
  where phone=p_input->>'phone';

  if not found or exists(
   select 1
   from public.jeby_wallet_controls
   where user_id=v_row.user_id
    and is_frozen
  ) then
   return 'null'::jsonb;
  end if;

  return to_jsonb(v_row)-'created_by';

 elsif p_action='issue' then

  select a.*
  into v_row
  from jeby_auth_private.accounts a

  where user_id=
   (p_input->>'user_id')::uuid

  for update;

  if
   not found
   or not v_row.must_change
   or v_row.state<>'pending'

   or exists(
    select 1
    from public.jeby_wallet_controls
    where user_id=v_row.user_id
     and is_frozen
   )
  then
   return 'null'::jsonb;
  end if;

  v_token:=gen_random_uuid();

  insert into jeby_auth_private.challenges(
   token,
   user_id,
   expires_at
  )
  values(
   v_token,
   v_row.user_id,
   now()+interval '10 minutes'
  )

  on conflict(user_id)
  do update set
   token=excluded.token,
   expires_at=excluded.expires_at;

  return jsonb_build_object(
   'challenge',v_token
  );

 elsif p_action='claim' then

  delete from jeby_auth_private.challenges

  where token=
   (p_input->>'challenge')::uuid

   and expires_at>now()

  returning user_id into v_id;

  if v_id is null then
   raise exception 'Expired or used challenge';
  end if;

  select a.*
  into v_row
  from jeby_auth_private.accounts a
  where user_id=v_id
  for update;

  if
   not v_row.must_change
   or v_row.state<>'pending'

   or exists(
    select 1
    from public.jeby_wallet_controls
    where user_id=v_id
     and is_frozen
   )
  then
   raise exception 'Account unavailable';
  end if;

  update jeby_auth_private.accounts
  set state='activating'
  where user_id=v_id;

  return jsonb_build_object(
   'user_id',v_id,
   'phone',v_row.phone
  );

 elsif p_action in ('complete','abort') then

  v_id:=(p_input->>'user_id')::uuid;

  update jeby_auth_private.accounts

  set
   state=case
    when p_action='complete'
     then 'active'
    else 'pending'
   end,

   must_change=(p_action<>'complete')

  where user_id=v_id
   and state='activating';

  if not found then
   raise exception 'Activation state mismatch';
  end if;

  return 'true'::jsonb;

 else

  raise exception 'Unknown authentication action';

 end if;

end;
$$;

revoke all on function
public.jeby_participant_auth_service(text,jsonb)
from public,anon,authenticated;

grant execute on function
public.jeby_participant_auth_service(text,jsonb)
to service_role;

commit;
