import { createClient } from 'npm:@supabase/supabase-js@2.95.0';
import { createHandler } from './core.js';

const url=Deno.env.get('SUPABASE_URL')||'';

const anon=Deno.env.get('SUPABASE_ANON_KEY')||'';

const serviceKey=
 Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')||'';

const options={
 auth:{
  persistSession:false,
  autoRefreshToken:false
 }
};

const admin=createClient(
 url,
 serviceKey,
 options
);

const service=async(action,input)=>{
 const {data,error}=await admin.rpc(
  'jeby_participant_auth_service',
  {
   p_action:action,
   p_input:input
  }
 );

 if(error){
  throw Error('Authentication database request failed');
 }

 return data;
};

const allowedOrigins=(
 Deno.env.get('JEBY_AUTH_ALLOWED_ORIGINS')||''
)
 .split(',')
 .map(value=>value.trim())
 .filter(Boolean);

Deno.serve(
 createHandler({
  enabled:
   Deno.env.get('JEBY_PARTICIPANT_AUTH_ENABLED')==='true',

  allowedOrigins,

  service,

  caller:async(header)=>{
   if(!header.startsWith('Bearer ')){
    return null;
   }

   const client=createClient(
    url,
    anon,
    {
     ...options,
     global:{
      headers:{
       Authorization:header
      }
     }
    }
   );

   const {data,error}=await client.auth.getUser(
    header.slice(7)
   );

   if(error||!data.user){
    return null;
   }

   const access=await client.rpc(
    'jeby_admin_has_permission',
    {
     p_permission:'admin.manage'
    }
   );

   return !access.error&&access.data===true
    ?data.user.id
    :null;
  },

  getUser:async(id)=>{
   const {data,error}=
    await admin.auth.admin.getUserById(id);

   if(error){
    if(error.status===404){
     return null;
    }

    throw Error('User lookup failed');
   }

   return data.user;
  },

  createUser:async(input)=>{
   const result=
    await admin.auth.admin.createUser(input);

   if(result.error){
    throw Error('User creation failed');
   }

   return result.data.user;
  },

  updateUser:async(id,input)=>{
   const result=
    await admin.auth.admin.updateUserById(
     id,
     input
    );

   if(result.error){
    throw Error('User update failed');
   }
  },

  signIn:async(phone,password)=>{
   const client=createClient(
    url,
    anon,
    options
   );

   const {data,error}=
    await client.auth.signInWithPassword({
     phone,
     password
    });

   if(error){
    return null;
   }

   return data.session;
  }
 })
);
