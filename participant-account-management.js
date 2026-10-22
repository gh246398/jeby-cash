
/* JEBY CASH — Personal account management, v1. Educational use only. */
(() => {
  'use strict';
  if (window.JEBY_ACCOUNT_MANAGEMENT_V1) return;
  window.JEBY_ACCOUNT_MANAGEMENT_V1 = true;

  const $ = (tag, text, className) => {
    const e = document.createElement(tag);
    if (text !== undefined) e.textContent = text;
    if (className) e.className = className;
    return e;
  };
  const css = (e, style) => { e.style.cssText = style; return e; };
  const btn = (label, action) => {
    const e = $('button', label);
    e.type = 'button'; e.onclick = action;
    return css(e, 'padding:10px 12px;border-radius:10px;margin:5px;background:#571d35;color:white;border:0;cursor:pointer');
  };
  const client = () => window.db || (typeof db !== 'undefined' ? db : null);
  const currentUser = () => window.user || (typeof user !== 'undefined' ? user : null);
  const note = (text, bad = false) => {
    const e = css($('div', text), 'position:fixed;top:12px;right:12px;left:12px;z-index:100002;padding:13px;border-radius:12px;background:' + (bad ? '#ffe9e9' : '#e5f5eb') + ';color:#342a30;border:1px solid #b8a9a9');
    document.body.append(e); setTimeout(() => e.remove(), 4500);
  };
  function dialog(title) {
    const shade = css($('div'), 'position:fixed;inset:0;z-index:100000;background:#0009;display:flex;align-items:center;justify-content:center;padding:12px;direction:rtl');
    const panel = css($('div'), 'width:min(100%,560px);max-height:88vh;overflow:auto;background:#fff;border-radius:16px;padding:18px;font:14px/1.8 Tahoma,Arial;color:#342a30');
    panel.append($('h2', title));
    panel.append(btn('إغلاق', () => shade.remove()));
    shade.append(panel);
    shade.onclick = e => { if (e.target === shade) shade.remove(); };
    document.body.append(shade);
    return { shade, panel };
  }
  function field(panel, title, value) {
    const label = $('label', title);
    const input = css($('input'), 'width:100%;padding:11px;border:1px solid #d8cdd2;border-radius:10px;margin-bottom:10px');
    input.value = value ?? '';
    panel.append(label, input);
    return input;
  }
  async function accounts() {
    const c = client(), u = currentUser();
    if (!c || !u) return note('سجّل الدخول أولًا', true);
    const {panel} = dialog('إدارة حساباتي الشخصية');
    const area = $('div', 'جارٍ تحميل الحسابات...'); panel.append(area);
    const {data, error} = await c.from('jeby_chart_accounts')
      .select('id,code,name,is_active,owner_user_id,parent_id,level')
      .eq('owner_user_id', u.id).order('code');
    if (error) { area.textContent = 'تعذر تحميل الحسابات: ' + error.message; return; }
    area.replaceChildren();
    if (!data?.length) { area.textContent = 'لم تُضف حسابات شخصية بعد. يمكنك إضافتها من إدارة الدليل المحاسبي.'; return; }
    for (const account of data) {
      const row = css($('div'), 'border:1px solid #e9dedf;border-radius:12px;padding:12px;margin:9px 0;background:#fffaf7');
      row.append($('strong', account.code + ' — ' + account.name));
      row.append($('div', account.is_active ? 'نشط' : 'معطّل'));
      row.append(btn('تعديل / ' + (account.is_active ? 'تعطيل' : 'إعادة تفعيل'), () => edit(account, row)));
      area.append(row);
    }
  }
  function edit(account, row) {
    const c = client();
    const {shade, panel} = dialog('تعديل الحساب الشخصي');
    const name = field(panel, 'اسم الحساب', account.name);
    const code = field(panel, 'رمز الحساب', account.code);
    const activeLabel = $('label', ' الحساب نشط');
    const active = $('input'); active.type = 'checkbox'; active.checked = account.is_active;
    activeLabel.prepend(active); panel.append(activeLabel);
    panel.append($('p', 'لن يتغير أي رصيد أو عملية مالية. قد يُرفض التعطيل إذا كان الحساب مستخدمًا أو لديه حسابات فرعية نشطة.'));
    const save = btn('حفظ التعديل', async () => {
      const newName = name.value.trim(), newCode = code.value.trim();
      if (newName.length < 2 || !newCode) return note('تحقق من اسم الحساب ورمزه', true);
      if (!active.checked && account.is_active && !confirm('هل تريد تعطيل هذا الحساب الشخصي؟')) return;
      save.disabled = true;
      try {
        const {error} = await c.rpc('jeby_chart_update_personal_account', {
          p_account_id: account.id, p_name: newName, p_code: newCode, p_is_active: active.checked
        });
        if (error) throw error;
        account.name = newName; account.code = newCode; account.is_active = active.checked;
        row.querySelector('strong').textContent = newCode + ' — ' + newName;
        row.querySelector('div').textContent = active.checked ? 'نشط' : 'معطّل';
        shade.remove(); note('تم حفظ الحساب الشخصي');
      } catch (e) { note('تعذر الحفظ: ' + e.message, true); }
      finally { save.disabled = false; }
    });
    panel.append(save);
  }
  async function audit() {
    const c = client(), u = currentUser();
    if (!c || !u) return note('سجّل الدخول أولًا', true);
    const {panel} = dialog('سجل تدقيق الحسابات');
    const output = $('div', 'جارٍ تحميل سجل التدقيق...'); panel.append(output);
    const {data, error} = await c.from('jeby_chart_audit')
      .select('action,account_id,created_at,before_data,after_data')
      .eq('actor_user_id', u.id).order('created_at', {ascending:false}).limit(50);
    if (error) { output.textContent = 'تعذر قراءة السجل: ' + error.message; return; }
    output.replaceChildren();
    if (!data?.length) { output.textContent = 'لا توجد تعديلات مسجلة بعد.'; return; }
    for (const item of data) {
      const card = css($('div'), 'border-bottom:1px solid #e9dedf;padding:10px 0');
      card.append($('strong', ({account_update:'تعديل حساب',account_disable:'تعطيل حساب'}[item.action] || item.action)));
      card.append($('div', 'الحساب: ' + (item.account_id ?? '—')));
      card.append($('small', new Date(item.created_at).toLocaleString('ar-YE')));
      if (item.before_data?.name || item.after_data?.name)
        card.append($('div', (item.before_data?.name ?? '—') + ' ← ' + (item.after_data?.name ?? '—')));
      output.append(card);
    }
  }
  function mount() {
    if (document.getElementById('jeby-account-manager-launcher')) return;
    const target = document.getElementById('profileView');
    if (!target) return;
    const box = $('div'); box.id = 'jeby-account-manager-launcher';
    box.append($('h3', 'إدارة الحسابات المحاسبية'));
    box.append(btn('إدارة حساباتي الشخصية', accounts));
    box.append(btn('سجل التعديلات', audit));
    target.append(box);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount);
  else mount();
})();
