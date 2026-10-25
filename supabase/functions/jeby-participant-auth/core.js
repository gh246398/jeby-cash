// Server-side authentication handler.
// No service key is included in frontend files.

export function normalizePhone(value) {
 let phone=String(value??'')
  .trim()
  .replace(/[\s()-]/g,'');

 if(phone.startsWith('00967')){
  phone=phone.slice(5);
 }else if(phone.startsWith('+967')){
  phone=phone.slice(4);
 }else if(/^967\d{9}$/.test(phone)){
  phone=phone.slice(3);
 }

 if(!/^7\d{8}$/.test(phone)){
  throw new Error(
   'أدخل رقم جوال يمني صحيحًا من 9 أرقام إنجليزية'
  );
 }

 return '+967'+phone;
}

const uuid=value=>
 typeof value==='string'&&
 /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);

export function createHandler(deps) {
 const {
  service,
  signIn,
  createUser,
  getUser,
  updateUser,
  caller,
  allowedOrigins,
  enabled
 }=deps;

 return async req=>{
  const origin=req.headers.get('origin');

  const headers={
   'Content-Type':'application/json; charset=utf-8',
   'Cache-Control':'no-store',
   'Vary':'Origin',
   'Access-Control-Allow-Headers':
    'authorization, apikey, content-type, x-client-info',
   'Access-Control-Allow-Methods':
    'POST, OPTIONS'
  };

  if(origin&&allowedOrigins.includes(origin)){
   headers['Access-Control-Allow-Origin']=origin;
  }

  const reply=(status,body)=>
   new Response(
    JSON.stringify(body),
    {status,headers}
   );

  if(origin&&!allowedOrigins.includes(origin)){
   return reply(403,{
    error:'المصدر غير مسموح'
   });
  }

  if(req.method==='OPTIONS'){
   return new Response(
    null,
    {status:204,headers}
   );
  }

  if(req.method!=='POST'){
   return reply(405,{
    error:'POST required'
   });
  }

  if(!enabled){
   return reply(503,{
    error:'مسار الحسابات الجديد غير مفعّل بعد'
   });
  }

  if(
   Number(
    req.headers.get('content-length')||0
   )>8192
  ){
   return reply(413,{
    error:'Request too large'
   });
  }

  try {
   const text=await req.text();

   if(text.length>8192){
    return reply(413,{
     error:'Request too large'
    });
   }

   let input;

   try{
    input=JSON.parse(text);
   }catch{
    return reply(400,{
     error:'Invalid JSON'
    });
   }

   if(
    !input||
    typeof input!=='object'||
    Array.isArray(input)
   ){
    return reply(400,{
     error:'Invalid input'
    });
   }

   const action=input.action;

   if(
    ['create','bind','list'].includes(action)
   ){
    const actor=await caller(
     req.headers.get('authorization')||''
    );

    if(!actor){
     return reply(403,{
      error:'صلاحية إدارة الحسابات مطلوبة'
     });
    }

    if(action==='list'){
     return reply(200,{
      accounts:await service(
       'list',
       {actor_id:actor}
      )
     });
    }

    const phone=normalizePhone(input.phone);

    const name=String(
     input.name||''
    ).trim();

    if(
     name.length<3||
     name.length>120||
     !uuid(input.request_id)
    ){
     return reply(400,{
      error:'تحقق من الاسم ومعرّف الطلب'
     });
    }

    if(
     action==='bind'&&
     !uuid(input.user_id)
    ){
     return reply(400,{
      error:'اختر حساب المشترك الحالي'
     });
    }

    const reservation=await service(
     'reserve',
     {
      actor_id:actor,
      request_id:input.request_id,
      operation:action,
      name,
      phone,
      user_id:input.user_id
     }
    );

    if(!reservation.finished){
     if(action==='create'){
      // 123 is the initial activation value.
      // Native Auth receives an unshared random password.
      // No wallet session is issued before first change.

      const existing=await getUser(
       reservation.user_id
      );

      if(existing){
       if(
        existing.app_metadata
         ?.jeby_creation_request!==
        input.request_id
       ){
        throw new Error(
         'Provision identity mismatch'
        );
       }
      }else{
       await createUser({
        id:reservation.user_id,
        phone,
        password:
         crypto.randomUUID()+
         crypto.randomUUID(),
        phone_confirm:true,
        app_metadata:{
         jeby_creation_request:
          input.request_id
        },
        user_metadata:{
         full_name:name,
         phone_number:phone
        }
       });
      }

     }else{
      const existing=await getUser(
       reservation.user_id
      );

      if(!existing){
       throw new Error(
        'Account not found'
       );
      }

      if(
       existing.phone&&
       normalizePhone(existing.phone)!==phone
      ){
       throw new Error(
        'Existing phone differs; manual review required'
       );
      }

      await updateUser(
       reservation.user_id,
       {
        phone,
        phone_confirm:true
       }
      );
     }

     await service(
      'finalize',
      {
       actor_id:actor,
       request_id:input.request_id
      }
     );
    }

    return reply(200,{
     ok:true,
     user_id:reservation.user_id,
     initial_password:
      action==='create'
       ?'123'
       :undefined
    });
   }

   if(action==='login'){
    const phone=normalizePhone(
     input.phone
    );

    const password=String(
     input.password||''
    );

    if(password.length>1024){
     return reply(400,{
      error:'Invalid input'
     });
    }

    if(
     !await service(
      'rate',
      {phone}
     )
    ){
     return reply(429,{
      error:'محاولات كثيرة؛ حاول بعد 15 دقيقة'
     });
    }

    const account=await service(
     'lookup',
     {phone}
    );

    if(!account){
     return reply(401,{
      error:'رقم الجوال أو كلمة المرور غير صحيحة، أو الحساب غير متاح'
     });
    }

    if(
     account.must_change&&
     account.state==='pending'
    ){
     if(password!=='123'){
      return reply(401,{
       error:'رقم الجوال أو كلمة المرور غير صحيحة، أو الحساب غير متاح'
      });
     }

     const issued=await service(
      'issue',
      {user_id:account.user_id}
     );

     if(!issued?.challenge){
      return reply(401,{
       error:'الحساب غير متاح'
      });
     }

     return reply(200,{
      must_change:true,
      challenge:issued.challenge
     });
    }

    const session=await signIn(
     phone,
     password
    );

    if(
     !session?.user||
     session.user.id!==account.user_id
    ){
     return reply(401,{
      error:'رقم الجوال أو كلمة المرور غير صحيحة، أو الحساب غير متاح'
     });
    }

    // Recover if the password changed successfully
    // but the database acknowledgement was lost.
    if(account.must_change){
     if(account.state!=='activating'){
      return reply(401,{
       error:'أكمل تغيير كلمة المرور أولًا'
      });
     }

     await service(
      'complete',
      {user_id:account.user_id}
     );
    }

    return reply(200,{
     session:{
      access_token:
       session.access_token,
      refresh_token:
       session.refresh_token
     }
    });
   }

   if(action==='first_change'){
    const password=String(
     input.password||''
    );

    if(
     input.old_password!=='123'||
     password.length<10||
     password.length>128||
     password!==input.confirm||
     password==='123'||
     !uuid(input.challenge)
    ){
     return reply(400,{
      error:'تحقق من كلمة المرور القديمة والجديدة وتأكيدها؛ الجديدة 10 أحرف على الأقل'
     });
    }

    const account=await service(
     'claim',
     {challenge:input.challenge}
    );

    try{
     await updateUser(
      account.user_id,
      {password}
     );
    }catch(e){
     await service(
      'abort',
      {user_id:account.user_id}
     );

     throw e;
    }

    try{
     await service(
      'complete',
      {user_id:account.user_id}
     );
    }catch{
     // The password has already changed.
     // Normal login with the new password
     // can finish the activation state.
     return reply(200,{
      ok:true,
      activation_pending:true
     });
    }

    return reply(200,{
     ok:true
    });
   }

   return reply(400,{
    error:'إجراء غير معروف'
   });

  }catch{
   // Never echo passwords, tokens,
   // private SQL or upstream Auth errors.
   return reply(400,{
    error:'تعذر إتمام الطلب. تحقق من البيانات أو تواصل مع الإدارة؛ يمكن إعادة المحاولة بالطلب نفسه.'
   });
  }
 };
}
