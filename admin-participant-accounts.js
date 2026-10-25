(function(){
 'use strict';

 const $=id=>document.getElementById(id);

 const db=window.supabase.createClient(
  'https://hpsuqttshdcebacpkrrt.supabase.co',
  'sb_publishable_uSb5y_wtc2oi0qq7YLG83Q_muNekrs9'
 );

 const accounts=new Map();

 const message=(text,failed=false)=>{
  $('accountMessage').textContent=text;

  $('accountMessage').className=
   'notice '+(failed?'error':'success');
 };

 // الاحتفاظ بمعرّف الطلب عند إعادة المحاولة
 // لمنع تكرار إنشاء الحساب بعد انقطاع الاستجابة.
 async function requestFor(action,body){
  const digest=await crypto.subtle.digest(
   'SHA-256',
   new TextEncoder().encode(
    JSON.stringify({action,...body})
   )
  );

  const signature=Array.from(
   new Uint8Array(digest),
   value=>value.toString(16).padStart(2,'0')
  ).join('');

  const key='jeby-account-request:'+action;

  let previous;

  try{
   previous=JSON.parse(
    sessionStorage.getItem(key)||'null'
   );
  }catch{}

  if(
   previous?.signature===signature&&
   previous.id
  ){
   return previous.id;
  }

  const id=crypto.randomUUID();

  sessionStorage.setItem(
   key,
   JSON.stringify({signature,id})
  );

  return id;
 }

 async function load(){
  const {data,error}=await db.auth.getUser();

  if(error||!data.user){
   throw Error(
    'سجّل دخول المدير من لوحة الإدارة أولًا'
   );
  }

  const result=
   await window.JebyParticipantAuth.invoke(
    db,
    {action:'list'}
   );

  accounts.clear();

  $('existingParticipant').replaceChildren();
  $('participantList').replaceChildren();

  for(const row of result.accounts){
   accounts.set(row.user_id,row);

   if(!row.phone){
    const option=document.createElement('option');

    option.value=row.user_id;

    option.textContent=
     row.full_name+' — '+row.wallet_number;

    $('existingParticipant').append(option);
   }

   const p=document.createElement('p');

   p.textContent=
    row.full_name+
    ' | '+
    row.wallet_number+
    ' | '+
    (row.phone||'لم يُربط الجوال')+
    (
     row.must_change
      ?' | تغيير كلمة المرور مطلوب'
      :''
    );

   $('participantList').append(p);
  }

  $('bindParticipant')
   .querySelector('button')
   .disabled=
    !$('existingParticipant').options.length;

  $('accountControls').classList.remove('hidden');
 }

 function submit(form,action,payload){
  $(form).onsubmit=async e=>{
   e.preventDefault();

   const button=e.target.querySelector('button');

   button.disabled=true;

   try{
    const body=payload();

    const request_id=
     await requestFor(action,body);

    const result=
     await window.JebyParticipantAuth.invoke(
      db,
      {
       action,
       ...body,
       request_id
      }
     );

    if(!result.ok){
     throw Error('تعذر إتمام الطلب');
    }

    sessionStorage.removeItem(
     'jeby-account-request:'+action
    );

    e.target.reset();

    await load();

    message(
     action==='create'
      ?'تم إنشاء الحساب. كلمة المرور المؤقتة: 123. سلّمها للطالب مع رقم جواله.'
      :'تم ربط رقم الجوال بالحساب نفسه دون تغيير كلمة المرور أو المحفظة.'
    );

   }catch(e){
    message(e.message,true);

   }finally{
    button.disabled=false;
   }
  };
 }

 submit(
  'createParticipant',
  'create',
  ()=>({
   name:$('participantName').value.trim(),
   phone:$('participantPhone').value.trim()
  })
 );

 submit(
  'bindParticipant',
  'bind',
  ()=>{
   const row=accounts.get(
    $('existingParticipant').value
   );

   if(!row){
    throw Error('اختر المشترك');
   }

   return{
    name:row.full_name,
    phone:$('existingPhone').value.trim(),
    user_id:row.user_id
   };
  }
 );

 $('reloadParticipants').onclick=()=>{
  load().catch(e=>message(e.message,true));
 };

 load().catch(e=>{
  $('accountControls').classList.add('hidden');

  message(e.message,true);
 });

})();
