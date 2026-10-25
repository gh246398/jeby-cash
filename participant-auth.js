/* Authentication only: no service grid, notifications, balances or transaction logic. */
(function(){
 'use strict';

 async function invoke(db,body){
  const result=await db.functions.invoke(
   'jeby-participant-auth',
   {body}
  );

  if(result.error){
   let message='تعذر الاتصال بخدمة الدخول';

   try{
    const payload=await result.error.context.json();
    message=payload.error||message;
   }catch{}

   throw Error(message);
  }

  if(result.data?.error){
   throw Error(result.data.error);
  }

  return result.data;
 }

 async function session(db,value){
  if(!value?.access_token||!value?.refresh_token){
   throw Error('لم تُرجع الخدمة جلسة دخول صحيحة');
  }

  const {error}=await db.auth.setSession(value);

  if(error){
   throw error;
  }
 }

 const api={
  async login(db,phone,password){
   const result=await invoke(db,{
    action:'login',
    phone,
    password
   });

   if(!result.must_change){
    await session(db,result.session);
   }

   return result;
  },

  async firstChange(
   db,
   challenge,
   oldPassword,
   password,
   confirm
  ){
   return invoke(db,{
    action:'first_change',
    challenge,
    old_password:oldPassword,
    password,
    confirm
   });
  },

  invoke
 };

 window.JebyParticipantAuth=api;
})();
